import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MessagesSquare, Users, PhoneForwarded, Target, MoreHorizontal, ArrowUpRight, Flame, Bot, StopCircle, CheckCircle, Search } from 'lucide-react'
import { clsx } from 'clsx'
import axios from 'axios'

const API_URL = 'http://localhost:3001/api';

const chartData = [
  { name: '08:00', sent: 10, replied: 2 },
  { name: '10:00', sent: 25, replied: 5 },
  { name: '12:00', sent: 45, replied: 15 },
  { name: '14:00', sent: 80, replied: 30 },
  { name: '16:00', sent: 120, replied: 45 },
  { name: '18:00', sent: 150, replied: 60 },
  { name: '20:00', sent: 180, replied: 85 }
];

export default function Dashboard({ searchTerm = '' }) {
  const [statsData, setStatsData] = useState({
    leads: { total: 0, pending: 0, contacted: 0, interested: 0, hot: 0, dead: 0, converted: 0 },
    messages: 0
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [campaign, setCampaign] = useState({ isRunning: false, currentAudience: null, lastError: null });
  const [loading, setLoading] = useState(true);
  
  // New UI controls
  const [targetInput, setTargetInput] = useState("");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    try {
      const [statsRes, leadsRes, campRes] = await Promise.all([
        axios.get(`${API_URL}/stats`),
        axios.get(`${API_URL}/leads?limit=10`),
        axios.get(`${API_URL}/campaigns/status`)
      ]);
      
      setStatsData({
        leads: statsRes?.data?.leads || statsData.leads,
        messages: statsRes?.data?.messages || 0
      });
      setRecentLeads(leadsRes?.data?.leads || []);
      setCampaign(campRes?.data || { isRunning: false, currentAudience: null });
    } catch (err) {
      console.error("Error fetching dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10 seconds refresh
    return () => clearInterval(interval);
  }, []);

  const getConversionRate = () => {
    const total = parseInt(statsData?.leads?.total) || 0;
    const interested = parseInt(statsData?.leads?.interested) || 0;
    if (total === 0) return '0%';
    return ((interested / total) * 100).toFixed(1) + '%';
  };

  const startCampaign = async () => {
    if (!targetInput.trim()) {
      showToast("Please enter a target audience first!", "error");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/campaigns/start`, { targetAudience: targetInput });
      showToast(res.data.message);
      setTargetInput("");
      fetchData();
    } catch (e) { 
      showToast("Failed to start campaign.", "error"); 
    }
  };

  const stopCampaign = async () => {
    setShowStopConfirm(false);
    try {
      const res = await axios.post(`${API_URL}/campaigns/stop`);
      showToast(res.data.message);
      fetchData();
    } catch (e) { 
      showToast("Failed to stop campaign.", "error"); 
    }
  };

  const filteredLeads = recentLeads.filter(lead => 
    !searchTerm || 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    lead.phone.includes(searchTerm)
  );

  const stats = [
    { title: 'Total Leads Found', value: statsData?.leads?.total || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
    { title: 'Messages Sent', value: statsData?.messages || 0, icon: MessagesSquare, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
    { title: 'Hot Leads', value: statsData?.leads?.hot || 0, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]' },
    { title: 'Conversion Rate', value: getConversionRate(), icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]' },
  ]

  const formatTime = (dateString) => {
    if(!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 relative">
      
      {/* Toast Notification */}
      <div className={clsx(
        "fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 transform",
        toast.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none",
        toast.type === 'error' ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
      )}>
        <div className="flex items-center space-x-2">
          {toast.type === 'error' ? <StopCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      </div>

      {/* Stop Confirm Modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">Stop Campaign?</h3>
            <p className="text-white/60 text-sm mb-6">Are you sure you want to halt the current AI scraping and messaging loops? It will finish its current wait cycle before fully stopping.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowStopConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button 
                onClick={stopCampaign}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-colors">
                Yes, Stop It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-blue-900/20 to-purple-900/10 p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">SalesSync AI</h1>
            <p className="text-white/60 text-sm">
              {campaign?.isRunning ? (
                <span className="flex items-center text-emerald-400 font-medium tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                   Targeting: "{campaign?.currentAudience}"
                </span>
              ) : (
                "System is resting. Awaiting coordinates."
              )}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          {campaign?.isRunning ? (
            <button 
              onClick={() => setShowStopConfirm(true)}
              className="px-6 py-3 rounded-xl w-full sm:w-auto text-red-100 text-sm font-bold transition-all flex items-center justify-center space-x-2 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <StopCircle className="w-4 h-4" />
              <span>Stop Agent</span>
            </button>
          ) : (
            <div className="flex w-full sm:w-auto space-x-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input 
                  type="text" 
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="e.g. Dentists in Kochi"
                  className="w-full pl-9 pr-4 py-3 bg-[#13141b] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && startCampaign()}
                />
              </div>
              <button 
                onClick={startCampaign}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center space-x-2">
                <Flame className="w-4 h-4" />
                <span>Launch</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {campaign?.lastError && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl shadow-[0_0_20px_rgba(239,68,68,0.15)] flex items-start space-x-3 mb-6 animate-[pulse_2s_ease-in-out_infinite]">
          <StopCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-400 font-bold mb-1">System Error Encountered</h3>
            <p className="text-white/70 text-sm leading-relaxed">{campaign.lastError}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={clsx("glass rounded-2xl p-5 border", stat.border, stat.shadow, "relative overflow-hidden group")}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
              <stat.icon className={clsx("w-20 h-20", stat.color)} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className={clsx("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={clsx("w-5 h-5", stat.color)} />
                </div>
                <h3 className="text-white/60 text-sm font-medium">{stat.title}</h3>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-white tracking-tight">{loading ? '...' : stat.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="glass rounded-2xl p-6 border border-white/5 lg:col-span-2 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
            <h2 className="text-lg font-bold text-white mb-6">Activity Timeline (Mock Data)</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReplied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#13141b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                  <Area type="monotone" dataKey="replied" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorReplied)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Leads Activity */}
        <div className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Live Feed 
              {campaign?.isRunning && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>}
            </h2>
            <button className="text-white/50 hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-white/50 text-sm">Synchronizing database...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm text-center px-4">
                <Users className="w-10 h-10 text-white/10 mb-3" />
                <p>{searchTerm ? "No leads matched your search." : "No leads discovered yet.\nLaunch a campaign to start mining."}</p>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <div key={lead.id} className="p-4 rounded-xl hover:bg-white/5 bg-white/0 border border-transparent hover:border-white/5 transition-all group cursor-pointer mb-2 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div className="pr-16">
                      <h4 className="text-white font-semibold group-hover:text-blue-400 transition-colors truncate">{lead.name}</h4>
                      <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{lead.city || 'Kerala'} • {formatTime(lead.created_at)}</span>
                    </div>
                    <div className="absolute top-4 right-4 text-right">
                      {lead.status === 'hot' && (
                        <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-1 rounded-md border border-orange-500/20 uppercase">
                          HOT
                        </span>
                      )}
                      {(lead.status === 'contacted' || lead.status === 'interested') && (
                        <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-md border border-blue-500/20 uppercase">
                          {lead.status === 'contacted' ? 'SENT' : 'INTEREST'}
                        </span>
                      )}
                      {(lead.status === 'pending') && (
                        <span className="bg-white/5 text-white/40 text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 uppercase">
                          QUEUED
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-white/60 flex items-center font-mono text-xs"><PhoneForwarded className="w-3.5 h-3.5 mr-2 text-white/30" /> {lead.phone}</span>
                    <a 
                      href={`https://wa.me/${lead.phone}`}
                      target="_blank" rel="noreferrer"
                      className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold rounded-lg transition-colors flex items-center shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Chat
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent text-center absolute bottom-0 left-0 right-0 pointer-events-none">
             <div className="pointer-events-auto mt-4 backdrop-blur-md">
                <button className="text-sm text-blue-400 hover:text-blue-300 font-bold transition-colors">View All {statsData?.leads?.total || 0} Leads →</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
