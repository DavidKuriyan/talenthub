"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * @feature MOBILE_NAVIGATION
 * Fixed bottom navigation bar for mobile devices (< 768px).
 * Provides quick access to Home, Orders, Chat, and Profile.
 * 
 * @aiNote This component is hidden on desktop via md:hidden class.
 * If changing routes, also update the admin layout navigation.
 */
export default function MobileBottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: "🏠", label: "Home" },
        { href: "/client/orders", icon: "📦", label: "Orders" },
        { href: "/chat", icon: "💬", label: "Chat" },
        { href: "/client/dashboard", icon: "👤", label: "Profile" },
    ];

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive(item.href)
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                            }`}
                    >
                        <span className="text-xl mb-1">{item.icon}</span>
                        <span className="text-xs font-medium">{item.label}</span>
                        {isActive(item.href) && (
                            <span className="absolute bottom-1 w-8 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                        )}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
