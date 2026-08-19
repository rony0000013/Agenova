import { useQuery } from '@tanstack/react-query'
import { Users, Bot, DollarSign, Activity, TrendingUp, AlertTriangle, Shield } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { analyticsApi, adminApi } from '../../api/endpoints'

export function AdminDashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => analyticsApi.dashboard(),
  })

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users(),
  })

  const stats = [
    { label: 'Total Users', value: users?.total?.toLocaleString() ?? '0', icon: Users },
    { label: 'Total Agents', value: analytics?.agents_used?.toString() ?? '0', icon: Bot },
    { label: 'Total Revenue', value: `${analytics?.total_spent?.toFixed(2) ?? '0'} XLM`, icon: DollarSign },
    { label: 'Active Sessions', value: analytics?.total_requests?.toLocaleString() ?? '0', icon: Activity },
  ]

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display font-display text-near-black">Admin Dashboard</h1>
          <p className="text-body-lg text-muted-slate">System overview and management</p>
        </div>
        <Badge variant="info" size="md"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-caption text-muted-slate uppercase tracking-wider">{stat.label}</span>
              <div className="w-9 h-9 rounded-lg bg-soft-stone flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-ink" />
              </div>
            </div>
            <p className="text-heading-lg font-display text-ink">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h2 className="text-heading font-display text-ink mb-6">Recent Users</h2>
          {!users?.items?.length ? (
            <p className="text-body text-muted-slate py-4">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {users.items.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-hairline last:border-0">
                  <div>
                    <p className="text-button font-medium text-ink">{u.name}</p>
                    <p className="text-caption text-muted-slate">{u.email}</p>
                  </div>
                  <Badge variant={u.role === 'admin' ? 'info' : 'default'} size="sm">{u.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg">
          <h2 className="text-heading font-display text-ink mb-6">Pending Actions</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-button font-medium text-ink">Agent approvals</p>
                <p className="text-caption text-muted-slate">3 agents pending review</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-soft-stone/50 rounded-sm">
              <TrendingUp className="h-5 w-5 text-ink shrink-0" />
              <div>
                <p className="text-button font-medium text-ink">Daily report ready</p>
                <p className="text-caption text-muted-slate">System metrics available for download</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}