/**
 * Applies the migrations to an in-memory Postgres (PGlite) with minimal
 * Supabase stubs (auth, storage, roles) and exercises the key rules:
 * RLS isolation, plan limits, immutable slug, record_scan and stats.
 * Run with: npm run verify:sql
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdirSync, readFileSync } from "node:fs";

const db = new PGlite({ extensions: { pgcrypto } });
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

const stubs = `
create role anon; create role authenticated; create role service_role; create schema extensions;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
`;

async function as(user: string | null, sql: string) {
  await db.exec(user ? `set role authenticated; set request.jwt.claim.sub = '${user}';` : "reset role;");
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role;");
  }
}

function check(name: string, ok: boolean) {
  console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
  if (!ok) process.exitCode = 1;
}

async function expectError(name: string, fn: () => Promise<unknown>, match: RegExp) {
  try {
    await fn();
    check(name, false);
  } catch (e) {
    check(name, match.test(String((e as Error).message)));
  }
}

await db.exec(stubs);
for (const f of readdirSync("supabase/migrations").sort()) await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
await db.exec(`grant select, delete on all tables in schema public to authenticated; grant select on auth.users to authenticated;`);
console.log("Migrations applied\n");

await db.exec(`insert into auth.users (id, raw_user_meta_data) values ('${A}', '{"full_name":"Anna"}'), ('${B}', '{}');`);
check("profile created by trigger", (await db.query(`select * from public.profiles`)).rows.length === 2);

await as(A, `insert into public.qr_codes (name, slug, type, mode) values ('Menü', 'menuA1', 'menu', 'dynamic')`);
check("user A can create a code", true);
await expectError("free plan blocks a 2nd dynamic code", () => as(A, `insert into public.qr_codes (name, slug, type, mode) values ('x', 'second', 'url', 'dynamic')`), /PLAN_LIMIT_REACHED/);
await as(A, `insert into public.qr_codes (name, slug, type, mode) values ('WLAN', 'wifiA1', 'wifi', 'static')`);
check("static codes are not limited", true);

check("user B cannot see A's codes", (await as(B, `select * from public.qr_codes`)).rows.length === 0);
const upd = await as(B, `update public.qr_codes set name = 'hacked' where slug = 'menuA1' returning id`);
check("user B cannot update A's code", upd.rows.length === 0);
await expectError("slug is immutable", () => as(A, `update public.qr_codes set slug = 'other1' where slug = 'menuA1'`), /permission denied/);
await expectError("scan_count cannot be faked", () => as(A, `update public.qr_codes set scan_count = 999`), /permission denied/);
await expectError("plan cannot be self-upgraded", () => as(A, `update public.profiles set plan = 'agency'`), /permission denied/);

const id = (await db.query<{ id: string }>(`select id from public.qr_codes where slug = 'menuA1'`)).rows[0].id;
await db.exec(`set role service_role;`);
for (const h of ["v1", "v1", "v2"]) await db.query(`select public.record_scan($1, 'DE', 'Dorsten', 'Mobil', 'iOS', 'Safari', 'de', $2)`, [id, h]);
await db.exec(`reset role;`);
await expectError("users cannot call record_scan", () => as(A, `select public.record_scan('${id}', null, null, null, null, null, null, 'x')`), /permission denied/);

const stats = (await as(A, `select public.code_stats('${id}', 30) as s`)).rows[0] as { s: { total: number; unique: number; series: unknown[]; hours: unknown[] } };
check("stats: 3 scans", stats.s.total === 3);
check("stats: 2 unique visitors", stats.s.unique === 2);
check("stats: 30 day series", stats.s.series.length === 30);
check("stats: 24 hour buckets", stats.s.hours.length === 24);
check("B sees no stats for A's code", ((await as(B, `select public.code_stats('${id}', 30) as s`)).rows[0] as { s: { total: number } }).s.total === 0);
const sum = (await as(A, `select public.dashboard_summary() as s`)).rows[0] as { s: { codes: number; scans_total: number; scans_today: number; series: number[] } };
check("dashboard summary", sum.s.codes === 2 && sum.s.scans_total === 3);
check("dashboard 14-day series", sum.s.series.length === 14 && sum.s.series[13] === 3);
check("dashboard scans today", sum.s.scans_today === 3);

// ───────── guest codes (no account, secret edit token) ─────────
const T = "t".repeat(40);
async function asAnon(sql: string, args: unknown[] = []) {
  await db.exec(`set role anon;`);
  try {
    return await db.query(sql, args);
  } finally {
    await db.exec("reset role;");
  }
}
await asAnon(`select public.create_guest_code('tisch01', $1, 'Tisch 1', 'url', '{"url":"https://google.com"}', '{}')`, [T]);
check("guest can create a dynamic code", true);
await expectError("guest needs a long token", () => asAnon(`select public.create_guest_code('tisch02', 'short', 'x', 'url', '{}', '{}')`), /BAD_TOKEN/);
check("guest code is public for scanners", (await asAnon(`select * from public.public_code('tisch01')`)).rows.length === 1);
check("public lookup hides the token hash", !Object.keys((await asAnon(`select * from public.public_code('tisch01')`)).rows[0] as object).includes("edit_token_hash"));
check("wrong token cannot read for editing", (await asAnon(`select * from public.get_guest_code('tisch01', $1)`, ["x".repeat(40)])).rows.length === 0);
const changed = (await asAnon(`select public.update_guest_code('tisch01', $1, 'Tisch 1', 'menu', '{"business":"Dili"}', '{}') as ok`, [T])).rows[0] as { ok: boolean };
check("owner can switch type url -> menu, slug stays", changed.ok && ((await asAnon(`select type from public.public_code('tisch01')`)).rows[0] as { type: string }).type === "menu");
const denied = (await asAnon(`select public.update_guest_code('tisch01', $1, 'x', 'url', '{}', '{}') as ok`, ["y".repeat(40)])).rows[0] as { ok: boolean };
check("wrong token cannot update", !denied.ok);
await expectError("anon cannot read the table directly", () => asAnon(`select * from public.qr_codes`), /permission denied/);
check("A still sees only own codes", (await as(A, `select * from public.qr_codes`)).rows.length === 2);
