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
      <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
        <div className="max-w-8xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-8">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">User <span className="text-blue-500">Assignment</span></h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Provision survey resources and spatial jurisdictions</p>
            </div>
          </div>

          <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
            <div className="p-8 border-b border-slate-800/50 bg-slate-800/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight uppercase italic">Configuration Matrix</h3>
                <p className="text-sm text-slate-500 font-black uppercase tracking-widest mt-0.5 italic">Define target parameters</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-slate-600 uppercase tracking-widest italic">Cycle: {lastRefreshed.toLocaleTimeString()}</span>
                <button type="button" onClick={handleRefresh} className="p-2 text-slate-400 hover:text-blue-400 bg-slate-800/50 rounded-xl border border-slate-700/50 transition-all active:scale-95">
                  <Loader2 className={`w-4 h-4 ${wardsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1 italic">Identity Type</label>
                  <Select value={userType} onValueChange={setUserType} required>
                    <SelectTrigger className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl h-14 px-6 text-slate-200 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
                      <SelectValue placeholder="CHOOSE" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161B26] border-slate-800 text-slate-300">
                      {USER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="focus:bg-blue-600/20 focus:text-blue-400 transition-colors">{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1 italic">Target Personnel</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser} required disabled={!userType}>
                    <SelectTrigger className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl h-14 px-6 text-slate-200 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-30">
                      <SelectValue placeholder="SELECT USER" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161B26] border-slate-800 text-slate-300">
                      {users.length === 0 ? <SelectItem value="none" disabled>No records found</SelectItem> : users.map((u: any) => (
                        <SelectItem key={u.userId} value={u.userId} className="focus:bg-blue-600/20 focus:text-blue-400 transition-colors">{u.name || u.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1 italic">Corporate Body (ULB)</label>
                  <Select value={selectedUlb} onValueChange={setSelectedUlb} required>
                    <SelectTrigger className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl h-14 px-6 text-slate-200 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
                      <SelectValue placeholder="SELECT ULB" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161B26] border-slate-800 text-slate-300">
                      {ulbs.map((ulb: any) => (
                        <SelectItem key={ulb.ulbId} value={ulb.ulbId} className="focus:bg-blue-600/20 focus:text-blue-400 transition-colors">{ulb.ulbName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1 italic">Regional Zone</label>
                  <Select value={selectedZone} onValueChange={setSelectedZone} required disabled={!selectedUlb}>
                    <SelectTrigger className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl h-14 px-6 text-slate-200 font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-30">
                      <SelectValue placeholder="SELECT ZONE" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161B26] border-slate-800 text-slate-300">
                      {zones.map((zone: any) => (
                        <SelectItem key={zone.zoneId} value={zone.zoneId} className="focus:bg-blue-600/20 focus:text-blue-400 transition-colors">Zone: {zone.zoneNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="px-1 flex items-center justify-between">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] italic">Wards Inventory</label>
                  </div>
                  <div className="bg-black/20 border border-slate-800/50 rounded-3xl overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto h-[400px]">
                      <table className="w-full text-left border-collapse sticky-header transition-all">
                        <thead className="bg-[#161B26] sticky top-0 z-10">
                          <tr className="border-b border-slate-800 text-[15px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-6 py-4 w-12 text-center">Opt</th>
                            <th className="px-6 py-4">Ward Entity</th>
                            <th className="px-6 py-4 text-center">Mohallas</th>
                            <th className="px-6 py-4 w-24">Density</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                          {wards.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-600 italic text-xs font-black uppercase tracking-widest opacity-20">Awaiting Regional Selection</td></tr>
                          ) : (
                            wards.map((ward: any) => {
                              const isFullyAssigned = ward.unassignedMohallas === 0;
                              return (
                                <tr key={ward.wardId} className={`hover:bg-blue-500/[0.02] transition-colors group ${selectedWards.includes(ward.wardId) ? 'bg-blue-500/[0.05]' : ''}`}>
                                  <td className="px-6 py-4 text-center">
                                    <input type="checkbox" checked={selectedWards.includes(ward.wardId)} onChange={(e) => { const checked = e.target.checked; setSelectedWards((prev) => checked ? [...prev, ward.wardId] : prev.filter((id) => id !== ward.wardId)); }} className="w-4 h-4 bg-slate-800 border-slate-700 rounded transition-all checked:bg-blue-600" />
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="text-slate-200 font-black text-sm uppercase tracking-tight">{ward.wardName}</span>
                                      <span className="text-blue-500/60 font-mono text-[12px] font-bold">W#{ward.newWardNumber}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center"><span className="text-sm font-black text-slate-400">{ward.unassignedMohallas}/{ward.totalMohallas}</span></td>
                                  <td className="px-6 py-4">
                                     {isFullyAssigned ? <span className="text-[12px] font-black text-emerald-500/60 bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10 uppercase tracking-tighter">Saturated</span> : <span className="text-[12px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded-full border border-blue-500/10 uppercase tracking-tighter">Available</span>}
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

                <div className="space-y-4">
                  <div className="px-1 flex items-center justify-between">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] italic">Mohallas Matrix</label>
                  </div>
                  <div className="bg-black/20 border border-slate-800/50 rounded-3xl overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto h-[400px]">
                      <table className="w-full text-left border-collapse transition-all">
                        <thead className="bg-[#161B26] sticky top-0 z-10">
                          <tr className="border-b border-slate-800 text-[15px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-6 py-4 w-12 text-center">Opt</th>
                            <th className="px-6 py-4">Locality Name</th>
                            <th className="px-6 py-4">Current Anchor</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                          {selectedWards.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-600 italic text-xs font-black uppercase tracking-widest opacity-20">Zero Proxies detected</td></tr>
                          ) : (
                            selectedWards.map((wardId) => {
                              const mIds = wardMohallaMap[wardId] || [];
                              const wardData = wards.find((w: any) => w.wardId === wardId);
                              return mIds.map((mohallaId) => {
                                const assignedUser = mohallaAssignments[wardId]?.[mohallaId];
                                const isAssigned = Boolean(assignedUser);
                                const mohalla = mohallas.find((m: any) => m.mohallaId === mohallaId);
                                return (
                                  <tr key={mohallaId} className={`hover:bg-blue-500/[0.02] transition-colors group ${isAssigned ? 'opacity-40 italic' : ''} ${selectedMohallas.includes(mohallaId) ? 'bg-blue-500/[0.05]' : ''}`}>
                                    <td className="px-6 py-4 text-center">
                                      <input type="checkbox" checked={selectedMohallas.includes(mohallaId)} onChange={(e) => { const checked = e.target.checked; setSelectedMohallas((prev) => checked ? [...prev, mohallaId] : prev.filter((id) => id !== mohallaId)); }} disabled={isAssigned} className="w-4 h-4 bg-slate-800 border-slate-700 rounded transition-all disabled:cursor-not-allowed" />
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-slate-200 font-black text-xs uppercase tracking-tight">{mohalla ? mohalla.mohallaName : mohallaId}</span>
                                        <span className="text-slate-500 text-[12px] font-bold">Ref: {wardData?.wardName}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4"><span className="text-sm font-bold text-slate-400">{assignedUser ? (assignedUser.name || assignedUser.username) : "SYSTEM_UNBOUND"}</span></td>
                                    <td className="px-6 py-4">{isAssigned ? <span className="text-[12px] font-black text-red-400/60 uppercase tracking-widest">Locked</span> : <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest">Open</span>}</td>
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

              <div className="flex justify-end pt-8">
                <button type="submit" disabled={submitting} className="px-12 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-[0.2em] text-xs active:scale-95 disabled:opacity-50 flex items-center gap-3">
                  {submitting && <Loader2 className="animate-spin w-4 h-4" />}
                  {submitting ? "PROVISIONING..." : "COMMIT ASSIGNMENT"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {showConfirmDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#161B26] border border-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
               <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-white/[0.01]">
                 <div>
                   <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Final Validation</h3>
                   <p className="text-sm text-slate-500 font-black uppercase tracking-widest mt-1 italic">Review deployment parameters</p>
                 </div>
                 <button onClick={() => setShowConfirmDialog(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                   <XCircle className="w-8 h-8" />
                 </button>
               </div>
               
               <div className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-800/20 p-6 rounded-3xl border border-slate-700/30">
                       <p className="text-lg font-black text-white capitalize">{users.find((u) => u.userId === pendingAssignment?.userId)?.name || "N/A"}</p>
                       <p className="text-sm font-bold text-blue-500/60 uppercase tracking-tighter mt-1">{pendingAssignment?.assignmentType} REGISTRY</p>
                    </div>
                    <div className="bg-slate-800/20 p-6 rounded-3xl border border-slate-700/30">
                       <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic mb-2"></p>
                       <p className="text-lg font-black text-white">{ulbs.find((u: any) => u.ulbId === selectedUlb)?.ulbName || "N/A"}</p>
                       <p className="text-sm font-bold text-slate-400/60 uppercase tracking-tighter mt-1">ZONE: {zones.find((z: any) => z.zoneId === selectedZone)?.zoneNumber || "N/A"}</p>
                    </div>
                  </div>

                  <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-500/10 max-h-40 overflow-y-auto">
                      <p className="text-[15px] font-black text-blue-400 uppercase tracking-widest italic mb-3">Target Wards/Mohallas ({selectedMohallas.length} Localities)</p>
                      <div className="flex flex-wrap gap-2">
                         {selectedWards.map((wardId) => {
                           const ward = wards.find((w: any) => w.wardId === wardId);
                           const mohallaIds = (wardMohallaMap[wardId] || []).filter(mid => selectedMohallas.includes(mid));
                           if (mohallaIds.length === 0) return null;
                           return (
                             <div key={wardId} className="flex flex-col gap-1 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50 min-w-[140px]">
                               <span className="text-sm font-black text-slate-500 uppercase tracking-tighter">WARD: {ward?.wardName || wardId}</span>
                               <span className="text-[15px] font-bold text-white italic">{mohallaIds.length} LOCALITIES</span>
                             </div>
                           );
                         })}
                      </div>
                  </div>

                  <p className="text-slate-500 text-xs font-medium italic text-center px-10">By confirming, you authorize the selected personnel to undertake jurisdictional operations within the specified spatial boundaries.</p>

                  <div className="flex gap-4 pt-4">
                      <button onClick={() => setShowConfirmDialog(false)} className="flex-1 px-8 py-5 bg-slate-800 text-slate-400 font-black rounded-3xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[11px] active:scale-95">ABORT</button>
                      <button onClick={confirmAssignment} disabled={submitting} className="flex-[2] px-8 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-900/40 hover:bg-blue-500 transition-all uppercase tracking-widest text-[11px] active:scale-95 disabled:opacity-50">{submitting ? "SYNCING..." : "CONFIRM DEPLOYMENT"}</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UserAssignmentPage;
