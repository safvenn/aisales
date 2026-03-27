import { LayoutDashboard, Users, MessageSquare, Settings, Activity, Sparkles, LogOut, ChevronLeft } from 'lucide-react'
import { clsx } from 'clsx'

export default function Sidebar({ isOpen, setIsOpen, activeTab, setActiveTab }) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Users, label: 'Leads Directory' },
    { icon: MessageSquare, label: 'Conversations', badge: '12' },
    { icon: Activity, label: 'Campaigns' },
    { icon: Settings, label: 'Configuration' },
  ]

  return (
    <aside className={clsx(
      "glass border-r border-white/5 h-screen transition-all duration-300 flex flex-col relative z-20",
      isOpen ? "w-64" : "w-20 hidden md:flex"
    )}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-white/5 space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {isOpen && (
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight leading-tight">SalesSync AI</span>
            <span className="text-xs text-white/50">Kerala Region</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2">
        {navItems.map((item, i) => {
          const isActive = activeTab === item.label;
          return (
          <button
            key={i}
            onClick={() => setActiveTab(item.label)}
            className={clsx(
              "w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
              isActive 
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            )}
            <item.icon className={clsx("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive && "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]")} />
            {isOpen && (
              <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
            )}
            {isOpen && item.badge && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                {item.badge}
              </span>
            )}
          </button>
        )})}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut className="w-5 h-5 shrink-0" />
          {isOpen && <span className="font-medium text-sm">Disconnect</span>}
        </button>
      </div>
      
      {/* Toggle Button for Desktop */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-20 w-6 h-6 bg-gray-800 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors hidden md:flex z-50 shadow-lg"
      >
        <ChevronLeft className={clsx("w-4 h-4 transition-transform", !isOpen && "rotate-180")} />
      </button>
    </aside>
  )
}
