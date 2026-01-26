"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [role, setRole] = useState<'organization' | 'engineer' | null>(null);

    useEffect(() => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userRole = session?.user?.app_metadata?.role || session?.user?.user_metadata?.role;
            if (userRole === 'provider' || userRole === 'engineer') setRole('engineer');
            else if (userRole === 'client' || userRole === 'organization') setRole('organization');
        };
        checkRole();
    }, []);

    const navItems = role === 'engineer' ? [
        { href: "/engineer", icon: "🏠", label: "Home" },
        { href: "/engineer/jobs", icon: "🎯", label: "Jobs" },
        { href: "/engineer/messages", icon: "💬", label: "Chat" },
        { href: "/engineer/profile", icon: "👤", label: "Profile" },
    ] : [
        { href: "/organization/dashboard", icon: "🏠", label: "Home" },
        { href: "/organization/matching", icon: "🎯", label: "Match" },
        { href: "/organization/messages", icon: "💬", label: "Chat" },
        { href: "/organization/engineers", icon: "👨‍💻", label: "Pool" },
    ];

    if (!role && (pathname === '/' || pathname === '/login')) return null;

    const isActive = (href: string) => {
        if (href === "/" || href === "/organization/dashboard") {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-900 border-t border-white/5 shadow-2xl">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 ${isActive(item.href)
                            ? "text-indigo-400"
                            : "text-zinc-500 hover:text-zinc-300"
                            }`}
                    >
                        <span className="text-xl mb-1">{item.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        {isActive(item.href) && (
                            <span className="absolute bottom-1 w-6 h-1 bg-indigo-500 rounded-full" />
                        )}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
