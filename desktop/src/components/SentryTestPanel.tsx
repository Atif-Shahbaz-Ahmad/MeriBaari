import { isErrorReportingEnabled, triggerSentryTestException } from '@/lib/monitoring';

export function SentryTestPanel() {
  if (!import.meta.env.DEV) return null;

  return (
    <section className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 text-sm">
      <h2 className="mb-2 font-semibold">Sentry test (development only)</h2>
      <button
        type="button"
        className="rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white"
        onClick={() => {
          triggerSentryTestException('desktop');
          window.alert(
            isErrorReportingEnabled() ? 'Test exception sent to Sentry.' : 'Sentry DSN is not set.',
          );
        }}
      >
        Send Sentry test exception
      </button>
    </section>
  );
}
