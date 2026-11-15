"use client";

import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/env";

/**
 * Shrinks an image in the browser (max side, WebP) and uploads it to the
 * public "images" bucket. Returns the public https URL.
 */
export async function uploadImage(file: File, maxSide = 1400): Promise<string> {
  if (!supabaseConfigured) throw new Error("Bild-Upload ist gerade nicht verfügbar.");
  if (!/^image\/(png|jpe?g|webp|gif|heic|heif)$/i.test(file.type) && !/\.(png|jpe?g|webp|heic)$/i.test(file.name)) {
    throw new Error("Bitte ein Bild wählen (JPG, PNG oder WebP).");
  }
  if (file.size > 25 * 1024 * 1024) throw new Error("Das Bild ist größer als 25 MB.");

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("Dieses Bildformat kann der Browser nicht lesen. Bitte JPG oder PNG nutzen.");
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob: Blob | null = null;
  for (const q of [0.84, 0.72, 0.6]) {
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", q));
    if (blob && blob.size < 2.8 * 1024 * 1024) break;
  }
  if (!blob) throw new Error("Bild konnte nicht verarbeitet werden.");

  const path = `g/${crypto.randomUUID()}.webp`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("images").upload(path, blob, { contentType: "image/webp", upsert: false });
  if (error) throw new Error("Upload fehlgeschlagen. Bitte erneut versuchen.");
  return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
}
