import { z } from "zod";
import { DEFAULT_STYLE, type QrStyle } from "./style";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const MAX_LOGO_CHARS = 400_000; // ~300 KB image, logos are resized client side

const styleSchema = z.object({
  ecc: z.enum(["L", "M", "Q", "H"]),
  margin: z.number().int().min(0).max(8),
  dots: z.enum(["square", "rounded", "dots", "classy", "diamond", "fluid", "mini", "vertical", "horizontal", "bubble"]),
  eyeFrame: z.enum(["square", "rounded", "circle", "leaf", "octagon", "shield"]),
  eyeBall: z.enum(["square", "rounded", "circle", "diamond", "leaf", "octagon", "shield"]),
  fill: z.discriminatedUnion("type", [
    z.object({ type: z.literal("solid"), color: hex }),
    z.object({ type: z.enum(["linear", "radial"]), colors: z.tuple([hex, hex]), rotation: z.number().min(0).max(360) }),
  ]),
  eyeColor: hex.nullable(),
  eyeBallColor: hex.nullable(),
  radius: z.number().min(0).max(20),
  background: hex,
  transparent: z.boolean(),
  logo: z
    .object({
      src: z.string().max(MAX_LOGO_CHARS).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Logo muss PNG, JPG oder WebP sein"),
      size: z.number().min(0.1).max(0.3),
      excavate: z.boolean(),
      plate: z.boolean(),
    })
    .nullable(),
  frame: z.object({
    style: z.enum(["none", "card", "label", "ticket"]),
    text: z.string().max(40),
    color: hex,
    textColor: hex,
  }),
});

/** Server-side guard: only well-formed styles are stored (no script in SVG). */
export function sanitizeStyle(input: unknown): { ok: true; style: QrStyle } | { ok: false; error: string } {
  const merged = { ...DEFAULT_STYLE, ...(input as object) };
  const r = styleSchema.safeParse(merged);
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Ungültiges Design" };
  return { ok: true, style: r.data };
}
