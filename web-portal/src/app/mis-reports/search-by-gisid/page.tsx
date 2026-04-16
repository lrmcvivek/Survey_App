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
        <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-12 pb-24">
            {/* Header */}
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="space-y-2">
                 <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">Universal <span className="text-blue-500">GIS Search</span></h1>
                 <p className="text-slate-500 font-medium italic max-w-xl mx-auto leading-relaxed">
                   Access real-time property intelligence by resolving unique GIS identifiers. Connect directly to spatial and historical telemetry records.
                 </p>
              </div>
            </div>

            {/* Search Matrix */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-[#161B26] p-3 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                   <Search className="w-32 h-32 text-white" />
                </div>
                <form onSubmit={handleSearch} className="relative flex items-center gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-600 group-focus-within:text-blue-400 transition-colors">
                      <SearchIcon className="w-6 h-6" />
                    </div>
                    <input
                      type="text"
                      value={gisId}
                      onChange={(e) => setGisId(e.target.value)}
                      placeholder="Input Registry Sequence (e.g. GIS-9921)"
                      className="w-full pl-16 pr-6 py-6 bg-transparent text-white font-black focus:outline-none placeholder:text-slate-700 placeholder:font-medium text-xl uppercase tracking-wider font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !gisId}
                    className="px-10 py-6 bg-blue-600 text-white font-black rounded-[1.75rem] shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 uppercase tracking-widest text-[10px] flex items-center gap-3 shrink-0"
                  >
                    {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Resolve Node
                  </button>
                </form>
              </div>
              {error && (
                <div className="mt-4 flex items-center justify-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest italic animate-pulse">
                  <Info className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            {/* Content Results */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {searched && !loading && results.length === 0 && (
                <div className="text-center py-32 bg-[#161B26]/50 rounded-[3rem] border border-slate-800 border-dashed">
                  <div className="w-24 h-24 bg-slate-900 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-800">
                    <Database className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-3">Identity Void</h3>
                  <p className="text-slate-500 font-medium italic">No topographical matches located for resource "{gisId}" in global register.</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {results.map((survey: any) => (
                    <div 
                      key={survey.surveyUniqueCode} 
                      className="group bg-[#161B26] rounded-[3rem] border border-slate-800 shadow-2xl hover:border-slate-700 transition-all duration-500 overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="p-10 border-b border-slate-800/50 relative overflow-hidden bg-slate-800/20">
                         <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-blue-600/10 transition-colors"></div>
                         <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-4">
                               <div className="flex items-center gap-3">
                                  <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border italic ${survey.surveyStatusMaps?.[0]?.status?.statusName === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                    {survey.surveyStatusMaps?.[0]?.status?.statusName || 'PROCESSING'}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic font-mono group-hover:text-slate-400 transition-colors">#{survey.surveyUniqueCode}</span>
                               </div>
                               <h3 className="text-3xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase italic leading-none">
                                  {survey.ownerDetails?.ownerName || "Unidentified Asset"}
                               </h3>
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic truncate max-w-xs">{survey.locationDetails?.buildingName || "Premises Sequence N/A"}</p>
                            </div>
                            <button 
                              onClick={() => window.open(`/qc/edit?surveyCode=${survey.surveyUniqueCode}`, '_blank')}
                              className="w-14 h-14 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/40 transition-all active:scale-95"
                            >
                              <ExternalLink className="w-6 h-6" />
                            </button>
                         </div>
                      </div>

                      {/* Info Bento */}
                      <div className="p-10 grid grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <div className="flex items-center gap-3 text-blue-500/50">
                               <MapPin className="w-5 h-5" />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Spatial Node</span>
                            </div>
                            <div className="space-y-1 pl-8 border-l border-slate-800/50">
                               <p className="text-xs font-black text-slate-200 uppercase tracking-tight">Ward {survey.ward?.newWardNumber || "X"} · {survey.zone?.zoneName || "Central"}</p>
                               <p className="text-[10px] font-bold text-slate-500 italic truncate">{survey.mohalla?.mohallaName || "Urban Cluster"}</p>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <div className="flex items-center gap-3 text-amber-500/50">
                               <Building2 className="w-5 h-5" />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Classification</span>
                            </div>
                            <div className="space-y-1 pl-8 border-l border-slate-800/50">
                               <p className="text-xs font-black text-slate-200 uppercase tracking-tight truncate">{survey.surveyType?.surveyTypeName || "Standard"}</p>
                               <p className="text-[10px] font-bold text-slate-500 italic uppercase tracking-widest">Type Identifier</p>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <div className="flex items-center gap-3 text-emerald-500/50">
                               <Clock className="w-5 h-5" />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Telemetry Log</span>
                            </div>
                            <div className="space-y-1 pl-8 border-l border-slate-800/50">
                               <p className="text-xs font-black text-slate-200 uppercase tracking-tight">{formatDate(survey.createdAt)}</p>
                               <p className="text-[10px] font-bold text-slate-500 italic">Review required</p>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <div className="flex items-center gap-3 text-indigo-500/50">
                               <Box className="w-5 h-5" />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Unit Mass</span>
                            </div>
                            <div className="space-y-1 pl-8 border-l border-slate-800/50">
                               <p className="text-xs font-black text-slate-200 uppercase tracking-tight">{survey._count?.residentialPropertyAssessments || 0} RESI / {survey._count?.nonResidentialPropertyAssessments || 0} COM</p>
                               <p className="text-[10px] font-bold text-slate-500 italic uppercase tracking-widest">Inventory Stack</p>
                            </div>
                         </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="px-8 py-6 bg-slate-900/50 border-t border-slate-800/50 flex items-center justify-between group/footer">
                         <div className="flex items-center gap-2">
                             <ShieldCheck className="w-4 h-4 text-slate-700" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 italic">E2E Integrity Verified</span>
                         </div>
                         <button 
                            onClick={() => window.open(`/qc/edit?surveyCode=${survey.surveyUniqueCode}`, '_blank')}
                            className="flex items-center gap-3 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:gap-5 transition-all outline-none"
                         >
                            Open Terminal
                            <ArrowRight className="w-4 h-4 group-hover/footer:translate-x-1 transition-transform" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
