import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Field({ label, error, className, id, ...props }: FieldProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-field border border-hairline bg-surface px-3 py-2 text-sm",
          "placeholder:text-mute/60",
          "focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-stop",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-stop">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full rounded-field border border-hairline bg-surface px-3 py-2 text-sm min-h-[80px]",
          "placeholder:text-mute/60",
          "focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-stop",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-stop">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full rounded-field border border-hairline bg-surface px-3 py-2 text-sm",
          "focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-stop",
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-stop">{error}</p>}
    </div>
  );
}
