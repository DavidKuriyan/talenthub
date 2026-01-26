"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RequirementActionsProps {
    requirementId: string;
    onClose?: () => void;
}

export default function RequirementActions({ requirementId, onClose }: RequirementActionsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleClose = async () => {
        if (!confirm("Are you sure you want to close this requirement?")) return;

        setLoading(true);
        try {
            await fetch('/api/requirements/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: requirementId, status: 'closed' })
            });
            router.refresh();
        } catch (error) {
            console.error("Error closing requirement:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium disabled:opacity-50"
        >
            {loading ? "Closing..." : "Close"}
        </button>
    );
}
