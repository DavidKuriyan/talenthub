"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Notification {
    id: string;
    type: "match" | "interview" | "offer" | "payment" | "system";
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

/**
 * @feature NOTIFICATIONS
 * @aiNote Real-time notification bell component for the header.
 * Shows unread count and dropdown with recent notifications.
 */
export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        subscribeToNotifications();

        // Close dropdown on outside click
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // For now, generate mock notifications based on user's data
            // In production, this would fetch from a notifications table
            const mockNotifications: Notification[] = [
                {
                    id: "1",
                    type: "match",
                    title: "New Job Match!",
                    message: "You've been matched with a new job requirement.",
                    read: false,
                    created_at: new Date().toISOString()
                }
            ];

            // Fetch real data - interviews, offers
            const [interviewsRes, offersRes] = await Promise.all([
                supabase.from("interviews").select("id, scheduled_at, status").eq("status", "scheduled").limit(3),
                supabase.from("offer_letters").select("id, status, created_at").eq("status", "pending").limit(3)
            ]);

            const interviewNotifs: Notification[] = (interviewsRes.data || []).map((i: any) => ({
                id: `int-${i.id}`,
                type: "interview" as const,
                title: "Interview Scheduled",
                message: `Interview on ${new Date(i.scheduled_at).toLocaleDateString()}`,
                read: false,
                created_at: i.scheduled_at
            }));

            const offerNotifs: Notification[] = (offersRes.data || []).map((o: any) => ({
                id: `off-${o.id}`,
                type: "offer" as const,
                title: "New Offer Letter",
                message: "You have a pending offer to review.",
                read: false,
                created_at: o.created_at
            }));

            setNotifications([...interviewNotifs, ...offerNotifs, ...mockNotifications].slice(0, 5));
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToNotifications = () => {
        // Subscribe to real-time updates for matches, interviews, offers
        const channel = supabase
            .channel("notifications")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, () => {
                fetchNotifications();
            })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "interviews" }, () => {
                fetchNotifications();
            })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "offer_letters" }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "match": return "🎯";
            case "interview": return "🎥";
            case "offer": return "📄";
            case "payment": return "💰";
            case "system": return "🔔";
            default: return "📣";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-50">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-blue-600 hover:text-blue-700"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <span className="text-xl">{getIcon(notif.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-50">{notif.title}</p>
                                                <p className="text-xs text-zinc-500 mt-1 truncate">{notif.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-zinc-400">
                                No notifications yet
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
