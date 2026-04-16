"use client";
import React, { useState } from "react";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import QCWorkflowDashboard from "@/components/qc/QCWorkflowDashboard";
import { 
  RefreshCw, 
  Filter, 
  Search, 
  Settings, 
  BarChart3, 
  Workflow,
  ChevronDown,
  XCircle,
  Activity
} from "lucide-react";

const QCWorkflowPage: React.FC = () => {
  const [filters, setFilters] = useState({
    qcLevel: "",
    status: "",
    wardId: "",
    mohallaId: "",
    search: "",
  });

  const [activeTab, setActiveTab] = useState("dashboard");

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      qcLevel: "",
      status: "",
      wardId: "",
      mohallaId: "",
      search: "",
    });
  };

  return (
    <ProtectedRoute requiredRoles={["SUPERADMIN", "ADMIN"]}>
      <MainLayout>
        <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400">
                      <Workflow className="w-6 h-6" />
                   </div>
                   <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">QC Workflow</h1>
                </div>
                <p className="text-slate-500 text-sm font-medium italic">Advanced multi-tier validation and compliance orchestration</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 bg-[#161B26] border border-slate-800 text-slate-400 hover:text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-xl"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Sync Node</span>
              </button>
            </div>

            {/* Filter Hub */}
            <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <Filter className="w-48 h-48 text-white" />
               </div>
               
               <div className="relative space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center">
                       <Filter className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest italic">Filter Matrix</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">QC Tier</label>
                       <div className="relative">
                          <select 
                            value={filters.qcLevel}
                            onChange={(e) => handleFilterChange("qcLevel", e.target.value)}
                            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-slate-900">All Levels</option>
                            {[1,2,3,4].map(l => <option key={l} value={l} className="bg-slate-900">Level {l}</option>)}
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Lifecycle State</label>
                       <div className="relative">
                          <select 
                            value={filters.status}
                            onChange={(e) => handleFilterChange("status", e.target.value)}
                            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-slate-900">All States</option>
                            {["PENDING", "APPROVED", "REJECTED", "NEEDS_REVISION", "DUPLICATE"].map(s => (
                              <option key={s} value={s} className="bg-slate-900">{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Ward Anchor</label>
                       <input 
                         placeholder="ID Search..."
                         value={filters.wardId}
                         onChange={(e) => handleFilterChange("wardId", e.target.value)}
                         className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Mohalla ID</label>
                       <input 
                         placeholder="Target ID..."
                         value={filters.mohallaId}
                         onChange={(e) => handleFilterChange("mohallaId", e.target.value)}
                         className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Global Lookup</label>
                       <div className="relative group/search">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/search:text-blue-400 transition-colors" />
                          <input 
                            placeholder="GIS / Owner..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-4">
                    <button onClick={clearFilters} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Reset matrix</button>
                    <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95">Apply Compliance</button>
                 </div>
               </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-8">
               <button 
                 onClick={() => setActiveTab('dashboard')}
                 className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 Workflow Dashboard
                 {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
               </button>
               <button 
                 onClick={() => setActiveTab('reports')}
                 className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'reports' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 QC Records
                 {activeTab === 'reports' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
               </button>
               <button 
                 onClick={() => setActiveTab('settings')}
                 className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'settings' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 Engine Settings
                 {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
               </button>
            </div>

            {/* Content Context */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               {activeTab === "dashboard" && (
                 <QCWorkflowDashboard
                   qcLevel={filters.qcLevel ? parseInt(filters.qcLevel) : undefined}
                   status={filters.status || undefined}
                   wardId={filters.wardId || undefined}
                   mohallaId={filters.mohallaId || undefined}
                 />
               )}

               {activeTab === "reports" && (
                 <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-24 text-center">
                    <div className="max-w-xs mx-auto space-y-4 opacity-30">
                       <BarChart3 className="w-16 h-16 mx-auto text-slate-500" />
                       <h3 className="text-xl font-black text-white uppercase italic">Report Aggregate</h3>
                       <p className="text-slate-500 text-sm font-medium italic">Advanced reporting modules are offline during topographical sync.</p>
                    </div>
                 </div>
               )}

               {activeTab === "settings" && (
                 <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-24 text-center">
                    <div className="max-w-xs mx-auto space-y-4 opacity-30">
                       <Settings className="w-16 h-16 mx-auto text-slate-500" />
                       <h3 className="text-xl font-black text-white uppercase italic">Protocol Config</h3>
                       <p className="text-slate-500 text-sm font-medium italic">Engine protocol settings access restricted by system firewall.</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default QCWorkflowPage;
