"use client";
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { surveyApi } from "@/lib/api";
import { 
  Search, 
  Building2, 
  MapPin, 
  ArrowRight, 
  Info, 
  Calendar, 
  Box, 
  Clock,
  ExternalLink,
  Sparkles,
  Database,
  SearchIcon,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity
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
      setError("Data retrieval latency detected. System node not responding.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-10">
          {/* Header */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="space-y-2">
               <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">GIS ID Search</h1>
               <p className="text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                 Search and retrieve property survey records across the municipality using official GIS Identification numbers.
               </p>
            </div>
          </div>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <form onSubmit={handleSearch} className="relative flex items-center gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <SearchIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={gisId}
                    onChange={(e) => setGisId(e.target.value)}
                    placeholder="Enter GIS ID (e.g. GIS-9921)"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 placeholder:text-gray-400 text-lg transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !gisId}
                  className="px-6 py-3.5 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 uppercase tracking-wider text-xs flex items-center gap-2 shrink-0"
                >
                  {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search Property
                </button>
              </form>
            </div>
            {error && (
              <div className="mt-4 flex items-center justify-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider">
                <Info className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {searched && !loading && results.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                <div className="w-16 h-16 bg-white text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                  <Database className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 uppercase mb-1">No Records Found</h3>
                <p className="text-gray-500 text-sm">No property surveys were located for GIS ID "{gisId}" in the central database.</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {results.map((survey: any) => (
                  <div 
                    key={survey.surveyUniqueCode} 
                    className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    {/* Property Card Header */}
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                       <div className="flex justify-between items-start">
                          <div className="space-y-3">
                             <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded border ${
                                   survey.surveyStatusMaps?.[0]?.status?.statusName === 'APPROVED' 
                                   ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                   : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                  {survey.surveyStatusMaps?.[0]?.status?.statusName || 'PENDING'}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{survey.surveyUniqueCode}</span>
                             </div>
                             <h3 className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors uppercase">
                                {survey.ownerDetails?.ownerName || "Unknown Owner"}
                             </h3>
                             <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{survey.locationDetails?.buildingName || "Building Details Not Available"}</p>
                          </div>
                          <button 
                            onClick={() => window.open(`/qc/edit?surveyCode=${survey.surveyUniqueCode}`, '_blank')}
                            className="w-10 h-10 bg-white border border-gray-200 text-gray-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                            title="View Details"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </button>
                       </div>
                    </div>

                    {/* Property Information Grid */}
                    <div className="p-8 grid grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-400">
                             <MapPin className="w-4 h-4" />
                             <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
                          </div>
                          <div className="pl-6 border-l border-gray-100">
                             <p className="text-xs font-bold text-gray-700 uppercase">Ward {survey.ward?.newWardNumber || "X"} · {survey.zone?.zoneName || "Zone"}</p>
                             <p className="text-[10px] text-gray-500 font-medium truncate">{survey.mohalla?.mohallaName || "Mohalla"}</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-400">
                             <Building2 className="w-4 h-4" />
                             <span className="text-[10px] font-bold uppercase tracking-wider">Property Type</span>
                          </div>
                          <div className="pl-6 border-l border-gray-100">
                             <p className="text-xs font-bold text-gray-700 uppercase truncate">{survey.surveyType?.surveyTypeName || "General"}</p>
                             <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Classification</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-400">
                             <Clock className="w-4 h-4" />
                             <span className="text-[10px] font-bold uppercase tracking-wider">Survey Date</span>
                          </div>
                          <div className="pl-6 border-l border-gray-100">
                             <p className="text-xs font-bold text-gray-700 uppercase">{formatDate(survey.createdAt)}</p>
                             <p className="text-[10px] text-gray-500 font-medium">Record Created</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-400">
                             <Box className="w-4 h-4" />
                             <span className="text-[10px] font-bold uppercase tracking-wider">Property Units</span>
                          </div>
                          <div className="pl-6 border-l border-gray-100">
                             <p className="text-xs font-bold text-gray-700 uppercase">{survey._count?.residentialPropertyAssessments || 0} Residential / {survey._count?.nonResidentialPropertyAssessments || 0} Commercial</p>
                             <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Unit Summary</p>
                          </div>
                       </div>
                    </div>

                    {/* Action Bar */}
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-emerald-500" />
                           <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Data Verified</span>
                       </div>
                       <button 
                          onClick={() => window.open(`/qc/edit?surveyCode=${survey.surveyUniqueCode}`, '_blank')}
                          className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                       >
                          View Complete Details
                          <ArrowRight className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
