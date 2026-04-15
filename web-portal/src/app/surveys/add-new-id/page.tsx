"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import toast from "react-hot-toast";
import { masterDataApi, surveyApi } from "@/lib/api";
import { 
  Building2, 
  MapPin, 
  User as UserIcon, 
  ClipboardCheck, 
  Plus, 
  Trash2, 
  Save, 
  CornerDownRight,
  Info
} from "lucide-react";

interface SurveyFormData {
  surveyDetails: {
    ulbId: string;
    zoneId: string;
    wardId: string;
    mohallaId: string;
    surveyTypeId: string | number;
    entryDate: string;
    mapId: number;
    gisId: string;
    subGisId: string | null;
  };
  propertyDetails: {
    responseTypeId: string | number;
    oldHouseNumber: string;
    electricityConsumerName: string;
    waterSewerageConnectionNumber: string;
    respondentName: string;
    respondentStatusId: string | number;
  };
  ownerDetails: {
    ownerName: string;
    fatherHusbandName: string;
    mobileNumber: string;
    aadharNumber: string;
  };
  locationDetails: {
    propertyLatitude: number;
    propertyLongitude: number;
    assessmentYear: string;
    propertyTypeId: string | number;
    buildingName: string;
    roadTypeId: string | number;
    constructionYear: string;
    constructionTypeId: string | number;
    addressRoadName: string;
    locality: string;
    pinCode: string | number;
    landmark: string;
    fourWayEast: string;
    fourWayWest: string;
    fourWayNorth: string;
    fourWaySouth: string;
    newWardNumber: string;
  };
  otherDetails: {
    waterSourceId: string | number;
    rainWaterHarvestingSystem: string;
    plantation: string;
    parking: string;
    pollution: string;
    pollutionMeasurementTaken: string;
    waterSupplyWithin200Meters: string;
    sewerageLineWithin100Meters: string;
    disposalTypeId: string | number;
    totalPlotArea: string | number;
    builtupAreaOfGroundFloor: string | number;
    remarks: string;
  };
  residentialPropertyAssessments: any[];
  nonResidentialPropertyAssessments: any[];
}

const AddNewIdPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Master Data State
  const [ulbs, setUlbs] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [mohallas, setMohallas] = useState<any[]>([]);
  const [masters, setMasters] = useState<any>(null);
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<number, any[]>>({});

  // Form State
  const [formData, setFormData] = useState<SurveyFormData>({
    surveyDetails: {
      ulbId: "",
      zoneId: "",
      wardId: "",
      mohallaId: "",
      surveyTypeId: 1, // DEFAULT: RESIDENTIAL
      entryDate: new Date().toISOString(),
      mapId: 0,
      gisId: "",
      subGisId: null,
    },
    propertyDetails: {
      responseTypeId: "",
      oldHouseNumber: "",
      electricityConsumerName: "",
      waterSewerageConnectionNumber: "",
      respondentName: "",
      respondentStatusId: "",
    },
    ownerDetails: {
      ownerName: "",
      fatherHusbandName: "",
      mobileNumber: "",
      aadharNumber: "",
    },
    locationDetails: {
      propertyLatitude: 0,
      propertyLongitude: 0,
      assessmentYear: "2024-25",
      propertyTypeId: "",
      buildingName: "",
      roadTypeId: "",
      constructionYear: new Date().getFullYear().toString(),
      constructionTypeId: "",
      addressRoadName: "",
      locality: "",
      pinCode: "",
      landmark: "",
      fourWayEast: "",
      fourWayWest: "",
      fourWayNorth: "",
      fourWaySouth: "",
      newWardNumber: "",
    },
    otherDetails: {
      waterSourceId: "",
      rainWaterHarvestingSystem: "NO",
      plantation: "NO",
      parking: "NO",
      pollution: "NO",
      pollutionMeasurementTaken: "",
      waterSupplyWithin200Meters: "NO",
      sewerageLineWithin100Meters: "NO",
      disposalTypeId: "",
      totalPlotArea: "",
      builtupAreaOfGroundFloor: "",
      remarks: "",
    },
    residentialPropertyAssessments: [],
    nonResidentialPropertyAssessments: [],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [ulbData, masterData] = await Promise.all([
        masterDataApi.getAllUlbs(),
        masterDataApi.getAllMasterData()
      ]);
      setUlbs(ulbData);
      setMasters(masterData);
      
      if (ulbData.length > 0) {
        handleUlbChange(ulbData[0].ulbId);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load master data");
    } finally {
      setLoading(false);
    }
  };

  const handleUlbChange = async (ulbId: string) => {
    setFormData((prev: SurveyFormData) => ({
      ...prev,
      surveyDetails: { ...prev.surveyDetails, ulbId, zoneId: "", wardId: "", mohallaId: "" }
    }));
    try {
      const zoneData = await masterDataApi.getZonesByUlb(ulbId);
      setZones(zoneData);
      setWards([]);
      setMohallas([]);
    } catch (error) {
      toast.error("Failed to load zones");
    }
  };

  const handleZoneChange = async (zoneId: string) => {
    setFormData((prev: SurveyFormData) => ({
      ...prev,
      surveyDetails: { ...prev.surveyDetails, zoneId, wardId: "", mohallaId: "" }
    }));
    try {
      const wardData = await masterDataApi.getWardsByZone(zoneId);
      setWards(wardData);
      setMohallas([]);
    } catch (error) {
      toast.error("Failed to load wards");
    }
  };

  const handleWardChange = async (wardId: string) => {
    const selectedWard = wards.find(w => w.wardId === wardId);
    setFormData((prev: SurveyFormData) => ({
      ...prev,
      surveyDetails: { ...prev.surveyDetails, wardId, mohallaId: "" },
      locationDetails: { ...prev.locationDetails, newWardNumber: selectedWard?.newWardNumber || selectedWard?.wardNumber || "" }
    }));
    try {
      const mohallaData = await masterDataApi.getMohallasByWard(wardId);
      setMohallas(mohallaData);
    } catch (error) {
      toast.error("Failed to load mohallas");
    }
  };

  const handleMohallaChange = (mohallaId: string) => {
    const selectedMohalla = mohallas.find(m => m.mohallaId === mohallaId);
    setFormData((prev: SurveyFormData) => ({
      ...prev,
      surveyDetails: { ...prev.surveyDetails, mohallaId },
      locationDetails: { ...prev.locationDetails, locality: selectedMohalla?.mohallaName || "" }
    }));
  };

  const handleInputChange = (section: keyof SurveyFormData, field: string, value: any) => {
    setFormData((prev: SurveyFormData) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleCategoryChange = async (index: number, categoryId: number) => {
    const updated = [...formData.nonResidentialPropertyAssessments];
    updated[index].nrPropertyCategoryId = categoryId;
    updated[index].nrSubCategoryId = ""; 
    setFormData((prev: SurveyFormData) => ({ ...prev, nonResidentialPropertyAssessments: updated }));
    
    if (categoryId && !subCategoriesMap[categoryId]) {
      try {
        const subData = await masterDataApi.getNrPropertySubCategories(categoryId);
        setSubCategoriesMap((prev: Record<number, any[]>) => ({ ...prev, [categoryId]: subData }));
      } catch (error) {
        toast.error("Failed to load subcategories");
      }
    }
  };

  const addResidentialAssessment = () => {
    setFormData((prev: SurveyFormData) => ({
      ...prev,
      residentialPropertyAssessments: [
        ...prev.residentialPropertyAssessments,
        {
          floorNumberId: "",
          occupancyStatusId: "",
          constructionNatureId: "",
          coveredArea: "",
          allRoomVerandaArea: "",
          allBalconyKitchenArea: "",
          allGarageArea: "",
          carpetArea: "",
        }
      ]
    }));
  };

  const addNonResidentialAssessment = () => {
    setFormData((prev: SurveyFormData) => ({
      ...prev,
      nonResidentialPropertyAssessments: [
        ...prev.nonResidentialPropertyAssessments,
        {
          floorNumberId: "",
          nrPropertyCategoryId: "",
          nrSubCategoryId: "",
          establishmentName: "",
          licenseNo: "",
          licenseExpiryDate: null,
          occupancyStatusId: "",
          constructionNatureId: "",
          builtupArea: "",
        }
      ]
    }));
  };

  const removeAssessment = (type: 'residential' | 'nonResidential', index: number) => {
    const listField = type === 'residential' ? 'residentialPropertyAssessments' : 'nonResidentialPropertyAssessments';
    setFormData((prev: any) => ({
      ...prev,
      [listField]: prev[listField].filter((_: any, i: number) => i !== index)
    }));
  };

  const updateAssessment = (type: 'residential' | 'nonResidential', index: number, field: string, value: any) => {
    const listField = type === 'residential' ? 'residentialPropertyAssessments' : 'nonResidentialPropertyAssessments';
    const updated = [...formData[listField]];
    updated[index][field] = value;
    setFormData((prev: SurveyFormData) => ({ ...prev, [listField]: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    
    // Comprehensive Validation
    const { surveyDetails, propertyDetails, ownerDetails, locationDetails, otherDetails } = formData;
    const errors: string[] = [];

    if (!surveyDetails.gisId || surveyDetails.gisId.length !== 12) errors.push("GIS ID must be 12 characters");
    if (!surveyDetails.ulbId) errors.push("ULB is required");
    if (!surveyDetails.zoneId) errors.push("Zone is required");
    if (!surveyDetails.wardId) errors.push("Ward is required");
    if (!surveyDetails.mohallaId) errors.push("Mohalla is required");
    
    if (!propertyDetails.responseTypeId) errors.push("Response Type is required");
    if (!propertyDetails.respondentName) errors.push("Respondent Name is required");
    if (!propertyDetails.respondentStatusId) errors.push("Respondent Status is required");
    
    if (!ownerDetails.ownerName) errors.push("Owner Name is required");
    if (!ownerDetails.fatherHusbandName) errors.push("Father/Husband Name is required");
    
    if (!locationDetails.roadTypeId) errors.push("Road Type is required");
    if (!locationDetails.constructionYear) errors.push("Construction Year is required");
    if (!locationDetails.constructionTypeId) errors.push("Construction Type is required");
    if (!locationDetails.addressRoadName) errors.push("Address/Road Name is required");
    if (!locationDetails.pinCode) errors.push("Pin Code is required");
    if (!locationDetails.newWardNumber) errors.push("New Ward Number is required");
    
    if (!otherDetails.waterSourceId) errors.push("Water Source is required");
    if (!otherDetails.disposalTypeId) errors.push("Disposal Type is required");
    if (otherDetails.totalPlotArea === "") errors.push("Total Plot Area is required");
    if (otherDetails.builtupAreaOfGroundFloor === "") errors.push("Built-up Area of Ground Floor is required");

    // Property Type requirement for Residential/Mixed
    const surveyTypeId = Number(surveyDetails.surveyTypeId);
    if ((surveyTypeId === 1 || surveyTypeId === 3) && !locationDetails.propertyTypeId) {
      errors.push("Property Type is required for Residential/Mixed surveys");
    }

    if (errors.length > 0) {
      toast.error(errors[0]); // Show first error
      setSubmitting(false);
      return;
    }

    try {
      const payload = JSON.parse(JSON.stringify(formData));
      
      // Type conversions
      payload.surveyDetails.surveyTypeId = Number(payload.surveyDetails.surveyTypeId);
      payload.surveyDetails.mapId = Number(payload.surveyDetails.mapId);
      
      const convertToNum = (obj: any, fields: string[]) => {
        fields.forEach(f => { if(obj[f] !== "" && obj[f] !== null) obj[f] = Number(obj[f]); });
      };

      convertToNum(payload.propertyDetails, ['responseTypeId', 'respondentStatusId']);
      convertToNum(payload.locationDetails, ['propertyTypeId', 'roadTypeId', 'constructionTypeId', 'pinCode', 'propertyLatitude', 'propertyLongitude']);
      convertToNum(payload.otherDetails, ['waterSourceId', 'disposalTypeId', 'totalPlotArea', 'builtupAreaOfGroundFloor']);
      
      payload.residentialPropertyAssessments.forEach((a: any) => {
        convertToNum(a, ['floorNumberId', 'occupancyStatusId', 'constructionNatureId', 'coveredArea', 'allRoomVerandaArea', 'allBalconyKitchenArea', 'allGarageArea', 'carpetArea']);
      });
      
      payload.nonResidentialPropertyAssessments.forEach((a: any) => {
        convertToNum(a, ['floorNumberId', 'nrPropertyCategoryId', 'nrSubCategoryId', 'occupancyStatusId', 'constructionNatureId', 'builtupArea']);
      });

      await surveyApi.submitSurvey(payload);
      toast.success("Property record added successfully!");
      setTimeout(() => {
        window.location.href = "/surveys";
      }, 1500);
    } catch (error: any) {
      console.error("Submission error:", error);
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to submit survey";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  const Section = ({ title, icon: Icon, children, colorClass = "from-blue-600 to-indigo-700" }: any) => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100 transition-all hover:shadow-2xl">
      <div className={`bg-gradient-to-r ${colorClass} p-5 flex items-center gap-3`}>
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <Icon className="text-white w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
      </div>
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-gray-50/30">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, required, children }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  const selectClass = "w-full px-4 py-2.5 bg-white border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 placeholder-gray-400 cursor-pointer hover:border-gray-300";
  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 placeholder-gray-400 hover:border-gray-300";

  return (
    <ProtectedRoute requireWebPortalAccess>
      <MainLayout>
        <div className="min-w-full">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Add New Property ID</h1>
              <p className="text-gray-500 mt-2 text-lg">Manually create a residential or non-residential property record.</p>
            </div>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => window.location.href = "/surveys"}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? <Loading /> : <Save className="w-5 h-5" />}
                {submitting ? "Submitting..." : "Save Record"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 pb-10">
            
            <Section title="Master Information" icon={MapPin}>
              <InputField label="ULB" required>
                <select 
                  className={selectClass}
                  value={formData.surveyDetails.ulbId} 
                  onChange={(e) => handleUlbChange(e.target.value)}
                  required
                >
                  <option value="">Select ULB</option>
                  {ulbs.map(u => <option key={u.ulbId} value={u.ulbId}>{u.ulbName}</option>)}
                </select>
              </InputField>
              
              <InputField label="Zone" required>
                <select 
                  className={selectClass}
                  value={formData.surveyDetails.zoneId} 
                  onChange={(e) => handleZoneChange(e.target.value)}
                  required
                >
                  <option value="">Select Zone</option>
                  {zones.map(z => <option key={z.zoneId} value={z.zoneId}>{z.zoneNumber} - {z.zoneName}</option>)}
                </select>
              </InputField>
              
              <InputField label="Ward" required>
                <select 
                  className={selectClass}
                  value={formData.surveyDetails.wardId} 
                  onChange={(e) => handleWardChange(e.target.value)}
                  required
                >
                  <option value="">Select Ward</option>
                  {wards.map(w => <option key={w.wardId} value={w.wardId}>{w.wardNumber} - {w.wardName}</option>)}
                </select>
              </InputField>
              
              <InputField label="Mohalla" required>
                <select 
                  className={selectClass}
                  value={formData.surveyDetails.mohallaId} 
                  onChange={(e) => handleMohallaChange(e.target.value)}
                  required
                >
                  <option value="">Select Mohalla</option>
                  {mohallas.map(m => <option key={m.mohallaId} value={m.mohallaId}>{m.mohallaName}</option>)}
                </select>
              </InputField>

              <InputField label="Survey Type" required>
                <select 
                  className={selectClass}
                  value={formData.surveyDetails.surveyTypeId} 
                  onChange={(e) => handleInputChange('surveyDetails', 'surveyTypeId', e.target.value)}
                  required
                >
                  {masters?.surveyTypes?.map((t: any) => (
                    <option key={t.surveyTypeId} value={t.surveyTypeId}>{t.surveyTypeName}</option>
                  ))}
                </select>
              </InputField>
            </Section>

            <Section title="Property & GIS Details" icon={Building2}>
              <InputField label="GIS ID (12 Char)" required>
                <input 
                  type="text" 
                  className={inputClass} 
                  maxLength={12}
                  placeholder="Enter 12-digit GIS ID"
                  value={formData.surveyDetails.gisId}
                  onChange={(e) => handleInputChange('surveyDetails', 'gisId', e.target.value)}
                  required
                />
              </InputField>
              
              <InputField label="Sub-GIS ID">
                <input 
                  type="text" 
                  className={inputClass} 
                  maxLength={15}
                  value={formData.surveyDetails.subGisId || ""}
                  onChange={(e) => handleInputChange('surveyDetails', 'subGisId', e.target.value)}
                />
              </InputField>

              <InputField label="Response Type" required>
                <select 
                  className={selectClass}
                  value={formData.propertyDetails.responseTypeId} 
                  onChange={(e) => handleInputChange('propertyDetails', 'responseTypeId', e.target.value)}
                  required
                >
                  <option value="">Select Type</option>
                  {masters?.responseTypes?.map((t: any) => (
                    <option key={t.responseTypeId} value={t.responseTypeId}>{t.responseTypeName}</option>
                  ))}
                </select>
              </InputField>

              <InputField label="Respondent Name" required>
                <input 
                  type="text" 
                  className={inputClass}
                  value={formData.propertyDetails.respondentName}
                  onChange={(e) => handleInputChange('propertyDetails', 'respondentName', e.target.value)}
                  required
                />
              </InputField>

              <InputField label="Respondent Status" required>
                <select 
                  className={selectClass}
                  value={formData.propertyDetails.respondentStatusId} 
                  onChange={(e) => handleInputChange('propertyDetails', 'respondentStatusId', e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  {masters?.respondentStatuses?.map((s: any) => (
                    <option key={s.respondentStatusId} value={s.respondentStatusId}>{s.respondentStatusName}</option>
                  ))}
                </select>
              </InputField>

              <InputField label="Old House Number">
                <input 
                  type="text" 
                  className={inputClass}
                  value={formData.propertyDetails.oldHouseNumber || ""}
                  onChange={(e) => handleInputChange('propertyDetails', 'oldHouseNumber', e.target.value)}
                />
              </InputField>
            </Section>

            <Section title="Owner Information" icon={UserIcon}>
              <InputField label="Owner Name" required>
                <input 
                  type="text" 
                  className={inputClass}
                  value={formData.ownerDetails.ownerName}
                  onChange={(e) => handleInputChange('ownerDetails', 'ownerName', e.target.value)}
                  required
                />
              </InputField>
              <InputField label="Father/Husband Name" required>
                <input 
                  type="text" 
                  className={inputClass}
                  value={formData.ownerDetails.fatherHusbandName}
                  onChange={(e) => handleInputChange('ownerDetails', 'fatherHusbandName', e.target.value)}
                  required
                />
              </InputField>
              <InputField label="Mobile Number">
                <input 
                  type="tel" 
                  className={inputClass}
                  value={formData.ownerDetails.mobileNumber || ""}
                  onChange={(e) => handleInputChange('ownerDetails', 'mobileNumber', e.target.value)}
                />
              </InputField>
              <InputField label="Aadhar Number (12 Digits)">
                <input 
                  type="text" 
                  className={inputClass}
                  maxLength={12}
                  value={formData.ownerDetails.aadharNumber || ""}
                  onChange={(e) => handleInputChange('ownerDetails', 'aadharNumber', e.target.value)}
                />
              </InputField>
            </Section>

            <Section title="Location & Construction" icon={ClipboardCheck}>
              <InputField label="Property Type" required={[1, 3].includes(Number(formData.surveyDetails.surveyTypeId))}>
                <select 
                  className={selectClass}
                  value={formData.locationDetails.propertyTypeId} 
                  onChange={(e) => handleInputChange('locationDetails', 'propertyTypeId', e.target.value)}
                >
                  <option value="">Select Property Type</option>
                  {masters?.propertyTypes?.map((t: any) => (
                    <option key={t.propertyTypeId} value={t.propertyTypeId}>{t.propertyTypeName}</option>
                  ))}
                </select>
              </InputField>

              <InputField label="Road Type" required>
                <select 
                  className={selectClass}
                  value={formData.locationDetails.roadTypeId} 
                  onChange={(e) => handleInputChange('locationDetails', 'roadTypeId', e.target.value)}
                  required
                >
                  <option value="">Select Road Type</option>
                  {masters?.roadTypes?.map((t: any) => (
                    <option key={t.roadTypeId} value={t.roadTypeId}>{t.roadTypeName}</option>
                  ))}
                </select>
              </InputField>

              <InputField label="Construction Year" required>
                <input 
                  type="text" 
                  className={inputClass}
                  value={formData.locationDetails.constructionYear}
                  onChange={(e) => handleInputChange('locationDetails', 'constructionYear', e.target.value)}
                  required
                />
              </InputField>

              <InputField label="Construction Type" required>
                <select 
                  className={selectClass}
                  value={formData.locationDetails.constructionTypeId} 
                  onChange={(e) => handleInputChange('locationDetails', 'constructionTypeId', e.target.value)}
                  required
                >
                  <option value="">Select Construction Type</option>
                  {masters?.constructionTypes?.map((t: any) => (
                    <option key={t.constructionTypeId} value={t.constructionTypeId}>{t.constructionTypeName}</option>
                  ))}
                </select>
              </InputField>

              <InputField label="Road Name / Address" required>
                <input 
                  type="text" 
                  className={inputClass}
                  value={formData.locationDetails.addressRoadName}
                  onChange={(e) => handleInputChange('locationDetails', 'addressRoadName', e.target.value)}
                  required
                />
              </InputField>

              <InputField label="Pincode" required>
                <input 
                  type="number" 
                  className={inputClass}
                  value={formData.locationDetails.pinCode}
                  onChange={(e) => handleInputChange('locationDetails', 'pinCode', e.target.value)}
                  required
                />
              </InputField>

              <InputField label="New Ward Number" required>
                <input 
                  type="text" 
                  className={inputClass}
                  value={formData.locationDetails.newWardNumber}
                  onChange={(e) => handleInputChange('locationDetails', 'newWardNumber', e.target.value)}
                  required
                />
              </InputField>

              <InputField label="Locality">
                <input 
                  type="text" 
                  className={inputClass}
                  value={formData.locationDetails.locality}
                  onChange={(e) => handleInputChange('locationDetails', 'locality', e.target.value)}
                />
              </InputField>
            </Section>

            <Section title="Other Utility Details" icon={Info} colorClass="from-amber-500 to-orange-600">
              <InputField label="Water Source" required>
                <select 
                  className={selectClass}
                  value={formData.otherDetails.waterSourceId} 
                  onChange={(e) => handleInputChange('otherDetails', 'waterSourceId', e.target.value)}
                  required
                >
                  <option value="">Select Water Source</option>
                  {masters?.waterSources?.map((s: any) => (
                    <option key={s.waterSourceId} value={s.waterSourceId}>{s.waterSourceName}</option>
                  ))}
                </select>
              </InputField>

              <InputField label="Disposal Type" required>
                <select 
                  className={selectClass}
                  value={formData.otherDetails.disposalTypeId} 
                  onChange={(e) => handleInputChange('otherDetails', 'disposalTypeId', e.target.value)}
                  required
                >
                  <option value="">Select Disposal Type</option>
                  {masters?.disposalTypes?.map((t: any) => (
                    <option key={t.disposalTypeId} value={t.disposalTypeId}>{t.disposalTypeName}</option>
                  ))}
                </select>
              </InputField>

              <InputField label="Rainwater Harvesting?">
                <select 
                  className={selectClass}
                  value={formData.otherDetails.rainWaterHarvestingSystem} 
                  onChange={(e) => handleInputChange('otherDetails', 'rainWaterHarvestingSystem', e.target.value)}
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </InputField>

              <InputField label="Parking?">
                <select 
                  className={selectClass}
                  value={formData.otherDetails.parking} 
                  onChange={(e) => handleInputChange('otherDetails', 'parking', e.target.value)}
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </InputField>

              <InputField label="Water Supply < 200m?">
                <select 
                  className={selectClass}
                  value={formData.otherDetails.waterSupplyWithin200Meters} 
                  onChange={(e) => handleInputChange('otherDetails', 'waterSupplyWithin200Meters', e.target.value)}
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </InputField>

              <InputField label="Sewerage < 100m?">
                <select 
                  className={selectClass}
                  value={formData.otherDetails.sewerageLineWithin100Meters} 
                  onChange={(e) => handleInputChange('otherDetails', 'sewerageLineWithin100Meters', e.target.value)}
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </InputField>
            </Section>

            <Section title="Area Details" icon={Plus} colorClass="from-emerald-600 to-teal-700">
               <InputField label="Total Plot Area (sqft)" required>
                <input 
                  type="number" 
                  step="0.01"
                  className={inputClass}
                  value={formData.otherDetails.totalPlotArea}
                  onChange={(e) => handleInputChange('otherDetails', 'totalPlotArea', e.target.value)}
                  required
                />
              </InputField>
              <InputField label="G.F. Built-up Area (sqft)" required>
                <input 
                  type="number" 
                  step="0.01"
                  className={inputClass}
                  value={formData.otherDetails.builtupAreaOfGroundFloor}
                  onChange={(e) => handleInputChange('otherDetails', 'builtupAreaOfGroundFloor', e.target.value)}
                  required
                />
              </InputField>
              <InputField label="Remarks">
                <input 
                  type="text" 
                  className={inputClass}
                  value={formData.otherDetails.remarks}
                  onChange={(e) => handleInputChange('otherDetails', 'remarks', e.target.value)}
                />
              </InputField>
            </Section>

            {/* Assessment Section - RESIDENTIAL */}
            {[1, 3].includes(Number(formData.surveyDetails.surveyTypeId)) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="bg-green-600 p-5 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Plus className="text-white w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">Residential Floor Assessments</h2>
                  </div>
                  <button 
                    type="button" 
                    onClick={addResidentialAssessment}
                    className="px-4 py-2 bg-white text-green-700 rounded-xl font-bold hover:bg-green-50 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Floor
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  {formData.residentialPropertyAssessments.length === 0 && (
                     <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No floor assessments added yet.</p>
                     </div>
                  )}
                  {formData.residentialPropertyAssessments.map((a: any, idx: number) => (
                    <div key={idx} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-200 relative group transition-all hover:bg-white hover:border-green-200 shadow-sm">
                      <button 
                        type="button" 
                        onClick={() => removeAssessment('residential', idx)}
                        className="absolute -top-3 -right-3 p-2 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white shadow-md z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputField label="Floor" required>
                          <select 
                            className={selectClass}
                            value={a.floorNumberId}
                            onChange={(e) => updateAssessment('residential', idx, 'floorNumberId', e.target.value)}
                            required
                          >
                            <option value="">Select Floor</option>
                            {masters?.floors?.map((f: any) => <option key={f.floorNumberId} value={f.floorNumberId}>{f.floorNumberName}</option>)}
                          </select>
                        </InputField>
                        <InputField label="Occupancy" required>
                          <select 
                            className={selectClass}
                            value={a.occupancyStatusId}
                            onChange={(e) => updateAssessment('residential', idx, 'occupancyStatusId', e.target.value)}
                            required
                          >
                            <option value="">Select Occupancy</option>
                            {masters?.occupancyStatuses?.map((s: any) => <option key={s.occupancyStatusId} value={s.occupancyStatusId}>{s.occupancyStatusName}</option>)}
                          </select>
                        </InputField>
                        <InputField label="Construction Nature" required>
                          <select 
                            className={selectClass}
                            value={a.constructionNatureId}
                            onChange={(e) => updateAssessment('residential', idx, 'constructionNatureId', e.target.value)}
                            required
                          >
                            <option value="">Select Nature</option>
                            {masters?.constructionNatures?.map((n: any) => <option key={n.constructionNatureId} value={n.constructionNatureId}>{n.constructionNatureName}</option>)}
                          </select>
                        </InputField>
                        <InputField label="Carpet Area (sqft)" required>
                          <input 
                            type="number" 
                            step="0.01"
                            className={inputClass}
                            value={a.carpetArea}
                            onChange={(e) => updateAssessment('residential', idx, 'carpetArea', e.target.value)}
                            required
                          />
                        </InputField>
                        <InputField label="Covered Area (sqft)" required>
                          <input 
                            type="number" 
                            step="0.01"
                            className={inputClass}
                            value={a.coveredArea}
                            onChange={(e) => updateAssessment('residential', idx, 'coveredArea', e.target.value)}
                            required
                          />
                        </InputField>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment Section - NON-RESIDENTIAL */}
            {[2, 3].includes(Number(formData.surveyDetails.surveyTypeId)) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="bg-purple-600 p-5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Building2 className="text-white w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">Non-Residential Floor Assessments</h2>
                  </div>
                  <button 
                    type="button" 
                    onClick={addNonResidentialAssessment}
                    className="px-4 py-2 bg-white text-purple-700 rounded-xl font-bold hover:bg-purple-50 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Unit
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  {formData.nonResidentialPropertyAssessments.length === 0 && (
                     <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No non-residential units added yet.</p>
                     </div>
                  )}
                  {formData.nonResidentialPropertyAssessments.map((a: any, idx: number) => (
                    <div key={idx} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-200 relative group transition-all hover:bg-white hover:border-purple-200 shadow-sm">
                      <button 
                        type="button" 
                        onClick={() => removeAssessment('nonResidential', idx)}
                        className="absolute -top-3 -right-3 p-2 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white shadow-md z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <InputField label="Establishment Name" required>
                          <input 
                            type="text" 
                            className={inputClass}
                            value={a.establishmentName}
                            onChange={(e) => updateAssessment('nonResidential', idx, 'establishmentName', e.target.value)}
                            required
                          />
                        </InputField>
                        <InputField label="Category" required>
                          <select 
                            className={selectClass}
                            value={a.nrPropertyCategoryId}
                            onChange={(e) => handleCategoryChange(idx, Number(e.target.value))}
                            required
                          >
                            <option value="">Select Category</option>
                            {masters?.nrPropertyCategories?.map((c: any) => <option key={c.propertyCategoryId} value={c.propertyCategoryId}>{c.propertyCategoryName}</option>)}
                          </select>
                        </InputField>
                        <InputField label="Sub-Category" required>
                          <select 
                            className={selectClass}
                            value={a.nrSubCategoryId}
                            onChange={(e) => updateAssessment('nonResidential', idx, 'nrSubCategoryId', e.target.value)}
                            required
                          >
                            <option value="">Select Sub-Category</option>
                            {subCategoriesMap[Number(a.nrPropertyCategoryId)]?.map(s => <option key={s.subCategoryId} value={s.subCategoryId}>{s.subCategoryName}</option>)}
                          </select>
                        </InputField>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                         <InputField label="Floor" required>
                          <select 
                            className={selectClass}
                            value={a.floorNumberId}
                            onChange={(e) => updateAssessment('nonResidential', idx, 'floorNumberId', e.target.value)}
                            required
                          >
                            <option value="">Select Floor</option>
                            {masters?.floors?.map((f: any) => <option key={f.floorNumberId} value={f.floorNumberId}>{f.floorNumberName}</option>)}
                          </select>
                        </InputField>
                        <InputField label="Built-up Area (sqft)" required>
                          <input 
                            type="number" 
                            step="0.01"
                            className={inputClass}
                            value={a.builtupArea}
                            onChange={(e) => updateAssessment('nonResidential', idx, 'builtupArea', e.target.value)}
                            required
                          />
                        </InputField>
                        <InputField label="OccupancyStatus" required>
                          <select 
                            className={selectClass}
                            value={a.occupancyStatusId}
                            onChange={(e) => updateAssessment('nonResidential', idx, 'occupancyStatusId', e.target.value)}
                            required
                          >
                            <option value="">Select Occupancy</option>
                            {masters?.occupancyStatuses?.map((s: any) => <option key={s.occupancyStatusId} value={s.occupancyStatusId}>{s.occupancyStatusName}</option>)}
                          </select>
                        </InputField>
                        <InputField label="Nature" required>
                          <select 
                            className={selectClass}
                            value={a.constructionNatureId}
                            onChange={(e) => updateAssessment('nonResidential', idx, 'constructionNatureId', e.target.value)}
                            required
                          >
                            <option value="">Select Nature</option>
                            {masters?.constructionNatures?.map((n: any) => <option key={n.constructionNatureId} value={n.constructionNatureId}>{n.constructionNatureName}</option>)}
                          </select>
                        </InputField>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-6 pt-10 border-t border-gray-100">
               <button 
                type="button"
                onClick={() => window.location.href = "/surveys"}
                className="px-10 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              >
                Back to Surveys
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                disabled={submitting}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-extrabold flex items-center gap-3 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? <Loading /> : <Save className="w-6 h-6" />}
                {submitting ? "Saving Record..." : "Submit Property Record"}
              </button>
            </div>
          </form>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default AddNewIdPage;
