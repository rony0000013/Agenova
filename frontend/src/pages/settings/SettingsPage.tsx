import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Lock, Bell, Palette, Globe, Trash2, Download, Moon, Sun } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Toggle } from '../../components/ui/Toggle'
import { Tabs } from '../../components/ui/Tabs'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { useUIStore } from '../../stores/uiStore'
import { useAuth } from '../../providers/AuthProvider'
import { settingsApi } from '../../api/endpoints'

const SETTINGS_TABS = ['Profile', 'Security', 'Notifications', 'Appearance', 'Billing', 'Data']

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile')
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [showDelete, setShowDelete] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, any>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      addToast({ type: 'success', title: 'Settings updated' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Update failed', message: err.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => settingsApi.deleteAccount(),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Account deleted' })
      window.location.href = '/'
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Delete failed', message: err.message }),
  })

  const exportMutation = useMutation({
    mutationFn: () => settingsApi.exportData(),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Export initiated', message: 'Check your email for the download link' })
    },
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-display font-display text-near-black">Settings</h1>
        <p className="text-body-lg text-muted-slate">Manage your account and preferences</p>
      </div>

      <Tabs tabs={SETTINGS_TABS} activeTab={activeTab} onChange={setActiveTab} />

      <Card padding="lg">
        {activeTab === 'Profile' && (
          <div className="max-w-lg space-y-6">
            <Input label="Full name" defaultValue={user?.name ?? ''} onBlur={(e) => updateMutation.mutate({ name: e.target.value })} />
            <Input label="Email" defaultValue={user?.email ?? ''} type="email" onBlur={(e) => updateMutation.mutate({ email: e.target.value })} />
            <Input label="Display name" defaultValue={user?.display_name ?? user?.name ?? ''} onBlur={(e) => updateMutation.mutate({ display_name: e.target.value })} />
            <Button onClick={() => updateMutation.mutate({ name: user?.name })} loading={updateMutation.isPending}>Save Changes</Button>
          </div>
        )}

        {activeTab === 'Security' && (
          <div className="max-w-lg space-y-6">
            <Input label="Current password" type="password" placeholder="Enter current password" />
            <Input label="New password" type="password" placeholder="At least 8 characters" />
            <Input label="Confirm new password" type="password" placeholder="Confirm new password" />
            <Button onClick={() => addToast({ type: 'success', title: 'Password updated' })}>Update Password</Button>
            <hr className="border-hairline my-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-button font-medium text-ink">Two-factor authentication</p>
                <p className="text-caption text-muted-slate">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-button font-medium text-ink">Active sessions</p>
                <p className="text-caption text-muted-slate">Manage logged-in devices</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
          </div>
        )}

        {activeTab === 'Notifications' && (
          <div className="max-w-lg space-y-6">
            <ToggleItem label="Email notifications" desc="Receive emails about activity" />
            <ToggleItem label="Agent execution updates" desc="When agents complete or fail" />
            <ToggleItem label="Payment confirmations" desc="When payments are processed" />
            <ToggleItem label="Weekly digest" desc="Summary of weekly activity" />
            <ToggleItem label="Marketing emails" desc="Product updates and offers" />
          </div>
        )}

        {activeTab === 'Appearance' && (
          <div className="space-y-6">
            <div>
              <p className="text-button font-medium text-ink mb-3">Theme</p>
              <div className="flex gap-3">
                <Button variant="outline" icon={<Sun className="h-4 w-4" />}>Light</Button>
                <Button variant="outline" icon={<Moon className="h-4 w-4" />}>Dark</Button>
                <Button variant="outline">System</Button>
              </div>
            </div>
            <div className="max-w-xs">
              <Input label="Font size" type="number" defaultValue="16" min={12} max={24} />
            </div>
          </div>
        )}

        {activeTab === 'Billing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-button font-medium text-ink">Current plan</p>
                <p className="text-caption text-muted-slate capitalize">{user?.plan ?? 'Free'}</p>
              </div>
              <Button onClick={() => window.location.href = '/dashboard/billing'}>Manage plan</Button>
            </div>
            <hr className="border-hairline" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-button font-medium text-ink">Payment method</p>
                <p className="text-caption text-muted-slate">Stellar wallet payments</p>
              </div>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard/wallet'}>Manage</Button>
            </div>
          </div>
        )}

        {activeTab === 'Data' && (
          <div className="max-w-lg space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-button font-medium text-ink">Export data</p>
                <p className="text-caption text-muted-slate">Download all your data</p>
              </div>
              <Button variant="outline" onClick={() => exportMutation.mutate()} loading={exportMutation.isPending} icon={<Download className="h-4 w-4" />}>Export</Button>
            </div>
            <hr className="border-hairline" />
            <div className="p-4 bg-red-50 rounded-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-button font-medium text-error-red">Delete account</p>
                  <p className="text-caption text-error-red">Permanently delete your account and all data</p>
                </div>
                <Button variant="danger" onClick={() => setShowDelete(true)} icon={<Trash2 className="h-4 w-4" />}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete account?"
        message="This action is irreversible. All your data, agents, and subscription will be permanently deleted."
        confirmLabel="Delete my account"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function ToggleItem({ label, desc }: { label: string; desc: string }) {
  const [enabled, setEnabled] = useState(true)
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-button text-ink">{label}</p>
        <p className="text-caption text-muted-slate">{desc}</p>
      </div>
      <Toggle checked={enabled} onChange={() => setEnabled(!enabled)} />
    </div>
  )
}