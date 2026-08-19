import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, Star, Zap, ArrowUpDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/utils'
import { agentsApi } from '../../api/endpoints'
import type { AgentCategory } from '../../types'

const categories: { value: AgentCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Agents' },
  { value: 'writing', label: 'Writing' },
  { value: 'coding', label: 'Coding' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'creative', label: 'Creative' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'data', label: 'Data' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'research', label: 'Research' },
]

export function MarketplacePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<AgentCategory | 'all'>('all')
  const [sort, setSort] = useState<'popular' | 'price' | 'rating'>('popular')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['agents', { category, search, sort, page }],
    queryFn: () => agentsApi.list({
      category: category === 'all' ? undefined : category,
      search: search || undefined,
      sort,
      page,
      limit: 12,
    }),
  })

  const agents = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-display text-near-black">Marketplace</h1>
          <p className="text-body-lg text-muted-slate">Discover AI agents for every task</p>
        </div>
        <Link to="/dashboard/agents/new">
          <Button icon={<Zap className="h-4 w-4" />}>Publish Agent</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-slate" />
          <input
            type="text"
            placeholder="Search agents by name or description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-3 rounded-sm border border-hairline bg-white text-body text-ink placeholder:text-muted-slate focus:outline-none focus:border-form-focus"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1) }}
              className={cn(
                'shrink-0 px-4 py-2 rounded-pill text-button transition-colors',
                category === cat.value ? 'bg-near-black text-white' : 'bg-soft-stone text-ink hover:bg-border-light'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSort(sort === 'popular' ? 'price' : sort === 'price' ? 'rating' : 'popular')}
          className="flex items-center gap-2 px-4 py-2 border border-hairline rounded-pill text-button text-ink hover:bg-soft-stone/50 transition-colors"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sort === 'popular' ? 'Popular' : sort === 'price' ? 'Price' : 'Rating'}
        </button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Failed to load agents"
          description="Could not fetch agents from the server. Please try again."
        />
      ) : agents.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No agents found"
          description={search ? `No results for "${search}". Try a different search term.` : 'No agents in this category yet.'}
          action={{ label: 'Clear filters', onClick: () => { setSearch(''); setCategory('all'); setPage(1) } }}
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <Link key={agent.id} to={`/marketplace/${agent.id}`}>
                <Card padding="md" hover className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-indigo-600" />
                    </div>
                    <Badge variant="success" size="sm">{agent.pricePerRequest ?? agent.price_per_request ?? 0.1} XLM</Badge>
                  </div>
                  <h3 className="text-heading font-display text-ink mb-1">{agent.name}</h3>
                  <p className="text-caption text-muted-slate mb-3 flex-1 line-clamp-2">{agent.description}</p>
                  <div className="flex items-center gap-3 text-caption text-muted-slate mb-3">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-coral text-coral" /> {agent.rating || 4.8}</span>
                    <span>{(agent.totalRequests ?? agent.total_requests ?? 0).toLocaleString()} req</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.tags?.map((tag) => (
                      <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                    ))}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {pagination && (pagination.totalPages ?? pagination.total_pages ?? 1) > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-button text-muted-slate hover:text-ink disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-caption text-muted-slate">
                Page {page} of {pagination.totalPages ?? pagination.total_pages ?? 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages ?? pagination.total_pages ?? 1, p + 1))}
                disabled={page >= (pagination.totalPages ?? pagination.total_pages ?? 1)}
                className="px-3 py-2 text-button text-muted-slate hover:text-ink disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}

        </>
      )}
    </div>
  )
}