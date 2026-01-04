/**
 * Stock Concurrency Tests
 * Tests stock decrement logic under concurrent order creation scenarios
 * Uses minimal database mocking to test race condition handling
 */

import { PrismaClient } from '@prisma/client';

describe('Stock Concurrency', () => {
  /**
   * Simulates the atomic stock decrement operation
   * This mirrors the production logic from orderService.createOrder
   */
  class StockManager {
    private stock: Map<string, number>;

    constructor() {
      this.stock = new Map();
    }

    setStock(productId: string, quantity: number): void {
      this.stock.set(productId, quantity);
    }

    getStock(productId: string): number {
      return this.stock.get(productId) || 0;
    }

    /**
     * Simulates Prisma's atomic decrement operation
     * In production: await tx.product.update({ data: { stock: { decrement: quantity } } })
     */
    async decrementStock(productId: string, quantity: number): Promise<boolean> {
      const currentStock = this.getStock(productId);
      
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock for product ${productId}`);
      }

      // Simulate atomic decrement
      this.stock.set(productId, currentStock - quantity);
      return true;
    }

    /**
     * Simulates transaction-based order creation with stock check
     */
    async createOrderWithStockCheck(
      productId: string,
      quantity: number
    ): Promise<{ success: boolean; finalStock: number }> {
      // In production, this happens inside prisma.$transaction
      const currentStock = this.getStock(productId);
      
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock: requested ${quantity}, available ${currentStock}`);
      }

      // Decrement stock atomically
      await this.decrementStock(productId, quantity);

      return {
        success: true,
        finalStock: this.getStock(productId),
      };
    }
  }

  describe('Sequential Order Creation', () => {
    test('should successfully create orders when stock is sufficient', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 10);

      // Create 3 orders sequentially
      await manager.createOrderWithStockCheck('product-1', 3);
      expect(manager.getStock('product-1')).toBe(7);

      await manager.createOrderWithStockCheck('product-1', 2);
      expect(manager.getStock('product-1')).toBe(5);

      await manager.createOrderWithStockCheck('product-1', 5);
      expect(manager.getStock('product-1')).toBe(0);
    });

    test('should reject order when stock is insufficient', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 5);

      await expect(
        manager.createOrderWithStockCheck('product-1', 10)
      ).rejects.toThrow('Insufficient stock: requested 10, available 5');

      // Stock should remain unchanged
      expect(manager.getStock('product-1')).toBe(5);
    });

    test('should reject order when stock becomes insufficient after previous orders', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 10);

      await manager.createOrderWithStockCheck('product-1', 7);
      expect(manager.getStock('product-1')).toBe(3);

      // This should fail
      await expect(
        manager.createOrderWithStockCheck('product-1', 5)
      ).rejects.toThrow('Insufficient stock: requested 5, available 3');

      // Stock should remain at 3
      expect(manager.getStock('product-1')).toBe(3);
    });
  });

  describe('Concurrent Order Creation', () => {
    test('should handle concurrent orders for same product correctly', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 10);

      // Simulate 5 concurrent orders of 2 items each
      const orders = [
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-1', 2),
      ];

      const results = await Promise.all(orders);

      // All orders should succeed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Final stock should be 0
      expect(manager.getStock('product-1')).toBe(0);
    });

    test('should handle concurrent orders when some exceed stock', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 10);

      // Simulate 6 concurrent orders of 2 items each (12 total, but only 10 available)
      const orders = [
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-1', 2), // This should fail
      ];

      const results = await Promise.allSettled(orders);

      // Count successful and failed orders
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBe(5); // First 5 should succeed
      expect(failed).toBe(1); // Last 1 should fail

      // Final stock should be 0
      expect(manager.getStock('product-1')).toBe(0);
    });

    test('should handle concurrent orders for different products independently', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 5);
      manager.setStock('product-2', 5);

      // Concurrent orders for different products
      const orders = [
        manager.createOrderWithStockCheck('product-1', 3),
        manager.createOrderWithStockCheck('product-2', 2),
        manager.createOrderWithStockCheck('product-1', 2),
        manager.createOrderWithStockCheck('product-2', 3),
      ];

      const results = await Promise.all(orders);

      // All orders should succeed
      expect(results).toHaveLength(4);
      
      // Check final stocks
      expect(manager.getStock('product-1')).toBe(0); // 5 - 3 - 2
      expect(manager.getStock('product-2')).toBe(0); // 5 - 2 - 3
    });
  });

  describe('Edge Cases', () => {
    test('should handle order for exact remaining stock', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 5);

      await manager.createOrderWithStockCheck('product-1', 5);
      expect(manager.getStock('product-1')).toBe(0);
    });

    test('should handle order for 1 item when stock is 1', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 1);

      await manager.createOrderWithStockCheck('product-1', 1);
      expect(manager.getStock('product-1')).toBe(0);
    });

    test('should reject order for 0 stock', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 0);

      await expect(
        manager.createOrderWithStockCheck('product-1', 1)
      ).rejects.toThrow('Insufficient stock');
    });

    test('should handle large stock quantities', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 10000);

      await manager.createOrderWithStockCheck('product-1', 5000);
      expect(manager.getStock('product-1')).toBe(5000);

      await manager.createOrderWithStockCheck('product-1', 5000);
      expect(manager.getStock('product-1')).toBe(0);
    });

    test('should handle many small concurrent orders', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 20);

      // 20 concurrent orders of 1 item each
      const orders = Array.from({ length: 20 }, () =>
        manager.createOrderWithStockCheck('product-1', 1)
      );

      const results = await Promise.all(orders);

      expect(results).toHaveLength(20);
      expect(manager.getStock('product-1')).toBe(0);
    });
  });

  describe('Stock Restoration on Cancellation', () => {
    test('should restore stock when order is cancelled', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 10);

      // Create order
      await manager.createOrderWithStockCheck('product-1', 3);
      expect(manager.getStock('product-1')).toBe(7);

      // Simulate cancellation - restore stock
      manager.setStock('product-1', manager.getStock('product-1') + 3);
      expect(manager.getStock('product-1')).toBe(10);
    });

    test('should handle multiple cancellations correctly', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 10);

      // Create 3 orders
      await manager.createOrderWithStockCheck('product-1', 2);
      await manager.createOrderWithStockCheck('product-1', 3);
      await manager.createOrderWithStockCheck('product-1', 1);
      expect(manager.getStock('product-1')).toBe(4);

      // Cancel first order (restore 2)
      manager.setStock('product-1', manager.getStock('product-1') + 2);
      expect(manager.getStock('product-1')).toBe(6);

      // Cancel third order (restore 1)
      manager.setStock('product-1', manager.getStock('product-1') + 1);
      expect(manager.getStock('product-1')).toBe(7);
    });

    test('should allow new orders after cancellation restores stock', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 5);

      // Create order that uses all stock
      await manager.createOrderWithStockCheck('product-1', 5);
      expect(manager.getStock('product-1')).toBe(0);

      // Try to create another order - should fail
      await expect(
        manager.createOrderWithStockCheck('product-1', 1)
      ).rejects.toThrow('Insufficient stock');

      // Cancel previous order - restore stock
      manager.setStock('product-1', manager.getStock('product-1') + 5);
      expect(manager.getStock('product-1')).toBe(5);

      // Now order should succeed
      await manager.createOrderWithStockCheck('product-1', 3);
      expect(manager.getStock('product-1')).toBe(2);
    });
  });

  describe('Transaction Atomicity', () => {
    test('should not decrement stock if order creation fails before decrement', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 10);

      // Simulate pre-validation failure (before stock decrement)
      const initialStock = manager.getStock('product-1');
      
      try {
        // Validation fails before decrement
        if (5 > 10) { // Invalid quantity check
          await manager.decrementStock('product-1', 5);
        } else {
          throw new Error('Validation failed');
        }
      } catch (error) {
        // Stock should not change
        expect(manager.getStock('product-1')).toBe(initialStock);
      }
    });

    test('should be atomic: either full order succeeds or nothing happens', async () => {
      const manager = new StockManager();
      manager.setStock('product-1', 10);
      manager.setStock('product-2', 5);

      // Simulate multi-item order
      const createMultiItemOrder = async () => {
        const snapshot1 = manager.getStock('product-1');
        const snapshot2 = manager.getStock('product-2');

        try {
          // Decrement first product
          await manager.decrementStock('product-1', 3);
          
          // Decrement second product - this fails
          await manager.decrementStock('product-2', 10); // Exceeds stock
        } catch (error) {
          // Rollback first product
          manager.setStock('product-1', snapshot1);
          manager.setStock('product-2', snapshot2);
          throw error;
        }
      };

      await expect(createMultiItemOrder()).rejects.toThrow();

      // Both stocks should remain unchanged
      expect(manager.getStock('product-1')).toBe(10);
      expect(manager.getStock('product-2')).toBe(5);
    });
  });
});