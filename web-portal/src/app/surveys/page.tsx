"use client";
import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import toast from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCcw, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Database,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  MoreVertical,
  Zap,
  Activity,
  Layers,
  ArrowUpRight
} from "lucide-react";

interface Survey {
  surveyUniqueCode: string;
  gisId: string;
  subGisId?: string;
  uploadedBy: {
    username: string;
    name?: string;
  };
  ulb: {
    ulbName: string;
  };
  zone: {
    zoneNumber: string;
  };
  ward: {
    wardNumber: string;
    wardName: string;
  };
  mohalla: {
    mohallaName: string;
  };
  surveyType: {
    surveyTypeName: string;
  };
  entryDate: string;
  isSynced: boolean;
  syncStatus: string;
  createdAt: string;
  updatedAt: string;
  qcRecords: Array<{
    qcStatus: string;
    qcLevel: number;
    remarks?: string;
  }>;
}

const SurveyManagementPage: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSyncStatus, setSelectedSyncStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [bulkSyncing, setBulkSyncing] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await fetch("/api/surveys", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching surveys:", error);
      toast.error("Failed to fetch surveys");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSurvey = async (surveyUniqueCode: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyUniqueCode}/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        toast.success("Survey synced successfully");
        fetchSurveys();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to sync survey");
      }
    } catch (error: any) {
      toast.error("Failed to sync survey");
    }
  };

  const handleBulkSync = async () => {
    const pendingSurveys = surveys.filter((s) => !s.isSynced);
    if (pendingSurveys.length === 0) {
      toast.success("No pending surveys to sync");
      return;
    }

    setBulkSyncing(true);
    try {
      const response = await fetch("/api/surveys/bulk-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          surveyUniqueCodes: pendingSurveys.map((s) => s.surveyUniqueCode),
        }),
      });

      if (response.ok) {
        toast.success("Surveys synced successfully");
        fetchSurveys();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to sync surveys");
      }
    } catch (error: any) {
      toast.error("Failed to sync surveys");
    } finally {
      setBulkSyncing(false);
    }
  };

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch =
      survey.surveyUniqueCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.gisId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.uploadedBy.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.uploadedBy.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.ward.wardName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      !selectedStatus ||
      (survey.qcRecords.length > 0 &&
        survey.qcRecords[survey.qcRecords.length - 1].qcStatus === selectedStatus);

    const matchesSyncStatus =
      !selectedSyncStatus || survey.syncStatus === selectedSyncStatus;

    return matchesSearch && matchesStatus && matchesSyncStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSurveys = filteredSurveys.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);

  const getQCStatus = (survey: Survey) => {
    if (survey.qcRecords.length === 0) return "PENDING";
    return survey.qcRecords[survey.qcRecords.length - 1].qcStatus;
  };

  const getQCStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "text-emerald-400 bg-emerald-400/5 border-emerald-400/10";
      case "REJECTED": return "text-rose-400 bg-rose-400/5 border-rose-400/10";
      case "DUPLICATE": return "text-amber-400 bg-amber-400/5 border-amber-400/10";
      case "NEEDS_REVISION": return "text-indigo-400 bg-indigo-400/5 border-indigo-400/10";
      default: return "text-slate-400 bg-slate-400/5 border-slate-400/10";
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "SYNCED": return "text-emerald-400 bg-emerald-400/5 border-emerald-400/10";
      case "FAILED": return "text-rose-400 bg-rose-400/5 border-rose-400/10";
      case "CONFLICT": return "text-amber-400 bg-amber-400/5 border-amber-400/10";
      default: return "text-indigo-400 bg-indigo-400/5 border-indigo-400/10";
    }
  };

  if (loading) return <ProtectedRoute requireWebPortalAccess><Loading fullScreen /></ProtectedRoute>;

  return (
    <ProtectedRoute requireWebPortalAccess>
      <MainLayout>
        <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-8">
               <div className="space-y-1">
                  <div className="flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                     <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Observation <span className="text-blue-500">Registry</span></h1>
                  </div>
                  <p className="text-slate-500 text-sm font-medium italic ml-5">Operational survey stream and structural data synchronization</p>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    onClick={handleBulkSync}
                    disabled={bulkSyncing}
                    className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${bulkSyncing ? 'animate-spin' : ''}`} />
                    Push Batch Sync
                  </button>
                  <button 
                    onClick={() => window.location.href = "/surveys/add-new-id"}
                    className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-900/20 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    New Observation
                  </button>
               </div>
            </div>

            {/* Stats Bento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {[
                 { label: "Total Observations", value: surveys.length, icon: FileText, color: "blue", sub: "Total captured" },
                 { label: "Cloud Sync Ready", value: surveys.filter(s => s.isSynced).length, icon: CheckCircle2, color: "emerald", sub: "Integrity verified" },
                 { label: "Pending Uplink", value: surveys.filter(s => !s.isSynced).length, icon: Clock, color: "amber", sub: "Awaiting push" },
                 { label: "QC Integration", value: surveys.filter(s => getQCStatus(s) === "APPROVED").length, icon: Activity, color: "indigo", sub: "Approved nodes" }
               ].map((stat, i) => (
                 <div key={i} className="bg-[#161B26] border border-slate-800 p-6 rounded-[2.5rem] group hover:border-blue-500/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                       <div className={`w-10 h-10 bg-${stat.color}-500/10 rounded-xl flex items-center justify-center text-${stat.color}-400`}>
                          <stat.icon className="w-5 h-5" />
                       </div>
                       <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic leading-none">{stat.label}</h4>
                       <div className="flex items-end gap-2">
                          <p className="text-2xl font-black text-white leading-none tracking-tight">{stat.value}</p>
                          <span className="text-[9px] font-bold text-slate-600 uppercase italic bottom-0.5 relative">{stat.sub}</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            {/* Matrix Controls */}
            <div className="flex flex-col xl:flex-row gap-4">
               <div className="relative flex-1 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text"
                    placeholder="QUERY REGISTRY (ID, GIS, UPLOADER, WARD)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#161B26] border border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-xs text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-black uppercase tracking-widest"
                  />
               </div>
               <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-[#161B26] border border-slate-800 rounded-2xl px-4 py-2">
                     <Layers className="w-3.5 h-3.5 text-blue-500" />
                     <select 
                       value={selectedStatus}
                       onChange={(e) => setSelectedStatus(e.target.value)}
                       className="bg-transparent text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none cursor-pointer"
                     >
                        <option value="">ALL QC STATES</option>
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="DUPLICATE">DUPLICATE</option>
                        <option value="NEEDS_REVISION">NEEDS REVISION</option>
                     </select>
                  </div>
                  <div className="flex items-center gap-2 bg-[#161B26] border border-slate-800 rounded-2xl px-4 py-2">
                     <Zap className="w-3.5 h-3.5 text-amber-500" />
                     <select 
                       value={selectedSyncStatus}
                       onChange={(e) => setSelectedSyncStatus(e.target.value)}
                       className="bg-transparent text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none cursor-pointer"
                     >
                        <option value="">ALL SYNC STATES</option>
                        <option value="PENDING">AWAITING</option>
                        <option value="SYNCED">SYNCED</option>
                        <option value="FAILED">FAILED</option>
                        <option value="CONFLICT">CONFLICT</option>
                     </select>
                  </div>
               </div>
            </div>

            {/* High Density Registry Table */}
            <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-800/20 border-b border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
                           <th className="px-8 py-6">ID Node</th>
                           <th className="px-8 py-6">GIS Identifier</th>
                           <th className="px-8 py-6">Topography</th>
                           <th className="px-8 py-6">Source User</th>
                           <th className="px-8 py-6">Timestamp</th>
                           <th className="px-8 py-6">Audit Status</th>
                           <th className="px-8 py-6">Uplink</th>
                           <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800/40">
                        {currentSurveys.length > 0 ? (
                          currentSurveys.map((survey) => {
                            const qcStatus = getQCStatus(survey);
                            return (
                              <tr key={survey.surveyUniqueCode} className="hover:bg-blue-500/[0.02] transition-colors group">
                                 <td className="px-8 py-6">
                                    <span className="text-blue-400 font-mono font-black text-[10px] px-2.5 py-1 bg-blue-400/5 rounded-lg border border-blue-400/10">{survey.surveyUniqueCode}</span>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="space-y-0.5">
                                       <span className="text-slate-200 font-black text-xs uppercase tracking-tight leading-none block">{survey.gisId}</span>
                                       {survey.subGisId && <span className="text-[9px] font-bold text-slate-600 uppercase italic">/ {survey.subGisId}</span>}
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                       <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                       </div>
                                       <div className="space-y-0.5">
                                          <span className="text-slate-300 font-black text-[10px] uppercase leading-none block">WARD {survey.ward.wardNumber}</span>
                                          <span className="text-[9px] font-bold text-slate-600 uppercase italic truncate max-w-[120px] block">{survey.mohalla.mohallaName}</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 text-slate-400">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase italic">
                                       <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                                          <User className="w-3 h-3 text-slate-500" />
                                       </div>
                                       {survey.uploadedBy.name || survey.uploadedBy.username}
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 font-mono text-[10px] text-slate-500 font-bold italic">
                                    {new Date(survey.entryDate).toLocaleDateString()}
                                 </td>
                                 <td className="px-8 py-6">
                                    <span className={`inline-flex px-3 py-1 text-[9px] font-black uppercase italic rounded-full border ${getQCStatusColor(qcStatus)}`}>
                                       {qcStatus}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase italic rounded-full border ${getSyncStatusColor(survey.syncStatus)}`}>
                                       <div className={`w-1 h-1 rounded-full ${survey.syncStatus === 'SYNCED' ? 'bg-emerald-400' : 'bg-current'}`}></div>
                                       {survey.syncStatus}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                       {!survey.isSynced && (
                                          <button 
                                            onClick={() => handleSyncSurvey(survey.surveyUniqueCode)}
                                            className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all active:scale-90"
                                            title="Uplink Sync"
                                          >
                                             <RefreshCcw className="w-3.5 h-3.5" />
                                          </button>
                                       )}
                                       <button 
                                         className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-90"
                                         title="View Node"
                                       >
                                          <Eye className="w-3.5 h-3.5" />
                                       </button>
                                       <button className="p-2.5 rounded-xl text-slate-600 hover:text-slate-400 transition-all active:scale-90">
                                          <MoreVertical className="w-3.5 h-3.5" />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                             <td colSpan={8} className="px-8 py-32 text-center opacity-30">
                                <Database className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                                <h3 className="text-xl font-black uppercase italic">Registry Archive Clear</h3>
                                <p className="text-xs font-medium italic mt-1">No operational nodes match the current filter buffer</p>
                             </td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>

               {/* Density Controls - Pagination */}
               {totalPages > 1 && (
                  <div className="p-6 border-t border-slate-800 bg-slate-800/10 flex flex-col md:flex-row items-center justify-between gap-4">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                        Visualizing Buffer <span className="text-blue-400">{indexOfFirstItem + 1}</span> to <span className="text-blue-400">{Math.min(indexOfLastItem, filteredSurveys.length)}</span> of <span className="text-blue-400">{filteredSurveys.length}</span> nodes
                     </span>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                           <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Segment {currentPage} / {totalPages}</span>
                        </div>
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                           <ChevronRight className="w-4 h-4" />
                        </button>
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

export default SurveyManagementPage;
