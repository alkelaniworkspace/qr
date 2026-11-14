import { cn } from "@/lib/cn";

export const inputClass =
  "w-full h-12 rounded-[14px] border border-edge bg-bg/60 px-4 text-[15px] text-fg placeholder:text-faint transition focus:border-lime/60 focus:outline-none focus:ring-4 focus:ring-lime/10 aria-[invalid=true]:border-rose";

export function Label({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-dim", className)}>
      {children}
    </label>
  );
}

export function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? <p className="mt-1.5 text-xs text-rose">{error}</p> : hint ? <p className="mt-1.5 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cn(inputClass, "h-auto py-3 leading-relaxed", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, "appearance-none pr-8", props.className)} />;
}
