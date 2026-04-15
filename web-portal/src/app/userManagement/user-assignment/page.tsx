"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterDataApi, userApi, wardApi, assignmentApi } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2 } from "lucide-react"; // For loading spinner
import { useAuth } from "@/features/auth/AuthContext";

const USER_TYPES = [
  { label: "Surveyor", value: "SURVEYOR" },
  { label: "Supervisor", value: "SUPERVISOR" },
];

const UserAssignmentPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userType, setUserType] = useState("");
  const [selectedUlb, setSelectedUlb] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedWards, setSelectedWards] = useState<string[]>([]);
  const [selectedMohallas, setSelectedMohallas] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<any>(null);
  const [wardMohallaMap, setWardMohallaMap] = useState<{
    [wardId: string]: string[];
  }>({});
  const [mohallaAssignments, setMohallaAssignments] = useState<{
    [wardId: string]: { [mohallaId: string]: any };
  }>({});
  const [wardAssignments, setWardAssignments] = useState<{
    [wardId: string]: any;
  }>({});
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Initialize loading state
  useEffect(() => {
    // Simulate loading time for consistency
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Global data synchronization - listen for changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "assignment_updated") {
        console.log("Assignment update detected, refreshing data...");
        queryClient.invalidateQueries({ queryKey: ["wards"] });
        queryClient.invalidateQueries({ queryKey: ["mohallas"] });
        queryClient.invalidateQueries({ queryKey: ["available-wards"] });
        setLastRefreshed(new Date());
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [queryClient]);

  // Fetch ULBs
  const { data: ulbs = [], isLoading: ulbsLoading } = useQuery({
    queryKey: ["ulbs"],
    queryFn: masterDataApi.getAllUlbs,
  });

  // Fetch Zones by ULB
  const { data: zones = [], isLoading: zonesLoading } = useQuery({
    queryKey: ["zones", selectedUlb],
    queryFn: () => masterDataApi.getZonesByUlb(selectedUlb),
    enabled: !!selectedUlb,
  });

  // Fetch Wards by Zone (status 'STARTED') - Only wards with unassigned mohallas
  const {
    data: wardsResponse,
    isLoading: wardsLoading,
    error: wardsError,
  } = useQuery({
    queryKey: ["wards", selectedZone, "available-wards"],
    queryFn: async () => {
      console.log("=== DEBUG: Fetching available wards ===");
      console.log("Selected zoneId:", selectedZone);
      console.log("Zone type:", typeof selectedZone);
      console.log("Zone truthy check:", !!selectedZone);
      const result = await masterDataApi.getAvailableWards(selectedZone!);
      console.log("API Response received:", result);
      console.log("Response type:", typeof result);
      console.log("Response keys:", result ? Object.keys(result) : "null/undefined");
      if (result && result.wards) {
        console.log("Wards array length:", result.wards.length);
        if (result.wards.length > 0) {
          console.log("First ward sample:", result.wards[0]);
        }
      }
      console.log("=====================================");
      return result;
    },
    enabled: !!selectedZone,
    refetchInterval: 30000, // Refetch every 30 seconds to get latest assignment status
    refetchOnWindowFocus: true, // Refetch when user comes back to the page
    staleTime: 0, // Consider data immediately stale
  });

  // Extract wards array from the response
  const wards = (wardsResponse as any)?.wards || [];

  // Debug logging
  useEffect(() => {
    console.log("=== Ward Assignment Debug Info ===");
    console.log("Selected zone:", selectedZone);
    console.log("Wards loading:", wardsLoading);
    console.log("Wards error:", wardsError);
    console.log("Wards response:", wardsResponse);
    console.log("Wards array:", wards);
    console.log("Wards array length:", wards.length);
    if (wards.length > 0) {
      console.log("First ward:", wards[0]);
    }
    console.log("===============================");
  }, [selectedZone, wardsLoading, wardsError, wardsResponse, wards]);

  // Fetch Mohallas by selected Wards (only unassigned mohallas)
  const { data: mohallas = [], isLoading: mohallasLoading } = useQuery({
    queryKey: ["mohallas", selectedWards],
    queryFn: async () => {
      if (!selectedWards.length) return [];
      const allMohallas = await Promise.all(
        selectedWards.map((wardId) =>
          masterDataApi.getAvailableMohallas(wardId)
        )
      );
      const flat = allMohallas.flatMap((response) => response.mohallas || []);
      const unique = Array.from(
        new Map(flat.map((m) => [m.mohallaId, m])).values()
      );
      return unique;
    },
    enabled: !!selectedWards.length,
  });

  // Fetch users by role
  useEffect(() => {
    if (userType) {
      userApi.getUsersByRole(userType).then((res) => setUsers(res.users || []));
    } else {
      setUsers([]);
    }
    setSelectedUser("");
  }, [userType]);

  // Fetch mohallas and assignment status for selected wards
  useEffect(() => {
    const fetchMohallasAndAssignments = async () => {
      const newWardMohallaMap: { [wardId: string]: string[] } = {};
      const newMohallaAssignments: {
        [wardId: string]: { [mohallaId: string]: any };
      } = {};
      const newWardAssignments: { [wardId: string]: any } = {};

      for (const wardId of selectedWards) {
        // Fetch mohallas with assignment status for this ward
        const response = await masterDataApi.getAvailableMohallas(wardId);
        const mohallasData = response.mohallas || [];

        newWardMohallaMap[wardId] = mohallasData.map((m: any) => m.mohallaId);

        // Track ward-level assignments
        const res = await assignmentApi.getAssignmentsByWard(wardId);
        const assignments = res.assignments || [];
        if (assignments.length > 0) {
          newWardAssignments[wardId] = assignments[0].user;
        }

        const mohallaMap: { [mohallaId: string]: any } = {};
        mohallasData.forEach((mohalla: any) => {
          if (mohalla.isAssigned && mohalla.assignedTo) {
            mohallaMap[mohalla.mohallaId] = mohalla.assignedTo;
          }
        });
        newMohallaAssignments[wardId] = mohallaMap;
      }

      setWardMohallaMap(newWardMohallaMap);
      setMohallaAssignments(newMohallaAssignments);
      setWardAssignments(newWardAssignments);
    };

    if (selectedWards.length > 0) {
      fetchMohallasAndAssignments();
    } else {
      setWardMohallaMap({});
      setMohallaAssignments({});
      setWardAssignments({});
    }
  }, [selectedWards]);

  // Auto-select all unassigned mohallas for each ward
  useEffect(() => {
    if (Object.keys(wardMohallaMap).length > 0) {
      const newSelectedMohallas: string[] = [];
      Object.entries(wardMohallaMap).forEach(([wardId, mohallaIds]) => {
        mohallaIds.forEach((mid) => {
          if (!mohallaAssignments[wardId] || !mohallaAssignments[wardId][mid]) {
            newSelectedMohallas.push(mid);
          }
        });
      });
      setSelectedMohallas(newSelectedMohallas);
    }
  }, [wardMohallaMap, mohallaAssignments]);

  // Manual refresh function
  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    // Invalidate all related queries aggressively
    queryClient.invalidateQueries({ queryKey: ["wards"] });
    queryClient.invalidateQueries({ queryKey: ["zones"] });
    queryClient.invalidateQueries({ queryKey: ["mohallas"] });
    queryClient.invalidateQueries({ queryKey: ["available-wards"] });
    queryClient.invalidateQueries({ queryKey: ["allAssignments"] });

    // Force refetch the current query
    queryClient.refetchQueries({
      queryKey: ["wards", selectedZone, "available-wards"],
    });

    setLastRefreshed(new Date());
    toast.success("Data refreshed successfully!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a user to assign.");
      return;
    }
    
    // Build assignments array: [{ wardId, mohallaIds }]
    const assignments = Object.entries(wardMohallaMap)
      .map(([wardId, mohallaIds]) => ({
        wardId,
        mohallaIds: mohallaIds.filter((mid) =>
          selectedMohallas.includes(mid)
        ),
      }))
      .filter((a) => a.mohallaIds.length > 0);
    
    if (assignments.length === 0) {
      toast.error("No mohallas selected for assignment.");
      return;
    }
    
    // Store pending assignment and show confirmation dialog
    setPendingAssignment({
      userId: selectedUser,
      assignmentType: userType,
      assignments,
    });
    setShowConfirmDialog(true);
  };

  const confirmAssignment = async () => {
    if (!pendingAssignment) {
      setShowConfirmDialog(false);
      return;
    }
    
    setSubmitting(true);
    setShowConfirmDialog(false);
    
    try {
      const res = await assignmentApi.bulkAssign(pendingAssignment);
      console.log("Assignment API response:", res);
      
      if (res.success && res.assigned && res.assigned.length > 0) {
        toast.success("Assignment successful!", {
          position: "top-right",
        });
        
        if (res.conflicts && res.conflicts.length > 0) {
          toast("Some mohallas were already assigned and skipped.", {
            icon: "⚠️",
            position: "top-right",
          });
        }
        
        // Refresh available wards to update the list
        queryClient.invalidateQueries({ queryKey: ["wards"] });
        queryClient.invalidateQueries({ queryKey: ["mohallas"] });
        queryClient.invalidateQueries({ queryKey: ["available-wards"] });
        queryClient.invalidateQueries({ queryKey: ["allAssignments"] });

        // Trigger global update notification
        localStorage.setItem("assignment_updated", Date.now().toString());
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "assignment_updated",
            newValue: Date.now().toString(),
          })
        );

        setSelectedWards([]);
        setSelectedMohallas([]);
        setSelectedUser("");
      } else if (res.success && (!res.assigned || res.assigned.length === 0)) {
        toast(
          "No new mohallas were assigned. All selected mohallas may already be assigned.",
          { 
            icon: "⚠️",
            position: "top-right",
          }
        );
      } else {
        toast.error("Assignment failed", { position: "top-right" });
      }
    } catch (err: any) {
      console.error("Assignment API error:", err);
      toast.error(err?.response?.data?.error || "Assignment failed", {
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
      setPendingAssignment(null);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <MainLayout>
      <Card className="w-full ">
        <CardHeader className="bg-black text-white text-2xl font-bold p-4 mb-4 border-2 border-amber-50 rounded-lg">
          User Assignment
        </CardHeader>
        <CardContent className="p-8">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="flex flex-col gap-2">
              <Label>
                User Type <span className="text-red-500">*</span>
              </Label>
              <Select value={userType} onValueChange={setUserType} required>
                <SelectTrigger className="h-12 text-base font-medium">
                  <SelectValue placeholder="SELECT" />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-black bg-white border-2 border-black hover:bg-blue-300"
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                User <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
                required
                disabled={!userType}
              >
                <SelectTrigger className="h-12 text-base font-medium">
                  <SelectValue placeholder="Select User..." />
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      {userType ? "No users found" : "Select user type first"}
                    </SelectItem>
                  ) : (
                    users.map((user: any) => (
                      <SelectItem
                        key={user.userId}
                        value={user.userId}
                        className="text-black bg-white border-2 border-black hover:bg-blue-300"
                      >
                        {user.name || user.username}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                ULB <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedUlb}
                onValueChange={setSelectedUlb}
                required
              >
                <SelectTrigger className="h-12 text-base font-medium">
                  <SelectValue placeholder="Select ULB..." />
                </SelectTrigger>
                <SelectContent>
                  {ulbsLoading ? (
                    <SelectItem
                      value="loading"
                      disabled
                      className="text-black bg-white border-2 border-black hover:bg-blue-300"
                    >
                      Loading...
                    </SelectItem>
                  ) : (
                    ulbs.map((ulb: any) => (
                      <SelectItem
                        key={ulb.ulbId}
                        value={ulb.ulbId}
                        className="text-black bg-white border-2 border-black hover:bg-blue-300"
                      >
                        {ulb.ulbName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                Zone Name <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedZone}
                onValueChange={setSelectedZone}
                required
                disabled={!selectedUlb}
              >
                <SelectTrigger className="h-12 text-base font-medium">
                  <SelectValue placeholder="Select Zone..." />
                </SelectTrigger>
                <SelectContent>
                  {zonesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    zones.map((zone: any) => (
                      <SelectItem
                        key={zone.zoneId}
                        value={zone.zoneId}
                        className="text-black bg-white border-2 border-black hover:bg-blue-300"
                      >
                        {zone.zoneNumber}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Wards Table */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-semibold">
                  Wards <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Last updated: {lastRefreshed.toLocaleTimeString()}
                  </span>
                  <Button
                    type="button"
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={wardsLoading}
                  >
                    {wardsLoading ? "Loading..." : "Refresh Wards"}
                  </Button>
                </div>
              </div>
              {wardsLoading ? (
                <div className="text-center py-4">Loading wards...</div>
              ) : wardsError ? (
                <div className="text-center py-4 text-red-500">
                  Error loading wards: {wardsError.message}
                </div>
              ) : wards.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {selectedZone
                    ? "No wards found with unassigned mohallas"
                    : "Select a zone to view wards"}
                </div>
              ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Select
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ward Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mohallas (Unassigned/Total)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {wards.map((ward: any) => {
                        const isFullyAssigned = ward.unassignedMohallas === 0;
                        return (
                          <tr key={ward.wardId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedWards.includes(ward.wardId)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedWards((prev) =>
                                    checked
                                      ? [...prev, ward.wardId]
                                      : prev.filter((id) => id !== ward.wardId)
                                  );
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {ward.wardName}
                              </div>
                              <div className="text-sm text-gray-500">
                                Ward #{ward.newWardNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {ward.unassignedMohallas}/{ward.totalMohallas}
                              </div>
                              <div className="text-xs text-gray-500">
                                {ward.assignedMohallas} assigned
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  isFullyAssigned
                                    ? "bg-green-100 text-green-800"
                                    : ward.assignedMohallas > 0
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {isFullyAssigned
                                  ? "Fully Assigned"
                                  : ward.assignedMohallas > 0
                                  ? "Partially Assigned"
                                  : "Available"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mohallas Table */}
            <div className="md:col-span-2">
              <Label className="text-lg font-semibold mb-4 block">
                Mohallas <span className="text-red-500">*</span>
              </Label>
              {selectedWards.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Select wards first to view mohallas
                </div>
              ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Select
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mohalla Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned To
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedWards
                        .map((wardId) => {
                          const mohallaIds = wardMohallaMap[wardId] || [];
                          const wardName = wards.find(
                            (w: any) => w.wardId === wardId
                          )?.wardName;
                          return mohallaIds.map((mohallaId) => {
                            const assignedUser =
                              mohallaAssignments[wardId]?.[mohallaId];
                            const isAssigned = Boolean(assignedUser);
                            const mohalla = mohallas.find(
                              (m: any) => m.mohallaId === mohallaId
                            );

                            return (
                              <tr
                                key={mohallaId}
                                className={`hover:bg-gray-50 ${
                                  isAssigned ? "bg-red-50" : ""
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedMohallas.includes(
                                      mohallaId
                                    )}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSelectedMohallas((prev) =>
                                        checked
                                          ? [...prev, mohallaId]
                                          : prev.filter(
                                              (id) => id !== mohallaId
                                            )
                                      );
                                    }}
                                    disabled={isAssigned}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {mohalla ? mohalla.mohallaName : mohallaId}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Ward: {wardName}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      isAssigned
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {isAssigned ? "Assigned" : "Available"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {assignedUser
                                    ? assignedUser.name || assignedUser.username
                                    : "-"}
                                </td>
                              </tr>
                            );
                          });
                        })
                        .flat()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
              <Button
                type="submit"
                className="px-10 py-3 text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-black rounded-lg shadow-lg hover:from-yellow-400 hover:to-amber-500 transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center"
                disabled={submitting}
              >
                {submitting && <Loader2 className="animate-spin w-5 h-5" />}
                {submitting ? "Assigning..." : "Submit"}
              </Button>
            </div>
          </form>
          
          {/* Confirmation Dialog */}
          {showConfirmDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white text-black rounded-lg p-6 w-[500px] shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-red-600">
                  Confirm Assignment
                </h3>
                
                <div className="mb-6 space-y-3">
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="text-sm">
                      <strong className="text-gray-700">User Type:</strong>{" "}
                      <span className="ml-2 font-semibold">
                        {pendingAssignment?.assignmentType}
                      </span>
                    </p>
                  </div>
                  
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="text-sm">
                      <strong className="text-gray-700">User:</strong>{" "}
                      <span className="ml-2 font-semibold">
                        {users.find((u) => u.userId === pendingAssignment?.userId)?.name || 
                         users.find((u) => u.userId === pendingAssignment?.userId)?.username || "N/A"}
                      </span>
                    </p>
                  </div>
                  
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="text-sm mb-2">
                      <strong className="text-gray-700">ULB:</strong>{" "}
                      <span className="ml-2 font-semibold">
                        {ulbs.find((u: any) => u.ulbId === selectedUlb)?.ulbName || "N/A"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <strong className="text-gray-700">Zone:</strong>{" "}
                      <span className="ml-2 font-semibold">
                        {zones.find((z: any) => z.zoneId === selectedZone)?.zoneNumber || "N/A"}
                      </span>
                    </p>
                  </div>
                  
                  <div className="bg-gray-100 p-3 rounded-md max-h-32 overflow-y-auto">
                    <p className="text-sm mb-2">
                      <strong className="text-gray-700">Wards:</strong>
                    </p>
                    <ul className="text-sm ml-4 list-disc">
                      {wards
                        .filter((w: any) => selectedWards.includes(w.wardId))
                        .map((w: any) => (
                          <li key={w.wardId} className="text-gray-800">
                            {w.wardName} (Ward #{w.newWardNumber})
                          </li>
                        ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-100 p-3 rounded-md max-h-32 overflow-y-auto">
                    <p className="text-sm mb-2">
                      <strong className="text-gray-700">Mohallas to Assign:</strong>
                    </p>
                    <p className="text-sm text-gray-800">
                      {selectedMohallas.length} mohalla(s) selected
                    </p>
                  </div>
                </div>
                
                <p className="mb-6 text-gray-700 font-medium">
                  Are you sure you want to proceed with this assignment?
                </p>
                
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="px-6 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors font-medium"
                    onClick={() => {
                      setShowConfirmDialog(false);
                      setPendingAssignment(null);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400"
                    onClick={confirmAssignment}
                    disabled={submitting}
                  >
                    {submitting ? "Assigning..." : "Confirm Assignment"}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Assignment Summary */}
          <div className="col-span-2 mt-6">
            <h3 className="font-bold mb-2">Assignment Summary</h3>
            <div className="bg-black p-4 rounded-lg text-white">
              <div>
                <b>User Type:</b> {userType}
              </div>
              <div>
                <b>User:</b>{" "}
                {users.find((u: any) => u.userId === selectedUser)?.name || "-"}
              </div>
              <div>
                <b>ULB:</b>{" "}
                {ulbs.find((u: any) => u.ulbId === selectedUlb)?.ulbName || "-"}
              </div>
              <div>
                <b>Zone:</b>{" "}
                {zones.find((z: any) => z.zoneId === selectedZone)
                  ?.zoneNumber || "-"}
              </div>
              <div>
                <b>Wards:</b>{" "}
                {wards
                  .filter((w: any) => selectedWards.includes(w.wardId))
                  .map((w: any) => w.wardName)
                  .join(", ") || "-"}
              </div>
              <div>
                <b>Mohallas:</b>{" "}
                {selectedWards
                  .map((wardId) => {
                    const mohallaIds = wardMohallaMap[wardId] || [];
                    const mohallaNames = mohallaIds
                      .filter((mid) => selectedMohallas.includes(mid))
                      .map((mid) => {
                        const mohalla = mohallas.find(
                          (m: any) => m.mohallaId === mid
                        );
                        return mohalla ? mohalla.mohallaName : mid;
                      });
                    return mohallaNames.length > 0
                      ? `${
                          wards.find((w: any) => w.wardId === wardId)?.wardName
                        }: ${mohallaNames.join(", ")}`
                      : null;
                  })
                  .filter(Boolean)
                  .join("; ") || "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default UserAssignmentPage;
