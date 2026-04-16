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
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ULB Master</h1>
              <p className="text-gray-500 text-sm mt-1">Manage Urban Local Bodies (Municipalities) in the system</p>
            </div>
            {canEditMasters && (
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95">
                <Plus className="w-4 h-4" />
                Add New ULB
              </button>
            )}
          </div>

          {/* Search & Stats Card */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by ULB name or code..." 
                className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-11 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-sm transition-all"
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-6 py-3 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total ULBs</p>
                <p className="text-xl font-bold text-gray-900 leading-none mt-1">{ulbs?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort("ulbCode")}>
                      <div className="flex items-center gap-2">ULB Code {getSortIcon("ulbCode")}</div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort("ulbName")}>
                      <div className="flex items-center gap-2">ULB Name {getSortIcon("ulbName")}</div>
                    </th>
                    <th className="px-6 py-4 text-center">Zones</th>
                    <th className="px-6 py-4 text-center">Wards</th>
                    <th className="px-6 py-4 text-center">Mohallas</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getSortedUlbs().length > 0 ? (
                    getSortedUlbs().map((ulb: any) => (
                      <tr key={ulb.ulbId} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-blue-600 font-bold text-xs px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100">{ulb.ulbCode}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-bold text-sm">{ulb.ulbName}</span>
                            <span className="text-gray-400 text-xs truncate max-w-[250px]">{ulb.description || "Urban Local Body record"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-md border border-gray-100">
                             <Map className="w-3.5 h-3.5 text-gray-400" />
                             <span className="text-xs font-bold text-gray-700">{ulb.totalZones}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-md border border-gray-100">
                             <Navigation className="w-3.5 h-3.5 text-gray-400" />
                             <span className="text-xs font-bold text-gray-700">{ulb.totalWards}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-md border border-gray-100">
                             <Home className="w-3.5 h-3.5 text-gray-400" />
                             <span className="text-xs font-bold text-gray-700">{ulb.totalMohallas}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {ulb.isActive ? (
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
                              onClick={() => handleEditClick(ulb)}
                              disabled={!canEditMasters}
                              className={`p-1.5 rounded-lg transition-all ${
                                canEditMasters
                                  ? "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                  : "text-gray-200 cursor-not-allowed"
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
                              className={`p-1.5 rounded-lg transition-all ${
                                canEditMasters
                                  ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  : "text-gray-200 cursor-not-allowed"
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
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Database className="w-10 h-10 text-gray-200" />
                          <p className="text-sm font-medium text-gray-400">No ULBs found</p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 w-full max-w-lg rounded-xl shadow-xl overflow-hidden transition-all animate-in fade-in zoom-in duration-200">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                   <h3 className="text-lg font-bold text-gray-900">Edit ULB record</h3>
                   <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Reference ID: #{selectedUlb?.ulbCode}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">ULB Code</label>
                    <input
                      type="text"
                      value={editFormData.ulbCode}
                      onChange={(e) => setEditFormData({ ...editFormData, ulbCode: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">ULB Name</label>
                    <input
                      type="text"
                      value={editFormData.ulbName}
                      onChange={(e) => setEditFormData({ ...editFormData, ulbName: e.target.value })}
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
                    placeholder="Enter description..."
                  />
                </div>
                <div className="flex items-center justify-between border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Record Status</p>
                    <p className="text-[10px] font-medium text-gray-500">Enable or disable this ULB in the system</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all text-sm active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateUlbMutation.isPending}
                    className="flex-[2] px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all text-sm disabled:opacity-50 active:scale-95"
                  >
                    {updateUlbMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 w-full max-w-md rounded-xl shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                <p className="text-gray-500 text-sm">
                  Are you sure you want to permanently remove <span className="text-red-600 font-bold">"{selectedUlb?.ulbName}"</span>? 
                  <span className="block mt-1 font-semibold text-gray-400">This action cannot be undone.</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteUlbMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg shadow-sm hover:bg-red-700 transition-all text-sm disabled:opacity-50"
                >
                  {deleteUlbMutation.isPending ? "Deleting..." : "Delete record"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
