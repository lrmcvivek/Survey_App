"use client";
import React, { useState, useEffect } from "react";
import ULBSelector from "@/components/masters/ULBSelector";
import ZoneSelector from "@/components/masters/ZoneSelector";
import StatusChangeModal from "@/components/masters/StatusChangeModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterDataApi, surveyStatusApi } from "@/lib/api";
import toast from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { useAuth } from "@/features/auth/AuthContext";
import { getUserRoleRank, ROLE_RANK } from "@/lib/api";
import { 
  Plus, 
  Search, 
  Navigation, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  XCircle,
  Database,
  Activity
} from "lucide-react";

export default function WardMasterPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUlb, setSelectedUlb] = React.useState<string | null>(null);
  const [selectedZone, setSelectedZone] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedWardToDelete, setSelectedWardToDelete] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    wardName: "",
    newWardNumber: "",
    description: "",
    isActive: true,
  });

  const canEditMasters = user && getUserRoleRank(user) >= ROLE_RANK.ADMIN;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const {
    data: wards,
    isLoading: wardsLoading,
    error: wardsError,
  } = useQuery({
    queryKey: ["wards", selectedZone],
    queryFn: () => masterDataApi.getWardsByZone(selectedZone!),
    enabled: !!selectedZone,
  });

  const getCurrentStatusName = (ward: any) => {
    if (ward.wardStatusMaps && ward.wardStatusMaps.length > 0) {
      const active = ward.wardStatusMaps.find((m: any) => m.isActive);
      return active ? active.status.statusName : "Not Started";
    }
    return "Not Started";
  };

  const filteredWards =
    wards?.filter((ward: any) =>
      ward.wardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ward.newWardNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedFilteredWards = () => {
    if (!filteredWards || !sortConfig) return filteredWards || [];
    const sorted = [...filteredWards];
    sorted.sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (sortConfig.key === "newWardNumber") {
        const aNum = parseInt(String(a.newWardNumber).replace(/\D/g, '')) || 0;
        const bNum = parseInt(String(b.newWardNumber).replace(/\D/g, '')) || 0;
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      return sortConfig.direction === "asc" 
        ? String(aValue).localeCompare(String(bValue)) 
        : String(bValue).localeCompare(String(aValue));
    });
    return sorted;
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <MoreHorizontal className="w-3 h-3 text-slate-600" />;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  const updateWardMutation = useMutation({
    mutationFn: (data: any) => masterDataApi.updateWard(selectedWardToDelete.wardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards", selectedZone] });
      toast.success("Ward updated successfully");
      setShowEditModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update Ward");
    },
  });

  const deleteWardMutation = useMutation({
    mutationFn: (wardId: string) => masterDataApi.deleteWard(wardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards", selectedZone] });
      toast.success("Ward removed successfully");
      setShowDeleteConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete Ward");
    },
  });

  const handleEditClick = (ward: any) => {
    setSelectedWardToDelete(ward);
    setEditFormData({
      wardName: ward.wardName || "",
      newWardNumber: ward.newWardNumber || "",
      description: ward.description || "",
      isActive: ward.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateWardMutation.mutate(editFormData);
  };

  const handleDelete = () => {
    if (selectedWardToDelete) {
      deleteWardMutation.mutate(selectedWardToDelete.wardId);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
        <div className="max-w-8xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-8">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Ward Master</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Manage ward identities and survey statuses</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsStatusModalOpen(true)}
                 className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
               >
                 <Activity className="w-4 h-4 text-amber-500" />
                 Survey Status
               </button>
               {canEditMasters && selectedZone && (
                 <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                   <Plus className="w-4 h-4" />
                   Add Ward
                 </button>
               )}
            </div>
          </div>

          {/* Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#161B26] border border-slate-800 rounded-3xl p-6 shadow-sm">
             <ULBSelector value={selectedUlb} onChange={(id) => { setSelectedUlb(id); setSelectedZone(null); }} isDark />
             <ZoneSelector ulbId={selectedUlb} value={selectedZone} onChange={setSelectedZone} isDark />
          </div>

          {selectedZone && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Search */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search wards by name or number..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#161B26] border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  />
                </div>
                <div className="bg-[#161B26] border border-slate-800 rounded-2xl px-6 py-3.5 flex items-center gap-4">
                   <Navigation className="w-4 h-4 text-blue-400" />
                   <span className="text-sm font-black text-slate-300">Wards: {filteredWards.length}</span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#161B26] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/20 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        <th className="px-8 py-6 cursor-pointer hover:bg-slate-800/30 transition-colors" onClick={() => handleSort("newWardNumber")}>
                          <div className="flex items-center gap-2">Number {getSortIcon("newWardNumber")}</div>
                        </th>
                        <th className="px-8 py-6 cursor-pointer hover:bg-slate-800/30 transition-colors" onClick={() => handleSort("wardName")}>
                          <div className="flex items-center gap-2">Ward Name {getSortIcon("wardName")}</div>
                        </th>
                        <th className="px-8 py-6">Survey State</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {getSortedFilteredWards().length > 0 ? (
                        getSortedFilteredWards().map((ward: any) => (
                          <tr key={ward.wardId} className="hover:bg-blue-500/[0.02] transition-colors group">
                            <td className="px-8 py-6">
                              <span className="text-blue-400 font-mono font-black text-xs px-3 py-1 bg-blue-400/5 rounded-full border border-blue-400/10">W-{ward.newWardNumber}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-slate-200 font-black text-sm uppercase tracking-tight">{ward.wardName}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase italic border ${
                                getCurrentStatusName(ward).toLowerCase().includes('started') 
                                ? 'bg-slate-800 text-slate-500 border-slate-700' 
                                : 'bg-emerald-400/5 text-emerald-400 border-emerald-400/10'}`}>
                                 {getCurrentStatusName(ward)}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => handleEditClick(ward)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                                  disabled={!canEditMasters}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedWardToDelete(ward);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                  disabled={!canEditMasters}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center">
                             <div className="flex flex-col items-center justify-center opacity-20">
                                <Database className="w-12 h-12 mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest italic leading-none">No ward data available</p>
                             </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!selectedZone && !wardsLoading && (
            <div className="bg-[#161B26] border border-slate-800 rounded-[2rem] p-20 text-center shadow-xl">
               <div className="max-w-xs mx-auto space-y-4">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto text-blue-400">
                     <Navigation className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Ward Discovery</h3>
                  <p className="text-slate-500 text-sm font-medium italic">Define hierarchy by selecting ULB and Zone to visualize ward topography</p>
               </div>
            </div>
          )}
        </div>

        {/* Status Modal - Logic handled in component */}
        <StatusChangeModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
        />

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#161B26] border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-10 border-b border-slate-800 flex items-center justify-between">
                 <h3 className="text-2xl font-black text-white tracking-tight">Update Ward</h3>
                 <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white">
                   <XCircle className="w-6 h-6" />
                 </button>
              </div>
              <form onSubmit={handleUpdate} className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Ward Number</label>
                    <input
                      type="text"
                      value={editFormData.newWardNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, newWardNumber: e.target.value })}
                      className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Ward Name</label>
                    <input
                      type="text"
                      value={editFormData.wardName}
                      onChange={(e) => setEditFormData({ ...editFormData, wardName: e.target.value })}
                      className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Metadata Notes</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 font-bold outline-none resize-none min-h-[120px] focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-8 py-5 bg-slate-800 text-slate-300 font-black rounded-3xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[11px]">Abort</button>
                  <button type="submit" disabled={updateWardMutation.isPending} className="flex-[2] px-8 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:bg-blue-500 transition-all uppercase tracking-widest text-[11px]">
                    {updateWardMutation.isPending ? "Syncing..." : "Apply Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#161B26] border border-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-in fade-in zoom-in duration-300">
               <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Confirm Removal?</h3>
               <p className="text-slate-400 font-medium italic mb-8">Permanently excise ward <span className="text-red-400 font-black">"{selectedWardToDelete?.wardName}"</span> from the topographical database?</p>
               <div className="flex gap-4">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-6 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px]">Back</button>
                  <button onClick={handleDelete} disabled={deleteWardMutation.isPending} className="flex-1 px-6 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl hover:bg-red-500 transition-all uppercase tracking-widest text-[10px]">
                    {deleteWardMutation.isPending ? "Excising..." : "Confirm"}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
