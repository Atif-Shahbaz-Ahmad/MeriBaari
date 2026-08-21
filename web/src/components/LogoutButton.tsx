'use client';

import { useTransition, type ButtonHTMLAttributes } from 'react';

import { Button } from '@web/components/ui';
import { logoutAction } from '@web/lib/logout-action';

export function LogoutButton({
  children,
  className,
  variant = 'ghost',
  onClick,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      {...props}
      type="button"
      className={className}
      variant={variant}
      disabled={pending || disabled}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        startTransition(async () => {
          const result = await logoutAction();
          window.location.assign(result.redirectTo);
        });
      }}
    >
      {pending ? 'Signing out…' : children}
    </Button>
  );
}