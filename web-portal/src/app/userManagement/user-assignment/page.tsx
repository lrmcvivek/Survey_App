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
import { Loader2, XCircle } from "lucide-react"; // For loading spinner
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
      const result = await masterDataApi.getAvailableWards(selectedZone!);
      return result;
    },
    enabled: !!selectedZone,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Extract wards array from the response
  const wards = (wardsResponse as any)?.wards || [];

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
        const response = await masterDataApi.getAvailableMohallas(wardId);
        const mohallasData = response.mohallas || [];

        newWardMohallaMap[wardId] = mohallasData.map((m: any) => m.mohallaId);

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
    queryClient.invalidateQueries({ queryKey: ["wards"] });
    queryClient.invalidateQueries({ queryKey: ["zones"] });
    queryClient.invalidateQueries({ queryKey: ["mohallas"] });
    queryClient.invalidateQueries({ queryKey: ["available-wards"] });
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
      if (res.success && res.assigned && res.assigned.length > 0) {
        toast.success("Assignment successful!");
        queryClient.invalidateQueries({ queryKey: ["wards"] });
        queryClient.invalidateQueries({ queryKey: ["mohallas"] });
        queryClient.invalidateQueries({ queryKey: ["available-wards"] });
        localStorage.setItem("assignment_updated", Date.now().toString());
        window.dispatchEvent(new StorageEvent("storage", { key: "assignment_updated", newValue: Date.now().toString() }));
        setSelectedWards([]);
        setSelectedMohallas([]);
        setSelectedUser("");
      } else {
        toast.error("Assignment failed");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Assignment failed");
    } finally {
      setSubmitting(false);
      setPendingAssignment(null);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Survey Team Assignment</h1>
            <p className="text-gray-500 text-sm mt-1">Assign surveyors and supervisors to specific wards and mohallas for field data collection.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Assignment Details</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Configure user and location details</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Refreshed: {lastRefreshed.toLocaleTimeString()}</span>
              <button type="button" onClick={handleRefresh} className="p-1.5 text-gray-400 hover:text-blue-600 bg-white rounded-md border border-gray-200 shadow-sm transition-all active:scale-95">
                <Loader2 className={`w-4 h-4 ${wardsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">User Role</label>
                <Select value={userType} onValueChange={setUserType} required>
                  <SelectTrigger className="w-full bg-gray-50 border border-gray-200 rounded-lg h-11 px-4 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-sm font-medium">{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Select User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser} required disabled={!userType}>
                  <SelectTrigger className="w-full bg-gray-50 border border-gray-200 rounded-lg h-11 px-4 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all disabled:opacity-50">
                    <SelectValue placeholder="Select Personnel" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? <SelectItem value="none" disabled>No users found</SelectItem> : users.map((u: any) => (
                      <SelectItem key={u.userId} value={u.userId} className="text-sm font-medium">{u.name || u.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Municipality (ULB)</label>
                <Select value={selectedUlb} onValueChange={setSelectedUlb} required>
                  <SelectTrigger className="w-full bg-gray-50 border border-gray-200 rounded-lg h-11 px-4 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
                    <SelectValue placeholder="Select ULB" />
                  </SelectTrigger>
                  <SelectContent>
                    {ulbs.map((ulb: any) => (
                      <SelectItem key={ulb.ulbId} value={ulb.ulbId} className="text-sm font-medium">{ulb.ulbName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Zone</label>
                <Select value={selectedZone} onValueChange={setSelectedZone} required disabled={!selectedUlb}>
                  <SelectTrigger className="w-full bg-gray-50 border border-gray-200 rounded-lg h-11 px-4 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all disabled:opacity-50">
                    <SelectValue placeholder="Select Zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone: any) => (
                      <SelectItem key={zone.zoneId} value={zone.zoneId} className="text-sm font-medium">Zone {zone.zoneNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <div className="px-1 flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Available Wards</label>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto h-[400px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                        <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <th className="px-6 py-3.5 w-12 text-center">Select</th>
                          <th className="px-6 py-3.5">Ward Name</th>
                          <th className="px-6 py-3.5 text-center">Mohallas</th>
                          <th className="px-6 py-3.5 w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {wards.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-400 text-xs font-bold uppercase tracking-wider">No wards available for current selection</td></tr>
                        ) : (
                          wards.map((ward: any) => {
                            const isFullyAssigned = ward.unassignedMohallas === 0;
                            return (
                              <tr key={ward.wardId} className={`hover:bg-blue-50/30 transition-colors ${selectedWards.includes(ward.wardId) ? 'bg-blue-50/50' : ''}`}>
                                <td className="px-6 py-4 text-center">
                                  <input type="checkbox" checked={selectedWards.includes(ward.wardId)} onChange={(e) => { const checked = e.target.checked; setSelectedWards((prev) => checked ? [...prev, ward.wardId] : prev.filter((id) => id !== ward.wardId)); }} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600/20" />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-gray-900 font-bold text-sm tracking-tight">{ward.wardName}</span>
                                    <span className="text-gray-400 text-[11px] font-semibold">Ward #{ward.newWardNumber}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center"><span className="text-xs font-bold text-gray-600">{ward.unassignedMohallas} / {ward.totalMohallas} Unassigned</span></td>
                                <td className="px-6 py-4">
                                   {isFullyAssigned ? <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 uppercase tracking-tighter">Assigned</span> : <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-100 uppercase tracking-tighter">Available</span>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="px-1 flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Mohalla Assignment</label>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto h-[400px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                        <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <th className="px-6 py-3.5 w-12 text-center">Select</th>
                          <th className="px-6 py-3.5">Mohalla Name</th>
                          <th className="px-6 py-3.5">Assigned To</th>
                          <th className="px-6 py-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedWards.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-400 text-xs font-bold uppercase tracking-wider">No wards selected</td></tr>
                        ) : (
                          selectedWards.map((wardId) => {
                            const mIds = wardMohallaMap[wardId] || [];
                            const wardData = wards.find((w: any) => w.wardId === wardId);
                            return mIds.map((mohallaId) => {
                              const assignedUser = mohallaAssignments[wardId]?.[mohallaId];
                              const isAssigned = Boolean(assignedUser);
                              const mohalla = mohallas.find((m: any) => m.mohallaId === mohallaId);
                              return (
                                <tr key={mohallaId} className={`hover:bg-blue-50/30 transition-colors ${selectedMohallas.includes(mohallaId) ? 'bg-blue-50/50' : ''}`}>
                                  <td className="px-6 py-4 text-center">
                                    <input type="checkbox" checked={selectedMohallas.includes(mohallaId)} onChange={(e) => { const checked = e.target.checked; setSelectedMohallas((prev) => checked ? [...prev, mohallaId] : prev.filter((id) => id !== mohallaId)); }} disabled={isAssigned} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600/20 disabled:opacity-20" />
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="text-gray-900 font-bold text-xs tracking-tight">{mohalla ? mohalla.mohallaName : "Mohalla ID: " + mohallaId}</span>
                                      <span className="text-gray-400 text-[10px] font-semibold">{wardData?.wardName}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4"><span className="text-xs font-semibold text-gray-500">{assignedUser ? (assignedUser.name || assignedUser.username) : "NOT ASSIGNED"}</span></td>
                                  <td className="px-6 py-4">{isAssigned ? <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned</span> : <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Available</span>}</td>
                                </tr>
                              );
                            });
                          }).flat()
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={submitting} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all uppercase tracking-wider text-xs active:scale-95 disabled:opacity-50 flex items-center gap-2">
                {submitting && <Loader2 className="animate-spin w-4 h-4" />}
                {submitting ? "SAVING..." : "SAVE ASSIGNMENT"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
               <div>
                 <h3 className="text-lg font-bold text-gray-900 tracking-tight">Confirm Assignment</h3>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Please review the assignment details</p>
               </div>
               <button onClick={() => setShowConfirmDialog(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                 <XCircle className="w-5 h-5" />
               </button>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                     <p className="text-sm font-bold text-gray-900">{users.find((u) => u.userId === pendingAssignment?.userId)?.name || "N/A"}</p>
                     <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{pendingAssignment?.assignmentType} Role</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                     <p className="text-sm font-bold text-gray-900">{ulbs.find((u: any) => u.ulbId === selectedUlb)?.ulbName || "N/A"}</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Zone {zones.find((z: any) => z.zoneId === selectedZone)?.zoneNumber || "N/A"}</p>
                  </div>
                </div>

                <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100 max-h-40 overflow-y-auto">
                    <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-2">Assigned Wards/Mohallas ({selectedMohallas.length} Areas)</p>
                    <div className="flex flex-wrap gap-2">
                       {selectedWards.map((wardId) => {
                         const ward = wards.find((w: any) => w.wardId === wardId);
                         const mohallaIds = (wardMohallaMap[wardId] || []).filter(mid => selectedMohallas.includes(mid));
                         if (mohallaIds.length === 0) return null;
                         return (
                           <div key={wardId} className="flex flex-col gap-0.5 bg-white p-2.5 rounded-md border border-gray-200 min-w-[120px]">
                             <span className="text-[10px] font-bold text-gray-500 uppercase">WARD: {ward?.wardName || wardId}</span>
                             <span className="text-xs font-bold text-gray-900">{mohallaIds.length} Mohallas</span>
                           </div>
                         );
                       })}
                    </div>
                </div>

                <p className="text-gray-500 text-[11px] font-medium text-center px-4">
                  By confirming, the selected user will be assigned to the specified wards and mohallas for survey operations.
                </p>

                <div className="flex gap-4 pt-2">
                    <button onClick={() => setShowConfirmDialog(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all uppercase tracking-wider text-xs">CANCEL</button>
                    <button onClick={confirmAssignment} disabled={submitting} className="flex-[1.5] px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all uppercase tracking-wider text-xs disabled:opacity-50">{submitting ? "SAVING..." : "CONFIRM ASSIGNMENT"}</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UserAssignmentPage;
