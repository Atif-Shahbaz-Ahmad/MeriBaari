'use client';

import { Eye, EyeOff } from 'lucide-react';
import {
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@web/lib/cn';

export function UnderlineField({
  label,
  className,
  id,
  trailing,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  trailing?: ReactNode;
}) {
  const inputId = id ?? props.name ?? label.replace(/\s+/g, '-').toLowerCase();
  return (
    <label className="block" htmlFor={inputId}>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <span className="relative mt-1 block">
        <input
          id={inputId}
          className={cn(
            'w-full border-0 border-b border-line bg-transparent px-0 py-2 text-ink outline-none placeholder:text-ink-muted focus:border-primary',
            trailing ? 'pr-9' : '',
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="absolute inset-y-0 right-0 flex items-center">{trailing}</span>
        ) : null}
      </span>
    </label>
  );
}

export function UnderlinePasswordField({
  label,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <UnderlineField
      {...props}
      label={label}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className="text-ink-muted hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  );
}
