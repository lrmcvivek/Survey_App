"use client";
import React, { useState, useEffect } from "react";
import ULBSelector from "@/components/masters/ULBSelector";
import ZoneSelector from "@/components/masters/ZoneSelector";
import WardSelector from "@/components/masters/WardSelector";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterDataApi } from "@/lib/api";
import toast from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { useAuth } from "@/features/auth/AuthContext";
import { getUserRoleRank, ROLE_RANK } from "@/lib/api";
import { 
  Plus, 
  Search, 
  MapPin, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  XCircle,
  Database,
  Layers
} from "lucide-react";

export default function MohallaMasterPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUlb, setSelectedUlb] = React.useState<string | null>(null);
  const [selectedZone, setSelectedZone] = React.useState<string | null>(null);
  const [selectedWard, setSelectedWard] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMohalla, setSelectedMohalla] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    mohallaName: "",
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
    data: mohallas,
    isLoading: mohallasLoading,
    error: mohallasError,
  } = useQuery({
    queryKey: ["mohallas", selectedWard],
    queryFn: () => masterDataApi.getMohallasByWard(selectedWard!),
    enabled: !!selectedWard,
  });

  const getCurrentStatusName = (mohalla: any) => {
    return mohalla.inheritedStatus || "Not Started";
  };

  const filteredMohallas =
    mohallas?.filter((mohalla: any) =>
      mohalla.mohallaName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedFilteredMohallas = () => {
    if (!filteredMohallas || !sortConfig) return filteredMohallas || [];
    const sorted = [...filteredMohallas];
    sorted.sort((a: any, b: any) => {
      const aValue = String(a[sortConfig.key]);
      const bValue = String(b[sortConfig.key]);
      return sortConfig.direction === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
    return sorted;
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <MoreHorizontal className="w-3 h-3 text-slate-600" />;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  const updateMohallaMutation = useMutation({
    mutationFn: (data: any) => masterDataApi.updateMohalla(selectedMohalla.mohallaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mohallas", selectedWard] });
      toast.success("Mohalla updated successfully");
      setShowEditModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update Mohalla");
    },
  });

  const deleteMohallaMutation = useMutation({
    mutationFn: (mohallaId: string) => masterDataApi.deleteMohalla(mohallaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mohallas", selectedWard] });
      toast.success("Mohalla removed successfully");
      setShowDeleteConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete Mohalla");
    },
  });

  const handleEditClick = (mohalla: any) => {
    setSelectedMohalla(mohalla);
    setEditFormData({
      mohallaName: mohalla.mohallaName || "",
      description: mohalla.description || "",
      isActive: mohalla.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMohallaMutation.mutate(editFormData);
  };

  const handleDelete = () => {
    if (selectedMohalla) {
      deleteMohallaMutation.mutate(selectedMohalla.mohallaId);
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
               <div className="flex items-center gap-3 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  <h1 className="text-3xl font-black text-white tracking-tight">Mohalla Registry</h1>
               </div>
               <p className="text-slate-500 text-sm font-medium ml-5">Configure micro-topographical units and assignments</p>
            </div>
            {canEditMasters && selectedWard && (
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                <Plus className="w-4 h-4" />
                New Mohalla
              </button>
            )}
          </div>

          {/* Hierarchical Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#161B26] border border-slate-800 rounded-3xl p-6 shadow-sm">
             <ULBSelector value={selectedUlb} onChange={(id) => { setSelectedUlb(id); setSelectedZone(null); setSelectedWard(null); }} isDark />
             <ZoneSelector ulbId={selectedUlb} value={selectedZone} onChange={(id) => { setSelectedZone(id); setSelectedWard(null); }} isDark />
             <WardSelector zoneId={selectedZone} value={selectedWard} onChange={setSelectedWard} isDark />
          </div>

          {selectedWard && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Search */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search mohallas by identity..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#161B26] border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  />
                </div>
                <div className="bg-[#161B26] border border-slate-800 rounded-2xl px-6 py-3.5 flex items-center gap-4">
                   <Layers className="w-4 h-4 text-blue-400" />
                   <span className="text-sm font-black text-slate-300">Total: {filteredMohallas.length}</span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#161B26] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/20 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        <th className="px-8 py-6 cursor-pointer hover:bg-slate-800/30 transition-colors" onClick={() => handleSort("mohallaName")}>
                          <div className="flex items-center gap-2">Mohalla Identity {getSortIcon("mohallaName")}</div>
                        </th>
                        <th className="px-8 py-6">Parent Status</th>
                        <th className="px-8 py-6">Accessibility</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {getSortedFilteredMohallas().length > 0 ? (
                        getSortedFilteredMohallas().map((mohalla: any) => (
                          <tr key={mohalla.mohallaId} className="hover:bg-blue-500/[0.02] transition-colors group">
                            <td className="px-8 py-6">
                              <span className="text-slate-200 font-black text-sm uppercase tracking-tight">{mohalla.mohallaName}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 italic">
                                 <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                                 {getCurrentStatusName(mohalla)}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              {mohalla.isActive ? (
                                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest italic px-3 py-1 bg-emerald-400/5 rounded-full border border-emerald-400/10">Connected</span>
                              ) : (
                                <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic px-3 py-1 bg-slate-800 rounded-full border border-slate-700">Restricted</span>
                              )}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => handleEditClick(mohalla)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                                  disabled={!canEditMasters}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMohalla(mohalla);
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
                                <p className="text-xs font-black uppercase tracking-widest italic leading-none">Registry slice empty</p>
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

          {!selectedWard && !mohallasLoading && (
            <div className="bg-[#161B26] border border-slate-800 rounded-[2rem] p-20 text-center shadow-xl">
               <div className="max-w-xs mx-auto space-y-4">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto text-blue-400">
                     <MapPin className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Topographical Scope</h3>
                  <p className="text-slate-500 text-sm font-medium italic">Complete the administrative hierarchy to visualize regional mohalla units</p>
               </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#161B26] border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-10 border-b border-slate-800 flex items-center justify-between">
                 <h3 className="text-2xl font-black text-white tracking-tight">Modify Mohalla</h3>
                 <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white transition-colors">
                   <XCircle className="w-6 h-6" />
                 </button>
              </div>
              <form onSubmit={handleUpdate} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Unit Name</label>
                  <input
                    type="text"
                    value={editFormData.mohallaName}
                    onChange={(e) => setEditFormData({ ...editFormData, mohallaName: e.target.value })}
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Notes / Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 font-bold outline-none resize-none min-h-[120px] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-8 py-5 bg-slate-800 text-slate-300 font-black rounded-3xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[11px] active:scale-95">Cancel</button>
                  <button type="submit" disabled={updateMohallaMutation.isPending} className="flex-[2] px-8 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:bg-blue-500 transition-all uppercase tracking-widest text-[11px] active:scale-95">
                    {updateMohallaMutation.isPending ? "Syncing..." : "Update Unit"}
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
               <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Excise Unit?</h3>
               <p className="text-slate-400 font-medium italic mb-8">Confirm permanent deletion of mohalla unit <span className="text-red-400 font-black">"{selectedMohalla?.mohallaName}"</span>?</p>
               <div className="flex gap-4">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-6 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px]">Cancel</button>
                  <button onClick={handleDelete} disabled={deleteMohallaMutation.isPending} className="flex-1 px-6 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl hover:bg-red-500 transition-all uppercase tracking-widest text-[10px]">
                    {deleteMohallaMutation.isPending ? "Excising..." : "Confirm"}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
