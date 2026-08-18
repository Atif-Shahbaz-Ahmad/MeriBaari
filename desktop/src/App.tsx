import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AppProviders } from '@web/components/Providers';
import { QueueActionsProvider } from './lib/queue-actions';
import { DesktopShell } from './components/DesktopShell';
import { RedirectIfAuthenticated, RequireAuth } from './guards/RequireAuth';
import WelcomePage from './pages/WelcomePage';
import BusinessesPage from './pages/BusinessesPage';
import PublicBusinessPage from './pages/PublicBusinessPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import QueueWorkspacePage from './pages/QueueWorkspacePage';

import LoginPage from '@web-app/(auth)/login/page';
import SignupPage from '@web-app/(auth)/signup/page';
import ForgotPasswordPage from '@web-app/(auth)/forgot-password/page';
import ResetPasswordPage from '@web-app/(auth)/reset-password/page';
import VerifyEmailPage from '@web-app/(auth)/verify-email/page';
import RoleSelectPage from '@web-app/(auth)/role-select/page';
import AuthCallbackPage from '@web-app/auth/callback/page';
import PrivacyPage from '@web-app/privacy/page';

import BusinessCustomersPage from '@web-app/(business)/business/customers/page';
import BusinessTicketsPage from '@web-app/(business)/business/tickets/page';
import BusinessDepartmentsPage from '@web-app/(business)/business/departments/page';
import BusinessServicesPage from '@web-app/(business)/business/services/page';
import BusinessHistoryPage from '@web-app/(business)/business/history/page';
import BusinessAnalyticsPage from '@web-app/(business)/business/analytics/page';
import BusinessAssistantPage from '@web-app/(business)/business/assistant/page';
import BusinessNotificationsPage from '@web-app/(customer)/customer/notifications/page';
import BusinessProfilePage from '@web-app/(business)/business/profile/page';
import BusinessSubscriptionPage from '@web-app/(business)/business/subscription/page';
import BusinessSettingsPage from '@web-app/(business)/business/settings/page';

import CustomerHomePage from '@web-app/(customer)/customer/home/page';
import CustomerDiscoverPage from '@web-app/(customer)/customer/discover/page';
import CustomerNearbyPage from '@web-app/(customer)/customer/nearby/page';
import CustomerTicketsPage from '@web-app/(customer)/customer/tickets/page';
import CustomerFavoritesPage from '@web-app/(customer)/customer/favorites/page';
import CustomerNotificationsPage from '@web-app/(customer)/customer/notifications/page';
import CustomerAssistantPage from '@web-app/(customer)/customer/assistant/page';
import CustomerProfilePage from '@web-app/(customer)/customer/profile/page';
import JoinBusinessPage from '@web-app/(customer)/customer/join/[orgId]/page';
import JoinDepartmentPage from '@web-app/(customer)/customer/join/[orgId]/departments/[departmentId]/page';
import JoinConfirmPage from '@web-app/(customer)/customer/join/[orgId]/confirm/[serviceId]/page';

import AdminLayout from '@web-app/admin/layout';
import AdminPage from '@web-app/admin/page';
import AdminBusinessPage from '@web-app/admin/businesses/[id]/page';
import SentryTestPage from './pages/SentryTestPage';

function AdminLayoutRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

export function App() {
  return (
    <HashRouter>
      <AppProviders>
        <QueueActionsProvider>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            {import.meta.env.DEV ? (
              <Route path="/dev/sentry-test" element={<SentryTestPage />} />
            ) : null}
            <Route path="/businesses" element={<BusinessesPage />} />
            <Route path="/businesses/:id" element={<PublicBusinessPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            <Route
              path="/login"
              element={
                <RedirectIfAuthenticated>
                  <LoginPage />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="/signup"
              element={
                <RedirectIfAuthenticated>
                  <SignupPage />
                </RedirectIfAuthenticated>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/role-select" element={<RoleSelectPage />} />

            <Route element={<RequireAuth role="business" />}>
              <Route element={<DesktopShell area="business" />}>
                <Route path="/business" element={<Navigate to="/business/dashboard" replace />} />
                <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
                <Route path="/business/queue" element={<QueueWorkspacePage />} />
                <Route path="/business/customers" element={<BusinessCustomersPage />} />
                <Route path="/business/tickets" element={<BusinessTicketsPage />} />
                <Route path="/business/departments" element={<BusinessDepartmentsPage />} />
                <Route path="/business/services" element={<BusinessServicesPage />} />
                <Route path="/business/history" element={<BusinessHistoryPage />} />
                <Route path="/business/analytics" element={<BusinessAnalyticsPage />} />
                <Route path="/business/assistant" element={<BusinessAssistantPage />} />
                <Route path="/business/notifications" element={<BusinessNotificationsPage />} />
                <Route path="/business/profile" element={<BusinessProfilePage />} />
                <Route path="/business/subscription" element={<BusinessSubscriptionPage />} />
                <Route path="/business/settings" element={<BusinessSettingsPage />} />
              </Route>
            </Route>

            <Route element={<RequireAuth role="customer" />}>
              <Route element={<DesktopShell area="customer" />}>
                <Route path="/customer" element={<Navigate to="/customer/home" replace />} />
                <Route path="/customer/home" element={<CustomerHomePage />} />
                <Route path="/customer/discover" element={<CustomerDiscoverPage />} />
                <Route path="/customer/nearby" element={<CustomerNearbyPage />} />
                <Route path="/customer/tickets" element={<CustomerTicketsPage />} />
                <Route path="/customer/favorites" element={<CustomerFavoritesPage />} />
                <Route path="/customer/notifications" element={<CustomerNotificationsPage />} />
                <Route path="/customer/assistant" element={<CustomerAssistantPage />} />
                <Route path="/customer/profile" element={<CustomerProfilePage />} />
                <Route path="/customer/join/:orgId" element={<JoinBusinessPage />} />
                <Route
                  path="/customer/join/:orgId/departments/:departmentId"
                  element={<JoinDepartmentPage />}
                />
                <Route
                  path="/customer/join/:orgId/confirm/:serviceId"
                  element={<JoinConfirmPage />}
                />
              </Route>
            </Route>

            <Route element={<RequireAuth role="admin" />}>
              <Route element={<AdminLayoutRoute />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/businesses/:id" element={<AdminBusinessPage />} />
              </Route>
            </Route>
          </Routes>
        </QueueActionsProvider>
      </AppProviders>
    </HashRouter>
  );
}
