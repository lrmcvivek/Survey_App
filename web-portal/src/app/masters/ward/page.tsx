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
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ward Master</h1>
              <p className="text-gray-500 text-sm mt-1">Manage ward identities and survey statuses</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsStatusModalOpen(true)}
                 className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
               >
                 <Activity className="w-4 h-4 text-blue-600" />
                 Survey Status
               </button>
               {canEditMasters && selectedZone && (
                 <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95">
                   <Plus className="w-4 h-4" />
                   Add Ward
                 </button>
               )}
            </div>
          </div>

          {/* Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
             <ULBSelector value={selectedUlb} onChange={(id) => { setSelectedUlb(id); setSelectedZone(null); }} isDark={false} />
             <ZoneSelector ulbId={selectedUlb} value={selectedZone} onChange={setSelectedZone} isDark={false} />
          </div>

          {selectedZone && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Search */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search wards by name or number..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-11 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-sm transition-all"
                  />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-6 py-3 flex items-center gap-4 shadow-sm">
                   <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                     <Navigation className="w-5 h-5 text-blue-600" />
                   </div>
                   <div>
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Wards</p>
                     <p className="text-xl font-bold text-gray-900 mt-1 leading-none">{filteredWards.length}</p>
                   </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort("newWardNumber")}>
                          <div className="flex items-center gap-2">Ward Number {getSortIcon("newWardNumber")}</div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort("wardName")}>
                          <div className="flex items-center gap-2">Ward Name {getSortIcon("wardName")}</div>
                        </th>
                        <th className="px-6 py-4">Survey State</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getSortedFilteredWards().length > 0 ? (
                        getSortedFilteredWards().map((ward: any) => (
                          <tr key={ward.wardId} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="text-blue-600 font-bold text-xs px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100">W-{ward.newWardNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-gray-900 font-bold text-sm">{ward.wardName}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                getCurrentStatusName(ward).toLowerCase().includes('started') 
                                ? 'bg-gray-100 text-gray-600 border-gray-200' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                 {getCurrentStatusName(ward)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditClick(ward)}
                                  className={`p-1.5 rounded-lg transition-all ${canEditMasters ? "text-gray-400 hover:text-blue-600 hover:bg-blue-50" : "text-gray-200 cursor-not-allowed"}`}
                                  disabled={!canEditMasters}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedWardToDelete(ward);
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
                          <td colSpan={4} className="px-6 py-16 text-center">
                             <div className="flex flex-col items-center justify-center space-y-2">
                                <Database className="w-10 h-10 text-gray-200" />
                                <p className="text-sm font-medium text-gray-400">No wards found</p>
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
            <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm">
               <div className="max-w-xs mx-auto space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500">
                     <Navigation className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Select a Zone</h3>
                    <p className="text-gray-500 text-sm mt-1">Select an Urban Local Body and Zone to view its wards.</p>
                  </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                 <h3 className="text-lg font-bold text-gray-900">Edit Ward</h3>
                 <button onClick={() => setShowEditModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                   <XCircle className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleUpdate} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Ward Number</label>
                    <input
                      type="text"
                      value={editFormData.newWardNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, newWardNumber: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Ward Name</label>
                    <input
                      type="text"
                      value={editFormData.wardName}
                      onChange={(e) => setEditFormData({ ...editFormData, wardName: e.target.value })}
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
                  <button type="submit" disabled={updateWardMutation.isPending} className="flex-[2] px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all text-sm disabled:opacity-50 active:scale-95">
                    {updateWardMutation.isPending ? "Saving..." : "Save Changes"}
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
               <p className="text-gray-500 text-sm mb-6">Are you sure you want to permanently remove <span className="text-red-600 font-bold">"{selectedWardToDelete?.wardName}"</span>? This action cannot be undone.</p>
               <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all text-sm">Cancel</button>
                  <button onClick={handleDelete} disabled={deleteWardMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg shadow-sm hover:bg-red-700 transition-all text-sm disabled:opacity-50">
                    {deleteWardMutation.isPending ? "Deleting..." : "Delete ward"}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
