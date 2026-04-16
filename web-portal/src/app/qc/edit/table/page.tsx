"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Loading from "@/components/ui/loading";
import toast from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import {
  Pencil,
  Check,
  X,
  Trash2,
  Map,
  Users,
  Calendar,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
  AlertCircle
} from "lucide-react";
import { qcApi, masterDataApi } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";

const ERROR_TYPE_OPTIONS = [
  { value: "NONE", label: "Clean" },
  { value: "MISSING", label: "Missing" },
  { value: "DUPLICATE", label: "Duplicate" },
  { value: "OTHER", label: "Other" },
];

const PAGE_SIZE = 10;

function QCEditTableContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Read all filters from URL
  const ulbId = searchParams.get("ulbId") || "";
  const zoneId = searchParams.get("zoneId") || "";
  const wardId = searchParams.get("wardId") || "";
  const mohallaId = searchParams.get("mohallaId") || "";
  const propertyTypeId = searchParams.get("propertyTypeId") || "";
  const surveyTypeId = searchParams.get("surveyTypeId") || "";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const search = searchParams.get("search") || "";
  const qcDone = searchParams.get("qcDone") || "ALL";
  const userRole = searchParams.get("userRole") || user?.role || "";
  const qcLevel = parseInt(searchParams.get("qcLevel") || "1", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // For inline edits
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [errorTypes, setErrorTypes] = useState<{ [key: string]: string }>({});
  const [gisRemarks, setGisRemarks] = useState<{ [key: string]: string }>({});
  const [surveyTeamRemarks, setSurveyTeamRemarks] = useState<{ [key: string]: string; }>({});
  const [riRemarks, setRiRemarks] = useState<{ [key: string]: string }>({});
  const [assessmentRemarks, setAssessmentRemarks] = useState<{ [key: string]: string; }>({});
  const [plotAreaGIS, setPlotAreaGIS] = useState<{ [key: string]: string }>({});
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    fetchProperties();
    fetchWards();
  }, [ulbId, zoneId, wardId, mohallaId, propertyTypeId, surveyTypeId, fromDate, toDate, search, page, qcDone]);

  const fetchProperties = async () => {
    setLoading(true);
    setError("");
    try {
      const paramObj: any = {
        ulbId, zoneId, wardId, mohallaId, propertyTypeId, surveyTypeId,
        fromDate, toDate, search, qcDone,
        skip: ((page - 1) * PAGE_SIZE).toString(),
        take: PAGE_SIZE.toString(),
        userRole,
        qcLevel: qcLevel.toString(),
      };

      const data = await qcApi.getPropertyList(paramObj);
      setProperties(data || []);
      setTotal(data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + data.length : page * PAGE_SIZE + 1);
    } catch (e) {
      setError("Compliance synchronization sync failure. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWards = async () => {
    try {
      const data = await masterDataApi.getAllWards();
      setWards(data || []);
    } catch {
      setWards([]);
    }
  };

  const surveyTypeLabel = () => {
    if (surveyTypeId === "1") return "Residential";
    if (surveyTypeId === "2") return "Non-Residential";
    if (surveyTypeId === "3") return "Mixed-Use";
    return "Universal";
  };

  const handleEdit = (surveyUniqueCode: string) => {
    window.open(`/qc/edit/${surveyUniqueCode}?surveyTypeId=${surveyTypeId}&userRole=${userRole}&qcLevel=${qcLevel}`, "_blank");
  };

  const handleQCAction = async (prop: any, action: "APPROVED" | "REJECTED") => {
    try {
      setLoading(true);
      const surveyUniqueCode = prop.surveyUniqueCode;
      const payload = {
        updateData: {
          assessmentRemark: assessmentRemarks[surveyUniqueCode] ?? prop.assessmentRemark ?? "",
          plotAreaGIS: plotAreaGIS[surveyUniqueCode] ?? prop.otherDetails?.plotAreaGIS ?? "",
        },
        qcLevel,
        qcStatus: action,
        reviewedById: user?.userId || "",
        remarks: remarks[surveyUniqueCode] || "",
        errorType: errorTypes[surveyUniqueCode] || prop.qcRecords?.[0]?.errorType || "NONE",
        gisTeamRemark: gisRemarks[surveyUniqueCode] ?? prop.qcRecords?.[0]?.gisTeamRemark ?? "",
        surveyTeamRemark: surveyTeamRemarks[surveyUniqueCode] ?? prop.qcRecords?.[0]?.surveyTeamRemark ?? "",
        RIRemark: riRemarks[surveyUniqueCode] ?? prop.qcRecords?.[0]?.RIRemark ?? "",
      };

      await qcApi.updateSurveyQC(surveyUniqueCode, payload);
      toast.success(`Identity established as ${action.toLowerCase()}`);
      fetchProperties();
    } catch (e) {
      toast.error(`Verification process failed for ${action.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (prop: any) => {
    if (!confirm(`CRITICAL: Redundant ID detected?\n\nGIS: ${prop.gisId}\nThis record will be purged from active processing.`)) return;
    try {
      setLoading(true);
      await qcApi.updateSurveyQC(prop.surveyUniqueCode, {
        updateData: {},
        qcLevel,
        qcStatus: "REJECTED",
        reviewedById: user?.userId || "",
        remarks: "Redundancy termination triggered.",
        errorType: "DUPLICATE",
        gisTeamRemark: "Manual purge requested.",
        surveyTeamRemark: "",
        RIRemark: "",
      });
      toast.success("Redundant record purged.");
      fetchProperties();
    } catch (e) {
      toast.error("Termination failure.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("page", newPage.toString());
    router.replace(`/qc/edit/table?${params.toString()}`);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-32">
        {/* Header Unit */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-md border border-gray-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                QC Level {qcLevel}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-md border border-blue-100">
                {surveyTypeLabel()} Surveys
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              QC <span className="text-blue-600">Verification</span>
            </h1>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              Review and verify submitted survey records
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
                <div className="text-right">
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Total Records</p>
                   <p className="text-xl font-bold text-gray-900 leading-none">{total}</p>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-right">
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Page Progress</p>
                   <p className="text-xl font-bold text-blue-600 leading-none">{properties.length}/{PAGE_SIZE}</p>
                </div>
             </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-xs font-black rounded-2xl border border-red-100 flex items-center gap-3 animate-pulse uppercase tracking-widest italic">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Dense Action Matrix */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[2400px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">Survey ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Property Type & Old ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Measurements</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Owner Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Adjustments</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_10px_rgba(0,0,0,0.02)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center text-gray-500 font-semibold text-sm uppercase tracking-wider">
                      No Records Found
                    </td>
                  </tr>
                ) : (
                  properties.map((prop) => {
                    const sc = prop.surveyUniqueCode;
                    return (
                      <tr key={sc} className="group hover:bg-gray-50/50 transition-colors">
                        {/* Identity Col */}
                        <td className="px-6 py-5 sticky left-0 bg-white group-hover:bg-gray-50 transition-colors z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                           <div className="space-y-1">
                              <span className="text-sm font-bold text-gray-900 block">#{sc}</span>
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">GIS: {prop.gisId || "N/A"}</span>
                           </div>
                        </td>

                        {/* Status Col */}
                        <td className="px-6 py-5">
                           <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${prop.surveyMatchStatus === 'MATCH' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                <span className={`text-xs font-bold uppercase tracking-wider ${prop.surveyMatchStatus === 'MATCH' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {prop.surveyMatchStatus || "PENDING"}
                                </span>
                             </div>
                             <button 
                               onClick={() => handleEdit(sc)}
                               className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                             >
                               <Pencil className="w-3.5 h-3.5" />
                               View / Edit
                             </button>
                           </div>
                        </td>

                        {/* Type & GIS */}
                        <td className="px-6 py-5 text-sm">
                           <div className="space-y-1">
                              <p className="text-gray-900 font-semibold">{prop.locationDetails?.propertyType?.propertyTypeName || "Generic"}</p>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Old ID: {prop.oldPropertyNumber || "NA"}</p>
                           </div>
                        </td>

                        {/* Levels & Measurements */}
                        <td className="px-6 py-5">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <span className="text-xs font-bold text-gray-500 uppercase">Floors</span>
                                 <p className="text-sm font-semibold text-gray-900">{Array.isArray(prop.residentialPropertyAssessments) ? prop.residentialPropertyAssessments.length + (prop.nonResidentialPropertyAssessments?.length || 0) : 1}</p>
                              </div>
                              <div className="space-y-1">
                                 <span className="text-xs font-bold text-gray-500 uppercase">Plot Area GIS</span>
                                 <input
                                   type="text"
                                   placeholder="0.00"
                                   className="w-16 bg-gray-50 border border-gray-200 rounded text-xs font-semibold px-2 py-1 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none"
                                   value={plotAreaGIS[sc] ?? prop.otherDetails?.plotAreaGIS ?? ""}
                                   onChange={(e) => setPlotAreaGIS({...plotAreaGIS, [sc]: e.target.value})}
                                 />
                              </div>
                           </div>
                        </td>

                        {/* Location Context */}
                        <td className="px-6 py-5 text-sm text-gray-700">
                           <div className="space-y-1">
                              <p className="font-semibold">Ward {prop.locationDetails?.newWardNumber || "0"} - {prop.ward?.wardName || "Core"}</p>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{prop.mohalla?.mohallaName || "Urban Sector"}</p>
                           </div>
                        </td>

                        {/* Ownership Metadata */}
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-100">
                                 {(prop.ownerDetails?.ownerName || "U")[0].toUpperCase()}
                              </div>
                              <div className="space-y-0.5">
                                 <p className="text-sm font-semibold text-gray-900 leading-tight">{prop.ownerDetails?.ownerName || "Unknown Custodian"}</p>
                                 <p className="text-xs font-medium text-gray-500">{prop.ownerDetails?.fatherHusbandName || "No Father/Husband Name"}</p>
                              </div>
                           </div>
                        </td>

                        {/* Inline Adjustments */}
                        <td className="px-6 py-5">
                           <div className="space-y-3">
                              <div className="space-y-1">
                                 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Error Type</span>
                                 <select
                                   className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold px-3 py-1.5 text-gray-700 focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
                                   value={errorTypes[sc] || prop.qcRecords?.[0]?.errorType || "NONE"}
                                   onChange={(e) => setErrorTypes({...errorTypes, [sc]: e.target.value})}
                                 >
                                   {ERROR_TYPE_OPTIONS.map((opt) => (
                                     <option key={opt.value} value={opt.value}>{opt.label}</option>
                                   ))}
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">GIS Team Remark</span>
                                 <input
                                   type="text"
                                   placeholder="Remarks..."
                                   className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold px-3 py-1.5 text-gray-700 focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none"
                                   value={gisRemarks[sc] ?? prop.qcRecords?.[0]?.gisTeamRemark ?? ""}
                                   onChange={(e) => setGisRemarks({...gisRemarks, [sc]: e.target.value})}
                                 />
                              </div>
                           </div>
                        </td>

                        {/* Audit Remarks */}
                        <td className="px-6 py-5">
                           <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Surveyor note..."
                                  className="w-64 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold px-3 py-1.5 text-gray-700 focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none"
                                  value={surveyTeamRemarks[sc] ?? prop.qcRecords?.[0]?.surveyTeamRemark ?? ""}
                                  onChange={(e) => setSurveyTeamRemarks({...surveyTeamRemarks, [sc]: e.target.value})}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Assessment remark..."
                                  className="w-64 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold px-3 py-1.5 text-gray-700 focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none"
                                  value={assessmentRemarks[sc] ?? prop.assessmentRemark ?? ""}
                                  onChange={(e) => setAssessmentRemarks({...assessmentRemarks, [sc]: e.target.value})}
                                />
                              </div>
                           </div>
                        </td>

                        {/* Verdict Action */}
                        <td className="px-6 py-5 sticky right-0 bg-white group-hover:bg-gray-50 transition-colors z-10 shadow-[-2px_0_10px_rgba(0,0,0,0.02)]">
                           <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleQCAction(prop, "APPROVED")}
                                className="w-full py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleQCAction(prop, "REJECTED")}
                                  className="flex-1 py-1.5 border border-red-200 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                                <button
                                  onClick={() => handleDelete(prop)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Controls */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Showing Page {page} of {totalPages || 1}
             </p>
             
             {totalPages > 1 && (
               <div className="flex items-center gap-2">
                  <button 
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1 px-2">
                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                       const p = i + 1;
                       return (
                         <button
                           key={p}
                           onClick={() => handlePageChange(p)}
                           className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${p === page ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                         >
                           {p}
                         </button>
                       );
                     })}
                     {totalPages > 5 && <span className="text-gray-400 px-1 font-bold">...</span>}
                     {totalPages > 5 && (
                       <button
                         onClick={() => handlePageChange(totalPages)}
                         className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${totalPages === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                       >
                         {totalPages}
                       </button>
                     )}
                  </div>
                  <button 
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
               </div>
             )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function QCEditTablePage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <QCEditTableContent />
    </Suspense>
  );
}
