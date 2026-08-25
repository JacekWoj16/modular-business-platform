import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/** Labeled input with an optional validation message, used across panel forms. */
export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-xs font-medium text-slate-600">
        {label}
      </label>
      <input
        id={fieldId}
        className="rounded border border-slate-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        {...inputProps}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
