import type { CodeMode, CodeTypeId } from "./types";

export interface QrCodeRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  type: CodeTypeId;
  mode: CodeMode;
  content: Record<string, unknown>;
  style: unknown;
  status: "active" | "paused";
  archived_at?: string | null;
  deleted_at?: string | null;
  locked_at?: string | null;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CodeStats {
  total: number;
  unique: number;
  series: { date: string; scans: number }[];
  devices: { label: string; n: number }[];
  os: { label: string; n: number }[];
  countries: { label: string; n: number }[];
  cities: { label: string; n: number }[];
  hours: { hour: number; n: number }[];
}
