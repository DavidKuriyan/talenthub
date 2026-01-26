export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Helper type to extract table Row types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    is_active?: boolean
                    created_at?: string
                }
            }
            users: {
                Row: {
                    id: string
                    tenant_id: string
                    email: string
                    role: 'admin' | 'provider' | 'subscriber' | 'super_admin'
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    email: string
                    role?: 'admin' | 'provider' | 'subscriber' | 'super_admin'
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    email?: string
                    role?: 'admin' | 'provider' | 'subscriber' | 'super_admin'
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    price: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    price: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    price?: number
                    created_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    tenant_id: string
                    user_id: string
                    total: number
                    status: 'pending' | 'paid' | 'cancelled'
                    razorpay_order_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    user_id: string
                    total: number
                    status?: 'pending' | 'paid' | 'cancelled'
                    razorpay_order_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    user_id?: string
                    total?: number
                    status?: 'pending' | 'paid' | 'cancelled'
                    razorpay_order_id?: string | null
                    created_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    match_id: string
                    sender_id: string
                    sender_role: 'organization' | 'engineer'
                    content: string
                    deleted_by: string[] | null
                    tenant_id: string | null
                    created_at: string
                    is_system_message: boolean
                }
                Insert: {
                    id?: string
                    match_id: string
                    sender_id: string
                    sender_role?: 'organization' | 'engineer'
                    content: string
                    deleted_by?: string[] | null
                    tenant_id?: string | null
                    created_at?: string
                    is_system_message?: boolean
                }
                Update: {
                    id?: string
                    match_id?: string
                    sender_id?: string
                    sender_role?: 'organization' | 'engineer'
                    content?: string
                    deleted_by?: string[] | null
                    tenant_id?: string | null
                    created_at?: string
                    is_system_message?: boolean
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    tenant_id: string
                    user_id: string | null
                    action: string
                    details: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    user_id?: string | null
                    action: string
                    details?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    user_id?: string | null
                    action?: string
                    details?: Json | null
                    created_at?: string
                }
            },
            requirements: {
                Row: {
                    id: string
                    tenant_id: string
                    client_id: string
                    title: string
                    skills: Json
                    budget: number | null
                    status: 'open' | 'closed' | 'fulfilled'
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    client_id: string
                    title: string
                    skills?: Json
                    budget?: number | null
                    status?: 'open' | 'closed' | 'fulfilled'
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    client_id?: string
                    title?: string
                    skills?: Json
                    budget?: number | null
                    status?: 'open' | 'closed' | 'fulfilled'
                    created_at?: string
                }
            },
            profiles: {
                Row: {
                    id: string
                    user_id: string
                    tenant_id: string
                    skills: Json
                    experience_years: number
                    resume_url: string | null
                    availability: 'available' | 'busy' | 'unavailable'
                    desired_salary: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    tenant_id: string
                    skills?: Json
                    experience_years?: number
                    resume_url?: string | null
                    availability?: 'available' | 'busy' | 'unavailable'
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    tenant_id?: string
                    skills?: Json
                    experience_years?: number
                    resume_url?: string | null
                    availability?: 'available' | 'busy' | 'unavailable'
                    created_at?: string
                }
            },
            matches: {
                Row: {
                    id: string
                    tenant_id: string
                    requirement_id: string
                    profile_id: string
                    score: number
                    status: 'pending' | 'interview_scheduled' | 'hired' | 'rejected'
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    requirement_id: string
                    profile_id: string
                    score?: number
                    status?: 'pending' | 'interview_scheduled' | 'hired' | 'rejected'
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    requirement_id?: string
                    profile_id?: string
                    score?: number
                    status?: 'pending' | 'interview_scheduled' | 'hired' | 'rejected'
                    created_at?: string
                }
            },
            interviews: {
                Row: {
                    id: string
                    tenant_id: string
                    match_id: string
                    scheduled_at: string
                    jitsi_room_id: string
                    status: 'scheduled' | 'completed' | 'cancelled'
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    match_id: string
                    scheduled_at: string
                    jitsi_room_id: string
                    status?: 'scheduled' | 'completed' | 'cancelled'
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    match_id?: string
                    scheduled_at?: string
                    jitsi_room_id?: string
                    status?: 'scheduled' | 'completed' | 'cancelled'
                    notes?: string | null
                    created_at?: string
                }
            },
            offer_letters: {
                Row: {
                    id: string
                    tenant_id: string
                    match_id: string
                    salary: number
                    start_date: string
                    document_url: string | null
                    status: 'pending' | 'accepted' | 'rejected'
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    match_id: string
                    salary: number
                    start_date: string
                    document_url?: string | null
                    status?: 'pending' | 'accepted' | 'rejected'
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    match_id?: string
                    salary?: number
                    start_date?: string
                    document_url?: string | null
                    status?: 'pending' | 'accepted' | 'rejected'
                    created_at?: string
                }
            },
            invoices: {
                Row: {
                    id: string
                    tenant_id: string
                    match_id: string | null
                    engineer_id: string | null
                    amount: number
                    razorpay_order_id: string | null
                    razorpay_payment_id: string | null
                    status: 'pending' | 'paid' | 'failed'
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    match_id?: string | null
                    engineer_id?: string | null
                    amount: number
                    razorpay_order_id?: string | null
                    razorpay_payment_id?: string | null
                    status?: 'pending' | 'paid' | 'failed'
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    match_id?: string | null
                    engineer_id?: string | null
                    amount?: number
                    razorpay_order_id?: string | null
                    razorpay_payment_id?: string | null
                    status?: 'pending' | 'paid' | 'failed'
                    description?: string | null
                    created_at?: string
                }
            }
        }
    }
}

