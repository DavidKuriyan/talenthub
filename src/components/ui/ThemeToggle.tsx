"use client";

import { useEffect, useState } from "react";

type ThemeType = "light" | "dark";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<ThemeType>("dark");
    const [mounted, setMounted] = useState(false);

    // Only run on client-side
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("theme") as ThemeType | null;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = stored || (prefersDark ? "dark" : "light");
        setTheme(initialTheme);
        document.documentElement.classList.toggle("dark", initialTheme === "dark");
    }, []);

    const toggleTheme = () => {
        const newTheme: ThemeType = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    // Avoid hydration mismatch
    if (!mounted) {
        return (
            <div className="w-14 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-zinc-200 dark:bg-zinc-800"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
            {/* Toggle Track */}
            <div
                className={`absolute inset-0 rounded-full transition-all duration-300 ${theme === "dark"
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                        : "bg-gradient-to-r from-amber-400 to-orange-500"
                    }`}
            />

            {/* Toggle Circle */}
            <div
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${theme === "dark" ? "translate-x-7" : "translate-x-0"
                    }`}
            >
                {/* Icon */}
                <div className="flex items-center justify-center w-full h-full text-xs">
                    {theme === "dark" ? "🌙" : "☀️"}
                </div>
            </div>
        </button>
    );
}
