    import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all addresses for a user
 */
export const getUserAddresses = async (userId: string) => {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' }, // Default address first
      { createdAt: 'desc' },
    ],
  });

  return addresses;
};

/**
 * Get single address by ID
 */
export const getAddressById = async (addressId: string, userId: string) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    throw new AppError('Address not found', 404);
  }

  // Verify address belongs to user
  if (address.userId !== userId) {
    throw new AppError('Unauthorized to access this address', 403);
  }

  return address;
};

/**
 * Create new address
 */
export const createAddress = async (
  userId: string,
  data: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    isDefault?: boolean;
  }
) => {
  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // If user has no addresses, make this one default
  const addressCount = await prisma.address.count({
    where: { userId },
  });

  const address = await prisma.address.create({
    data: {
      userId,
      fullName: data.fullName,
      phone: data.phone,
      addressLine: data.addressLine,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country || 'India',
      isDefault: data.isDefault || addressCount === 0,
    },
  });

  return address;
};

/**
 * Update address
 */
export const updateAddress = async (
  addressId: string,
  userId: string,
  data: {
    fullName?: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    isDefault?: boolean;
  }
) => {
  // Check if address exists and belongs to user
  const existingAddress = await getAddressById(addressId, userId);

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { 
        userId, 
        isDefault: true,
        id: { not: addressId }
      },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: addressId },
    data,
  });

  return address;
};

/**
 * Delete address
 */
export const deleteAddress = async (addressId: string, userId: string) => {
  // Check if address exists and belongs to user
  const address = await getAddressById(addressId, userId);

  // If deleting default address, set another one as default
  if (address.isDefault) {
    const otherAddress = await prisma.address.findFirst({
      where: { 
        userId, 
        id: { not: addressId }
      },
    });

    if (otherAddress) {
      await prisma.address.update({
        where: { id: otherAddress.id },
        data: { isDefault: true },
      });
    }
  }

  await prisma.address.delete({
    where: { id: addressId },
  });

  return address;
};

/**
 * Set address as default
 */
export const setDefaultAddress = async (addressId: string, userId: string) => {
  // Check if address exists and belongs to user
  await getAddressById(addressId, userId);

  // Unset all other defaults
  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  // Set this address as default
  const address = await prisma.address.update({
    where: { id: addressId },
    data: { isDefault: true },
  });

  return address;
};

/**
 * Get default address
 */
export const getDefaultAddress = async (userId: string) => {
  const address = await prisma.address.findFirst({
    where: { userId, isDefault: true },
  });

  return address;
};