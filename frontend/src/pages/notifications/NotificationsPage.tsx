import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'
import { notificationsApi } from '../../api/endpoints'
import { formatDate } from '../../lib/utils'

export function NotificationsPage() {
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  })

  const readMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const readAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      addToast({ type: 'success', title: 'All marked as read' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      addToast({ type: 'success', title: 'Notification deleted' })
    },
  })

  const clearAllMutation = useMutation({
    mutationFn: () => notificationsApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      addToast({ type: 'success', title: 'All notifications cleared' })
    },
  })

  const notificationsList: any[] = Array.isArray(notes) ? notes : (notes as any)?.data || []

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-display text-near-black">Notifications</h1>
          <p className="text-body-lg text-muted-slate">Stay updated with your activity</p>
        </div>
        <div className="flex gap-3">
          {notificationsList.length > 0 && (
            <>
              <Button variant="outline" onClick={() => readAllMutation.mutate()} loading={readAllMutation.isPending} icon={<CheckCheck className="h-4 w-4" />}>Mark all read</Button>
              <Button variant="outline" onClick={() => clearAllMutation.mutate()} loading={clearAllMutation.isPending} icon={<Trash2 className="h-4 w-4" />}>Clear all</Button>
            </>
          )}
        </div>
      </div>

      {notificationsList.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="All caught up"
          description="No notifications yet. We'll let you know when something happens."
        />
      ) : (
        <div className="space-y-2">
          {notificationsList.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !(n.read || n.is_read) && readMutation.mutate(n.id)}
            >
              <Card
                padding="md"
                className={`flex items-start justify-between cursor-pointer hover:bg-soft-stone/30 transition-colors ${!(n.read || n.is_read) ? 'border-l-4 border-l-indigo-400' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${(n.read || n.is_read) ? 'bg-transparent' : 'bg-indigo-500'}`} />
                  <div>
                    <p className={`text-body text-ink ${!(n.read || n.is_read) ? 'font-medium' : ''}`}>{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-caption text-muted-slate">{formatDate(n.createdAt || n.created_at || new Date())}</span>
                      {n.type && <Badge size="sm" variant="default">{n.type}</Badge>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(n.id) }}
                  className="p-1 text-muted-slate hover:text-error-red transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}