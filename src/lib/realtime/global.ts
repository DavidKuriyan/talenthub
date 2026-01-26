import { supabase } from "@/lib/supabase"

export type GlobalTable = 'matches' | 'interviews' | 'requirements' | 'profiles' | 'messages'

/**
 * Subscribe to any table for the Event Bus.
 * Filters by tenant_id or profile_id depending on context.
 */
export function subscribeToTable({
    table,
    filterColumn,
    filterValue,
    onChange
}: {
    table: GlobalTable
    filterColumn: 'tenant_id' | 'profile_id' | 'user_id' | 'id'
    filterValue: string
    onChange: (payload: any) => void
}) {
    const channel = supabase
        .channel(`global:${table}:${filterValue}`)
        .on(
            "postgres_changes",
            {
                event: "*", // Listen to INSERT, UPDATE, DELETE
                schema: "public",
                table: table,
                filter: `${filterColumn}=eq.${filterValue}`,
            },
            (payload) => {
                onChange(payload)
            }
        )
        .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
}
