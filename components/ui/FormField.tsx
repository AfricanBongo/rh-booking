/**
 * FormField - Reusable form field with label, input, and error message
 *
 * Wraps a native input with consistent styling:
 * - Label above (text-sm font-medium)
 * - Input with rounded-xl border, focus ring animation
 * - Error message below in danger color
 * - Supports all native input types
 *
 * Usage:
 *   <FormField label="Email" id="email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
 */
import { forwardRef } from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, id, className = "", ...props }, ref) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-xl border border-border px-4 py-3.5 text-foreground bg-background focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200 ${error ? "border-danger" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-danger mt-1.5">{error}</p>}
      </div>
    );
  }
);
