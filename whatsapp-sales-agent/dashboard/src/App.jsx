import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="min-h-screen bg-[#050505] flex text-white overflow-hidden relative selection:bg-blue-500/30">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/20 blur-[120px] rounded-full point-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-emerald-600/10 blur-[150px] rounded-full point-events-none -z-10" />

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {activeTab === 'Dashboard' ? (
            <Dashboard searchTerm={searchTerm} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center animate-pulse">
               <div className="w-20 h-20 bg-white/5 rounded-3xl mb-6 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                  <span className="text-3xl">🚀</span>
               </div>
               <h2 className="text-2xl font-bold mb-2">{activeTab} View</h2>
               <p className="text-white/40 max-w-sm">This module is locked in the current demo or under construction. Check back later.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
