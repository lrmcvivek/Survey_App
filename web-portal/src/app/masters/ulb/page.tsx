"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterDataApi } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/AuthContext";
import { getUserRoleRank, ROLE_RANK } from "@/lib/api";
import { 
  Building2, 
  Search, 
  Map, 
  Navigation, 
  Home, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Database
} from "lucide-react";

export default function UlbMasterPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUlb, setSelectedUlb] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    ulbName: "",
    ulbCode: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    // Simulate loading time for consistency
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch ULBs with statistics
  const {
    data: ulbs,
    isLoading: ulbsLoading,
    error: ulbsError,
  } = useQuery({
    queryKey: ["ulbs-with-stats"],
    queryFn: () => masterDataApi.getUlbsWithStats(),
  });

  // Check if current user can edit masters
  const canEditMasters = user && getUserRoleRank(user) >= ROLE_RANK.ADMIN;

  // Update ULB mutation
  const updateUlbMutation = useMutation({
    mutationFn: (data: any) => masterDataApi.updateUlb(selectedUlb.ulbId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ulbs-with-stats"] });
      toast.success("ULB updated successfully");
      setShowEditModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update record");
    },
  });

  // Delete ULB mutation
  const deleteUlbMutation = useMutation({
    mutationFn: (ulbId: string) => masterDataApi.deleteUlb(ulbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ulbs-with-stats"] });
      toast.success("ULB removed successfully");
      setShowDeleteConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete record");
    },
  });

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get sorted ULBs
  const getSortedUlbs = () => {
    if (!ulbs || !sortConfig) return ulbs || [];
    
    const sorted = [...ulbs];
    sorted.sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
    
    return sorted;
  };

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <MoreHorizontal className="w-3 h-3 text-slate-600" />;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  // Handle edit click
  const handleEditClick = (ulb: any) => {
    setSelectedUlb(ulb);
    setEditFormData({
      ulbName: ulb.ulbName || "",
      ulbCode: ulb.ulbCode || "",
      description: ulb.description || "",
      isActive: ulb.isActive,
    });
    setShowEditModal(true);
  };

  // Handle update
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUlbMutation.mutate(editFormData);
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedUlb) {
      deleteUlbMutation.mutate(selectedUlb.ulbId);
    }
  };

  if (loading || ulbsLoading) {
    return <Loading fullScreen />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
        <div className="max-w-8xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-8">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">ULB Master</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Management console for Urban Local Bodies</p>
            </div>
            {canEditMasters && (
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                <Plus className="w-4 h-4" />
                Add New ULB
              </button>
            )}
          </div>

          {/* Search & Stats Card */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by name or code..." 
                className="w-full bg-[#161B26] border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium"
              />
            </div>
            <div className="bg-[#161B26] border border-slate-800 rounded-2xl px-6 py-3.5 flex items-center gap-4 shadow-sm">
              <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Registered</p>
                <p className="text-lg font-black text-white mt-1 leading-none">{ulbs?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#161B26] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/20 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="px-8 py-6 cursor-pointer hover:bg-slate-800/30 transition-colors" onClick={() => handleSort("ulbCode")}>
                      <div className="flex items-center gap-2">ULB Code {getSortIcon("ulbCode")}</div>
                    </th>
                    <th className="px-8 py-6 cursor-pointer hover:bg-slate-800/30 transition-colors" onClick={() => handleSort("ulbName")}>
                      <div className="flex items-center gap-2">Corporate Name {getSortIcon("ulbName")}</div>
                    </th>
                    <th className="px-8 py-6 text-center">Zones</th>
                    <th className="px-8 py-6 text-center">Wards</th>
                    <th className="px-8 py-6 text-center">Mohallas</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {getSortedUlbs().length > 0 ? (
                    getSortedUlbs().map((ulb: any) => (
                      <tr key={ulb.ulbId} className="hover:bg-blue-500/[0.02] transition-colors group">
                        <td className="px-8 py-6">
                          <span className="text-blue-400 font-black text-xs px-3 py-1 bg-blue-400/5 rounded-full border border-blue-400/10">{ulb.ulbCode}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-200 font-black text-sm uppercase tracking-tight">{ulb.ulbName}</span>
                            <span className="text-slate-500 text-[10px] font-bold italic truncate max-w-[250px]">{ulb.description || "Internal Master Record"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/30 rounded-full border border-slate-700/50">
                             <Map className="w-3 h-3 text-slate-500" />
                             <span className="text-xs font-black text-slate-300">{ulb.totalZones}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/30 rounded-full border border-slate-700/50">
                             <Navigation className="w-3 h-3 text-slate-500" />
                             <span className="text-xs font-black text-slate-300">{ulb.totalWards}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/30 rounded-full border border-slate-700/50">
                             <Home className="w-3 h-3 text-slate-500" />
                             <span className="text-xs font-black text-slate-300">{ulb.totalMohallas}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {ulb.isActive ? (
                            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest italic px-3 py-1 bg-emerald-400/5 rounded-full border border-emerald-400/10 w-max">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                              Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest italic px-3 py-1 bg-slate-500/5 rounded-full border border-slate-500/10 w-max">
                              <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                              Inactive
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleEditClick(ulb)}
                              disabled={!canEditMasters}
                              className={`p-2 rounded-xl transition-all ${
                                canEditMasters
                                  ? "text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 shadow-sm"
                                  : "text-slate-800 cursor-not-allowed"
                              }`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUlb(ulb);
                                setShowDeleteConfirm(true);
                              }}
                              disabled={!canEditMasters}
                              className={`p-2 rounded-xl transition-all ${
                                canEditMasters
                                  ? "text-slate-400 hover:text-red-400 hover:bg-red-400/10 shadow-sm"
                                  : "text-slate-800 cursor-not-allowed"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center justify-center opacity-20">
                          <Database className="w-12 h-12 mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest italic">Inventory register empty</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#161B26] border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden transition-all animate-in fade-in zoom-in duration-300">
              <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-white/[0.01]">
                <div>
                   <h3 className="text-2xl font-black text-white tracking-tight">Modify Identity</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic leading-none">Record Reference: #{selectedUlb?.ulbCode}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">ULB Code</label>
                    <input
                      type="text"
                      value={editFormData.ulbCode}
                      onChange={(e) => setEditFormData({ ...editFormData, ulbCode: e.target.value })}
                      className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Corporate Name</label>
                    <input
                      type="text"
                      value={editFormData.ulbName}
                      onChange={(e) => setEditFormData({ ...editFormData, ulbName: e.target.value })}
                      className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Internal Metadata</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none resize-none font-bold min-h-[120px]"
                    placeholder="Notes for administration..."
                  />
                </div>
                <div className="flex items-center justify-between bg-slate-800/20 p-6 rounded-3xl border border-slate-800/50">
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-tight">Active Visibility</p>
                    <p className="text-[10px] font-bold text-slate-500 italic">Toggle status in global registry</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-8 py-5 bg-slate-800 text-slate-300 font-black rounded-3xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[11px] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateUlbMutation.isPending}
                    className="flex-[2] px-8 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-widest text-[11px] disabled:opacity-50 active:scale-95"
                  >
                    {updateUlbMutation.isPending ? "Syncing..." : "Update Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#161B26] border border-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Trash2 className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Excise Data?</h3>
                <p className="text-slate-400 font-medium italic">
                  Permanently remove <span className="text-red-400 font-black">"{selectedUlb?.ulbName}"</span>? 
                  <span className="block mt-2 text-[10px] font-black tracking-[0.2em] uppercase text-slate-600">This action is irreversible.</span>
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px]"
                >
                  Abort
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteUlbMutation.isPending}
                  className="flex-1 px-6 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-900/20 hover:bg-red-500 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {deleteUlbMutation.isPending ? "Excising..." : "Confirm Removal"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
