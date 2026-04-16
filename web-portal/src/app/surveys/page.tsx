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
        <div className="space-y-6">
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
             <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <FileText className="w-6 h-6 text-blue-600" />
                   <h1 className="text-xl font-bold text-gray-900 tracking-tight">Household Survey Records</h1>
                </div>
                <p className="text-gray-500 text-sm">Monitor and manage submitted household property survey data across all wards.</p>
             </div>
             <div className="flex items-center gap-3">
                <button 
                  onClick={handleBulkSync}
                  disabled={bulkSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${bulkSyncing ? 'animate-spin' : ''}`} />
                  Bulk Sync Data
                </button>
                <button 
                  onClick={() => window.location.href = "/surveys/add-new-id"}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Survey Entry
                </button>
             </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[
               { label: "Total Surveys", value: surveys.length, icon: FileText, color: "blue", sub: "Grand total" },
               { label: "Synced Records", value: surveys.filter(s => s.isSynced).length, icon: CheckCircle2, color: "emerald", sub: "Uploaded to cloud" },
               { label: "Pending Sync", value: surveys.filter(s => !s.isSynced).length, icon: Clock, color: "amber", sub: "Local data only" },
               { label: "Approved Surveys", value: surveys.filter(s => getQCStatus(s) === "APPROVED").length, icon: Activity, color: "indigo", sub: "Verified by QC" }
             ].map((stat, i) => (
               <div key={i} className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                     <div className={`w-9 h-9 rounded-md flex items-center justify-center ${
                        stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                        stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                        'bg-indigo-50 text-indigo-600'
                     }`}>
                        <stat.icon className="w-5 h-5" />
                     </div>
                  </div>
                  <div>
                     <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{stat.label}</h4>
                     <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                        <span className="text-[10px] font-medium text-gray-400 uppercase">{stat.sub}</span>
                     </div>
                  </div>
               </div>
             ))}
          </div>

          {/* Search & Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col xl:flex-row gap-4">
             <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search by Survey ID, GIS ID, Surveyor, or Ward..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md py-2 pl-9 pr-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
             </div>
             <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2">
                   <Layers className="w-3.5 h-3.5 text-gray-400" />
                   <select 
                     value={selectedStatus}
                     onChange={(e) => setSelectedStatus(e.target.value)}
                     className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                   >
                      <option value="">QC STATUS (ALL)</option>
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="DUPLICATE">DUPLICATE</option>
                      <option value="NEEDS_REVISION">NEEDS REVISION</option>
                   </select>
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2">
                   <Zap className="w-3.5 h-3.5 text-gray-400" />
                   <select 
                     value={selectedSyncStatus}
                     onChange={(e) => setSelectedSyncStatus(e.target.value)}
                     className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                   >
                      <option value="">SYNC STATUS (ALL)</option>
                      <option value="PENDING">PENDING</option>
                      <option value="SYNCED">SYNCED</option>
                      <option value="FAILED">FAILED</option>
                      <option value="CONFLICT">CONFLICT</option>
                   </select>
                </div>
             </div>
          </div>

          {/* Records Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                         <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Survey ID</th>
                         <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">GIS ID</th>
                         <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                         <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Surveyor</th>
                         <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                         <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">QC Status</th>
                         <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sync</th>
                         <th className="px-6 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                      {currentSurveys.length > 0 ? (
                        currentSurveys.map((survey) => {
                          const qcStatus = getQCStatus(survey);
                          return (
                            <tr key={survey.surveyUniqueCode} className="hover:bg-gray-50/50 transition-colors">
                               <td className="px-6 py-4">
                                  <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2.5 py-1 rounded border border-blue-100">{survey.surveyUniqueCode}</span>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                     <span className="text-gray-900 font-semibold text-xs">{survey.gisId}</span>
                                     {survey.subGisId && <span className="text-[10px] text-gray-400 font-medium">/ {survey.subGisId}</span>}
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                     <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                     <div className="flex flex-col">
                                        <span className="text-gray-900 font-bold text-[10px] uppercase">WARD {survey.ward.wardNumber}</span>
                                        <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{survey.mohalla.mohallaName}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                     <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                        <User className="w-3 h-3 text-gray-400" />
                                     </div>
                                     <span className="truncate max-w-[100px]">{survey.uploadedBy.name || survey.uploadedBy.username}</span>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-[11px] text-gray-500 font-medium">
                                  {new Date(survey.entryDate).toLocaleDateString()}
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                                     qcStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                     qcStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                                     qcStatus === 'NEEDS_REVISION' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                     'bg-gray-50 text-gray-600 border-gray-100'
                                  }`}>
                                     {qcStatus}
                                  </span>
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                                     survey.syncStatus === 'SYNCED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                     survey.syncStatus === 'FAILED' ? 'bg-red-50 text-red-700 border-red-100' :
                                     'bg-blue-50 text-blue-700 border-blue-100'
                                  }`}>
                                     <div className={`w-1 h-1 rounded-full ${survey.syncStatus === 'SYNCED' ? 'bg-emerald-500' : 'bg-current'}`}></div>
                                     {survey.syncStatus}
                                  </span>
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                     {!survey.isSynced && (
                                        <button 
                                          onClick={() => handleSyncSurvey(survey.surveyUniqueCode)}
                                          className="p-1.5 rounded border border-gray-200 bg-white text-gray-500 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                                          title="Sync Now"
                                        >
                                           <RefreshCcw className="w-3.5 h-3.5" />
                                        </button>
                                     )}
                                     <button 
                                       className="p-1.5 rounded border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all"
                                       title="View Details"
                                     >
                                        <Eye className="w-3.5 h-3.5" />
                                     </button>
                                     <button className="p-1.5 text-gray-400 hover:text-gray-600">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                     </button>
                                  </div>
                               </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                           <td colSpan={8} className="px-6 py-20 text-center opacity-50">
                              <div className="max-w-xs mx-auto space-y-2">
                                 <Database className="w-10 h-10 mx-auto text-gray-300" />
                                 <h3 className="text-sm font-bold text-gray-900 uppercase">No Survey Records Found</h3>
                                 <p className="text-xs text-gray-500">We couldn't find any surveys matching your current filters.</p>
                              </div>
                           </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>

             {/* Pagination */}
             {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                   <span className="text-xs text-gray-500">
                      Showing <span className="font-bold text-gray-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-gray-900">{Math.min(indexOfLastItem, filteredSurveys.length)}</span> of <span className="font-bold text-gray-900">{filteredSurveys.length}</span> surveys
                   </span>
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                         <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="px-4 py-1.5 bg-white border border-gray-300 rounded">
                         <span className="text-xs font-bold text-gray-700">Page {currentPage} of {totalPages}</span>
                      </div>
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                         <ChevronRight className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default SurveyManagementPage;
