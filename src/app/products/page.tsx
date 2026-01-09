/**
 * @feature MARKETPLACE
 * Product listing page with cart integration
 * 
 * @aiNote Products are filtered by RLS policies in Supabase.
 * If "No products found" appears, check:
 * 1. Database has products (run supabase/seed.sql)
 * 2. RLS policies allow read access
 * 3. Tenant_id is set correctly in user JWT
 */

import { createClient } from "@/lib/server";
import AddToCartButton from "@/components/cart/AddToCartButton";
import CartSummary from "@/components/cart/CartSummary";

export default async function ProductsPage() {
    const supabase = await createClient();

    // Fetch products - RLS policies automatically filter by tenant
    const { data: products, error } = await supabase
        .from("products")
        .select("*");

    // Debug: Log for troubleshooting
    if (process.env.NODE_ENV === 'development') {
        console.log('Products query result:', {
            productsCount: products?.length || 0,
            error: error?.message,
            errorCode: error?.code
        });
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-4">
                            ❌ Error Loading Products
                        </h2>
                        <p className="text-red-600 dark:text-red-400 mb-4">
                            {error.message}
                        </p>
                        <div className="text-sm text-red-500 space-y-2">
                            <p><strong>Possible causes:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Database connection issue</li>
                                <li>RLS policies blocking access</li>
                                <li>Missing tenant_id in JWT</li>
                            </ul>
                            <p className="mt-4"><strong>Quick fix:</strong></p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Open Supabase SQL Editor</li>
                                <li>Run: <code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">SELECT * FROM products;</code></li>
                                <li>If error persists, run <code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">supabase/diagnostics.sql</code></li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">Available Placements</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                        Discover high-quality candidates for your organization.
                    </p>
                </div>
            </header>

            {products && products.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-all hover:shadow-md"
                            >
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                            {product.name}
                                        </h3>
                                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            ₹{(product.price / 100).toLocaleString()}
                                        </span>
                                    </div>

                                    <p className="text-zinc-600 dark:text-zinc-400">
                                        Premium placement service for verified {product.name.split(' ')[0]} professionals.
                                    </p>

                                    <AddToCartButton product={product} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <CartSummary />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 max-w-2xl">
                        <h3 className="text-xl font-bold text-amber-700 dark:text-amber-300 mb-4">
                            ⚠️ No Products Found
                        </h3>
                        <p className="text-amber-600 dark:text-amber-400 mb-4">
                            The database doesn't have any products yet.
                        </p>
                        <div className="text-left text-sm text-amber-700 dark:text-amber-300 space-y-3">
                            <p><strong>To fix this:</strong></p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Open your Supabase Dashboard</li>
                                <li>Go to <strong>SQL Editor</strong></li>
                                <li>Open file: <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">d:\Boot Camp\TalentHub\supabase\seed.sql</code></li>
                                <li>Copy all contents and paste in SQL Editor</li>
                                <li>Click <strong>RUN</strong></li>
                                <li>Refresh this page</li>
                            </ol>
                            <p className="mt-4 p-3 bg-amber-100 dark:bg-amber-900 rounded">
                                💡 <strong>Tip:</strong> The seed script will create 6 sample products (3 per tenant)
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
