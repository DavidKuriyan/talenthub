export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

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
                    role: 'admin' | 'provider' | 'subscriber'
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    email: string
                    role?: 'admin' | 'provider' | 'subscriber'
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    email?: string
                    role?: 'admin' | 'provider' | 'subscriber'
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
                    tenant_id: string
                    room_id: string
                    sender_id: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    room_id: string
                    sender_id: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    room_id?: string
                    sender_id?: string
                    content?: string
                    created_at?: string
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
            }
        }
    }
}
