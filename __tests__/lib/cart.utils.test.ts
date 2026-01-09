/**
 * @feature CART_MANAGEMENT
 * Unit tests for cart total calculation
 */

import { describe, it, expect } from '@jest/globals';

// Mock cart item type
interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

/**
 * Calculate total price for cart items
 * @param items - Array of cart items
 * @returns Total price
 */
function calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

describe('Cart Utilities', () => {
    describe('calculateTotal', () => {
        it('should return 0 for empty cart', () => {
            expect(calculateTotal([])).toBe(0);
        });

        it('should calculate total for single item', () => {
            const items: CartItem[] = [
                { id: '1', name: 'Product A', price: 1000, quantity: 1 }
            ];
            expect(calculateTotal(items)).toBe(1000);
        });

        it('should calculate total for multiple quantities', () => {
            const items: CartItem[] = [
                { id: '1', name: 'Product A', price: 1000, quantity: 3 }
            ];
            expect(calculateTotal(items)).toBe(3000);
        });

        it('should calculate total for multiple items', () => {
            const items: CartItem[] = [
                { id: '1', name: 'Product A', price: 1000, quantity: 2 },
                { id: '2', name: 'Product B', price: 500, quantity: 1 },
                { id: '3', name: 'Product C', price: 2000, quantity: 1 }
            ];
            expect(calculateTotal(items)).toBe(4500);
        });

        it('should handle decimal prices correctly', () => {
            const items: CartItem[] = [
                { id: '1', name: 'Product A', price: 99.99, quantity: 2 }
            ];
            expect(calculateTotal(items)).toBeCloseTo(199.98, 2);
        });

        it('should handle zero price items', () => {
            const items: CartItem[] = [
                { id: '1', name: 'Free Item', price: 0, quantity: 5 }
            ];
            expect(calculateTotal(items)).toBe(0);
        });
    });
});

export { calculateTotal };
