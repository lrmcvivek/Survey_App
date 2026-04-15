"use client";

import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { surveyApi } from "@/lib/api";
import { 
  Search, 
  Building2, 
  MapPin, 
  User, 
  ArrowRight, 
  Info, 
  Calendar, 
  Box, 
  FileText,
  Clock,
  ExternalLink
} from "lucide-react";
import Loading from "@/components/ui/loading";
import ProtectedRoute from "@/features/auth/ProtectedRoute";

export default function SearchByGisIdPage() {
  const [gisId, setGisId] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gisId.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const response = await surveyApi.getSurveyByGisId(gisId.trim());
      setResults(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 tracking-tight mb-3">
              Search by GIS ID
            </h1>
            <p className="text-gray-500 font-medium">
              Enter a GIS ID to retrieve property survey records and history.
            </p>
          </div>

          {/* Search Bar Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={gisId}
                onChange={(e) => setGisId(e.target.value)}
                placeholder="Enter GIS ID"
                maxLength={12}
                className="w-full pl-14 pr-32 py-5 text-black bg-white border-2 border-gray-100 rounded-2xl shadow-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-lg font-semibold placeholder:font-normal placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={loading || !gisId}
                className="absolute right-3 top-2.5 bottom-2.5 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </form>
            {error && <p className="mt-3 text-red-500 text-center font-medium">{error}</p>}
          </div>

          {/* Results Section */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 font-medium italic">Scanning database for GIS ID: {gisId}...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {searched && results.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Info className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No Records Found</h3>
                  <p className="text-gray-500">We couldn't find any survey entries for GIS ID "{gisId}".</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {results.map((survey: any) => (
                    <div 
                      key={survey.surveyUniqueCode} 
                      className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:-translate-y-1 transition-all hover:shadow-2xl group"
                    >
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {survey.surveyType?.surveyTypeName || 'Survey'}
                            </span>
                            <span className="text-blue-900/40 font-bold text-xs">#{survey.surveyUniqueCode.substring(0, 8)}</span>
                          </div>
                          <h3 className="text-2xl font-black text-blue-900 tracking-tight">
                            {survey.ownerDetails?.ownerName || "Owner Information Missing"}
                          </h3>
                        </div>
                        <a 
                          href={`/qc/edit/${survey.surveyUniqueCode}`} 
                          target="_blank" 
                          className="p-3 bg-white text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>

                      {/* Card Content */}
                      <div className="p-8 grid grid-cols-2 gap-y-8 gap-x-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Location</p>
                            <p className="text-sm font-bold text-gray-800 leading-tight">
                              Ward {survey.ward?.newWardNumber || "N/A"}, {survey.zone?.zoneName || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{survey.mohalla?.mohallaName || "N/A"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Property</p>
                            <p className="text-sm font-bold text-gray-800 leading-tight truncate">
                              {survey.locationDetails?.buildingName || "Standard Property"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{survey.locationDetails?.addressRoadName || "Road N/A"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Surveyor</p>
                            <p className="text-sm font-bold text-gray-800 leading-tight">
                              {survey.uploadedBy?.name || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">ID: {survey.uploadedBy?.username || "N/A"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Entry Date</p>
                            <p className="text-sm font-bold text-gray-800 leading-tight">
                              {formatDate(survey.createdAt)}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`w-2 h-2 rounded-full ${survey.surveyStatusMaps?.[0]?.status?.statusName === 'APPROVED' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                {survey.surveyStatusMaps?.[0]?.status?.statusName || 'PENDING'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer/Quick Info */}
                      <div className="px-8 py-5 bg-gray-50 flex items-center justify-between">
                         <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                               <Box className="w-4 h-4 text-gray-400" />
                               <span className="text-xs font-bold text-gray-500">{survey.residentialPropertyAssessments?.length || 0} Res Units</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <FileText className="w-4 h-4 text-gray-400" />
                               <span className="text-xs font-bold text-gray-500">{survey.nonResidentialPropertyAssessments?.length || 0} NR Units</span>
                            </div>
                         </div>
                         <button 
                            onClick={() => window.open(`/qc/edit/${survey.surveyUniqueCode}`, '_blank')}
                            className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                          >
                           Full Details <ArrowRight className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
