import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Key, Plus, Copy, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'
import { apiKeysApi } from '../../api/endpoints'

export function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [visibleKey, setVisibleKey] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null)
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => apiKeysApi.create(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setShowCreate(false)
      setNewKeyName('')
      setLastCreatedKey(data.key || data.key_prefix || 'ag_live_key')
      setVisibleKey(data.id)
      addToast({ type: 'success', title: 'API key created!', message: 'Copy your key now. You won\'t be able to see it again.' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Failed to create key', message: err.message }),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setDeleteId(null)
      addToast({ type: 'success', title: 'API key revoked' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Failed to revoke', message: err.message }),
  })

  const handleCreate = () => {
    if (!newKeyName.trim()) return
    createMutation.mutate(newKeyName)
  }

  const handleCopy = (keyValue: string) => {
    navigator.clipboard.writeText(keyValue)
    addToast({ type: 'success', title: 'API key copied!' })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-display text-near-black">API Keys</h1>
          <p className="text-body-lg text-muted-slate">Manage your API access tokens</p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={<Plus className="h-4 w-4" />}>Create Key</Button>
      </div>

      {!keys || keys.length === 0 ? (
        <EmptyState
          icon={<Key className="h-8 w-8" />}
          title="No API keys yet"
          description="Create an API key to access agents programmatically."
          action={{ label: 'Create your first key', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-3">
          {keys.map((k) => {
            const isNewlyCreated = visibleKey === k.id && lastCreatedKey
            const keyDisplay = isNewlyCreated ? lastCreatedKey : (k.key || k.key_prefix || 'ag_live_****')
            const createdDate = k.createdAt || k.created_at ? new Date(k.createdAt || k.created_at!).toLocaleDateString() : 'Recently'

            return (
              <Card key={k.id} padding="md" className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-button font-medium text-ink">{k.name}</p>
                    <Badge variant={k.active !== false ? 'success' : 'default'} size="sm">{k.active !== false ? 'Active' : 'Revoked'}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-caption text-muted-slate">
                    <span className="font-mono">
                      {isNewlyCreated ? lastCreatedKey : `${(k.key || k.key_prefix || 'ag_live_****').slice(0, 12)}...`}
                    </span>
                    <span>·</span>
                    <span>Created {createdDate}</span>
                    {k.lastUsed && <><span>·</span><span>Last used {new Date(k.lastUsed).toLocaleDateString()}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => visibleKey === k.id ? setVisibleKey(null) : setVisibleKey(k.id)}
                    className="p-2 text-muted-slate hover:text-ink transition-colors"
                    title={visibleKey === k.id ? 'Hide' : 'Show'}
                  >
                    {visibleKey === k.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => handleCopy(isNewlyCreated ? lastCreatedKey! : (k.key || k.key_prefix || ''))} className="p-2 text-muted-slate hover:text-ink transition-colors" title="Copy">
                    <Copy className="h-4 w-4" />
                  </button>
                  {k.active !== false && (
                    <button onClick={() => setDeleteId(k.id)} className="p-2 text-muted-slate hover:text-error-red transition-colors" title="Revoke">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}


      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create API Key" size="sm">
        <Input label="Key name" placeholder="e.g., Production, Development" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={handleCreate} loading={createMutation.isPending}>Create</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && revokeMutation.mutate(deleteId)}
        title="Revoke API key"
        message="Are you sure you want to revoke this API key? Any services using this key will lose access immediately."
        confirmLabel="Revoke"
        variant="danger"
        loading={revokeMutation.isPending}
      />
    </div>
  )
}