import { cn } from '../../lib/utils'

interface TabsProps {
  tabs: string[]
  activeTab: string
  onChange: (tab: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-hairline overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            'px-6 py-3 text-button whitespace-nowrap transition-colors border-b-2 -mb-[1px]',
            activeTab === tab
              ? 'text-ink border-near-black font-medium'
              : 'text-muted-slate border-transparent hover:text-ink'
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}