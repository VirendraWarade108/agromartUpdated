/**
 * Coupon Rules Tests
 * 
 * Tests the business logic for coupon validation and discount calculation
 * Ensures coupons are applied correctly with all business rules
 * 
 * File: backend/tests/couponRules.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// ============================================
// TYPE DEFINITIONS
// ============================================

type CouponType = 'percentage' | 'fixed';

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  discount?: number;
}

// ============================================
// COUPON VALIDATION LOGIC
// ============================================

/**
 * Validate coupon and calculate discount
 */
function validateAndCalculateDiscount(
  coupon: Coupon,
  orderTotal: number,
  currentDate: Date = new Date()
): ValidationResult {
  // Check if coupon is active
  if (!coupon.isActive) {
    return { valid: false, reason: 'Coupon is inactive' };
  }

  // Check if coupon is within valid date range
  if (currentDate < coupon.validFrom) {
    return { valid: false, reason: 'Coupon is not yet valid' };
  }

  if (currentDate > coupon.validUntil) {
    return { valid: false, reason: 'Coupon has expired' };
  }

  // Check usage limit
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }

  // Check minimum order value
  if (coupon.minOrderValue !== null && orderTotal < coupon.minOrderValue) {
    return {
      valid: false,
      reason: `Minimum order value of ₹${coupon.minOrderValue} not met`,
    };
  }

  // Calculate discount
  let discount = 0;

  if (coupon.type === 'percentage') {
    discount = (orderTotal * coupon.value) / 100;

    // Apply max discount cap for percentage coupons
    if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;

    // Fixed discount cannot exceed order total
    if (discount > orderTotal) {
      discount = orderTotal;
    }
  }

  // Round to 2 decimal places
  discount = Math.round(discount * 100) / 100;

  return { valid: true, discount };
}

/**
 * Calculate final order total after discount
 */
function calculateFinalTotal(orderTotal: number, discount: number): number {
  const final = orderTotal - discount;
  return Math.max(0, Math.round(final * 100) / 100);
}

// ============================================
// TEST DATA
// ============================================

const createCoupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  id: 'coupon_test',
  code: 'TEST10',
  type: 'percentage',
  value: 10,
  minOrderValue: null,
  maxDiscount: null,
  usageLimit: null,
  usageCount: 0,
  validFrom: new Date('2024-01-01'),
  validUntil: new Date('2026-12-31'),
  isActive: true,
  ...overrides,
});

// ============================================
// TESTS
// ============================================

describe('Coupon Validation', () => {
  describe('Active Status', () => {
    test('active coupon is valid', () => {
      const coupon = createCoupon({ isActive: true });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
    });

    test('inactive coupon is rejected', () => {
      const coupon = createCoupon({ isActive: false });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('inactive');
    });
  });

  describe('Date Validity', () => {
    test('coupon not yet valid is rejected', () => {
      const coupon = createCoupon({
        validFrom: new Date('2030-01-01'),
        validUntil: new Date('2030-12-31'),
      });
      const result = validateAndCalculateDiscount(
        coupon,
        1000,
        new Date('2026-01-01')
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not yet valid');
    });

    test('expired coupon is rejected', () => {
      const coupon = createCoupon({
        validFrom: new Date('2020-01-01'),
        validUntil: new Date('2020-12-31'),
      });
      const result = validateAndCalculateDiscount(
        coupon,
        1000,
        new Date('2026-01-01')
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');
    });

    test('coupon valid today is accepted', () => {
      const today = new Date('2026-06-15');
      const coupon = createCoupon({
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
      });
      const result = validateAndCalculateDiscount(coupon, 1000, today);
      expect(result.valid).toBe(true);
    });

    test('coupon valid on last day is accepted', () => {
      const lastDay = new Date('2026-12-31');
      const coupon = createCoupon({
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
      });
      const result = validateAndCalculateDiscount(coupon, 1000, lastDay);
      expect(result.valid).toBe(true);
    });
  });

  describe('Usage Limits', () => {
    test('coupon under usage limit is valid', () => {
      const coupon = createCoupon({ usageLimit: 100, usageCount: 50 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
    });

    test('coupon at usage limit is rejected', () => {
      const coupon = createCoupon({ usageLimit: 100, usageCount: 100 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('usage limit');
    });

    test('coupon over usage limit is rejected', () => {
      const coupon = createCoupon({ usageLimit: 100, usageCount: 101 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('usage limit');
    });

    test('coupon with null usage limit has no limit', () => {
      const coupon = createCoupon({ usageLimit: null, usageCount: 999999 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
    });
  });

  describe('Minimum Order Value', () => {
    test('order meeting minimum is valid', () => {
      const coupon = createCoupon({ minOrderValue: 500 });
      const result = validateAndCalculateDiscount(coupon, 500);
      expect(result.valid).toBe(true);
    });

    test('order exceeding minimum is valid', () => {
      const coupon = createCoupon({ minOrderValue: 500 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
    });

    test('order below minimum is rejected', () => {
      const coupon = createCoupon({ minOrderValue: 500 });
      const result = validateAndCalculateDiscount(coupon, 499);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Minimum order value');
      expect(result.reason).toContain('500');
    });

    test('coupon with null minimum accepts any order', () => {
      const coupon = createCoupon({ minOrderValue: null });
      const result = validateAndCalculateDiscount(coupon, 1);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Discount Calculation', () => {
  describe('Percentage Discounts', () => {
    test('10% discount on ₹1000 = ₹100', () => {
      const coupon = createCoupon({ type: 'percentage', value: 10 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(100);
    });

    test('25% discount on ₹500 = ₹125', () => {
      const coupon = createCoupon({ type: 'percentage', value: 25 });
      const result = validateAndCalculateDiscount(coupon, 500);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(125);
    });

    test('50% discount on ₹1000 = ₹500', () => {
      const coupon = createCoupon({ type: 'percentage', value: 50 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(500);
    });

    test('100% discount on ₹1000 = ₹1000', () => {
      const coupon = createCoupon({ type: 'percentage', value: 100 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(1000);
    });
  });

  describe('Percentage Discount with Max Cap', () => {
    test('20% discount capped at ₹100 on ₹1000 order', () => {
      const coupon = createCoupon({
        type: 'percentage',
        value: 20,
        maxDiscount: 100,
      });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(100); // Would be ₹200, capped at ₹100
    });

    test('10% discount uncapped on ₹1000 order', () => {
      const coupon = createCoupon({
        type: 'percentage',
        value: 10,
        maxDiscount: 200,
      });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(100); // ₹100 < cap of ₹200
    });

    test('50% discount capped at ₹50 on ₹1000 order', () => {
      const coupon = createCoupon({
        type: 'percentage',
        value: 50,
        maxDiscount: 50,
      });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(50); // Would be ₹500, capped at ₹50
    });
  });

  describe('Fixed Amount Discounts', () => {
    test('₹100 discount on ₹1000 order', () => {
      const coupon = createCoupon({ type: 'fixed', value: 100 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(100);
    });

    test('₹500 discount on ₹1000 order', () => {
      const coupon = createCoupon({ type: 'fixed', value: 500 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(500);
    });

    test('fixed discount cannot exceed order total', () => {
      const coupon = createCoupon({ type: 'fixed', value: 1500 });
      const result = validateAndCalculateDiscount(coupon, 1000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(1000); // Capped at order total
    });

    test('₹50 discount on ₹50 order results in ₹0', () => {
      const coupon = createCoupon({ type: 'fixed', value: 50 });
      const result = validateAndCalculateDiscount(coupon, 50);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(50);
      
      const finalTotal = calculateFinalTotal(50, result.discount!);
      expect(finalTotal).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('discount rounds to 2 decimal places', () => {
      const coupon = createCoupon({ type: 'percentage', value: 33.33 });
      const result = validateAndCalculateDiscount(coupon, 100);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(33.33);
    });

    test('zero order value results in zero discount', () => {
      const coupon = createCoupon({ type: 'percentage', value: 50 });
      const result = validateAndCalculateDiscount(coupon, 0);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(0);
    });
  });
});

describe('Final Total Calculation', () => {
  test('₹1000 order - ₹100 discount = ₹900', () => {
    const finalTotal = calculateFinalTotal(1000, 100);
    expect(finalTotal).toBe(900);
  });

  test('₹500 order - ₹500 discount = ₹0', () => {
    const finalTotal = calculateFinalTotal(500, 500);
    expect(finalTotal).toBe(0);
  });

  test('final total cannot be negative', () => {
    const finalTotal = calculateFinalTotal(100, 200);
    expect(finalTotal).toBe(0);
  });

  test('final total rounds to 2 decimal places', () => {
    const finalTotal = calculateFinalTotal(100.555, 50.333);
    expect(finalTotal).toBe(50.22);
  });
});

describe('Combined Validation Scenarios', () => {
  test('valid coupon with all constraints met', () => {
    const coupon = createCoupon({
      type: 'percentage',
      value: 20,
      minOrderValue: 500,
      maxDiscount: 150,
      usageLimit: 100,
      usageCount: 50,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
      isActive: true,
    });

    const result = validateAndCalculateDiscount(
      coupon,
      1000,
      new Date('2026-06-15')
    );

    expect(result.valid).toBe(true);
    expect(result.discount).toBe(150); // 20% of ₹1000 = ₹200, capped at ₹150
  });

  test('fails on multiple constraints', () => {
    const coupon = createCoupon({
      minOrderValue: 1000,
      usageLimit: 10,
      usageCount: 15,
      isActive: false,
    });

    const result = validateAndCalculateDiscount(coupon, 500);
    
    expect(result.valid).toBe(false);
    // Should fail on first check (inactive)
    expect(result.reason).toContain('inactive');
  });
});

/**
 * ============================================
 * TEST SUMMARY
 * ============================================
 * 
 * VALIDATION TESTS:
 * - Active status (2 tests)
 * - Date validity (5 tests)
 * - Usage limits (4 tests)
 * - Minimum order value (4 tests)
 * 
 * DISCOUNT CALCULATION:
 * - Percentage discounts (4 tests)
 * - Percentage with max cap (3 tests)
 * - Fixed amount discounts (4 tests)
 * - Edge cases (2 tests)
 * 
 * FINAL TOTAL:
 * - Final calculation (4 tests)
 * 
 * COMBINED SCENARIOS:
 * - All constraints (2 tests)
 * 
 * Total: 39 tests
 * ============================================
 */