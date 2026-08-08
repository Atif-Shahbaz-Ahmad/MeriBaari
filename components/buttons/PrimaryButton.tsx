import { Button, type ButtonProps } from '@/components/ui/Button';

type SharedProps = Omit<ButtonProps, 'variant'>;

/** Primary CTA — thin wrapper over design-system Button. */
export function PrimaryButton(props: SharedProps) {
  return <Button variant="primary" {...props} />;
}

/** Secondary CTA — thin wrapper over design-system Button. */
export function SecondaryButton(props: SharedProps) {
  return <Button variant="secondary" {...props} />;
}
