import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// ==========================================
// PUBLIC API - Get single listing by ID
// ==========================================
export const getListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id: BigInt(id), isActive: true },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            colorName: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!listing) {
      errorResponse(res, 'Listing not found', 404);
      return;
    }

    successResponse(res, listing);
  } catch (error) {
    logger.error('Get listing error:', error);
    errorResponse(res, 'Failed to fetch listing', 500, error);
  }
};

// ==========================================
// PUBLIC API - Get listings by product slug
// ==========================================
export const getListingsByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productSlug } = req.params;

    const listings = await prisma.listing.findMany({
      where: {
        product: { slug: productSlug },
        isActive: true,
      },
      orderBy: { size: 'asc' },
      select: {
        id: true,
        skuCode: true,
        size: true,
        price: true,
        discountAmount: true,
        stock: true,
        isActive: true,
      },
    });

    successResponse(res, listings);
  } catch (error) {
    logger.error('Get listings by product error:', error);
    errorResponse(res, 'Failed to fetch listings', 500, error);
  }
};

// ==========================================
// ADMIN API - List all listings with filters
// ==========================================
export const adminListListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { search, productId, isActive, lowStock } = req.query;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { skuCode: { contains: search as string, mode: 'insensitive' } },
        { size: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (productId) {
      where.productId = BigInt(productId as string);
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (lowStock === 'true') {
      where.stock = { lte: 10 };
    }

    const total = await prisma.listing.count({ where });

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            colorName: true,
            isActive: true,
          },
        },
      },
    });

    paginatedResponse(res, listings, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Admin list listings error:', error);
    errorResponse(res, 'Failed to fetch listings', 500, error);
  }
};

// ==========================================
// ADMIN API - Get single listing by ID
// ==========================================
export const adminGetListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id: BigInt(id) },
      include: {
        product: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
            categories: {
              include: {
                category: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        _count: {
          select: { cartItems: true, orderItems: true },
        },
      },
    });

    if (!listing) {
      errorResponse(res, 'Listing not found', 404);
      return;
    }

    successResponse(res, listing);
  } catch (error) {
    logger.error('Admin get listing error:', error);
    errorResponse(res, 'Failed to fetch listing', 500, error);
  }
};

// ==========================================
// ADMIN API - Create listing
// ==========================================
export const createListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productId,
      skuCode,
      size,
      price,
      discountAmount,
      stock,
      isActive,
    } = req.body;

    const listing = await prisma.listing.create({
      data: {
        productId: BigInt(productId),
        skuCode,
        size,
        price,
        discountAmount: discountAmount || 0,
        stock: stock || 0,
        isActive: isActive ?? true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    successResponse(res, listing, 'Listing created successfully', 201);
  } catch (error) {
    logger.error('Create listing error:', error);
    errorResponse(res, 'Failed to create listing', 500, error);
  }
};

// ==========================================
// ADMIN API - Update listing
// ==========================================
export const updateListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      skuCode,
      size,
      price,
      discountAmount,
      stock,
      isActive,
    } = req.body;

    const listing = await prisma.listing.update({
      where: { id: BigInt(id) },
      data: {
        skuCode,
        size,
        price,
        discountAmount,
        stock,
        isActive,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    successResponse(res, listing, 'Listing updated successfully');
  } catch (error) {
    logger.error('Update listing error:', error);
    errorResponse(res, 'Failed to update listing', 500, error);
  }
};

// ==========================================
// ADMIN API - Update listing stock
// ==========================================
export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (typeof stock !== 'number' || stock < 0) {
      errorResponse(res, 'Stock must be a non-negative number', 400);
      return;
    }

    const listing = await prisma.listing.update({
      where: { id: BigInt(id) },
      data: { stock },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    successResponse(res, listing, 'Stock updated successfully');
  } catch (error) {
    logger.error('Update stock error:', error);
    errorResponse(res, 'Failed to update stock', 500, error);
  }
};

// ==========================================
// ADMIN API - Bulk update stock
// ==========================================
export const bulkUpdateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      errorResponse(res, 'updates must be an array', 400);
      return;
    }

    await prisma.$transaction(
      updates.map((update) =>
        prisma.listing.update({
          where: { id: BigInt(update.listingId) },
          data: { stock: update.stock },
        })
      )
    );

    successResponse(res, null, 'Stock updated successfully for all listings');
  } catch (error) {
    logger.error('Bulk update stock error:', error);
    errorResponse(res, 'Failed to update stock', 500, error);
  }
};

// ==========================================
// ADMIN API - Delete listing
// ==========================================
export const deleteListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.listing.delete({
      where: { id: BigInt(id) },
    });

    successResponse(res, null, 'Listing deleted successfully');
  } catch (error) {
    logger.error('Delete listing error:', error);
    errorResponse(res, 'Failed to delete listing', 500, error);
  }
};

// ==========================================
// ADMIN API - Toggle listing status
// ==========================================
export const toggleListingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id: BigInt(id) },
      select: { isActive: true },
    });

    if (!listing) {
      errorResponse(res, 'Listing not found', 404);
      return;
    }

    const updated = await prisma.listing.update({
      where: { id: BigInt(id) },
      data: { isActive: !listing.isActive },
    });

    successResponse(res, updated, `Listing ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    logger.error('Toggle listing status error:', error);
    errorResponse(res, 'Failed to toggle listing status', 500, error);
  }
};
