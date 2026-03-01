import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

// List user addresses
export const listAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' },
    });

    successResponse(res, addresses);
  } catch (error) {
    logger.error('List addresses error:', error);
    errorResponse(res, 'Failed to fetch addresses', 500, error);
  }
};

// Get single address
export const getAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: {
        id: BigInt(id),
        userId: req.user.id,
      },
    });

    if (!address) {
      errorResponse(res, 'Address not found', 404);
      return;
    }

    successResponse(res, address);
  } catch (error) {
    logger.error('Get address error:', error);
    errorResponse(res, 'Failed to fetch address', 500, error);
  }
};

// Create address
export const createAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { isDefault, name, label, ...addressData } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        fullName: name,
        isDefault,
        userId: req.user.id,
      },
    });

    successResponse(res, address, 'Address created successfully', 201);
  } catch (error) {
    logger.error('Create address error:', error);
    errorResponse(res, 'Failed to create address', 500, error);
  }
};

// Update address
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;
    const { isDefault, name, ...addressData } = req.body;

    // Verify ownership
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: BigInt(id),
        userId: req.user.id,
      },
    });

    if (!existingAddress) {
      errorResponse(res, 'Address not found', 404);
      return;
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: BigInt(id) },
      data: {
        ...addressData,
        fullName: name,
        isDefault,
      },
    });

    successResponse(res, address, 'Address updated successfully');
  } catch (error) {
    logger.error('Update address error:', error);
    errorResponse(res, 'Failed to update address', 500, error);
  }
};

// Delete address
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;

    // Verify ownership
    const address = await prisma.address.findFirst({
      where: {
        id: BigInt(id),
        userId: req.user.id,
      },
    });

    if (!address) {
      errorResponse(res, 'Address not found', 404);
      return;
    }

    await prisma.address.delete({
      where: { id: BigInt(id) },
    });

    successResponse(res, null, 'Address deleted successfully');
  } catch (error) {
    logger.error('Delete address error:', error);
    errorResponse(res, 'Failed to delete address', 500, error);
  }
};
