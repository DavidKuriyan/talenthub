"use client";

import { useCart } from "@/context/CartContext";
import { Tables } from "@/lib/supabase";

export default function AddToCartButton({ product }: { product: Tables<"products"> }) {
    const { addToCart } = useCart();

    return (
        <button
            onClick={() => addToCart(product)}
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-50 px-5 py-3 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
            Add to Cart
        </button>
    );
}
