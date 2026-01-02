import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as addressService from '../services/addressService';

/**
 * Get all user addresses
 * GET /api/users/addresses
 */
export const getUserAddresses = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const addresses = await addressService.getUserAddresses(userId);

    res.json({
      success: true,
      data: addresses,
    });
  }
);

/**
 * Get single address by ID
 * GET /api/users/addresses/:id
 */
export const getAddressById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const address = await addressService.getAddressById(id, userId);

    res.json({
      success: true,
      data: address,
    });
  }
);

/**
 * Create new address
 * POST /api/users/addresses
 */
export const createAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { fullName, phone, addressLine, city, state, pincode, country, isDefault } = req.body;

    // Validation
    if (!fullName || !phone || !addressLine || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const address = await addressService.createAddress(userId, {
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      country,
      isDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address,
    });
  }
);

/**
 * Update address
 * PUT /api/users/addresses/:id
 */
export const updateAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    const { fullName, phone, addressLine, city, state, pincode, country, isDefault } = req.body;

    const address = await addressService.updateAddress(id, userId, {
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      country,
      isDefault,
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  }
);

/**
 * Delete address
 * DELETE /api/users/addresses/:id
 */
export const deleteAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const address = await addressService.deleteAddress(id, userId);

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: address,
    });
  }
);

/**
 * Set address as default
 * PUT /api/users/addresses/:id/default
 */
export const setDefaultAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const address = await addressService.setDefaultAddress(id, userId);

    res.json({
      success: true,
      message: 'Default address updated',
      data: address,
    });
  }
);

/**
 * Get default address
 * GET /api/users/addresses/default
 */
export const getDefaultAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const address = await addressService.getDefaultAddress(userId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'No default address found',
      });
    }

    res.json({
      success: true,
      data: address,
    });
  }
);