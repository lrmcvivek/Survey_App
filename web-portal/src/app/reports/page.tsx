"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import toast from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";

interface ReportData {
  totalSurveys: number;
  surveysByStatus: {
    pending: number;
    approved: number;
    rejected: number;
    duplicate: number;
    needsRevision: number;
  };
  surveysByWard: Array<{
    wardName: string;
    count: number;
  }>;
  surveysByMonth: Array<{
    month: string;
    count: number;
  }>;
  syncStats: {
    synced: number;
    pending: number;
    failed: number;
    conflict: number;
  };
  userStats: {
    totalUsers: number;
    activeUsers: number;
    surveysPerUser: Array<{
      username: string;
      count: number;
    }>;
  };
}

const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedWard, setSelectedWard] = useState("all");

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockData: ReportData = {
        totalSurveys: 1250,
        surveysByStatus: {
          pending: 150,
          approved: 850,
          rejected: 50,
          duplicate: 30,
          needsRevision: 170,
        },
        surveysByWard: [
          { wardName: "Ward 1", count: 120 },
          { wardName: "Ward 2", count: 95 },
          { wardName: "Ward 3", count: 140 },
          { wardName: "Ward 4", count: 88 },
          { wardName: "Ward 5", count: 156 },
        ],
        surveysByMonth: [
          { month: "Jan", count: 85 },
          { month: "Feb", count: 120 },
          { month: "Mar", count: 95 },
          { month: "Apr", count: 140 },
          { month: "May", count: 110 },
          { month: "Jun", count: 130 },
        ],
        syncStats: {
          synced: 1100,
          pending: 100,
          failed: 30,
          conflict: 20,
        },
        userStats: {
          totalUsers: 45,
          activeUsers: 38,
          surveysPerUser: [
            { username: "admin1", count: 150 },
            { username: "surveyor1", count: 120 },
            { username: "surveyor2", count: 95 },
            { username: "surveyor3", count: 88 },
            { username: "surveyor4", count: 76 },
          ],
        },
      };

      setReportData(mockData);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: "pdf" | "excel" | "csv") => {
    try {
      toast.success(`Exporting report in ${format.toUpperCase()} format...`);
      // Implement actual export functionality
      setTimeout(() => {
        toast.success(
          `Report exported successfully as ${format.toUpperCase()}`
        );
      }, 2000);
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireWebPortalAccess>
        <Loading fullScreen />
      </ProtectedRoute>
    );
  }

  if (!reportData) {
    return (
      <ProtectedRoute requireWebPortalAccess>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              No Data Available
            </h2>
            <p className="text-gray-600 mt-2">
              Report data is not available at the moment.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireWebPortalAccess>
      <MainLayout>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white-900">
                  Reports & Analytics
                </h1>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
                <button
                  onClick={() => exportReport("pdf")}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => exportReport("excel")}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    {reportData.totalSurveys.toLocaleString()}
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
                  <p className="text-sm font-medium text-gray-600">
                    Approval Rate
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(
                      (reportData.surveysByStatus.approved /
                        reportData.totalSurveys) *
                      100
                    ).toFixed(1)}
                    %
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
                    Pending Review
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {reportData.surveysByStatus.pending}
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Active Users
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {reportData.userStats.activeUsers}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Survey Status Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Survey Status Distribution
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Approved
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (reportData.surveysByStatus.approved /
                              reportData.totalSurveys) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {reportData.surveysByStatus.approved}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Pending
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (reportData.surveysByStatus.pending /
                              reportData.totalSurveys) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {reportData.surveysByStatus.pending}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Rejected
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (reportData.surveysByStatus.rejected /
                              reportData.totalSurveys) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {reportData.surveysByStatus.rejected}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Needs Revision
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (reportData.surveysByStatus.needsRevision /
                              reportData.totalSurveys) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {reportData.surveysByStatus.needsRevision}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Surveys by Ward */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Surveys by Ward
              </h3>
              <div className="space-y-3">
                {reportData.surveysByWard.map((ward, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {ward.wardName}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (ward.count /
                                Math.max(
                                  ...reportData.surveysByWard.map(
                                    (w) => w.count
                                  )
                                )) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {ward.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trends and User Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Survey Trends */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Monthly Survey Trends
              </h3>
              <div className="flex items-end justify-between h-32">
                {reportData.surveysByMonth.map((month, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-blue-600 rounded-t w-8 mb-2"
                      style={{
                        height: `${
                          (month.count /
                            Math.max(
                              ...reportData.surveysByMonth.map((m) => m.count)
                            )) *
                          80
                        }px`,
                      }}
                    ></div>
                    <span className="text-xs text-gray-600">{month.month}</span>
                    <span className="text-xs font-medium text-gray-900">
                      {month.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Surveyors
              </h3>
              <div className="space-y-3">
                {reportData.userStats.surveysPerUser
                  .slice(0, 5)
                  .map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-700">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {user.username}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {user.count} surveys
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Sync Status and System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sync Status */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sync Status Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.syncStats.synced}
                  </div>
                  <div className="text-sm text-green-600">Synced</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {reportData.syncStats.pending}
                  </div>
                  <div className="text-sm text-yellow-600">Pending</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {reportData.syncStats.failed}
                  </div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {reportData.syncStats.conflict}
                  </div>
                  <div className="text-sm text-orange-600">Conflict</div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                System Health
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Data Accuracy
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    98.5%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    System Uptime
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    99.9%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Response Time
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    ~200ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Active Sessions
                  </span>
                  <span className="text-sm font-semibold text-purple-600">
                    24
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default ReportsPage;
