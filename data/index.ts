/**
 * Public data-layer API.
 *
 * Screens & stores should import from `@/data` or `@/data/di`,
 * never from `@/mock` directly.
 */
export { container, getContainer, setContainer, createMockContainer } from './di';
export type { AppContainer } from './di';
export { dataAccess } from './access';
