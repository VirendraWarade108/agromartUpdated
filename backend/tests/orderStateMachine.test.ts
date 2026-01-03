/**
 * Order State Machine Tests
 * 
 * Tests the business logic for order state transitions
 * Ensures orders can only move through valid states
 * 
 * File: backend/tests/orderStateMachine.test.ts
 * 
 * IMPORTANT: Create the folder backend/tests before adding this file
 */

import { describe, test, expect } from '@jest/globals';

// ============================================
// ORDER STATE DEFINITIONS
// ============================================

type OrderStatus = 
  | 'pending'      // Initial state after order creation
  | 'processing'   // Payment confirmed, order being prepared
  | 'shipped'      // Order dispatched
  | 'delivered'    // Order completed successfully
  | 'cancelled'    // Order cancelled by user or system
  | 'refunded';    // Payment refunded

// ============================================
// STATE TRANSITION RULES
// ============================================

/**
 * Valid state transitions map
 * Key: current state
 * Value: array of valid next states
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [], // Terminal state
  refunded: [],  // Terminal state
};

/**
 * Check if a state transition is valid
 */
function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

/**
 * Get valid next states for current state
 */
function getValidNextStates(current: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[current] || [];
}

/**
 * Check if state is terminal (no further transitions allowed)
 */
function isTerminalState(state: OrderStatus): boolean {
  return VALID_TRANSITIONS[state]?.length === 0;
}

/**
 * Validate state transition with business rules
 */
function validateTransition(
  from: OrderStatus,
  to: OrderStatus,
  context?: { paymentStatus?: string; refundReason?: string }
): { valid: boolean; reason?: string } {
  // Check if transition is allowed
  if (!canTransition(from, to)) {
    return {
      valid: false,
      reason: `Invalid transition from ${from} to ${to}`,
    };
  }

  // Additional business rule validations
  if (to === 'processing' && context?.paymentStatus !== 'completed') {
    return {
      valid: false,
      reason: 'Cannot move to processing without completed payment',
    };
  }

  if (to === 'refunded' && !context?.refundReason) {
    return {
      valid: false,
      reason: 'Refund reason is required',
    };
  }

  return { valid: true };
}

// ============================================
// TESTS
// ============================================

describe('Order State Machine', () => {
  describe('Valid State Transitions', () => {
    test('pending → processing (valid)', () => {
      expect(canTransition('pending', 'processing')).toBe(true);
    });

    test('pending → cancelled (valid)', () => {
      expect(canTransition('pending', 'cancelled')).toBe(true);
    });

    test('processing → shipped (valid)', () => {
      expect(canTransition('processing', 'shipped')).toBe(true);
    });

    test('processing → cancelled (valid)', () => {
      expect(canTransition('processing', 'cancelled')).toBe(true);
    });

    test('shipped → delivered (valid)', () => {
      expect(canTransition('shipped', 'delivered')).toBe(true);
    });

    test('shipped → refunded (valid)', () => {
      expect(canTransition('shipped', 'refunded')).toBe(true);
    });

    test('delivered → refunded (valid)', () => {
      expect(canTransition('delivered', 'refunded')).toBe(true);
    });
  });

  describe('Invalid State Transitions', () => {
    test('pending → shipped (invalid - must go through processing)', () => {
      expect(canTransition('pending', 'shipped')).toBe(false);
    });

    test('pending → delivered (invalid - cannot skip states)', () => {
      expect(canTransition('pending', 'delivered')).toBe(false);
    });

    test('pending → refunded (invalid - no payment yet)', () => {
      expect(canTransition('pending', 'refunded')).toBe(false);
    });

    test('processing → delivered (invalid - must ship first)', () => {
      expect(canTransition('processing', 'delivered')).toBe(false);
    });

    test('shipped → processing (invalid - cannot go backwards)', () => {
      expect(canTransition('shipped', 'processing')).toBe(false);
    });

    test('delivered → processing (invalid - cannot reverse)', () => {
      expect(canTransition('delivered', 'processing')).toBe(false);
    });

    test('cancelled → processing (invalid - terminal state)', () => {
      expect(canTransition('cancelled', 'processing')).toBe(false);
    });

    test('refunded → delivered (invalid - terminal state)', () => {
      expect(canTransition('refunded', 'delivered')).toBe(false);
    });
  });

  describe('Terminal States', () => {
    test('cancelled is a terminal state', () => {
      expect(isTerminalState('cancelled')).toBe(true);
      expect(getValidNextStates('cancelled')).toHaveLength(0);
    });

    test('refunded is a terminal state', () => {
      expect(isTerminalState('refunded')).toBe(true);
      expect(getValidNextStates('refunded')).toHaveLength(0);
    });

    test('delivered is not a terminal state (can be refunded)', () => {
      expect(isTerminalState('delivered')).toBe(false);
      expect(getValidNextStates('delivered')).toContain('refunded');
    });
  });

  describe('Business Rule Validations', () => {
    test('cannot move to processing without payment', () => {
      const result = validateTransition('pending', 'processing', {
        paymentStatus: 'pending',
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('payment');
    });

    test('can move to processing with completed payment', () => {
      const result = validateTransition('pending', 'processing', {
        paymentStatus: 'completed',
      });
      expect(result.valid).toBe(true);
    });

    test('cannot refund without reason', () => {
      const result = validateTransition('delivered', 'refunded', {});
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('reason');
    });

    test('can refund with reason', () => {
      const result = validateTransition('delivered', 'refunded', {
        refundReason: 'Defective product',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('Get Valid Next States', () => {
    test('pending order has 2 valid next states', () => {
      const nextStates = getValidNextStates('pending');
      expect(nextStates).toHaveLength(2);
      expect(nextStates).toContain('processing');
      expect(nextStates).toContain('cancelled');
    });

    test('processing order has 2 valid next states', () => {
      const nextStates = getValidNextStates('processing');
      expect(nextStates).toHaveLength(2);
      expect(nextStates).toContain('shipped');
      expect(nextStates).toContain('cancelled');
    });

    test('shipped order has 2 valid next states', () => {
      const nextStates = getValidNextStates('shipped');
      expect(nextStates).toHaveLength(2);
      expect(nextStates).toContain('delivered');
      expect(nextStates).toContain('refunded');
    });

    test('delivered order has 1 valid next state', () => {
      const nextStates = getValidNextStates('delivered');
      expect(nextStates).toHaveLength(1);
      expect(nextStates).toContain('refunded');
    });

    test('cancelled order has no valid next states', () => {
      const nextStates = getValidNextStates('cancelled');
      expect(nextStates).toHaveLength(0);
    });
  });

  describe('Complete Order Flow', () => {
    test('happy path: pending → processing → shipped → delivered', () => {
      expect(canTransition('pending', 'processing')).toBe(true);
      expect(canTransition('processing', 'shipped')).toBe(true);
      expect(canTransition('shipped', 'delivered')).toBe(true);
    });

    test('cancellation path: pending → cancelled', () => {
      expect(canTransition('pending', 'cancelled')).toBe(true);
      expect(isTerminalState('cancelled')).toBe(true);
    });

    test('refund path: pending → processing → shipped → refunded', () => {
      expect(canTransition('pending', 'processing')).toBe(true);
      expect(canTransition('processing', 'shipped')).toBe(true);
      expect(canTransition('shipped', 'refunded')).toBe(true);
      expect(isTerminalState('refunded')).toBe(true);
    });

    test('post-delivery refund: delivered → refunded', () => {
      expect(canTransition('delivered', 'refunded')).toBe(true);
      expect(isTerminalState('refunded')).toBe(true);
    });
  });
});

