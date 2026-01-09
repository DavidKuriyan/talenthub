"use client";

import { useEffect, useState } from "react";
import {
    queryAuditLogs,
    detectSuspiciousActivity,
    downloadAuditReport,
    subscribeToAuditLogs,
    type AuditLog,
    type SuspiciousActivity,
} from "@/lib/audit";

/**
 * @feature admin:audit-logs
 * Admin dashboard for viewing and monitoring audit logs
 */
export default function AuditLogDashboard() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [alerts, setAlerts] = useState<SuspiciousActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("");
    const [hoursBack, setHoursBack] = useState(24);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load audit logs
                const auditLogs = await queryAuditLogs(
                    filter || undefined,
                    hoursBack,
                    100
                );
                setLogs(auditLogs);

                // Load suspicious activity alerts
                const suspicious = await detectSuspiciousActivity();
                setAlerts(suspicious);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load audit logs");
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToAuditLogs((newLog) => {
            setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
        }, filter);

        return () => unsubscribe();
    }, [filter, hoursBack]);

    const handleExport = async () => {
        try {
            await downloadAuditReport(`audit_report_${Date.now()}.csv`, hoursBack);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to export audit logs");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                    Audit & Security Log
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Monitor all system activities and security events
                </p>
            </header>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div className="mb-8 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                    <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4">
                        🚨 Security Alerts ({alerts.length})
                    </h2>
                    <div className="space-y-3">
                        {alerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/30"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                                            {alert.alert_type.replace(/_/g, " ").toUpperCase()}
                                        </p>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                            {alert.action} - {alert.count_in_window} operations
                                        </p>
                                    </div>
                                    <span className="text-xs font-mono text-red-600 dark:text-red-400">
                                        {alert.user_id?.substring(0, 8)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls Section */}
            <div className="mb-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                    Filters & Actions
                </h2>
                <div className="flex flex-col lg:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Filter by action (e.g., users_insert, orders_update)..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
                    />
                    <select
                        value={hoursBack}
                        onChange={(e) => setHoursBack(Number(e.target.value))}
                        className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
                    >
                        <option value={1}>Last 1 hour</option>
                        <option value={6}>Last 6 hours</option>
                        <option value={24}>Last 24 hours</option>
                        <option value={72}>Last 3 days</option>
                        <option value={168}>Last 7 days</option>
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={loading || logs.length === 0}
                        className="px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                        📥 Export CSV
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-8 p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Logs Section */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        Activity Log ({logs.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-zinc-500">
                        <p className="animate-pulse">Loading audit logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                        <p>No audit logs found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-zinc-900 dark:text-zinc-50">
                                        Timestamp
                                    </th>
                                    <th className="text-left p-4 font-semibold text-zinc-900 dark:text-zinc-50">
                                        Action
                                    </th>
                                    <th className="text-left p-4 font-semibold text-zinc-900 dark:text-zinc-50">
                                        User
                                    </th>
                                    <th className="text-left p-4 font-semibold text-zinc-900 dark:text-zinc-50">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <td className="p-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-block px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                                            {log.user_id ? log.user_id.substring(0, 8) + "..." : "system"}
                                        </td>
                                        <td className="p-4">
                                            <details className="cursor-pointer">
                                                <summary className="text-blue-600 dark:text-blue-400 hover:underline">
                                                    View Details
                                                </summary>
                                                <pre className="mt-2 p-3 rounded bg-zinc-100 dark:bg-zinc-800 text-xs overflow-auto max-h-48 text-zinc-900 dark:text-zinc-50">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
