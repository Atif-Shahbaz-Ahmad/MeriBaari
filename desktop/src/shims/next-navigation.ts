import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => {
      navigate(href);
    },
    replace: (href: string) => {
      navigate(href, { replace: true });
    },
    back: () => {
      navigate(-1);
    },
    prefetch: () => undefined,
    refresh: () => undefined,
  };
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  const [params] = useRouterSearchParams();
  return params;
}

export function useParams<T extends Record<string, string | undefined>>() {
  return useRouterParams() as T;
}

export function redirect(href: string): never {
  if (typeof window !== 'undefined') {
    window.location.hash = `#${href}`;
  }
  throw new Error(`REDIRECT:${href}`);
}

export function notFound(): never {
  throw new Error('NOT_FOUND');
}
