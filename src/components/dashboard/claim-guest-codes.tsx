"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { claimGuestCodes } from "@/app/dashboard/actions";
import { listLocalCodes, saveLocalCode } from "@/lib/codes/local-store";

/** After sign-in: codes made in this browser without an account move into the account. */
export function ClaimGuestCodes() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  useEffect(() => {
    const local = listLocalCodes().filter((c) => c.dynamic && !(c as { claimed?: boolean }).claimed);
    if (!local.length) return;
    claimGuestCodes(local.map((c) => c.dynamic!)).then(({ claimed }) => {
      for (const c of local) {
        if (claimed.includes(c.dynamic!.slug)) {
          try {
            saveLocalCode({ ...c, claimed: true } as typeof c);
          } catch {
            // ignore
          }
        }
      }
      if (claimed.length) {
        setCount(claimed.length);
        router.refresh();
      }
    });
  }, [router]);
  if (!count) return null;
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm">
      <Check className="size-4 text-mint" /> {count === 1 ? "1 Code" : `${count} Codes`} aus diesem Browser wurden in dein Konto übernommen.
    </div>
  );
}
