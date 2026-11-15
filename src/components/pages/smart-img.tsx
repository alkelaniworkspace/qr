"use client";

import { useState } from "react";
import { proxiedImage } from "@/lib/image-url";

/**
 * Photo for hosted pages: loads external images through our proxy (full size,
 * WebP, cached), retries the original URL once, and shows `fallback` instead
 * of a broken-image icon if the photo really cannot be loaded.
 */
export function SmartImg({ src, width = 800, alt = "", className, fallback = null, eager = false }: {
  src: string;
  width?: number;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  eager?: boolean;
}) {
  const [stage, setStage] = useState<{ src: string; n: number }>({ src, n: 0 });
  // reset when the source changes (editor preview)
  const current = stage.src === src ? stage.n : 0;
  if (!src || current > 1) return <>{fallback}</>;
  const url = current === 0 ? proxiedImage(src, width) : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setStage({ src, n: current + (url === src ? 2 : 1) })}
      className={className}
    />
  );
}
