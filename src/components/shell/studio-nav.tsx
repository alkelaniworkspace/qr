"use client";

import { createContext, useContext, useState } from "react";

/**
 * The studio wizard publishes where the user is (step, chosen type, output
 * tab) and how to move; the sidebar shows it as a numbered path with sub-menus.
 */
export type Output = "print" | "sticker" | "motion";

export interface StudioNavState {
  step: number;
  reached: number;
  typeLabel: string;
  name: string;
  designLabel: string;
  output: Output;
  go: (step: number) => void;
  setOutput: (o: Output) => void;
}

const Ctx = createContext<{ nav: StudioNavState | null; publish: (s: StudioNavState | null) => void } | null>(null);

export function StudioNavProvider({ children }: { children: React.ReactNode }) {
  const [nav, publish] = useState<StudioNavState | null>(null);
  return <Ctx.Provider value={{ nav, publish }}>{children}</Ctx.Provider>;
}

export function useStudioNav() {
  return useContext(Ctx)?.nav ?? null;
}

export function usePublishStudioNav() {
  return useContext(Ctx)?.publish ?? null;
}
