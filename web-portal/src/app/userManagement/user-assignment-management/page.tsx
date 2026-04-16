"use client";
import { assignmentApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import toast from "react-hot-toast";
import { useState } from "react";

// --- UserAssignments Management Division ---
function UserAssignmentsTable({
  ulbId,
  zoneId,
  wardId,
}: {
  ulbId?: string;
  zoneId?: string;
  wardId?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "activate" | "deactivate" | "delete";
    assignmentId: string;
    isActive?: boolean;
  } | null>(null);
  // For demo, fetch all assignments for all users (could be filtered by ULB/Zone/Ward)
  const { data, isLoading, error } = useQuery({
    queryKey: ["allAssignments"],
    queryFn: assignmentApi.getAllAssignments,
  });

  const mutationUpdate = useMutation({
    mutationFn: ({
      assignmentId,
      isActive,
    }: {
      assignmentId: string;
      isActive: boolean;
    }) => assignmentApi.updateAssignmentStatus(assignmentId, isActive),
    onSuccess: () => {
      // Invalidate multiple query keys to refresh all related data
      queryClient.invalidateQueries({
        queryKey: ["allAssignments", ulbId, zoneId, wardId],
      });
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["mohallas"] });
      queryClient.invalidateQueries({ queryKey: ["available-wards"] });
      queryClient.invalidateQueries({ queryKey: ["all-wards"] });

      // Trigger global update notification
      localStorage.setItem("assignment_updated", Date.now().toString());
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "assignment_updated",
          newValue: Date.now().toString(),
        })
      );

      toast.success("Assignment status updated successfully", {
        position: "top-right",
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to update assignment status.",
        { position: "top-right" }
      );
    },
  });
  const mutationDelete = useMutation({
    mutationFn: (assignmentId: string) =>
      assignmentApi.deleteAssignment(assignmentId),
    onSuccess: () => {
      // Invalidate multiple query keys to refresh all related data
      queryClient.invalidateQueries({
        queryKey: ["allAssignments", ulbId, zoneId, wardId],
      });
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["mohallas"] });
      queryClient.invalidateQueries({ queryKey: ["available-wards"] });
      queryClient.invalidateQueries({ queryKey: ["all-wards"] });

      // Trigger global update notification
      localStorage.setItem("assignment_updated", Date.now().toString());
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "assignment_updated",
          newValue: Date.now().toString(),
        })
      );

      // Show success message
      toast.success("Assignment deleted successfully. Ward is now available for reassignment", {
        position: "top-right",
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to delete assignment.",
        { position: "top-right" }
      );
    },
  });

  // Handle confirmation dialog actions
  const handleConfirmAction = () => {
    if (!pendingAction) return;
    
    if (pendingAction.type === "delete") {
      mutationDelete.mutate(pendingAction.assignmentId);
    } else if (pendingAction.type === "activate" || pendingAction.type === "deactivate") {
      mutationUpdate.mutate({
        assignmentId: pendingAction.assignmentId,
        isActive: pendingAction.type === "activate",
      });
    }
    
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const handleToggleClick = (assignmentId: string, currentIsActive: boolean) => {
    const actionType = currentIsActive ? "deactivate" : "activate";
    setPendingAction({
      type: actionType,
      assignmentId,
      isActive: !currentIsActive,
    });
    setShowConfirmDialog(true);
  };

  const handleDeleteClick = (assignmentId: string) => {
    setPendingAction({
      type: "delete",
      assignmentId,
    });
    setShowConfirmDialog(true);
  };

  if (isLoading) return <div className="mt-8">Loading assignments...</div>;
  if (error)
    return <div className="mt-8 text-red-500">Error loading assignments</div>;
  if (!data || !data.assignments || data.assignments.length === 0)
    return <div className="mt-8">No assignments found.</div>;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
        <div className="max-w-8xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50 pb-8">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Assignment <span className="text-blue-500">Registry</span></h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Manage operational bindings and personnel jurisdictions</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-slate-800/50 bg-slate-800/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight uppercase italic">Operational Matrix</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5 italic">Real-time assignment logs</p>
              </div>
              <div className="bg-blue-600/5 border border-blue-500/10 px-4 py-2 rounded-xl">
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active nodes: {data.assignments.filter((a: any) => a.isActive).length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/20 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="px-8 py-6">Personnel Entity</th>
                    <th className="px-8 py-6">Spatial Anchor (Ward)</th>
                    <th className="px-8 py-6">Locality Cluster</th>
                    <th className="px-8 py-6">Authority</th>
                    <th className="px-8 py-6">Protocol</th>
                    <th className="px-8 py-6 text-center">Operational Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {data.assignments.map((a: any) => (
                    <tr key={a.assignmentId} className="hover:bg-blue-500/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-0.5">
                           <span className="text-white font-black text-sm uppercase tracking-tight">{a.user?.name || a.user?.username || "N/A"}</span>
                           <span className="text-slate-500 text-[9px] font-black uppercase">ID: {a.user?.userId?.slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                           <span className="text-[10px] font-black text-blue-400 uppercase italic">{a.ward?.wardName || "SYSTEM_UNBOUND"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="max-w-[200px] truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:max-w-none transition-all">
                           <span className="text-[10px] font-bold text-slate-400 italic">
                             {a.mohallas ? a.mohallas.map((m: any) => m.mohallaName).join(", ") : "UNMAPPED"}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{a.assignedBy?.name || "ROOT"}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 text-[9px] font-black rounded-full border tracking-widest ${
                          a.assignmentType === 'PRIMARY' 
                            ? 'bg-blue-400/5 text-blue-400 border-blue-400/20' 
                            : 'bg-indigo-400/5 text-indigo-400 border-indigo-400/20'
                        }`}>
                          {a.assignmentType || 'SEC_OPS'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <button
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all active:scale-95 ${
                              a.isActive 
                                ? "bg-emerald-400/5 border-emerald-400/20 text-emerald-400" 
                                : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                            }`}
                            onClick={() => handleToggleClick(a.assignmentId, a.isActive)}
                            disabled={mutationUpdate.isPending}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${a.isActive ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-600"}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{a.isActive ? "Online" : "Offline"}</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button
                           className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                           onClick={() => handleDeleteClick(a.assignmentId)}
                         >
                           <Trash2 size={16} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmDialog && pendingAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#161B26] border border-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-300 relative overflow-hidden text-center">
               <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 ${pendingAction.type === 'delete' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {pendingAction.type === 'delete' ? <Trash2 className="w-10 h-10" /> : <ToggleRight className="w-10 h-10" />}
               </div>
               
               <div className="space-y-3 mb-10">
                 <h3 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">
                    {pendingAction.type === 'delete' ? 'Decommission node?' : 'Override Status?'}
                 </h3>
                 <p className="text-slate-400 font-medium italic text-sm">
                   {pendingAction.type === 'delete' 
                     ? "This will permanently sever the operational link. The jurisdiction will return to unassigned status." 
                     : `Commit status shift to ${pendingAction.isActive ? 'ONLINE' : 'OFFLINE'} protocol?`}
                 </p>
               </div>

               <div className="flex gap-4">
                  <button
                    onClick={() => { setShowConfirmDialog(false); setPendingAction(null); }}
                    className="flex-1 px-6 py-4 bg-slate-800 text-slate-300 font-black rounded-[1.5rem] hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] active:scale-95"
                  >
                    ABORT
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    disabled={mutationUpdate.isPending || mutationDelete.isPending}
                    className={`flex-1 px-6 py-4 font-black rounded-[1.5rem] shadow-xl transition-all uppercase tracking-widest text-[10px] active:scale-95 disabled:opacity-50 ${
                       pendingAction.type === 'delete' ? 'bg-red-600 text-white shadow-red-900/20 hover:bg-red-500' : 'bg-blue-600 text-white shadow-blue-900/20 hover:bg-blue-500'
                    }`}
                  >
                    {mutationUpdate.isPending || mutationDelete.isPending ? "SYNCING..." : "CONFIRM"}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function UserAssignmentManagementPage() {
  return (
      <UserAssignmentsTable />
  );
}
