"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import { useAuth } from "@/features/auth/AuthContext";
import Loading from "@/components/ui/loading";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string>("");

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: reportsApi.getDashboardStats,
  });

  // Fetch recent activity logs with filter
  const {
    data: recentActivity,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["recentActivity", activityFilter],
    queryFn: () => reportsApi.getRecentActivity(activityFilter),
  });

  useEffect(() => {
    // Simulate loading time for consistency
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      SUPERADMIN: "Super Admin",
      ADMIN: "Admin",
      SUPERVISOR: "Supervisor",
      SURVEYOR: "Surveyor",
    };
    return roleMap[role] || role;
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>{icon}</div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const QuickActionCard: React.FC<{
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
  }> = ({ title, description, href, icon }) => (
    <a
      href={href}
      className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-md bg-blue-100 text-blue-600">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </a>
  );

  if (loading || statsLoading) {
    return (
      <ProtectedRoute>
        <Loading fullScreen />
      </ProtectedRoute>
    );
  }

  if (statsError) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="p-6 text-red-500">
            Failed to load dashboard stats.
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-3">
          {/* Welcome Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name || user?.username}!
            </h1>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers ?? "NA"}
              icon={
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              }
              color="bg-blue-500"
            />
            <StatCard
              title="Active Wards"
              value={stats?.activeWards ?? "NA"}
              // Note: activeWards now shows wards with "STARTED" status from the backend
              icon={
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
              color="bg-green-500"
            />
            <StatCard
              title="Surveyors Assigned"
              value={stats?.surveyorsAssigned ?? "NA"}
              icon={
                <svg
                  className="h-6 w-6 text-white"
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
              }
              color="bg-yellow-500"
            />
            <StatCard
              title="QC Completed"
              value={stats?.qcCompleted ?? "NA"}
              icon={
                <svg
                  className="h-6 w-6 text-white"
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
              }
              color="bg-purple-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hasRole(["SUPERADMIN", "ADMIN"]) && (
                <QuickActionCard
                  title="Manage Users"
                  description="Add, edit, or remove user accounts"
                  href="/userManagement/users"
                  icon={
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  }
                />
              )}

              {hasRole(["SUPERADMIN", "ADMIN", "SUPERVISOR"]) && (
                <>
                  <QuickActionCard
                    title="Ward Management"
                    description="Update status of wards"
                    href="/masters/ward"
                    icon={
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    }
                  />
                  <QuickActionCard
                    title="QC Management"
                    description="Review and approve survey data"
                    href="/qc"
                    icon={
                      <svg
                        className="h-6 w-6"
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
                    }
                  />
                </>
              )}

              <QuickActionCard
                title="View Reports"
                description="Generate and view detailed reports"
                href="/reports"
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-black shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-100">
                Recent Activity
              </h2>
              <select
                className="border rounded px-2 py-1 text-sm bg-black"
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
              >
                <option value="">Last 5</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            {activityLoading ? (
              <div>Loading recent activity...</div>
            ) : activityError ? (
              <div className="text-red-500">
                Failed to load recent activity.
              </div>
            ) : recentActivity?.logs?.length === 0 ? (
              <div>No recent activity found.</div>
            ) : (
              <div className="space-y-4">
                {recentActivity.logs.map((log: any) => (
                  <div
                    key={log.actionId}
                    className="flex items-center space-x-3"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="h-4 w-4 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-300">
                        {log.user?.name || log.user?.username || "Unknown User"}
                        : {log.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
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
};

export default Dashboard;
