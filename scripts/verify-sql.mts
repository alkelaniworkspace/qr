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
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}', created_at timestamptz default now(), last_sign_in_at timestamptz, email_confirmed_at timestamptz);
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

function check(name: string, ok: boolean, info?: unknown) {
  if (!ok && info) console.log(JSON.stringify(info));
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
await db.exec(`update public.profiles set plan = 'start' where id = '${A}'`);
await as(A, `insert into public.qr_codes (name, slug, type, mode) values ('x', 'second', 'url', 'dynamic'), ('y', 'third1', 'url', 'dynamic')`);
check("start plan allows more dynamic codes", true);
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
check("dashboard summary", sum.s.codes === 4 && sum.s.scans_total === 3);
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
check("A still sees only own codes", (await as(A, `select * from public.qr_codes`)).rows.length === 4);

// ───────── accounts: claim a guest code ─────────
await asAnon(`select public.create_guest_code('claim01', $1, 'Gast', 'url', '{"url":"https://example.com"}', '{}')`, [T]);
await db.exec(`insert into auth.users (id) values ('33333333-3333-3333-3333-333333333333')`);
const C = "33333333-3333-3333-3333-333333333333";
const wrong = (await as(C, `select public.claim_guest_code('claim01', '${"z".repeat(40)}') as ok`)).rows[0] as { ok: boolean };
check("claim needs the right token", !wrong.ok);
const right = (await as(C, `select public.claim_guest_code('claim01', '${T}') as ok`)).rows[0] as { ok: boolean };
check("claim with token moves code into the account", right.ok && (await as(C, `select slug from public.qr_codes`)).rows.length === 1);
await expectError("anon cannot claim", () => asAnon(`select public.claim_guest_code('claim01', $1)`, [T]), /permission denied|NOT_SIGNED_IN/);
const lim = (await db.query(`select public.plan_dynamic_limit('free') f, public.plan_dynamic_limit('start') s, public.plan_dynamic_limit('pro') p, public.plan_dynamic_limit('business') b`)).rows[0] as Record<string, number>;
check("plan limits: 1 / 15 / 50 / 150", lim.f === 1 && lim.s === 15 && lim.p === 50 && lim.b === 150);

// ───────── forms ─────────
await as(B, `insert into public.forms (slug, title, fields) values ('feedB1', 'Feedback', '[{"id":"q1","type":"rating","label":"Wie war es?"}]')`);
check("user can create a form", true);
await expectError("free plan: only 1 form", () => as(B, `insert into public.forms (slug, title) values ('feedB2', 'Zweites')`), /FORM_LIMIT_REACHED/);
check("anon reads public form", (await asAnon(`select * from public.public_form('feedB1')`)).rows.length === 1);
const sub = (await asAnon(`select public.submit_form_response('feedB1', '{"q1":5}', '{}') as r`)).rows[0] as { r: string };
check("anon can submit a response", sub.r === "OK");
check("owner sees responses", (await as(B, `select * from public.form_responses`)).rows.length === 1);
check("others don't see responses", (await as(A, `select * from public.form_responses`)).rows.length === 0);
await expectError("anon cannot insert responses directly", () => asAnon(`insert into public.form_responses (form_id, answers) select id, '{}' from public.forms`), /permission denied/);
await as(B, `update public.forms set status = 'closed' where slug = 'feedB1'`);
check("closed form rejects", ((await asAnon(`select public.submit_form_response('feedB1', '{"q1":3}', '{}') as r`)).rows[0] as { r: string }).r === "CLOSED");
check("response counter", ((await as(B, `select response_count from public.forms`)).rows[0] as { response_count: number }).response_count === 1);
await as(B, `update public.forms set status = 'open', settings = '{"showResults": true}' where slug = 'feedB1'`);
await asAnon(`select public.submit_form_response('feedB1', '{"q2":"Pizza","q3":["A","B"]}', '{}')`);
await asAnon(`select public.submit_form_response('feedB1', '{"q2":"Pizza","q3":["A"]}', '{}')`);
const poll = ((await asAnon(`select public.form_poll_results('feedB1') as p`)).rows[0] as { p: Record<string, Record<string, number>> }).p;
check("poll results counted", poll.q2?.Pizza === 2 && poll.q3?.A === 2 && poll.q3?.B === 1, poll);

// ───────── polls ─────────
const PT = "p".repeat(40);
const pollContent = (extra: Record<string, unknown> = {}) => JSON.stringify({ question: "Gericht des Monats?", options: [{ label: "Pizza" }, { label: "Pasta" }, { label: "Salat" }], multiple: false, results: "after", ...extra });
await asAnon(`select public.create_guest_code('pollG1', $1, 'Umfrage', 'poll', $2::jsonb, '{}')`, [PT, pollContent()]);
async function vote(slug: string, choices: number[], hash: string) {
  await db.exec(`set role service_role;`);
  try {
    return ((await db.query(`select public.cast_vote($1, $2::smallint[], $3) as r`, [slug, `{${choices.join(",")}}`, hash])).rows[0] as { r: string }).r;
  } finally {
    await db.exec("reset role;");
  }
}
check("poll: first vote OK", (await vote("pollG1", [0], "h".repeat(32))) === "OK");
check("poll: same device cannot vote twice", (await vote("pollG1", [1], "h".repeat(32))) === "ALREADY");
check("poll: second device OK", (await vote("pollG1", [0], "i".repeat(32))) === "OK");
check("poll: third device OK", (await vote("pollG1", [2], "j".repeat(32))) === "OK");
check("poll: out-of-range option rejected", (await vote("pollG1", [7], "k".repeat(32))) === "INVALID");
check("poll: two choices on single-choice poll rejected", (await vote("pollG1", [0, 1], "k".repeat(32))) === "INVALID");
check("poll: unknown slug", (await vote("nopeX1", [0], "k".repeat(32))) === "NOT_FOUND");
await expectError("poll: anon cannot cast votes directly", () => asAnon(`select public.cast_vote('pollG1', '{0}', '${"z".repeat(32)}')`), /permission denied/);
await expectError("poll: anon cannot insert votes", () => asAnon(`insert into public.poll_votes (code_id, choices, voter_hash) select id, '{0}', '${"z".repeat(32)}' from public.qr_codes where slug = 'pollG1'`), /permission denied/);
const res = ((await asAnon(`select public.poll_results('pollG1') as r`)).rows[0] as { r: { total: number; counts: number[] } }).r;
check("poll: public tally", res.total === 3 && res.counts.join(",") === "2,0,1", res);

await asAnon(`select public.update_guest_code('pollG1', $1, 'Umfrage', 'poll', $2::jsonb, '{}')`, [PT, pollContent({ results: "never", multiple: true })]);
check("poll: hidden results not public", ((await asAnon(`select public.poll_results('pollG1') as r`)).rows[0] as { r: unknown }).r === null);
check("poll: edit token still sees results", (((await asAnon(`select public.poll_results('pollG1', $1) as r`, [PT])).rows[0] as { r: { total: number } | null }).r?.total) === 3);
check("poll: multiple choice allowed when enabled", (await vote("pollG1", [0, 2], "m".repeat(32))) === "OK");
check("poll: duplicate choices rejected", (await vote("pollG1", [1, 1], "n".repeat(32))) === "INVALID");

await asAnon(`select public.update_guest_code('pollG1', $1, 'Umfrage', 'poll', $2::jsonb, '{}')`, [PT, pollContent({ closesAt: "2020-01-01T00:00:00Z" })]);
check("poll: closed after end date", (await vote("pollG1", [0], "o".repeat(32))) === "CLOSED");

// ───────── event RSVP ─────────
const ET = "e".repeat(40);
const evContent = (extra: Record<string, unknown> = {}) => JSON.stringify({ title: "Jazz Night", start: "2099-12-05T19:30", rsvp: true, capacity: "5", showCount: true, ...extra });
await asAnon(`select public.create_guest_code('eventG1', $1, 'Jazz', 'event', $2::jsonb, '{}')`, [ET, evContent()]);
async function rsvp(email: string, guests: number, token: string, auto = false) {
  await db.exec(`set role service_role;`);
  try {
    return ((await db.query(`select public.rsvp_register('eventG1', 'Gast', $1, $2::smallint, $3, $4) as r`, [email, guests, token, auto])).rows[0] as { r: string }).r;
  } finally {
    await db.exec("reset role;");
  }
}
check("rsvp: register", (await rsvp("anna@example.com", 2, "t".repeat(40))) === "OK");
check("rsvp: unconfirmed not counted", ((await asAnon(`select public.rsvp_stats('eventG1') as s`)).rows[0] as { s: { attending: number } }).s.attending === 0);
await db.exec(`set role service_role;`);
const conf = ((await db.query(`select public.rsvp_confirm($1) as s`, ["t".repeat(40)])).rows[0] as { s: string }).s;
await db.exec(`reset role;`);
check("rsvp: confirm returns slug", conf === "eventG1");
check("rsvp: confirmed guests counted", ((await asAnon(`select public.rsvp_stats('eventG1') as s`)).rows[0] as { s: { attending: number; capacity: number } }).s.attending === 2);
check("rsvp: same email again = already attending", (await rsvp("ANNA@example.com", 1, "u".repeat(40))) === "CONFIRMED");
check("rsvp: auto-confirm without mail service", (await rsvp("ben@example.com", 3, "v".repeat(40), true)) === "OK");
check("rsvp: capacity enforced", (await rsvp("carl@example.com", 1, "w".repeat(40), true)) === "FULL");
check("rsvp: list hidden from the public", ((await asAnon(`select public.rsvp_list('eventG1') as l`)).rows[0] as { l: unknown }).l === null);
check("rsvp: list for edit-token holder", (((await asAnon(`select public.rsvp_list('eventG1', $1) as l`, [ET])).rows[0] as { l: unknown[] }).l?.length) === 2);
await expectError("rsvp: anon cannot register directly", () => asAnon(`select public.rsvp_register('eventG1', 'x', 'x@y.de', 1::smallint, '${"z".repeat(40)}', true)`), /permission denied/);
await expectError("rsvp: anon cannot read rows", () => asAnon(`insert into public.event_rsvps (code_id, email, token_hash) select id, 'a@b.de', '${"z".repeat(40)}' from public.qr_codes where slug = 'eventG1'`), /permission denied/);
await asAnon(`select public.update_guest_code('eventG1', $1, 'Jazz', 'event', $2::jsonb, '{}')`, [ET, evContent({ rsvp: false })]);
check("rsvp: closed when registration is off", (await rsvp("dora@example.com", 1, "x".repeat(40))) === "CLOSED");

// ───────── admin, trash, gifts ─────────
const ADM = "44444444-4444-4444-4444-444444444444";
await db.exec(`insert into auth.users (id, email) values ('${ADM}', 'Info@QlickQR.com');`);
check("admin: owner email becomes admin", ((await db.query(`select role from public.profiles where id = '${ADM}'`)).rows[0] as { role: string }).role === "admin");
await expectError("admin: normal user cannot read the overview", () => as(A, `select public.admin_overview()`), /NOT_ADMIN/);
check("admin: admin reads the overview", !!((await as(ADM, `select public.admin_overview() as o`)).rows[0] as { o: unknown }).o);
check("admin: lists users", (await as(ADM, `select * from public.admin_users()`)).rows.length >= 3);
await as(ADM, `select public.admin_set_plan('${B}', 'pro', now() + interval '30 days', 'Test')`);
check("admin: gift plan applied", ((await db.query(`select public.effective_plan('${B}') as p`)).rows[0] as { p: string }).p === "pro");
await db.exec(`update public.profiles set plan_until = now() - interval '1 day' where id = '${B}'`);
check("admin: expired gift falls back to free", ((await db.query(`select public.effective_plan('${B}') as p`)).rows[0] as { p: string }).p === "free");
check("admin: actions are logged", (await as(ADM, `select * from public.admin_audit_log()`)).rows.length >= 1);

await as(B, `insert into public.qr_codes (name, slug, type, mode) values ('Trash me', 'trashB1', 'url', 'dynamic')`);
await as(B, `update public.qr_codes set deleted_at = now() where slug = 'trashB1'`);
check("trash: deleted code is gone for scanners", (await asAnon(`select * from public.public_code('trashB1')`)).rows.length === 0);
await as(B, `insert into public.qr_codes (name, slug, type, mode) values ('Second', 'trashB2', 'url', 'dynamic')`);
check("trash: trashed codes do not count against the plan", true);
await expectError("trash: restore over the limit is blocked", () => as(B, `update public.qr_codes set deleted_at = null where slug = 'trashB1'`), /PLAN_LIMIT_REACHED/);

const codeB2 = ((await db.query(`select id from public.qr_codes where slug = 'trashB2'`)).rows[0] as { id: string }).id;
await as(ADM, `select public.admin_code_action('${codeB2}', 'lock', 'Spam')`);
check("lock: scanners see paused", ((await asAnon(`select status from public.public_code('trashB2')`)).rows[0] as { status: string }).status === "paused");
await expectError("lock: owner cannot remove the lock", () => as(B, `update public.qr_codes set locked_at = null where slug = 'trashB2'`), /permission denied/);
await as(ADM, `select public.admin_code_action('${codeB2}', 'pause')`);
await expectError("lock: owner cannot switch a locked code back on", () => as(B, `update public.qr_codes set status = 'active' where slug = 'trashB2'`), /CODE_LOCKED/);
await as(ADM, `select public.admin_suspend_user('${A}', true, 'Test')`);
await expectError("suspend: suspended user cannot create codes", () => as(A, `insert into public.qr_codes (name, slug, type, mode) values ('x', 'suspA1', 'url', 'static')`), /ACCOUNT_SUSPENDED/);
await expectError("suspend: admin cannot suspend themselves", () => as(ADM, `select public.admin_suspend_user('${ADM}', true, 'x')`), /NOT_SELF/);

// ── custom limits and gifts by e-mail ──
await as(ADM, `select public.admin_set_limit('${B}', 0)`);
await expectError("limit: custom limit 0 blocks new dynamic codes", () => as(B, `insert into public.qr_codes (name, slug, type, mode) values ('L', 'limB01', 'url', 'dynamic')`), /PLAN_LIMIT_REACHED/);
await as(ADM, `select public.admin_set_limit('${B}', -1)`);
await as(B, `insert into public.qr_codes (name, slug, type, mode) values ('L1', 'limB01', 'url', 'dynamic'), ('L2', 'limB02', 'url', 'dynamic'), ('L3', 'limB03', 'url', 'dynamic')`);
check("limit: unlimited lets the user create more", true);
check("limit: dynamic_limit is null for unlimited", ((await as(B, `select public.dynamic_limit('${B}') l`)).rows[0] as { l: number | null }).l === null);
await expectError("limit: users cannot set their own limit", () => as(B, `update public.profiles set code_limit = -1`), /permission denied/);
await expectError("limit: only admins", () => as(B, `select public.admin_set_limit('${B}', -1)`), /NOT_ADMIN/);

const pend = ((await as(ADM, `select public.admin_gift_email('Neu@Kunde.de', 'pro', 3, null, 7, 'Pilot') r`)).rows[0] as { r: { status: string } }).r;
check("gift: unknown e-mail waits for sign-up", pend.status === "pending" && (await as(ADM, `select * from public.admin_grants()`)).rows.length === 1);
const E = "55555555-5555-5555-5555-555555555555";
await db.exec(`insert into auth.users (id, email) values ('${E}', 'neu@kunde.de');`);
const ep = (await db.query(`select plan, plan_source, code_limit, plan_until > now() + interval '80 days' as later from public.profiles where id = '${E}'`)).rows[0] as { plan: string; plan_source: string; code_limit: number; later: boolean };
check("gift: applied on sign-up (plan, months from sign-up, limit)", ep.plan === "pro" && ep.plan_source === "gift" && ep.code_limit === 7 && ep.later);
check("gift: claimed gift leaves the open list", (await as(ADM, `select * from public.admin_grants()`)).rows.length === 0);
const now = ((await as(ADM, `select public.admin_gift_email('${"neu@kunde.de"}', 'business', null, null, null) r`)).rows[0] as { r: { status: string } }).r;
check("gift: existing account gets it at once", now.status === "applied" && ((await db.query(`select plan, plan_until from public.profiles where id = '${E}'`)).rows[0] as { plan: string; plan_until: string | null }).plan === "business");
await expectError("gift: bad e-mail is rejected", () => as(ADM, `select public.admin_gift_email('nope', 'pro', 1, null, null)`), /BAD_EMAIL/);
await expectError("gift: only admins", () => as(B, `select public.admin_gift_email('x@y.de', 'pro', 1, null, null)`), /NOT_ADMIN/);

// ── billing and settings ──
await as(B, `update public.profiles set notify_product = false where id = '${B}'`);
check("settings: user can change own e-mail preferences", ((await db.query(`select notify_product from public.profiles where id = '${B}'`)).rows[0] as { notify_product: boolean }).notify_product === false);
await expectError("billing: user cannot fake a subscription", () => as(B, `update public.profiles set subscription_status = 'active'`), /permission denied/);
await expectError("billing: user cannot set a customer id", () => as(B, `update public.profiles set stripe_customer_id = 'cus_x'`), /permission denied/);
await expectError("cancel page: e-mail lookup is server-only", () => as(B, `select public.user_id_by_email('neu@kunde.de')`), /permission denied/);
await as(B, `update public.profiles set avatar_url = 'https://x.supabase.co/storage/v1/object/public/assets/${B}/a.webp' where id = '${B}'`);
check("avatar: user can set own photo", !!((await db.query(`select avatar_url from public.profiles where id = '${B}'`)).rows[0] as { avatar_url: string }).avatar_url);
