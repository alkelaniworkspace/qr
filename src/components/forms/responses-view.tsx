"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "motion/react";
import { ArrowDownUp, FileSpreadsheet, FileText, Search, Star, Trash2 } from "lucide-react";
import type { FormField } from "@/lib/forms/types";
import { isInput } from "@/lib/forms/types";
import { deleteResponse } from "@/app/dashboard/forms/actions";
import { cn } from "@/lib/cn";

export interface ResponseRow {
  id: number;
  created_at: string;
  answers: Record<string, unknown>;
  meta: { device?: string; os?: string; lang?: string; country?: string | null };
}

const fmtDate = (s: string) => new Date(s).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
const show = (v: unknown) => (v === undefined || v === null ? "" : Array.isArray(v) ? v.join(", ") : v === true ? "Ja" : String(v));

function Bar({ label, n, total }: { label: string; n: number; total: number }) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm"><span className="truncate">{label}</span><span className="shrink-0 tabular-nums text-dim">{n} · {pct} %</span></div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-hi/10">
        <motion.div className="h-full rounded-full bg-fg" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
    </div>
  );
}

function Summary({ field, rows }: { field: FormField; rows: ResponseRow[] }) {
  const values = rows.map((r) => r.answers[field.id]).filter((v) => v !== undefined && v !== null && v !== "");
  const answered = values.length;
  let body: React.ReactNode;

  if (field.type === "single" || field.type === "dropdown" || field.type === "multi") {
    const counts = new Map<string, number>();
    for (const v of values) for (const x of Array.isArray(v) ? v : [v]) counts.set(String(x), (counts.get(String(x)) ?? 0) + 1);
    const opts = [...new Set([...(field.options ?? []), ...counts.keys()])].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
    body = <div className="space-y-2.5">{opts.map((o) => <Bar key={o} label={o} n={counts.get(o) ?? 0} total={answered} />)}</div>;
  } else if (field.type === "rating" || field.type === "nps" || field.type === "number") {
    const nums = values.map(Number).filter(isFinite);
    const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    if (field.type === "number") {
      body = (
        <div className="grid grid-cols-3 gap-3 text-center">
          {[["Ø", avg], ["Min", Math.min(...nums)], ["Max", Math.max(...nums)]].map(([k, v]) => (
            <div key={k as string} className="rounded-2xl bg-hi/5 p-3"><p className="text-xs text-dim">{k}</p><p className="font-display text-2xl tabular-nums">{nums.length ? (v as number).toLocaleString("de-DE", { maximumFractionDigits: 1 }) : "–"}</p></div>
          ))}
        </div>
      );
    } else {
      const max = field.type === "rating" ? 5 : 10;
      const min = field.type === "rating" ? 1 : 0;
      const dist = Array.from({ length: max - min + 1 }, (_, k) => nums.filter((n) => n === k + min).length);
      const promoters = nums.filter((n) => n >= 9).length;
      const detractors = nums.filter((n) => n <= 6).length;
      const nps = nums.length ? Math.round(((promoters - detractors) / nums.length) * 100) : 0;
      const peak = Math.max(1, ...dist);
      body = (
        <div>
          <div className="flex items-end gap-3">
            <p className="font-display text-5xl tabular-nums">{avg.toLocaleString("de-DE", { maximumFractionDigits: 1 })}</p>
            {field.type === "rating" ? (
              <div className="mb-2 flex">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn("size-5", avg >= s - 0.25 ? "fill-[#f5b301] text-[#f5b301]" : "text-hi/20")} />)}</div>
            ) : (
              <p className="mb-2 text-sm text-dim">NPS <b className={cn("text-fg", nps >= 30 ? "text-mint" : nps < 0 ? "text-rose" : "")}>{nps > 0 ? "+" : ""}{nps}</b></p>
            )}
          </div>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {dist.map((n, k) => (
              <div key={k} className="flex flex-1 flex-col items-center gap-1">
                <motion.div className={cn("w-full rounded-md", field.type === "nps" ? (k + min >= 9 ? "bg-mint" : k + min <= 6 ? "bg-rose/70" : "bg-hi/40") : "bg-fg")} initial={{ height: 0 }} whileInView={{ height: `${(n / peak) * 80}px` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: k * 0.03 }} />
                <span className="text-[10px] text-faint">{k + min}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  } else if (field.type === "consent") {
    body = <Bar label="Zugestimmt" n={answered} total={rows.length} />;
  } else {
    body = (
      <ul className="max-h-52 space-y-2 overflow-y-auto pr-1 text-sm">
        {values.slice(0, 50).map((v, k) => <li key={k} className="rounded-xl bg-hi/5 px-3 py-2">{show(v)}</li>)}
        {!values.length && <li className="text-faint">Noch keine Antworten</li>}
      </ul>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="font-semibold">{field.label}</p>
        <span className="shrink-0 text-xs text-faint">{answered} / {rows.length}</span>
      </div>
      {body}
    </div>
  );
}

export function ResponsesView({ formId, title, fields, rows }: { formId: string; title: string; fields: FormField[]; rows: ResponseRow[] }) {
  const inputs = fields.filter((f) => isInput(f.type));
  const [tab, setTab] = useState<"summary" | "table">("summary");
  const [q, setQ] = useState("");
  const [asc, setAsc] = useState(false);
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [list, setList] = useState(rows);
  const [, start] = useTransition();
  const [now] = useState(() => Date.now());

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list
      .filter((r) => !from || r.created_at >= from)
      .filter((r) => !to || r.created_at.slice(0, 10) <= to)
      .filter((r) => !needle || Object.values(r.answers).some((v) => show(v).toLowerCase().includes(needle)))
      .filter((r) => !filterField || !filterValue || show(r.answers[filterField]).split(", ").includes(filterValue))
      .sort((a, b) => (asc ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at)));
  }, [list, q, asc, filterField, filterValue, from, to]);

  const perDay = useMemo(() => {
    const days = 14;
    return Array.from({ length: days }, (_, k) => {
      const d = new Date(now - (days - 1 - k) * 86400000).toISOString().slice(0, 10);
      return { d, n: list.filter((r) => r.created_at.slice(0, 10) === d).length };
    });
  }, [list, now]);
  const peak = Math.max(1, ...perDay.map((x) => x.n));
  const filterOptions = inputs.find((f) => f.id === filterField)?.options ?? [];

  async function exportExcel() {
    const writeXlsxFile = (await import("write-excel-file/browser")).default;
    const header = [{ value: "Datum", fontWeight: "bold" as const }, ...inputs.map((f) => ({ value: f.label, fontWeight: "bold" as const })), { value: "Gerät", fontWeight: "bold" as const }];
    const data = [header, ...filtered.map((r) => [{ value: fmtDate(r.created_at) }, ...inputs.map((f) => ({ value: show(r.answers[f.id]) })), { value: [r.meta?.device, r.meta?.os].filter(Boolean).join(" · ") }])];
    await writeXlsxFile(data, { sheet: "Antworten", columns: [{ width: 18 }, ...inputs.map(() => ({ width: 28 })), { width: 16 }] }).toFile(`${title.replace(/[^\wäöüß -]/gi, "").slice(0, 40) || "antworten"}.xlsx`);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: inputs.length > 4 ? "landscape" : "portrait" });
    doc.setFontSize(18);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`${filtered.length} Antworten · Export vom ${new Date().toLocaleDateString("de-DE")}`, 14, 25);
    let y = 34;
    doc.setTextColor(25);
    for (const f of inputs.filter((x) => ["single", "multi", "dropdown", "rating", "nps", "number"].includes(x.type))) {
      const vals = filtered.map((r) => r.answers[f.id]).filter((v) => v !== undefined && v !== "");
      let line = "";
      if (["rating", "nps", "number"].includes(f.type)) {
        const nums = vals.map(Number).filter(isFinite);
        line = nums.length ? `Ø ${(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)} (${nums.length} Antworten)` : "–";
      } else {
        const c = new Map<string, number>();
        for (const v of vals) for (const x of Array.isArray(v) ? v : [v]) c.set(String(x), (c.get(String(x)) ?? 0) + 1);
        line = [...c.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}: ${Math.round((n / (vals.length || 1)) * 100)} %`).join("   ");
      }
      doc.setFont("helvetica", "bold");
      doc.text(f.label.slice(0, 90), 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(line, 180), 14, y + 5);
      y += 14;
      if (y > 180) {
        doc.addPage();
        y = 20;
      }
    }
    autoTable(doc, {
      startY: y + 2,
      head: [["Datum", ...inputs.map((f) => f.label.slice(0, 30))]],
      body: filtered.map((r) => [fmtDate(r.created_at), ...inputs.map((f) => show(r.answers[f.id]).slice(0, 120))]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [25, 25, 25], textColor: [189, 251, 4] },
    });
    doc.save(`${title.replace(/[^\wäöüß -]/gi, "").slice(0, 40) || "antworten"}.pdf`);
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-dim">Antworten gesamt</p><p className="font-display text-5xl tabular-nums">{list.length}</p></div>
        <div className="card p-5"><p className="text-sm text-dim">Letzte 7 Tage</p><p className="font-display text-5xl tabular-nums">{perDay.slice(-7).reduce((a, b) => a + b.n, 0)}</p></div>
        <div className="card p-5">
          <p className="text-sm text-dim">14 Tage</p>
          <div className="mt-3 flex h-14 items-end gap-1">
            {perDay.map((x) => <div key={x.d} title={`${x.d}: ${x.n}`} className="flex-1 rounded-sm bg-fg/80" style={{ height: `${Math.max(4, (x.n / peak) * 56)}px`, opacity: x.n ? 1 : 0.2 }} />)}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-edge bg-hi/5 p-1 text-sm font-semibold">
          {([["summary", "Auswertung"], ["table", "Alle Antworten"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={cn("rounded-full px-4 py-1.5", tab === k ? "bg-brand text-on-brand" : "text-dim")}>{l}</button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={exportExcel} disabled={!filtered.length} className="inline-flex items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-sm font-semibold hover:bg-hi/5 disabled:opacity-40"><FileSpreadsheet className="size-4" /> Excel</button>
          <button type="button" onClick={exportPdf} disabled={!filtered.length} className="inline-flex items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-sm font-semibold hover:bg-hi/5 disabled:opacity-40"><FileText className="size-4" /> PDF-Bericht</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-edge bg-surface px-4">
          <Search className="size-4 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="In Antworten suchen" className="h-10 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <select value={filterField} onChange={(e) => { setFilterField(e.target.value); setFilterValue(""); }} className="h-10 rounded-full border border-edge bg-surface px-4 text-sm">
          <option value="">Filtern nach Frage</option>
          {inputs.filter((f) => f.options).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        {filterField && (
          <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="h-10 rounded-full border border-edge bg-surface px-4 text-sm">
            <option value="">Alle</option>
            {filterOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
        )}
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-full border border-edge bg-surface px-4 text-sm" aria-label="Von" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-full border border-edge bg-surface px-4 text-sm" aria-label="Bis" />
        <button type="button" onClick={() => setAsc((v) => !v)} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-edge px-4 text-sm font-semibold"><ArrowDownUp className="size-4" /> {asc ? "Älteste zuerst" : "Neueste zuerst"}</button>
      </div>
      {filtered.length !== list.length && <p className="mt-2 text-xs text-dim">{filtered.length} von {list.length} Antworten</p>}

      {tab === "summary" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">{inputs.map((f) => <Summary key={f.id} field={f} rows={filtered} />)}</div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-edge text-xs text-dim">
              <tr><th className="p-3 font-semibold">Datum</th>{inputs.map((f) => <th key={f.id} className="p-3 font-semibold">{f.label}</th>)}<th /></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-edge/60 align-top last:border-0 hover:bg-hi/[0.03]">
                  <td className="whitespace-nowrap p-3 text-dim">{fmtDate(r.created_at)}</td>
                  {inputs.map((f) => <td key={f.id} className="max-w-[260px] p-3">{show(r.answers[f.id])}</td>)}
                  <td className="p-3">
                    <button type="button" aria-label="Antwort löschen" onClick={() => { setList((l) => l.filter((x) => x.id !== r.id)); start(() => deleteResponse(formId, r.id)); }} className="text-faint hover:text-rose"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={inputs.length + 2} className="p-10 text-center text-dim">Noch keine Antworten.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
