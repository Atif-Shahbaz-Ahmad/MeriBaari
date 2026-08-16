import {
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
} from 'react-router-dom';
import type { AnchorHTMLAttributes, MouseEventHandler, ReactNode } from 'react';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  children?: ReactNode;
  replace?: boolean;
  prefetch?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export default function Link({ href, replace, children, prefetch: _prefetch, ...rest }: Props) {
  return (
    <RouterLink to={href} replace={replace} {...(rest as Omit<RouterLinkProps, 'to'>)}>
      {children}
    </RouterLink>
  );
}
