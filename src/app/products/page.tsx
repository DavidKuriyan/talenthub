import { createClient } from "@/lib/server";
import AddToCartButton from "@/components/cart/AddToCartButton";
import CartSummary from "@/components/cart/CartSummary";

export default async function ProductsPage() {
    const supabase = await createClient();

    // @aiNote In production, the tenant_id would be derived from the auth session/middleware header.
    // For demonstration, we fetch products and rely on the RLS policies in Supabase.
    const { data: products, error } = await supabase
        .from("products")
        .select("*");

    if (error) {
        return <div className="p-8 text-red-500">Error loading products: {error.message}</div>;
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {products?.map((product) => (
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

            {products?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-zinc-500 dark:text-zinc-400">No products found for this tenant.</p>
                </div>
            )}
        </div>
    );
}
