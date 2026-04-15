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
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4">User Assignments Management</h2>
      <div className="overflow-x-auto bg-black rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">
                Surveyor Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">
                Ward Assigned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">
                Mohallas Assigned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">
                Assigned By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-blue-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-blue-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-black divide-y divide-gray-800">
            {data.assignments.map((a: any) => (
              <tr key={a.assignmentId} className="hover:bg-gray-900 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {a.user?.name || a.user?.username || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {a.ward?.wardName || "-"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300 max-w-xs truncate" title={a.mohallas ? a.mohallas.map((m: any) => m.mohallaName).join(", ") : a.mohallaIds ? a.mohallaIds.join(", ") : "-"}>
                    {a.mohallas
                      ? a.mohallas.map((m: any) => m.mohallaName).join(", ")
                      : a.mohallaIds
                      ? a.mohallaIds.join(", ")
                      : "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {a.assignedBy?.name || a.assignedBy?.username || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    a.assignmentType === 'PRIMARY' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                    {a.assignmentType || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    className={`inline-flex items-center gap-2 cursor-pointer transition-all ${
                      mutationUpdate.isPending &&
                      mutationUpdate.variables?.assignmentId === a.assignmentId
                        ? "opacity-50 pointer-events-none"
                        : "hover:scale-110"
                    }`}
                    onClick={() => handleToggleClick(a.assignmentId, a.isActive)}
                    title={a.isActive ? "Deactivate" : "Activate"}
                    disabled={mutationUpdate.isPending}
                  >
                    {mutationUpdate.isPending &&
                    mutationUpdate.variables?.assignmentId === a.assignmentId ? (
                      <span className="loader mr-2" />
                    ) : a.isActive ? (
                      <ToggleRight className="text-green-500 w-6 h-6" />
                    ) : (
                      <ToggleLeft className="text-gray-500 w-6 h-6" />
                    )}
                    <span className={`text-sm font-semibold ${
                      a.isActive ? "text-green-500" : "text-gray-500"
                    }`}>
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-3">
                    {/* Edit action could open a modal for reassignment */}
                    {/* <button 
                      className="text-blue-400 hover:text-blue-300 transition-colors" 
                      title="Edit Assignment"
                      onClick={() => toast.info("Edit feature coming soon", { position: "top-right" })}
                    >
                      <Pencil size={18} />
                    </button> */}
                    <button
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Assignment"
                      onClick={() => handleDeleteClick(a.assignmentId)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white text-black rounded-lg p-6 w-[500px] shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-red-600">
              {pendingAction.type === "delete" 
                ? "Confirm Deletion" 
                : pendingAction.type === "activate"
                ? "Confirm Activation"
                : "Confirm Deactivation"}
            </h3>
            
            <div className="mb-6 space-y-3">
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm">
                  <strong className="text-gray-700">Action:</strong>{" "}
                  <span className="ml-2 font-semibold capitalize">
                    {pendingAction.type}
                  </span>
                </p>
              </div>

              {pendingAction.type !== "delete" && (
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="text-sm">
                    <strong className="text-gray-700">New Status:</strong>{" "}
                    <span className={`ml-2 font-semibold ${
                      pendingAction.isActive ? "text-green-600" : "text-gray-600"
                    }`}>
                      {pendingAction.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              )}
              
              {pendingAction.type === "delete" && (
                <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Warning:</strong> This action will permanently remove 
                    this assignment and make the ward available for reassignment.
                  </p>
                </div>
              )}
            </div>
            
            <p className="mb-6 text-gray-700 font-medium">
              {pendingAction.type === "delete"
                ? "Are you sure you want to delete this assignment? This action cannot be undone."
                : pendingAction.type === "activate"
                ? "Are you sure you want to activate this assignment?"
                : "Are you sure you want to deactivate this assignment?"}
            </p>
            
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="px-6 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors font-medium"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingAction(null);
                }}
                disabled={mutationUpdate.isPending || mutationDelete.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-6 py-2 rounded text-white transition-colors font-medium disabled:opacity-50 ${
                  pendingAction.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={handleConfirmAction}
                disabled={mutationUpdate.isPending || mutationDelete.isPending}
              >
                {mutationUpdate.isPending || mutationDelete.isPending
                  ? "Processing..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserAssignmentManagementPage() {
  return (
    <MainLayout>
      <UserAssignmentsTable />
    </MainLayout>
  );
}
