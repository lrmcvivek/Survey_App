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
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Assignment Management</h1>
              <p className="text-gray-500 text-sm mt-1">Manage user assignments to wards and localities</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm relative">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">User Assignments</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">List of all active and inactive assignments</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md">
                 <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Active: {data.assignments.filter((a: any) => a.isActive).length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Ward</th>
                    <th className="px-6 py-4">Mohallas</th>
                    <th className="px-6 py-4">Assigned By</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {data.assignments.map((a: any) => (
                    <tr key={a.assignmentId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                           <span className="text-gray-900 font-bold text-sm">{a.user?.name || a.user?.username || "N/A"}</span>
                           <span className="text-gray-500 text-[10px] font-bold uppercase">ID: {a.user?.userId?.slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 rounded-full border border-gray-200">
                           <span className="text-xs font-semibold text-gray-700">{a.ward?.wardName || "Not Assigned"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[200px] truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:max-w-none transition-all">
                           <span className="text-xs font-medium text-gray-600">
                             {a.mohallas ? a.mohallas.map((m: any) => m.mohallaName).join(", ") : "All"}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs font-medium text-gray-600">{a.assignedBy?.name || "System"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border tracking-wider uppercase ${
                          a.assignmentType === 'PRIMARY' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {a.assignmentType || 'SECONDARY'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all active:scale-95 ${
                              a.isActive 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                            }`}
                            onClick={() => handleToggleClick(a.assignmentId, a.isActive)}
                            disabled={mutationUpdate.isPending}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${a.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{a.isActive ? "Active" : "Inactive"}</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button
                           className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                           onClick={() => handleDeleteClick(a.assignmentId)}
                           title="Remove Assignment"
                         >
                           <Trash2 className="w-4 h-4" />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 w-full max-w-sm rounded-xl shadow-xl p-6 text-center animate-in fade-in zoom-in duration-200">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${pendingAction.type === 'delete' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                  {pendingAction.type === 'delete' ? <Trash2 className="w-8 h-8" /> : <ToggleRight className="w-8 h-8" />}
               </div>
               
               <div className="space-y-2 mb-6">
                 <h3 className="text-lg font-bold text-gray-900">
                    {pendingAction.type === 'delete' ? 'Delete Assignment?' : 'Change Status?'}
                 </h3>
                 <p className="text-gray-500 text-sm leading-relaxed">
                   {pendingAction.type === 'delete' 
                     ? "This will permanently remove the assignment for this user." 
                     : `Are you sure you want to change the status to ${pendingAction.isActive ? 'Active' : 'Inactive'}?`}
                 </p>
               </div>

               <div className="flex flex-col gap-2 relative z-[105]">
                  <button
                    onClick={handleConfirmAction}
                    disabled={mutationUpdate.isPending || mutationDelete.isPending}
                    className={`py-2 px-4 font-bold rounded-md transition-all text-sm disabled:opacity-50 ${
                       pendingAction.type === 'delete' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {mutationUpdate.isPending || mutationDelete.isPending ? "Processing..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => { setShowConfirmDialog(false); setPendingAction(null); }}
                    className="py-2 px-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-md hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
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
