/**
 * Audit Logging Utilities
 * 
 * Client-side helpers for logging sensitive operations and querying audit logs.
 */

import { supabase } from "./supabase";

export interface AuditLog {
    id: string;
    tenant_id: string;
    user_id: string | null;
    action: string;
    details: Record<string, any>;
    created_at: string;
}

export interface SuspiciousActivity {
    alert_type: string;
    user_id: string | null;
    action: string;
    count_in_window: number;
    created_at: string;
}

/**
 * Log a sensitive operation
 */
export async function logSensitiveOperation(
    action: string,
    details: Record<string, any>,
    severity: "info" | "warning" | "error" = "info"
): Promise<string | null> {
    try {
        const { data, error } = await supabase.rpc("log_sensitive_operation", {
            p_action: action,
            p_details: details,
            p_severity: severity,
        });

        if (error) {
            console.error("Error logging operation:", error);
            return null;
        }

        return data;
    } catch (err) {
        console.error("Error in logSensitiveOperation:", err);
        return null;
    }
}

/**
 * Query audit logs with optional filtering
 * Admin only
 */
export async function queryAuditLogs(
    actionFilter?: string,
    hoursBack: number = 24,
    limit: number = 100
): Promise<AuditLog[]> {
    try {
        const { data, error } = await supabase.rpc("query_audit_logs", {
            p_action_filter: actionFilter,
            p_hours_back: hoursBack,
            p_limit: limit,
        });

        if (error) {
            console.error("Error querying audit logs:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Error in queryAuditLogs:", err);
        return [];
    }
}

/**
 * Export audit logs for compliance
 * Admin only
 */
export async function exportAuditLogs(
    startDate?: Date,
    endDate: Date = new Date()
): Promise<AuditLog[]> {
    try {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        const { data, error } = await supabase.rpc("export_audit_logs", {
            p_start_date: start.toISOString(),
            p_end_date: endDate.toISOString(),
        });

        if (error) {
            console.error("Error exporting audit logs:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Error in exportAuditLogs:", err);
        return [];
    }
}

/**
 * Detect suspicious activity patterns
 * Admin only
 */
export async function detectSuspiciousActivity(): Promise<SuspiciousActivity[]> {
    try {
        const { data, error } = await supabase.rpc("detect_suspicious_activity");

        if (error) {
            console.error("Error detecting suspicious activity:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Error in detectSuspiciousActivity:", err);
        return [];
    }
}

/**
 * Get audit log summary
 */
export async function getAuditLogSummary() {
    try {
        const { data, error } = await supabase
            .from("audit_log_summary")
            .select("*")
            .order("hour", { ascending: false })
            .limit(24);

        if (error) {
            console.error("Error getting audit log summary:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Error in getAuditLogSummary:", err);
        return [];
    }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
    eventType: "login" | "logout" | "registration" | "password_change" | "auth_failure",
    details?: Record<string, any>
): Promise<void> {
    const severity = eventType === "auth_failure" ? "warning" : "info";

    await logSensitiveOperation(
        `auth_${eventType}`,
        {
            event_type: eventType,
            ip_address: await getClientIpAddress(),
            user_agent: navigator.userAgent,
            ...details,
        },
        severity
    );
}

/**
 * Log cart activity
 */
export async function logCartActivity(
    action: "add" | "remove" | "clear" | "checkout",
    productId?: string,
    quantity?: number
): Promise<void> {
    await logSensitiveOperation(
        `cart_${action}`,
        {
            product_id: productId,
            quantity,
            action,
        },
        "info"
    );
}

/**
 * Log payment event
 */
export async function logPaymentEvent(
    eventType: "initiated" | "success" | "failure" | "refund",
    orderId: string,
    details?: Record<string, any>
): Promise<void> {
    const severity = eventType === "failure" ? "warning" : "info";

    await logSensitiveOperation(
        `payment_${eventType}`,
        {
            order_id: orderId,
            event_type: eventType,
            ...details,
        },
        severity
    );
}

/**
 * Log chat message activity
 */
export async function logChatActivity(
    action: "send" | "delete" | "edit",
    roomId: string,
    messageContent?: string
): Promise<void> {
    await logSensitiveOperation(
        `chat_${action}`,
        {
            room_id: roomId,
            message_preview: messageContent?.substring(0, 100),
            action,
        },
        "info"
    );
}

/**
 * Log data access
 */
export async function logDataAccess(
    resourceType: string,
    resourceId: string,
    accessType: "read" | "write" | "delete"
): Promise<void> {
    await logSensitiveOperation(
        `data_access_${accessType}`,
        {
            resource_type: resourceType,
            resource_id: resourceId,
            access_type: accessType,
        },
        "info"
    );
}

/**
 * Log admin action
 */
export async function logAdminAction(
    action: string,
    targetId: string,
    details?: Record<string, any>
): Promise<void> {
    await logSensitiveOperation(
        `admin_${action}`,
        {
            target_id: targetId,
            action,
            ...details,
        },
        "warning"
    );
}

/**
 * Helper: Get client IP address
 * Note: This is a best-effort approach. In production, you should get IP from backend.
 */
async function getClientIpAddress(): Promise<string | null> {
    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
    } catch {
        return null;
    }
}

/**
 * Setup real-time audit log listener (for admins)
 */
export function subscribeToAuditLogs(
    onNewLog: (log: AuditLog) => void,
    actionFilter?: string
) {
    const channel = supabase
        .channel("audit_logs_realtime")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "audit_logs",
                filter: actionFilter ? `action=like.${actionFilter}*` : undefined,
            },
            (payload) => {
                onNewLog(payload.new as AuditLog);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Generate audit report
 */
export async function generateAuditReport(
    format: "json" | "csv" = "json",
    hoursBack: number = 24
) {
    try {
        const logs = await queryAuditLogs(undefined, hoursBack, 10000);

        if (format === "csv") {
            return convertToCSV(logs);
        }

        return logs;
    } catch (err) {
        console.error("Error generating audit report:", err);
        return null;
    }
}

/**
 * Convert audit logs to CSV
 */
function convertToCSV(logs: AuditLog[]): string {
    const headers = ["ID", "Tenant ID", "User ID", "Action", "Details", "Created At"];
    const rows = logs.map((log) => [
        log.id,
        log.tenant_id,
        log.user_id || "",
        log.action,
        JSON.stringify(log.details),
        log.created_at,
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csvContent;
}

/**
 * Download audit report as file
 */
export async function downloadAuditReport(
    filename: string = "audit_report.csv",
    hoursBack: number = 24
) {
    try {
        const csv = await generateAuditReport("csv", hoursBack);

        if (!csv) {
            console.error("Failed to generate audit report");
            return;
        }

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error downloading audit report:", err);
    }
}
