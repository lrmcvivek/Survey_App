"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import toast from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";

interface Survey {
  surveyUniqueCode: string;
  gisId: string;
  subGisId?: string;
  uploadedBy: {
    username: string;
    name?: string;
  };
  ulb: {
    ulbName: string;
  };
  zone: {
    zoneNumber: string;
  };
  ward: {
    wardNumber: string;
    wardName: string;
  };
  mohalla: {
    mohallaName: string;
  };
  surveyType: {
    surveyTypeName: string;
  };
  entryDate: string;
  isSynced: boolean;
  syncStatus: string;
  createdAt: string;
  updatedAt: string;
  qcRecords: Array<{
    qcStatus: string;
    qcLevel: number;
    remarks?: string;
  }>;
}

const SurveyManagementPage: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSyncStatus, setSelectedSyncStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await fetch("/api/surveys", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching surveys:", error);
      toast.error("Failed to fetch surveys");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSurvey = async (surveyUniqueCode: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyUniqueCode}/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        toast.success("Survey synced successfully");
        fetchSurveys();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to sync survey");
      }
    } catch (error: any) {
      toast.error("Failed to sync survey");
    }
  };

  const handleBulkSync = async () => {
    const pendingSurveys = surveys.filter((s) => !s.isSynced);
    if (pendingSurveys.length === 0) {
      toast.success("No pending surveys to sync");
      return;
    }

    try {
      const response = await fetch("/api/surveys/bulk-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          surveyUniqueCodes: pendingSurveys.map((s) => s.surveyUniqueCode),
        }),
      });

      if (response.ok) {
        toast.success("Surveys synced successfully");
        fetchSurveys();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to sync surveys");
      }
    } catch (error: any) {
      toast.error("Failed to sync surveys");
    }
  };

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch =
      survey.surveyUniqueCode
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      survey.gisId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.uploadedBy.username
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      survey.ward.wardName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      !selectedStatus ||
      (survey.qcRecords.length > 0 &&
        survey.qcRecords[survey.qcRecords.length - 1].qcStatus ===
          selectedStatus);

    const matchesSyncStatus =
      !selectedSyncStatus || survey.syncStatus === selectedSyncStatus;

    return matchesSearch && matchesStatus && matchesSyncStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSurveys = filteredSurveys.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);

  const getQCStatus = (survey: Survey) => {
    if (survey.qcRecords.length === 0) return "PENDING";
    return survey.qcRecords[survey.qcRecords.length - 1].qcStatus;
  };

  const getQCStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "DUPLICATE":
        return "bg-orange-100 text-orange-800";
      case "NEEDS_REVISION":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "SYNCED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CONFLICT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireWebPortalAccess>
        <Loading fullScreen />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireWebPortalAccess>
      <MainLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white-900">
              Survey Management
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Surveys
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {surveys.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Synced</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {surveys.filter((s) => s.isSynced).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Sync
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {surveys.filter((s) => !s.isSynced).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    QC Approved
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {
                      surveys.filter((s) => getQCStatus(s) === "APPROVED")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search surveys by ID, GIS ID, or uploader..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" className="text-black-500">All QC Status</option>
                <option value="PENDING" className="text-black-500">Pending</option>
                <option value="APPROVED" className="text-black-500">Approved</option>
                <option value="REJECTED" className="text-black-500">Rejected</option>
                <option value="DUPLICATE" className="text-black-500">Duplicate</option>
                <option value="NEEDS_REVISION" className="text-black-500">Needs Revision</option>
              </select>
              <select
                value={selectedSyncStatus}
                onChange={(e) => setSelectedSyncStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" className="text-black-500">All Sync Status</option>
                <option value="PENDING" className="text-black-500">Pending</option>
                <option value="SYNCED" className="text-black-500">Synced</option>
                <option value="FAILED" className="text-black-500">Failed</option>
                <option value="CONFLICT" className="text-black-500">Conflict</option>
              </select>
              <button
                onClick={handleBulkSync}
                className="px-4 py-2 bg-green-600 text-black-500 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-black-500"
              >
                Bulk Sync
              </button>
            </div>
          </div>

          {/* Surveys Table */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Survey ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GIS ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QC Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sync Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSurveys.map((survey) => {
                  const qcStatus = getQCStatus(survey);

                  return (
                    <tr
                      key={survey.surveyUniqueCode}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {survey.surveyUniqueCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{survey.gisId}</div>
                        {survey.subGisId && (
                          <div className="text-xs text-gray-500">
                            {survey.subGisId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {survey.ward.wardNumber} - {survey.ward.wardName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {survey.mohalla.mohallaName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {survey.uploadedBy.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {survey.uploadedBy.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(survey.entryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQCStatusColor(
                            qcStatus
                          )}`}
                        >
                          {qcStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSyncStatusColor(
                            survey.syncStatus
                          )}`}
                        >
                          {survey.syncStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!survey.isSynced && (
                          <button
                            onClick={() =>
                              handleSyncSurvey(survey.surveyUniqueCode)
                            }
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Sync
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Navigate to survey details or open modal
                            toast.success("Survey details feature coming soon");
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredSurveys.length)} of{" "}
                {filteredSurveys.length} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default SurveyManagementPage;
