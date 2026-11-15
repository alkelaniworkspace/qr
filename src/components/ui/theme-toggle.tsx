"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const listeners = new Set<() => void>();

function read(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "dark" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("scanwerk.theme", next);
        } catch {
          // private mode: theme just isn't remembered
        }
        listeners.forEach((l) => l());
      }}
      aria-label={next === "light" ? "Heller Modus" : "Dunkler Modus"}
      title={next === "light" ? "Heller Modus" : "Dunkler Modus"}
      className="grid size-9 place-items-center rounded-xl border border-edge text-dim transition hover:border-edge-strong hover:text-fg"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
