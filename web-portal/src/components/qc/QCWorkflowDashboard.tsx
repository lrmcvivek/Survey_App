"use client";
import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  MessageSquare, 
  Calendar,
  Layers,
  Search,
  CheckSquare,
  Square,
  Activity,
  ArrowUpRight
} from "lucide-react";
import toast from "react-hot-toast";

interface QCWorkflowItem {
  surveyUniqueCode: string;
  gisId: string;
  ownerName?: string;
  respondentName?: string;
  mohallaName?: string;
  ownerDetails?: {
    ownerName?: string;
  };
  propertyDetails?: {
    respondentName?: string;
  };
  ward?: {
    wardName?: string;
    [key: string]: any;
  };
  qcRecords: Array<{
    qcLevel: number;
    qcStatus: string;
    reviewedAt: string;
    reviewedBy: {
      name: string;
      username: string;
    };
    remarks?: string;
    RIRemark?: string;
    gisTeamRemark?: string;
    surveyTeamRemark?: string;
    isError: boolean;
    errorType?: string;
    sectionRecords?: Array<{
      remarks?: string;
    }>;
  }>;
  currentLevel: number;
  nextLevel: number;
}

interface QCWorkflowDashboardProps {
  qcLevel?: number;
  status?: string;
  wardId?: string;
  mohallaId?: string;
}

const QCWorkflowDashboard: React.FC<QCWorkflowDashboardProps> = ({ qcLevel, status, wardId, mohallaId }) => {
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [selectedBulk, setSelectedBulk] = useState<string[]>([]);
  const userRole = typeof window !== "undefined" ? localStorage.getItem("user_role") || "" : "";
  const [workflowData, setWorkflowData] = useState<QCWorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchWorkflowData();
  }, [qcLevel, status, wardId, mohallaId]);

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (qcLevel) params.append("qcLevel", qcLevel.toString());
      if (status) params.append("status", status);
      if (wardId) params.append("wardId", wardId);
      if (mohallaId) params.append("mohallaId", mohallaId);

      const response = await fetch(`/api/qc/property-list?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflowData(data);
      } else {
        toast.error("Failed to fetch QC workflow data");
      }
    } catch (error) {
      toast.error("Error fetching QC workflow data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { icon: <CheckCircle className="w-3 h-3" />, color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5", label: "Approved" };
      case "REJECTED":
        return { icon: <XCircle className="w-3 h-3" />, color: "text-red-400 border-red-400/20 bg-red-400/5", label: "Rejected" };
      case "PENDING":
        return { icon: <Clock className="w-3 h-3" />, color: "text-amber-400 border-amber-400/20 bg-amber-400/5", label: "Pending" };
      case "NEEDS_REVISION":
        return { icon: <Activity className="w-3 h-3" />, color: "text-blue-400 border-blue-400/20 bg-blue-400/5", label: "Revision" };
      default:
        return { icon: <Clock className="w-3 h-3" />, color: "text-slate-500 border-slate-700 bg-slate-800/50", label: status };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getCurrentLevelStatus = (item: QCWorkflowItem) => {
    const currentRecord = item.qcRecords.find(
      (r) => r.qcLevel === item.currentLevel
    );
    return currentRecord?.qcStatus || "PENDING";
  };

  const getRemarksCount = (item: QCWorkflowItem) => {
    let count = 0;
    item.qcRecords.forEach((record) => {
      if (record.remarks) count++;
      if (record.RIRemark) count++;
      if (record.gisTeamRemark) count++;
      if (record.sectionRecords) {
        record.sectionRecords.forEach((section: any) => {
          if (section.remarks) count++;
        });
      }
      if (record.surveyTeamRemark) count++;
    });
    return count;
  };

  const filteredData = workflowData.filter((item) => {
    const s = getCurrentLevelStatus(item);
    if (activeTab === "pending") return s === "PENDING";
    if (activeTab === "approved") return s === "APPROVED";
    if (activeTab === "rejected") return s === "REJECTED";
    if (activeTab === "needs-revision") return s === "NEEDS_REVISION";
    return true;
  });

  const handleBulkApprove = async () => {
    try {
      const response = await fetch("/api/qc/bulk-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          action: "APPROVE",
          surveyCodes: selectedBulk,
        }),
      });
      if (response.ok) {
        toast.success("Bulk QC action successful");
        setSelectedBulk([]);
        fetchWorkflowData();
      } else {
        toast.error("Bulk QC action failed");
      }
    } catch (e) {
      toast.error("Network error during bulk action");
    }
  };

  if (loading) {
    return (
      <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-24 flex flex-col items-center justify-center space-y-4">
         <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
         <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] italic">Calibrating Workflow...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Table & Controls Container */}
      <div className="bg-[#161B26] border border-slate-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden">
        {/* Sub-Header with Controls */}
        <div className="p-8 border-b border-slate-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-800/10">
           <div className="flex items-center gap-6 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              {["pending", "approved", "rejected", "needs-revision"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 border ${
                    activeTab === tab 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' 
                    : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                   {tab.replace('-', ' ')}
                   <span className={`px-2 py-0.5 rounded-lg text-[9px] ${activeTab === tab ? 'bg-white/20' : 'bg-slate-800'}`}>
                      {workflowData.filter(i => {
                        const s = getCurrentLevelStatus(i);
                        if (tab === 'pending') return s === 'PENDING';
                        if (tab === 'approved') return s === 'APPROVED';
                        if (tab === 'rejected') return s === 'REJECTED';
                        if (tab === 'needs-revision') return s === 'NEEDS_REVISION';
                        return false;
                      }).length}
                   </span>
                </button>
              ))}
           </div>

           <div className="flex items-center gap-3">
              {(userRole === "SUPERVISOR" || userRole === "ADMIN") && selectedBulk.length > 0 && (
                <button 
                  onClick={handleBulkApprove}
                  className="px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-500 transition-all animate-in slide-in-from-right-4"
                >
                  Bulk Approve ({selectedBulk.length})
                </button>
              )}
              <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-2">
                 <Calendar className="w-4 h-4 text-slate-500" />
                 <input 
                   type="date" 
                   value={dateRange.from}
                   onChange={e => setDateRange({...dateRange, from: e.target.value})}
                   className="bg-transparent text-[10px] font-bold text-slate-300 outline-none w-24 uppercase"
                 />
                 <span className="text-slate-700">|</span>
                 <input 
                   type="date" 
                   value={dateRange.to}
                   onChange={e => setDateRange({...dateRange, to: e.target.value})}
                   className="bg-transparent text-[10px] font-bold text-slate-300 outline-none w-24 uppercase"
                 />
              </div>
           </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/30">
                {(userRole === "SUPERVISOR" || userRole === "ADMIN") && (
                  <th className="px-8 py-6 w-16">
                     <button onClick={() => {
                        if (selectedBulk.length === filteredData.length) setSelectedBulk([]);
                        else setSelectedBulk(filteredData.map(i => i.surveyUniqueCode));
                     }} className="text-slate-600 hover:text-blue-400 transition-colors">
                        {selectedBulk.length === filteredData.length && filteredData.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                     </button>
                  </th>
                )}
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Node Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Subject</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Coordinates</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Audit Tier</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Compliance</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredData.length > 0 ? (
                filteredData.map((item) => {
                  const statusInfo = getStatusConfig(getCurrentLevelStatus(item));
                  return (
                    <tr key={item.surveyUniqueCode} className="group hover:bg-blue-500/[0.02] transition-colors">
                      {(userRole === "SUPERVISOR" || userRole === "ADMIN") && (
                        <td className="px-8 py-6">
                           <button 
                             onClick={() => {
                               if (selectedBulk.includes(item.surveyUniqueCode)) setSelectedBulk(selectedBulk.filter(id => id !== item.surveyUniqueCode));
                               else setSelectedBulk([...selectedBulk, item.surveyUniqueCode]);
                             }}
                             className={`transition-colors ${selectedBulk.includes(item.surveyUniqueCode) ? 'text-blue-400' : 'text-slate-700 group-hover:text-slate-500'}`}
                           >
                              {selectedBulk.includes(item.surveyUniqueCode) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                           </button>
                        </td>
                      )}
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-0.5">
                           <span className="text-xs font-black text-slate-300 font-mono tracking-tight group-hover:text-white transition-colors">#{item.gisId}</span>
                           <span className="text-[9px] font-bold text-slate-600 uppercase italic">{item.surveyUniqueCode}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-0.5">
                           <span className="text-xs font-black text-slate-200 uppercase tracking-tight truncate max-w-[120px]">
                             {item.ownerDetails?.ownerName || item.propertyDetails?.respondentName || "Registry N/A"}
                           </span>
                           <span className="text-[9px] font-bold text-slate-500 italic">Respondent: {item.propertyDetails?.respondentName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.ward?.wardName || "N/A"}</span>
                           <span className="text-[9px] font-bold text-slate-600 italic truncate max-w-[100px]">{item.mohallaName || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black rounded-lg border border-slate-700 uppercase tracking-widest italic">Tier {item.currentLevel}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase italic ${statusInfo.color}`}>
                           {statusInfo.icon}
                           {statusInfo.label}
                        </div>
                        {getRemarksCount(item) > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 text-slate-600 group-hover:text-blue-400/50 transition-colors">
                             <MessageSquare className="w-3 h-3" />
                             <span className="text-[10px] font-black italic">{getRemarksCount(item)} Notes</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => window.location.href = `/qc/edit?surveyCode=${item.surveyUniqueCode}`}
                          className="p-3 bg-slate-800/50 text-slate-400 hover:text-blue-400 hover:bg-blue-600/10 border border-slate-800 rounded-2xl transition-all active:scale-95 group/btn"
                        >
                           <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                   <td colSpan={7} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center justify-center opacity-10">
                         <Layers className="w-16 h-16 mb-6 text-white" />
                         <p className="text-xl font-black uppercase tracking-[0.3em] italic">Zero Nodes Detected</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-slate-900/50 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600 italic">
           <div className="flex items-center gap-4">
              <span>Sync Status: <span className="text-emerald-500">Active</span></span>
              <span>•</span>
              <span>Registry Buffer: {filteredData.length} records</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-blue-500">v2.4.0 Engine</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default QCWorkflowDashboard;
