"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Loading from "@/components/ui/loading";
import toast from "react-hot-toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { masterDataApi, qcApi } from "@/lib/api";

const QC_STATUS_OPTIONS = [
  { value: "", label: "All Records" },
  { value: "SURVEY_QC_DONE", label: "Survey QC Done" },
  { value: "IN_OFFICE_QC_DONE", label: "In-Office QC Done" },
  { value: "RI_QC_DONE", label: "RI QC Done" },
  { value: "FINAL_QC_DONE", label: "Final QC Done" },
];

// Keep compatibility with previous code, but prefer using qcApi which
// centralizes baseURL and JWT headers. Avoid building URLs with an
// undefined baseUrl which was the cause of the 'undefined' segment.

const PAGE_SIZE = 10;

function PropertyListResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  // Read-only state for display only
  const [qcStatusFilter, setQcStatusFilter] = useState<string>("");
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    fetchProperties();
    fetchWards();
    // eslint-disable-next-line
  }, [
    ulbId,
    zoneId,
    wardId,
    mohallaId,
    propertyTypeId,
    surveyTypeId,
    fromDate,
    toDate,
    search,
    page,
    qcStatusFilter,
  ]);

  const fetchProperties = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (ulbId) params.append("ulbId", ulbId);
      if (zoneId) params.append("zoneId", zoneId);
      if (wardId) params.append("wardId", wardId);
      if (mohallaId) params.append("mohallaId", mohallaId);
      if (propertyTypeId) params.append("propertyTypeId", propertyTypeId);
      if (surveyTypeId) params.append("surveyTypeId", surveyTypeId);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      if (search) params.append("search", search);
      if (qcStatusFilter) params.append("qcStatusFilter", qcStatusFilter);
      params.append("skip", ((page - 1) * PAGE_SIZE).toString());
      params.append("take", PAGE_SIZE.toString());
      // Use qcApi.getMISReports for read-only MIS reports
      const paramObj: any = {};
      params.forEach((value, key) => {
        paramObj[key] = value;
      });
      const data = await qcApi.getMISReports(paramObj);
      setProperties(data || []);
      setTotal(
        data.length < PAGE_SIZE
          ? (page - 1) * PAGE_SIZE + data.length
          : page * PAGE_SIZE + 1,
      );
    } catch (e) {
      setError("Error fetching property list");
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

  const surveyTypeHeading =
    surveyTypeId === "1"
      ? "Property List (Residential)"
      : surveyTypeId === "2"
        ? "Property List (Non-Residential)"
        : surveyTypeId === "3"
          ? "Property List (Mix)"
          : "Property List (QC Results)";

  const handleQcStatusFilterChange = (value: string) => {
    setQcStatusFilter(value);
    // Refetch data with new filter
    fetchProperties();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("page", newPage.toString());
    router.replace(`/mis-reports/property-list/results?${params.toString()}`);
    console.log(params.toString());
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{surveyTypeHeading}</h1>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Filter by QC Status:
            </label>
            <select
              className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 min-w-[200px]"
              value={qcStatusFilter}
              onChange={(e) => handleQcStatusFilterChange(e.target.value)}
            >
              {QC_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-gray-50 border-b border-gray-200">
                <TableRow>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Map ID</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">GIS ID</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Match Status</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Old Prop #</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Property Type</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Match/UnMatch</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Floors</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Ward</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">New Ward</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Mohalla</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Owner Name</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Father/Husband</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Respondent</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">QC Status</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">QC Level</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Error Type</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">GIS Remark</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Survey Remark</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Road Type</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Plot Area</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">GIS Plot Area</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">RI Remark</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Entry Date</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap px-4 py-3">Assess. Remark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={24} className="text-center py-12 text-gray-500 font-medium">
                      No records found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((prop) => {
                    const wardName =
                      wards.find(
                        (w) =>
                          w.newWardNumber === prop.locationDetails?.newWardNumber,
                      )?.wardName || "N/A";
                    return (
                      <TableRow
                        key={prop.surveyUniqueCode}
                        className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <TableCell className="px-4 py-3 text-xs font-semibold text-gray-700">{prop.mapId || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs font-semibold text-gray-700">{prop.gisId || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600">{prop.surveyMatchStatus || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600">{prop.oldPropertyNumber || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600">
                          {prop.locationDetails?.propertyType?.propertyTypeName?.trim() || "N/A"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600">{prop.matchStatus || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 text-center">
                          {(() => {
                            const resCount = Array.isArray(prop.residentialPropertyAssessments) ? prop.residentialPropertyAssessments.length : 0;
                            const nonResCount = Array.isArray(prop.nonResidentialPropertyAssessments) ? prop.nonResidentialPropertyAssessments.length : 0;
                            const totalFloors = resCount + nonResCount;
                            return totalFloors === 0 ? 1 : totalFloors;
                          })()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{prop.ward?.wardName || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600">{wardName}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{prop.mohalla?.mohallaName || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs font-medium text-gray-900 whitespace-nowrap">{prop.ownerDetails?.ownerName || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{prop.ownerDetails?.fatherHusbandName || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{prop.propertyDetails?.respondentName || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prop.currentQCStatus === "IN_OFFICE_QC_DONE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : prop.currentQCStatus === "SURVEY_QC_DONE"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : prop.currentQCStatus?.includes("REVERTED")
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : "bg-gray-50 text-gray-600 border border-gray-100"
                            }`}
                          >
                            {prop.displayQCLevel || "Survey Pending"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 text-center">{prop.currentQCLevel || 0}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600">{prop.qcRecords?.[0]?.errorType || "None"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 max-w-48 truncate">{prop.qcRecords?.[0]?.gisTeamRemark || "-"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 max-w-48 truncate">{prop.qcRecords?.[0]?.surveyTeamRemark || "-"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{prop.locationDetails?.roadType?.roadTypeName || "N/A"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600">{prop.otherDetails?.totalPlotArea ?? "-"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600">{prop.otherDetails?.plotAreaGIS || "-"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 max-w-48 truncate">{prop.qcRecords?.[0]?.RIRemark || "-"}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {prop.entryDate ? new Date(prop.entryDate).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-gray-600 max-w-48 truncate">{prop.assessmentRemark || "-"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertyListResultsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PropertyListResultsContent />
    </Suspense>
  );
}
