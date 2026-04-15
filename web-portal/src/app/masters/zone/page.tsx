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
    // Simulate loading time for consistency
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Check if current user can edit masters
  const canEditMasters = user && getUserRoleRank(user) >= ROLE_RANK.ADMIN;

  // Fetch zones for selected ULB
  const {
    data: zones,
    isLoading: zonesLoading,
    error: zonesError,
  } = useQuery({
    queryKey: ["zones", selectedUlb],
    queryFn: () => masterDataApi.getZonesByUlb(selectedUlb!),
    enabled: !!selectedUlb,
  });

  // Update Zone mutation
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

  // Delete Zone mutation
  const deleteZoneMutation = useMutation({
    mutationFn: (zoneId: string) => masterDataApi.deleteZone(zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones", selectedUlb] });
      toast.success("Zone deleted successfully");
      setShowDeleteConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete Zone");
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

  // Get sorted zones
  const getSortedZones = () => {
    if (!zones || !sortConfig) return zones || [];
    
    const sorted = [...zones];
    sorted.sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Special handling for zoneNumber - extract numeric part
      if (sortConfig.key === "zoneNumber") {
        const aNum = parseInt(String(a.zoneNumber).replace(/\D/g, '')) || 0;
        const bNum = parseInt(String(b.zoneNumber).replace(/\D/g, '')) || 0;
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      
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
    if (!sortConfig || sortConfig.key !== columnKey) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // Handle edit click
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

  // Handle update
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateZoneMutation.mutate(editFormData);
  };

  // Handle delete
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
      <div className="bg-gray-900 min-h-screen text-white">
        <h1 className="text-2xl font-bold mb-4">Zone Master</h1>
        <div className="mb-4">
          <ULBSelector value={selectedUlb} onChange={setSelectedUlb} />
        </div>
        <div>
          {zonesLoading && (
            <div className="text-gray-400">Loading zones...</div>
          )}
          {zonesError && (
            <div className="text-red-400">Error loading zones</div>
          )}
          {!zonesLoading && !zonesError && (
            <table className="w-full bg-gray-800 rounded-lg overflow-hidden text-sm">
              <thead>
                <tr>
                  <th 
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort("zoneNumber")}
                  >
                    Zone Number {getSortIcon("zoneNumber")}
                  </th>
                  <th 
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort("zoneName")}
                  >
                    Zone Name {getSortIcon("zoneName")}
                  </th>
                  <th 
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-700"
                  >
                    Description
                  </th>
                  <th className="px-4 py-2 text-left">Active</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSortedZones().length > 0 ? (
                  getSortedZones().map((zone: any) => (
                    <tr key={zone.zoneId} className="border-b border-gray-700">
                      <td className="px-4 py-2">{zone.zoneNumber}</td>
                      <td className="px-4 py-2">{zone.zoneName}</td>
                      <td className="px-4 py-2">{zone.description}</td>
                      <td className="px-4 py-2">
                        {zone.isActive ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditClick(zone)}
                            disabled={!canEditMasters}
                            className={`p-2 rounded-lg transition ${
                              canEditMasters
                                ? "text-blue-400 hover:bg-blue-900"
                                : "text-gray-600 cursor-not-allowed"
                            }`}
                            title={!canEditMasters ? "Only ADMIN or SUPERADMIN can edit" : "Edit Zone"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setSelectedZone(zone);
                              setShowDeleteConfirm(true);
                            }}
                            disabled={!canEditMasters}
                            className={`p-2 rounded-lg transition ${
                              canEditMasters
                                ? "text-red-400 hover:bg-red-900"
                                : "text-gray-600 cursor-not-allowed"
                            }`}
                            title={!canEditMasters ? "Only ADMIN or SUPERADMIN can delete" : "Delete Zone"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-center text-gray-400"
                    >
                      {selectedUlb
                        ? "No zones found for this ULB."
                        : "Select a ULB to view zones."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Edit Zone Modal */}
        {showEditModal && selectedZone && (
          <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative mx-auto max-w-lg shadow-2xl rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200 w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mb-3 shadow-lg transform transition-transform hover:scale-110">
                    <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">Edit Zone</h3>
                </div>
                <form onSubmit={handleUpdate} className="space-y-3">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 6h14a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        </svg>
                        Zone Number
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.zoneNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, zoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-900 text-sm font-medium placeholder-gray-400 bg-gradient-to-r from-gray-50 to-white"
                      placeholder="Enter zone number"
                      required
                    />
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024-.195 1.414-.586l7-7a2 2 0 000-2.828l-7-7a2 2 0 00-2.828 0l-7 7a1.994 1.994 0 00-1.414.586L3 12c0 .512.195 1.024.586 1.414l7 7c.39.39.902.586 1.414.586h5c.512 0 1.024-.195 1.414-.586l7-7a2 2 0 000-2.828l-7-7a2 2 0 00-2.828 0L7 7z" />
                        </svg>
                        Zone Name
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.zoneName}
                      onChange={(e) => setEditFormData({ ...editFormData, zoneName: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 text-gray-900 text-sm font-medium placeholder-gray-400 bg-gradient-to-r from-gray-50 to-white"
                      placeholder="Enter zone name"
                      required
                    />
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description
                      </span>
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 text-gray-900 text-sm font-medium placeholder-gray-400 bg-gradient-to-r from-gray-50 to-white resize-none"
                      rows={3}
                      placeholder="Enter zone description (optional)"
                    />
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 shadow-sm border border-blue-100">
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={editFormData.isActive}
                          onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`block w-12 h-6 rounded-full transition-colors duration-200 ${editFormData.isActive ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 flex items-center justify-center shadow-md ${editFormData.isActive ? 'transform translate-x-6' : ''}`}>
                          {editFormData.isActive ? (
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                          {editFormData.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg hover:from-gray-200 hover:to-gray-300 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateZoneMutation.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:from-blue-300 disabled:to-indigo-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-1.5 text-sm"
                    >
                      {updateZoneMutation.isPending ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Update Zone
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedZone && (
          <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-gray-800 to-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative mx-auto max-w-md shadow-2xl rounded-2xl bg-gradient-to-br from-white via-red-50 to-white border border-red-200 w-full">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 mb-4 shadow-lg transform transition-transform hover:scale-110">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2">Delete Zone</h3>
                <p className="text-gray-600 mb-5 leading-relaxed text-sm">
                  Are you sure you want to delete <strong className="text-red-600">{selectedZone.zoneName}</strong> ? 
                  <span className="block mt-1.5 text-xs text-gray-500">This action cannot be undone and all associated data may be affected.</span>
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteZoneMutation.isPending}
                    className="px-4 py-2 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg hover:from-gray-200 hover:to-gray-300 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteZoneMutation.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:from-red-300 disabled:to-red-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-1.5 text-sm"
                  >
                    {deleteZoneMutation.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Zone
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
