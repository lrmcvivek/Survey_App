"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Loading from "@/components/ui/loading";
import toast from "react-hot-toast";
import { qcApi } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";

const ERROR_TYPE_OPTIONS = [
  { value: "MISSING", label: "Missing" },
  { value: "DUPLICATE", label: "Duplicate" },
  { value: "OTHER", label: "Other" },
  { value: "NONE", label: "None" },
];

function ReadOnlyInput({ label, value, required = false }: { label: string; value: any; required?: boolean }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        readOnly
        className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-800 cursor-not-allowed focus:outline-none"
        value={value ?? ""}
      />
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-8">
      {title}
    </h3>
  );
}

function QCEditDetailsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const surveyUniqueCode = params.surveyUniqueCode as string;
  const userRole = searchParams.get("userRole") || user?.role || "";
  const qcLevel = parseInt(searchParams.get("qcLevel") || "1", 10);

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [error, setError] = useState("");

  // Form states
  const [errorType, setErrorType] = useState("NONE");
  const [gisTeamRemark, setGisTeamRemark] = useState("");
  const [surveyTeamRemark, setSurveyTeamRemark] = useState("");
  const [riRemark, setRiRemark] = useState("");
  const [generalRemarks, setGeneralRemarks] = useState("");
  const [assessmentRemark, setAssessmentRemark] = useState("");
  const [plotAreaGIS, setPlotAreaGIS] = useState("");

  useEffect(() => {
    fetchPropertyDetails();
  }, [surveyUniqueCode]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await qcApi.getPropertyDetails(surveyUniqueCode);
      if (!data) {
        setError("Property not found");
        return;
      }

      setProperty(data);

      // Populate form with existing QC data if available
      const latestQC = data.qcRecords?.[0];
      if (latestQC) {
        setErrorType(latestQC.errorType || "NONE");
        setGisTeamRemark(latestQC.gisTeamRemark || "");
        setSurveyTeamRemark(latestQC.surveyTeamRemark || "");
        setRiRemark(latestQC.RIRemark || "");
        setGeneralRemarks(latestQC.remarks || "");
      }

      setAssessmentRemark(data.assessmentRemark || "");
      setPlotAreaGIS(data.otherDetails?.plotAreaGIS || "");
    } catch (e) {
      setError("Error fetching property details");
    } finally {
      setLoading(false);
    }
  };

  const handleQCAction = async (action: "APPROVED" | "REJECTED") => {
    try {
      setLoading(true);

      const payload = {
        updateData: {
          assessmentRemark,
          plotAreaGIS,
        },
        qcLevel: qcLevel,
        qcStatus: action,
        reviewedById: user?.userId || "",
        remarks: generalRemarks,
        errorType,
        gisTeamRemark,
        surveyTeamRemark,
        RIRemark: riRemark,
      };

      await qcApi.updateSurveyQC(surveyUniqueCode, payload);
      toast.success(`Survey ${action.toLowerCase()} successfully`);

      // Close window or redirect back
      if (window.opener) {
        window.close();
      } else {
        router.back();
      }
    } catch (e) {
      toast.error(`Error ${action.toLowerCase()} survey`);
    } finally {
      setLoading(false);
    }
  };

  const getPageHeading = () => {
    const levelText =
      userRole === "SUPERVISOR"
        ? "Survey QC (Level 1)"
        : userRole === "ADMIN"
          ? "In-Office QC (Level 2)"
          : "QC";

    return `${levelText} - Edit Property Details`;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (error || !property) {
    return (
      <div className="p-6">
        <div className="text-red-500 text-center">
          {error || "Property not found"}
        </div>
      </div>
    );
  }

  const floors = [
    ...(property.residentialPropertyAssessments || []),
    ...(property.nonResidentialPropertyAssessments || [])
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-800">
      <div className="mb-6 flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageHeading()}</h1>
          <p className="text-gray-500 mt-1 font-semibold">Survey Code: {surveyUniqueCode}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold bg-gray-50 text-gray-900 p-4 border border-gray-200 rounded-t-xl mb-6">
          Property Details Review
        </h2>

        {/* Top General Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <ReadOnlyInput label="Property Code" value={surveyUniqueCode} />
          <ReadOnlyInput label="Old House Number" value={property.propertyDetails?.oldHouseNumber} />
          
          <ReadOnlyInput label="Electricity Consumer Number" value={property.propertyDetails?.electricityConsumerName} />
          <ReadOnlyInput label="Water Sewerage Connection Number" value={property.propertyDetails?.waterSewerageConnectionNumber} />
          
          <ReadOnlyInput label="Respondent Name" value={property.propertyDetails?.respondentName} />
          <ReadOnlyInput label="Respondent Status" value={property.propertyDetails?.respondentStatus?.respondentStatusName || property.propertyDetails?.respondentStatus?.name} />
          
          <ReadOnlyInput label="MAP ID" value={property.mapId} />
          <ReadOnlyInput label="GIS ID" value={property.gisId} />
          
          <ReadOnlyInput label="SUB GIS ID" value={property.subGisId} />
          <div className="hidden md:block"></div> {/* Spacer */}
        </div>

        {/* Location Section */}
        <SectionHeading title="Property Location Detail" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <ReadOnlyInput label="Assessment Year" value={property.locationDetails?.assessmentYear} required />
          <ReadOnlyInput label="Zone" value={property.zone?.zoneName} required />
          
          <ReadOnlyInput label="Ward" value={property.ward?.wardName} required />
          <ReadOnlyInput label="Mohalla" value={property.mohalla?.mohallaName} required />
          
          <ReadOnlyInput label="Property Type" value={property.locationDetails?.propertyType?.propertyTypeName} required />
          <ReadOnlyInput label="Building Name" value={property.locationDetails?.buildingName} />
          
          <ReadOnlyInput label="Road Type" value={property.locationDetails?.roadType?.roadTypeName} required />
          <ReadOnlyInput label="Construction Year" value={property.locationDetails?.constructionYear} required />
          
          <ReadOnlyInput label="Locality" value={property.locationDetails?.locality} />
          <ReadOnlyInput label="Pin Code" value={property.locationDetails?.pinCode} />
          
          <ReadOnlyInput label="Road Name" value={property.locationDetails?.addressRoadName} />
          <ReadOnlyInput label="Landmark" value={property.locationDetails?.landmark} />
          
          <ReadOnlyInput label="Property Latitude" value={property.locationDetails?.propertyLatitude} />
          <ReadOnlyInput label="Property Longitude" value={property.locationDetails?.propertyLongitude} />
          
          <ReadOnlyInput label="Four Way- East" value={property.locationDetails?.fourWayEast} />
          <ReadOnlyInput label="Four Way- West" value={property.locationDetails?.fourWayWest} />
          
          <ReadOnlyInput label="Four Way- North" value={property.locationDetails?.fourWayNorth} />
          <ReadOnlyInput label="Four Way- South" value={property.locationDetails?.fourWaySouth} />
          
          <ReadOnlyInput label="New Ward" value={property.locationDetails?.newWardNumber} required />
        </div>

        {/* Owner Detail */}
        <SectionHeading title="Property Owner Detail" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <ReadOnlyInput label="Owner Name" value={property.ownerDetails?.ownerName} required />
          <ReadOnlyInput label="Father/Husband Name" value={property.ownerDetails?.fatherHusbandName} required />
          <ReadOnlyInput label="Mobile Number" value={property.ownerDetails?.mobileNumber} />
          <ReadOnlyInput label="Aadhar Number" value={property.ownerDetails?.aadharNumber} />
        </div>

        {/* Other Detail */}
        <SectionHeading title="Other Detail" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <ReadOnlyInput label="Source Of Water" value={property.otherDetails?.waterSource?.waterSourceName} required />
          <ReadOnlyInput label="Rain Harvesting System (Is Available)" value={property.otherDetails?.rainWaterHarvestingSystem} required />
          
          <div className="flex items-center space-x-3 mt-4">
            <input 
              type="checkbox" 
              checked={property.otherDetails?.waterSupplyWithin200Meters === 'YES'} 
              readOnly 
              className="w-4 h-4 rounded text-blue-600 bg-gray-50 border-gray-300"
            />
            <label className="text-sm font-semibold text-gray-700">Water Supply within 200 Meter</label>
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <input 
              type="checkbox" 
              checked={property.otherDetails?.sewerageLineWithin100Meters === 'YES'} 
              readOnly 
              className="w-4 h-4 rounded text-blue-600 bg-gray-50 border-gray-300"
            />
            <label className="text-sm font-semibold text-gray-700">Sewerage Line within 100 Meter</label>
          </div>
        </div>

        {/* Assessment Detail */}
        <SectionHeading title="Property Assessment Detail" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <ReadOnlyInput label="Total Plot Area" value={property.otherDetails?.totalPlotArea} />
          <ReadOnlyInput label="Builtup Area Of Ground Floor" value={property.otherDetails?.builtupAreaOfGroundFloor} />
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 mt-6">
          <table className="w-full text-sm text-left min-w-max">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Floor Number</th>
                <th className="px-4 py-3 font-semibold">Occupancy Status</th>
                <th className="px-4 py-3 font-semibold">Construction Nature</th>
                <th className="px-4 py-3 font-semibold">Covered Area</th>
                <th className="px-4 py-3 font-semibold">All Room/Veranda Area</th>
                <th className="px-4 py-3 font-semibold">All Balcony/Kitchen Area</th>
                <th className="px-4 py-3 font-semibold">All Garage Area</th>
                <th className="px-4 py-3 font-semibold">Carpet Area</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {floors.length > 0 ? (
                floors.map((floor: any, idx: number) => (
                  <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors border-l border-r border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{floor.floorMaster?.floorNumberName || floor.floorNumberId || "NA"}</td>
                    <td className="px-4 py-3">{floor.occupancyStatus?.occupancyStatusName || floor.occupancyStatusId || "NA"}</td>
                    <td className="px-4 py-3">{floor.constructionNature?.constructionNatureName || floor.constructionNatureId || "NA"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{floor.coveredArea || floor.builtupArea || "0.00"}</td>
                    <td className="px-4 py-3">{floor.allRoomVerandaArea ?? "0.00"}</td>
                    <td className="px-4 py-3">{floor.allBalconyKitchenArea ?? "0.00"}</td>
                    <td className="px-4 py-3">{floor.allGarageArea ?? "0.00"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{floor.carpetArea ?? "0.00"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 bg-white font-medium uppercase tracking-wider text-xs">
                    No floor details available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Attachments & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 border-t border-gray-200 pt-8">
          {/* Upload Document / Photo */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Property Document/Photo</h3>
            <div className="border border-gray-200 bg-gray-50 p-4 rounded-xl min-h-[200px]">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="pb-2 font-semibold">Attachment Name</th>
                    <th className="pb-2 font-semibold">Upload Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {property.propertyAttachments && property.propertyAttachments.length > 0 ? (
                    property.propertyAttachments.map((attachment: any, i: number) => {
                      const images = [];
                      for (let j = 1; j <= 10; j++) {
                        const url = attachment[`image${j}Url`];
                        if (url) images.push(url);
                      }
                      
                      return images.map((imgUrl, imgIdx) => (
                        <tr key={`${i}-${imgIdx}`}>
                          <td className="py-3 font-medium text-gray-900">Photo {imgIdx + 1}</td>
                          <td className="py-3">
                            <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                              View Attachment
                            </a>
                          </td>
                        </tr>
                      ))
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-8 text-gray-500 text-center font-semibold">
                        No attachments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-gray-500 text-sm">
                <span className="font-medium">Read-only view</span>
              </div>
            </div>
            
            <div className="mt-6 border border-gray-200 bg-gray-50 p-4 rounded-xl">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Transfer Property</h4>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-semibold text-gray-700">Transfer To:</label>
                <select disabled className="border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-100 text-gray-500 w-48 cursor-not-allowed">
                  <option>-Select-</option>
                </select>
                <button disabled className="px-4 py-1.5 bg-gray-200 text-gray-400 font-bold rounded-lg cursor-not-allowed">
                  Transfer
                </button>
              </div>
            </div>
          </div>

          {/* Remarks & Action (QC Review Form) */}
          <div>
             <h3 className="text-lg font-bold text-gray-900 mb-4">QC Review Form</h3>
             <div className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Error Type</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value)}
                  >
                    {ERROR_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Plot Area GIS</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    value={plotAreaGIS}
                    onChange={(e) => setPlotAreaGIS(e.target.value)}
                    placeholder="Enter GIS plot area"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">GIS Team Remark</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    rows={2}
                    value={gisTeamRemark}
                    onChange={(e) => setGisTeamRemark(e.target.value)}
                    placeholder="Enter GIS team remarks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Survey Team Remark</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    rows={2}
                    value={surveyTeamRemark}
                    onChange={(e) => setSurveyTeamRemark(e.target.value)}
                    placeholder="Enter survey team remarks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">RI Remark</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    rows={2}
                    value={riRemark}
                    onChange={(e) => setRiRemark(e.target.value)}
                    placeholder="Enter RI remarks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Assessment Remark</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    rows={2}
                    value={assessmentRemark}
                    onChange={(e) => setAssessmentRemark(e.target.value)}
                    placeholder="Enter assessment remarks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">General Remarks</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    rows={3}
                    value={generalRemarks}
                    onChange={(e) => setGeneralRemarks(e.target.value)}
                    placeholder="Enter general remarks"
                  />
                </div>
             </div>

             {/* Action Buttons */}
             <div className="mt-8 flex justify-end gap-4">
                <button
                  className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold transition-colors shadow-sm"
                  onClick={() => window.close()}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold transition-colors border border-red-200 disabled:opacity-50"
                  onClick={() => handleQCAction("REJECTED")}
                  disabled={loading}
                >
                  Reject
                </button>
                <button
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-colors shadow-sm disabled:opacity-50"
                  onClick={() => handleQCAction("APPROVED")}
                  disabled={loading}
                >
                  Approve
                </button>
             </div>
          </div>
        </div>

        {/* History portion, typically small and informative at the very bottom */}
        {property.qcRecords && property.qcRecords.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">QC History</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-gray-50">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Level</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Reviewed By</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {property.qcRecords.map((qc: any, index: number) => (
                    <tr key={index} className="bg-white">
                      <td className="px-4 py-3 font-medium text-gray-900">{qc.qcLevel}</td>
                      <td className="px-4 py-3 font-bold text-gray-700">{qc.qcStatus}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {qc.reviewedBy?.name || qc.reviewedBy?.username || "NA"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(qc.reviewedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{qc.remarks || "NA"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function QCEditDetailsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <QCEditDetailsContent />
    </Suspense>
  );
}
