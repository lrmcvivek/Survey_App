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
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Zone Master</h1>
              <p className="text-gray-500 text-sm mt-1">Configure geographic zones within ULBs</p>
            </div>
            {canEditMasters && selectedUlb && (
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95">
                <Plus className="w-4 h-4" />
                Add Zone
              </button>
            )}
          </div>

          {/* ULB Selector Area */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
             <div className="max-w-md">
                <ULBSelector value={selectedUlb} onChange={setSelectedUlb} isDark={false} />
             </div>
          </div>

          {selectedUlb && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Search & Meta */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search zones..." 
                    className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-11 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-sm transition-all"
                  />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-6 py-3 flex items-center gap-4 shadow-sm">
                   <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                     <Map className="w-5 h-5 text-blue-600" />
                   </div>
                   <div>
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Zones</p>
                     <p className="text-xl font-bold text-gray-900 mt-1 leading-none">{zones?.length || 0}</p>
                   </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort("zoneNumber")}>
                          <div className="flex items-center gap-2">Zone Number {getSortIcon("zoneNumber")}</div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort("zoneName")}>
                          <div className="flex items-center gap-2">Zone Name {getSortIcon("zoneName")}</div>
                        </th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getSortedZones().length > 0 ? (
                        getSortedZones().map((zone: any) => (
                          <tr key={zone.zoneId} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="text-blue-600 font-bold text-xs px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100">{zone.zoneNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-gray-900 font-bold text-sm">{zone.zoneName}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-gray-400 text-xs truncate max-w-[200px] block">{zone.description || "Administrative Zone"}</span>
                            </td>
                            <td className="px-6 py-4">
                              {zone.isActive ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100 w-max">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                  Active
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-50 rounded-full border border-gray-200 w-max">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  Inactive
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditClick(zone)}
                                  className={`p-1.5 rounded-lg transition-all ${canEditMasters ? "text-gray-400 hover:text-blue-600 hover:bg-blue-50" : "text-gray-200 cursor-not-allowed"}`}
                                  disabled={!canEditMasters}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedZone(zone);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all ${canEditMasters ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-gray-200 cursor-not-allowed"}`}
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
                          <td colSpan={5} className="px-6 py-16 text-center">
                             <div className="flex flex-col items-center justify-center space-y-2">
                                <Database className="w-10 h-10 text-gray-200" />
                                <p className="text-sm font-medium text-gray-400">No zones found</p>
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
            <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm">
               <div className="max-w-xs mx-auto space-y-4">
                  <div className="w-16 h-16 bg-blue-50 tracking-wider rounded-full flex items-center justify-center mx-auto text-blue-500">
                     <Search className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Select a ULB</h3>
                    <p className="text-gray-500 text-sm mt-1">Select an Urban Local Body to view and manage its zones.</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                 <h3 className="text-lg font-bold text-gray-900">Edit Zone</h3>
                 <button onClick={() => setShowEditModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                   <XCircle className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleUpdate} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Zone Number</label>
                    <input
                      type="text"
                      value={editFormData.zoneNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, zoneNumber: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Zone Name</label>
                    <input
                      type="text"
                      value={editFormData.zoneName}
                      onChange={(e) => setEditFormData({ ...editFormData, zoneName: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none resize-none min-h-[100px]"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all text-sm active:scale-95">Cancel</button>
                  <button type="submit" disabled={updateZoneMutation.isPending} className="flex-[2] px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all text-sm disabled:opacity-50 active:scale-95">
                    {updateZoneMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 w-full max-w-md rounded-xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-200">
               <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
               <p className="text-gray-500 text-sm mb-6">Are you sure you want to permanently remove <span className="text-red-600 font-bold">"{selectedZone?.zoneName}"</span>? This action cannot be undone.</p>
               <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all text-sm">Cancel</button>
                  <button onClick={handleDelete} disabled={deleteZoneMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg shadow-sm hover:bg-red-700 transition-all text-sm disabled:opacity-50">
                    {deleteZoneMutation.isPending ? "Deleting..." : "Delete record"}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
