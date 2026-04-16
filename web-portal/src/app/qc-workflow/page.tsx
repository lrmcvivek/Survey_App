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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <Workflow className="w-6 h-6 text-blue-600" />
                 <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quality Control Workflow</h1>
              </div>
              <p className="text-gray-500 text-sm">Manage and track multi-level quality control processes for survey data verification.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* Search Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
             <div className="space-y-6">
               <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Search Filters</h3>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Validation Level</label>
                     <div className="relative">
                        <select 
                          value={filters.qcLevel}
                          onChange={(e) => handleFilterChange("qcLevel", e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 appearance-none cursor-pointer"
                        >
                          <option value="">All Levels</option>
                          {[1,2,3,4].map(l => <option key={l} value={l}>Level {l}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Verification Status</label>
                     <div className="relative">
                        <select 
                          value={filters.status}
                          onChange={(e) => handleFilterChange("status", e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 appearance-none cursor-pointer"
                        >
                          <option value="">All Statuses</option>
                          {["PENDING", "APPROVED", "REJECTED", "NEEDS_REVISION", "DUPLICATE"].map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Ward ID</label>
                     <input 
                       placeholder="e.g. Ward 12"
                       value={filters.wardId}
                       onChange={(e) => handleFilterChange("wardId", e.target.value)}
                       className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Mohalla ID</label>
                     <input 
                       placeholder="e.g. MH-45"
                       value={filters.mohallaId}
                       onChange={(e) => handleFilterChange("mohallaId", e.target.value)}
                       className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Global Search</label>
                     <div className="relative group/search">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          placeholder="GIS ID or Owner..."
                          value={filters.search}
                          onChange={(e) => handleFilterChange("search", e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                        />
                     </div>
                  </div>
               </div>

               <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button onClick={clearFilters} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors">Clear Filters</button>
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm text-xs uppercase tracking-wider transition-all active:scale-95">Apply Search</button>
               </div>
             </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 gap-6">
             <button 
               onClick={() => setActiveTab('dashboard')}
               className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Workflow Dashboard
               {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
             </button>
             <button 
               onClick={() => setActiveTab('reports')}
               className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'reports' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
               QC Records
               {activeTab === 'reports' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
             </button>
             <button 
               onClick={() => setActiveTab('settings')}
               className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Workflow Settings
               {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
             </button>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px]">
             {activeTab === "dashboard" && (
               <QCWorkflowDashboard
                 qcLevel={filters.qcLevel ? parseInt(filters.qcLevel) : undefined}
                 status={filters.status || undefined}
                 wardId={filters.wardId || undefined}
                 mohallaId={filters.mohallaId || undefined}
               />
             )}

             {activeTab === "reports" && (
               <div className="bg-white border border-gray-200 rounded-lg p-20 text-center shadow-sm">
                  <div className="max-w-xs mx-auto space-y-3">
                     <BarChart3 className="w-12 h-12 mx-auto text-gray-300" />
                     <h3 className="text-lg font-bold text-gray-900 uppercase">Activity Reports</h3>
                     <p className="text-gray-500 text-sm">Detailed reporting modules are currently being updated and will be available shortly.</p>
                  </div>
               </div>
             )}

             {activeTab === "settings" && (
               <div className="bg-white border border-gray-200 rounded-lg p-20 text-center shadow-sm">
                  <div className="max-w-xs mx-auto space-y-3">
                     <Settings className="w-12 h-12 mx-auto text-gray-300" />
                     <h3 className="text-lg font-bold text-gray-900 uppercase">System Configuration</h3>
                     <p className="text-gray-500 text-sm">Workflow settings are currently locked for administrative review.</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default QCWorkflowPage;
