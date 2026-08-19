import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './providers/AppProvider'
import { LandingLayout } from './layouts/LandingLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

import { LandingPage } from './pages/landing/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignInPage } from './pages/auth/SignInPage'
import { SignupPage } from './pages/auth/SignupPage'

import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { MarketplacePage } from './pages/marketplace/MarketplacePage'
import { AgentDetailPage } from './pages/marketplace/AgentDetailPage'
import { DeveloperAgentsPage } from './pages/developer/DeveloperAgentsPage'
import { CreateAgentPage } from './pages/developer/CreateAgentPage'
import { WalletPage } from './pages/wallet/WalletPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { NotificationsPage } from './pages/notifications/NotificationsPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { BillingPage } from './pages/billing/BillingPage'
import { IntegrationsPage } from './pages/integrations/IntegrationsPage'
import { ApiKeysPage } from './pages/billing/ApiKeysPage'
import { PricingPage } from './pages/pricing/PricingPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ErrorBoundary>
        <Routes>
          <Route element={<LandingLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="features" element={<div className="max-w-7xl mx-auto px-4 py-20"><h1 className="text-display font-display text-near-black mb-4">Features</h1><p className="text-body-lg text-muted-slate">Explore all the capabilities of the Agenova platform.</p></div>} />
            <Route path="docs" element={<div className="max-w-7xl mx-auto px-4 py-20"><h1 className="text-display font-display text-near-black mb-4">Documentation</h1><p className="text-body-lg text-muted-slate">API reference and integration guides coming soon.</p></div>} />
            <Route path="about" element={<div className="max-w-7xl mx-auto px-4 py-20"><h1 className="text-display font-display text-near-black mb-4">About</h1><p className="text-body-lg text-muted-slate">Agenova is a decentralized AI agent marketplace powered by Stellar.</p></div>} />
            <Route path="contact" element={<div className="max-w-7xl mx-auto px-4 py-20"><h1 className="text-display font-display text-near-black mb-4">Contact</h1><p className="text-body-lg text-muted-slate">Get in touch with our team.</p></div>} />
            <Route path="privacy" element={<div className="max-w-7xl mx-auto px-4 py-20"><h1 className="text-display font-display text-near-black mb-4">Privacy Policy</h1><p className="text-body-lg text-muted-slate">Our privacy policy and data handling practices.</p></div>} />
            <Route path="terms" element={<div className="max-w-7xl mx-auto px-4 py-20"><h1 className="text-display font-display text-near-black mb-4">Terms of Service</h1><p className="text-body-lg text-muted-slate">Terms and conditions for using the Agenova platform.</p></div>} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

          <Route path="/marketplace" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<MarketplacePage />} />
            <Route path=":id" element={<AgentDetailPage />} />
          </Route>

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="agents" element={<DeveloperAgentsPage />} />
            <Route path="agents/new" element={<CreateAgentPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="analytics" element={<div className="animate-fade-in"><h1 className="text-display font-display text-near-black">Analytics</h1><p className="text-body-lg text-muted-slate">Usage analytics coming soon.</p></div>} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute requireAdmin><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboardPage />} />
          </Route>

          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-hero-md font-display text-near-black mb-4">404</h1>
                <p className="text-body-lg text-muted-slate mb-6">This page doesn&apos;t exist</p>
                <a href="/" className="text-action-blue hover:underline">Go home</a>
              </div>
            </div>
          } />
        </Routes>
        </ErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  )
}
