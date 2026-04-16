"use client";
import React, { useState, useEffect } from "react";
import ULBSelector from "@/components/masters/ULBSelector";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterDataApi } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/AuthContext";
import { getUserRoleRank, ROLE_RANK } from "@/lib/api";
import { 
  Plus, 
  Search, 
  Map, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  XCircle,
  Database
} from "lucide-react";

export default function ZoneMasterPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUlb, setSelectedUlb] = React.useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    zoneName: "",
    zoneNumber: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const canEditMasters = user && getUserRoleRank(user) >= ROLE_RANK.ADMIN;

  const {
    data: zones,
    isLoading: zonesLoading,
    error: zonesError,
  } = useQuery({
    queryKey: ["zones", selectedUlb],
    queryFn: () => masterDataApi.getZonesByUlb(selectedUlb!),
    enabled: !!selectedUlb,
  });

  const updateZoneMutation = useMutation({
    mutationFn: (data: any) => masterDataApi.updateZone(selectedZone.zoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones", selectedUlb] });
      toast.success("Zone updated successfully");
      setShowEditModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update Zone");
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (zoneId: string) => masterDataApi.deleteZone(zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones", selectedUlb] });
      toast.success("Zone removed successfully");
      setShowDeleteConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete Zone");
    },
  });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedZones = () => {
    if (!zones || !sortConfig) return zones || [];
    const sorted = [...zones];
    sorted.sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (sortConfig.key === "zoneNumber") {
        const aNum = parseInt(String(a.zoneNumber).replace(/\D/g, '')) || 0;
        const bNum = parseInt(String(b.zoneNumber).replace(/\D/g, '')) || 0;
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

  const handleEditClick = (zone: any) => {
    setSelectedZone(zone);
    setEditFormData({
      zoneName: zone.zoneName || "",
      zoneNumber: zone.zoneNumber || "",
      description: zone.description || "",
      isActive: zone.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateZoneMutation.mutate(editFormData);
  };

  const handleDelete = () => {
    if (selectedZone) {
      deleteZoneMutation.mutate(selectedZone.zoneId);
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
              <h1 className="text-3xl font-black text-white tracking-tight">Zone Master</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Configure geographic zones within URBs</p>
            </div>
            {canEditMasters && selectedUlb && (
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                <Plus className="w-4 h-4" />
                Initialize Zone
              </button>
            )}
          </div>

          {/* ULB Selector Area */}
          <div className="bg-[#161B26] border border-slate-800 rounded-3xl p-6 shadow-sm">
             <div className="max-w-md">
                <ULBSelector value={selectedUlb} onChange={setSelectedUlb} isDark />
             </div>
          </div>

          {selectedUlb && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Search & Meta */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search zones..." 
                    className="w-full bg-[#161B26] border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  />
                </div>
                <div className="bg-[#161B26] border border-slate-800 rounded-2xl px-6 py-3.5 flex items-center gap-4">
                   <Map className="w-4 h-4 text-blue-400" />
                   <span className="text-sm font-black text-slate-300">Count: {zones?.length || 0}</span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#161B26] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/20 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        <th className="px-8 py-6 cursor-pointer hover:bg-slate-800/30 transition-colors" onClick={() => handleSort("zoneNumber")}>
                          <div className="flex items-center gap-2">Number {getSortIcon("zoneNumber")}</div>
                        </th>
                        <th className="px-8 py-6 cursor-pointer hover:bg-slate-800/30 transition-colors" onClick={() => handleSort("zoneName")}>
                          <div className="flex items-center gap-2">Zone Identity {getSortIcon("zoneName")}</div>
                        </th>
                        <th className="px-8 py-6">Description</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {getSortedZones().length > 0 ? (
                        getSortedZones().map((zone: any) => (
                          <tr key={zone.zoneId} className="hover:bg-blue-500/[0.02] transition-colors group">
                            <td className="px-8 py-6">
                              <span className="text-blue-400 font-mono font-black text-xs px-3 py-1 bg-blue-400/5 rounded-full border border-blue-400/10">#{zone.zoneNumber}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-slate-200 font-black text-sm uppercase tracking-tight">{zone.zoneName}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-slate-500 text-[10px] font-bold italic truncate max-w-[200px] block">{zone.description || "Administrative Cluster"}</span>
                            </td>
                            <td className="px-8 py-6">
                              {zone.isActive ? (
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
                                  onClick={() => handleEditClick(zone)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                                  disabled={!canEditMasters}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedZone(zone);
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
                          <td colSpan={5} className="px-8 py-20 text-center">
                             <div className="flex flex-col items-center justify-center opacity-20">
                                <Database className="w-12 h-12 mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest italic leading-none">No zone clusters detected</p>
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

          {!selectedUlb && !zonesLoading && (
            <div className="bg-[#161B26] border border-slate-800 rounded-[2rem] p-20 text-center shadow-xl">
               <div className="max-w-xs mx-auto space-y-4">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto text-blue-400">
                     <Search className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Registry Awaiting</h3>
                  <p className="text-slate-500 text-sm font-medium italic">Select an Urban Local Body to access regional zone configurations</p>
               </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#161B26] border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-10 border-b border-slate-800 flex items-center justify-between">
                 <h3 className="text-2xl font-black text-white tracking-tight">Modify Zone</h3>
                 <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white transition-colors">
                   <XCircle className="w-6 h-6" />
                 </button>
              </div>
              <form onSubmit={handleUpdate} className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Zone Number</label>
                    <input
                      type="text"
                      value={editFormData.zoneNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, zoneNumber: e.target.value })}
                      className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Zone Name</label>
                    <input
                      type="text"
                      value={editFormData.zoneName}
                      onChange={(e) => setEditFormData({ ...editFormData, zoneName: e.target.value })}
                      className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm text-slate-200 font-bold outline-none resize-none min-h-[120px] focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-8 py-5 bg-slate-800 text-slate-300 font-black rounded-3xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[11px]">Cancel</button>
                  <button type="submit" disabled={updateZoneMutation.isPending} className="flex-[2] px-8 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:bg-blue-500 transition-all uppercase tracking-widest text-[11px]">
                    {updateZoneMutation.isPending ? "Updating..." : "Save Changes"}
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
               <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Excise Region?</h3>
               <p className="text-slate-400 font-medium italic mb-8">Permanently remove <span className="text-red-400 font-black">"{selectedZone?.zoneName}"</span> from registry?</p>
               <div className="flex gap-4">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-6 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px]">Abort</button>
                  <button onClick={handleDelete} disabled={deleteZoneMutation.isPending} className="flex-1 px-6 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl hover:bg-red-500 transition-all uppercase tracking-widest text-[10px]">
                    {deleteZoneMutation.isPending ? "Removing..." : "Confirm"}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
