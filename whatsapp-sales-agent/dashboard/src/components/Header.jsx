import { Bell, Search, Menu, Command } from 'lucide-react'

const statusStyles = {
  online: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]',
  offline: 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]',
  checking: 'bg-amber-500/10 border-amber-500/20 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
}

export default function Header({ sidebarOpen, setSidebarOpen, searchTerm, setSearchTerm, systemStatus }) {
  const currentStatus = systemStatus?.state || 'checking'

  return (
    <header className="h-16 glass border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 transition-all">
      <div className="flex items-center space-x-4">
        <button 
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-64 focus-within:w-80 focus-within:bg-white/10 focus-within:border-blue-500/50 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300">
          <Search className="w-4 h-4 text-white/50 mr-2" />
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30"
          />
          <div className="flex items-center text-[10px] text-white/40 bg-black/40 px-1.5 py-0.5 rounded ml-2 space-x-0.5">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className={`hidden sm:flex items-center space-x-2 border px-3 py-1.5 rounded-full ${statusStyles[currentStatus] || statusStyles.checking}`}>
          <div className={`w-2 h-2 rounded-full ${currentStatus === 'online' ? 'bg-emerald-400 animate-pulse' : currentStatus === 'offline' ? 'bg-red-400' : 'bg-amber-300 animate-pulse'}`} />
          <span className="text-xs font-medium tracking-wide">{systemStatus?.label || 'CHECKING API'}</span>
        </div>

        <button className="relative p-2 rounded-full hover:bg-white/5 text-white/70 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border border-white/20 shadow-md"></div>
      </div>
    </header>
  )
}
