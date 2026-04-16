"use client";
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterDataApi, surveyStatusApi, wardApi } from "@/lib/api";
import toast from "react-hot-toast";
import { XCircle, CheckCircle2, AlertTriangle, Search, ChevronDown, Activity } from "lucide-react";

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatusChangeModal({
  isOpen,
  onClose,
}: StatusChangeModalProps) {
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [wardZone, setWardZone] = useState<string>("");
  const [isWardDropdownOpen, setIsWardDropdownOpen] = useState(false);
  const [wardSearchTerm, setWardSearchTerm] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const wardDropdownRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data: wards = [] } = useQuery({
    queryKey: ["all-wards"],
    queryFn: masterDataApi.getAllWardsWithStatus,
    enabled: isOpen,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["ward-statuses"],
    queryFn: surveyStatusApi.getAllWardStatuses,
    enabled: isOpen,
  });

  const filteredWards = wards.filter((ward: any) =>
    `${ward.newWardNumber} - ${ward.wardName}`
      .toLowerCase()
      .includes(wardSearchTerm.toLowerCase())
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({
      wardId,
      wardStatusId,
    }: {
      wardId: string;
      wardStatusId: number;
    }) => wardApi.updateWardStatus(wardId, wardStatusId),
    onSuccess: () => {
      toast.success("Survey status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["wards-with-status"] });
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["mohallas"] });
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || "Failed to update status";
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (updateStatusMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["all-wards"] });
    }
  }, [updateStatusMutation.isSuccess, queryClient]);

  useEffect(() => {
    const fetchWardDetails = async () => {
      if (selectedWard) {
        try {
          const wardDetails = await masterDataApi.getWardWithZone(selectedWard);
          setWardZone(wardDetails.zone?.zoneName || "N/A");

          if (
            wardDetails.wardStatusMaps &&
            wardDetails.wardStatusMaps.length > 0
          ) {
            const activeStatus = wardDetails.wardStatusMaps[0];
            setCurrentStatus(activeStatus.status.statusName);
            setSelectedStatus(activeStatus.status.wardStatusId);
          } else {
            setCurrentStatus("Not Started");
            setSelectedStatus(null);
          }
        } catch (error) {
          setWardZone("N/A");
          setCurrentStatus("Unknown");
          setSelectedStatus(null);
        }
      } else {
        setWardZone("");
        setCurrentStatus("");
        setSelectedStatus(null);
      }
    };

    fetchWardDetails();
  }, [selectedWard, updateStatusMutation.isSuccess]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wardDropdownRef.current &&
        !wardDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWardDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClose = () => {
    setSelectedWard("");
    setSelectedStatus(null);
    setCurrentStatus("");
    setWardZone("");
    setWardSearchTerm("");
    setIsWardDropdownOpen(false);
    setShowConfirmation(false);
    onClose();
  };

  const handleWardSelect = (wardId: string, wardDisplayName: string) => {
    setSelectedWard(wardId);
    setWardSearchTerm(wardDisplayName);
    setIsWardDropdownOpen(false);
  };

  const handleSubmit = () => {
    if (!selectedWard || selectedStatus === null) {
      toast.error("Please select both ward and status");
      return;
    }
    setShowConfirmation(true);
  };

  const confirmSubmit = () => {
    if (!selectedWard || selectedStatus === null) {
      toast.error("Please select both ward and status");
      return;
    }

    updateStatusMutation.mutate({
      wardId: selectedWard,
      wardStatusId: selectedStatus,
    });
    setShowConfirmation(false);
  };

  const getSelectedWardDisplayName = () => {
    if (!selectedWard) return "";
    const ward = wards.find((w: any) => w.wardId === selectedWard);
    return ward ? `${ward.newWardNumber} - ${ward.wardName}` : "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-[#161B26] border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-10 border-b border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400">
                 <Activity className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-white tracking-tight">Survey Status</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 italic">Update lifecycle state</p>
              </div>
           </div>
           <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors">
             <XCircle className="w-7 h-7" />
           </button>
        </div>

        <div className="p-10 space-y-8">
          {/* Ward Search */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Target Ward Identity</label>
            <div className="relative" ref={wardDropdownRef}>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Registry lookup..."
                  value={wardSearchTerm}
                  onChange={(e) => {
                    setWardSearchTerm(e.target.value);
                    setIsWardDropdownOpen(true);
                    if (!e.target.value) setSelectedWard("");
                  }}
                  onFocus={() => setIsWardDropdownOpen(true)}
                  className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-14 py-5 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold"
                />
                <ChevronDown className={`absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-transform ${isWardDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isWardDropdownOpen && (
                <div className="absolute z-20 w-full mt-3 bg-[#1F2937] border border-slate-700/50 rounded-2xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden p-2 space-y-1 scrollbar-hide">
                  {filteredWards.length > 0 ? (
                    filteredWards.map((ward: any) => (
                      <div
                        key={ward.wardId}
                        className="px-6 py-4 hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors group"
                        onClick={() => handleWardSelect(ward.wardId, `${ward.newWardNumber} - ${ward.wardName}`)}
                      >
                        <div className="font-black text-sm text-slate-200 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                          {ward.newWardNumber} - {ward.wardName}
                        </div>
                        {ward.description && (
                          <div className="text-[10px] font-bold text-slate-500 italic truncate mt-0.5">
                            {ward.description}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center text-slate-500 italic text-xs">
                      No matching records detected
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6 items-start">
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Current State</label>
                <div className="px-6 py-4 bg-slate-800/20 rounded-2xl border border-slate-800/50 text-sm font-black text-slate-300 italic">
                   {currentStatus || "Registry Offline"}
                </div>
             </div>
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Zone Anchor</label>
                <div className="px-6 py-4 bg-slate-800/20 rounded-2xl border border-slate-800/50 text-sm font-black text-slate-300 italic">
                   {wardZone || "N/A"}
                </div>
             </div>
          </div>

          {/* New Status */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Transition To</label>
            <div className="relative group">
               <select
                 className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-5 text-sm font-black text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all cursor-pointer appearance-none"
                 value={selectedStatus || ""}
                 onChange={(e) => setSelectedStatus(Number(e.target.value) || null)}
               >
                 <option value="" className="bg-slate-900">Choose state transition...</option>
                 {statuses.map((status: any) => (
                   <option key={status.wardStatusId} value={status.wardStatusId} className="bg-slate-900">
                     {status.statusName}
                   </option>
                 ))}
               </select>
               <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-6">
            <button
              className="flex-1 px-8 py-5 bg-slate-800 text-slate-400 font-black rounded-3xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[11px] active:scale-95"
              onClick={handleClose}
              disabled={updateStatusMutation.isPending}
            >
              Abort
            </button>
            <button
              className="flex-[2] px-8 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all uppercase tracking-widest text-[11px] disabled:opacity-50 active:scale-95"
              onClick={handleSubmit}
              disabled={updateStatusMutation.isPending || !selectedWard || selectedStatus === null}
            >
              {updateStatusMutation.isPending ? "Connecting..." : "Confirm Update"}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-[#161B26] border border-slate-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
               <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">Confirm Change?</h3>
              <div className="space-y-2 text-left bg-slate-800/40 p-5 rounded-2xl border border-slate-800/50">
                 <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className="text-slate-500">Identity</span>
                    <span className="text-blue-400">{getSelectedWardDisplayName()}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest pt-2 border-t border-slate-700/50">
                    <span className="text-slate-500">Transition</span>
                    <span className="text-emerald-400">{statuses.find((s: any) => s.wardStatusId === selectedStatus)?.statusName}</span>
                 </div>
              </div>
              <p className="text-slate-400 text-xs font-medium italic">
                State transition for this topological unit will affect all child records and survey workflows.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                className="flex-1 px-6 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px]"
                onClick={() => setShowConfirmation(false)}
                disabled={updateStatusMutation.isPending}
              >
                Go Back
              </button>
              <button
                className="flex-[2] px-6 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-900/20 hover:bg-red-500 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                onClick={confirmSubmit}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? "Syncing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
