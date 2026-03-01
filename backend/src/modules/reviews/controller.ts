import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// Get reviews for a catalog (public)
export const getCatalogReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { catalogId } = req.params;
    const { page, limit, skip } = getPaginationParams(req);

    const where = {
      catalogId: BigInt(catalogId),
    };

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Get rating distribution
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: { rating: true },
    });

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingCounts[d.rating as keyof typeof ratingCounts] = d._count.rating;
    });

    // Use successResponse instead of paginatedResponse since we need to include stats
    const meta = {
      ...createPaginationMeta(page, limit, total),
    };

    successResponse(res, {
      reviews,
      meta,
      stats: {
        average: Math.round((stats._avg.rating || 0) * 10) / 10,
        total: stats._count.rating,
        distribution: ratingCounts,
      },
    });
  } catch (error) {
    logger.error('Get catalog reviews error:', error);
    errorResponse(res, 'Failed to fetch reviews', 500, error);
  }
};

// Create review (authenticated + verified purchase)
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { catalogId, rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      errorResponse(res, 'Rating must be between 1 and 5', 400);
      return;
    }

    // Check if user has purchased this catalog
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        order: {
          userId: req.user.id,
          status: {
            in: ['PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED'],
          },
        },
        item: {
          catalogId: BigInt(catalogId),
        },
      },
    });

    if (!hasPurchased) {
      errorResponse(res, 'You can only review products you have purchased', 403);
      return;
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        catalogId_userId: {
          catalogId: BigInt(catalogId),
          userId: req.user.id,
        },
      },
    });

    if (existingReview) {
      errorResponse(res, 'You have already reviewed this product', 400);
      return;
    }

    const review = await prisma.review.create({
      data: {
        catalogId: BigInt(catalogId),
        userId: req.user.id,
        rating,
        comment,
        isVerified: true, // Since we checked purchase
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    successResponse(res, review, 'Review added successfully', 201);
  } catch (error) {
    logger.error('Create review error:', error);
    errorResponse(res, 'Failed to create review', 500, error);
  }
};

// Update own review
export const updateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    // Verify ownership
    const existingReview = await prisma.review.findFirst({
      where: {
        id: BigInt(id),
        userId: req.user.id,
      },
    });

    if (!existingReview) {
      errorResponse(res, 'Review not found', 404);
      return;
    }

    const review = await prisma.review.update({
      where: { id: BigInt(id) },
      data: {
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    successResponse(res, review, 'Review updated successfully');
  } catch (error) {
    logger.error('Update review error:', error);
    errorResponse(res, 'Failed to update review', 500, error);
  }
};

// Delete own review
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;

    // Verify ownership (or admin)
    const where: Record<string, unknown> = { id: BigInt(id) };
    if (req.user.role !== 'ADMIN') {
      where.userId = req.user.id;
    }

    const existingReview = await prisma.review.findFirst({ where });

    if (!existingReview) {
      errorResponse(res, 'Review not found', 404);
      return;
    }

    await prisma.review.delete({
      where: { id: BigInt(id) },
    });

    successResponse(res, null, 'Review deleted successfully');
  } catch (error) {
    logger.error('Delete review error:', error);
    errorResponse(res, 'Failed to delete review', 500, error);
  }
};

// Get user's own reviews
export const getMyReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { page, limit, skip } = getPaginationParams(req);

    const where = { userId: req.user.id };

    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      include: {
        catalog: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    paginatedResponse(res, reviews, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Get my reviews error:', error);
    errorResponse(res, 'Failed to fetch reviews', 500, error);
  }
};

// Admin: List all reviews
export const adminListReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { catalogId, status } = req.query;

    const where: Record<string, unknown> = {};

    if (catalogId) {
      where.catalogId = BigInt(catalogId as string);
    }

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'unverified') {
      where.isVerified = false;
    }

    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        catalog: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    paginatedResponse(res, reviews, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Admin list reviews error:', error);
    errorResponse(res, 'Failed to fetch reviews', 500, error);
  }
};

// Admin: Verify/Unverify review
export const verifyReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const review = await prisma.review.update({
      where: { id: BigInt(id) },
      data: { isVerified },
    });

    successResponse(res, review, `Review ${isVerified ? 'verified' : 'unverified'}`);
  } catch (error) {
    logger.error('Verify review error:', error);
    errorResponse(res, 'Failed to update review', 500, error);
  }
};
