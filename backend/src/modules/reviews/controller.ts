import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// ==========================================
// PUBLIC API - Get reviews for a product
// ==========================================
export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { page, limit, skip } = getPaginationParams(req);
    const { verified } = req.query;

    const where: Record<string, unknown> = {
      productId: BigInt(productId),
    };

    if (verified === 'true') {
      where.isVerified = true;
    }

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where: { productId: BigInt(productId) },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Get rating distribution
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId: BigInt(productId) },
      _count: { rating: true },
    });

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingCounts[d.rating as keyof typeof ratingCounts] = d._count.rating;
    });

    const meta = createPaginationMeta(page, limit, total);

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
    logger.error('Get product reviews error:', error);
    errorResponse(res, 'Failed to fetch reviews', 500, error);
  }
};

// ==========================================
// USER API - Create review (verified purchase required)
// ==========================================
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { productId, orderId, rating, title, comment, images } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      errorResponse(res, 'Rating must be between 1 and 5', 400);
      return;
    }

    // Check if order belongs to user and contains this product
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId: BigInt(orderId),
        order: {
          userId: req.user.id,
          orderStatus: {
            in: ['DELIVERED'],
          },
        },
        listing: {
          productId: BigInt(productId),
        },
      },
      include: {
        listing: {
          select: {
            productId: true,
          },
        },
      },
    });

    if (!orderItem) {
      errorResponse(res, 'You can only review products from delivered orders', 403);
      return;
    }

    // Check if already reviewed for this order
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: BigInt(productId),
        userId: req.user.id,
        orderId: BigInt(orderId),
      },
    });

    if (existingReview) {
      errorResponse(res, 'You have already reviewed this product for this order', 400);
      return;
    }

    const review = await prisma.review.create({
      data: {
        productId: BigInt(productId),
        userId: req.user.id,
        orderId: BigInt(orderId),
        rating,
        title,
        comment,
        images: images || [],
        isVerified: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
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

// ==========================================
// USER API - Update own review
// ==========================================
export const updateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;
    const { rating, title, comment, images } = req.body;

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      errorResponse(res, 'Rating must be between 1 and 5', 400);
      return;
    }

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
        title,
        comment,
        images,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
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

// ==========================================
// USER API - Delete own review
// ==========================================
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;

    // Verify ownership (or admin)
    const where: Record<string, unknown> = { id: BigInt(id) };
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
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

// ==========================================
// USER API - Get user's own reviews
// ==========================================
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
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
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

// ==========================================
// USER API - Mark review as helpful
// ==========================================
export const markHelpful = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await prisma.review.update({
      where: { id: BigInt(id) },
      data: {
        isHelpful: {
          increment: 1,
        },
      },
    });

    successResponse(res, { isHelpful: review.isHelpful }, 'Marked as helpful');
  } catch (error) {
    logger.error('Mark helpful error:', error);
    errorResponse(res, 'Failed to mark helpful', 500, error);
  }
};

// ==========================================
// ADMIN API - List all reviews
// ==========================================
export const adminListReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { productId, status, search } = req.query;

    const where: Record<string, unknown> = {};

    if (productId) {
      where.productId = BigInt(productId as string);
    }

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'unverified') {
      where.isVerified = false;
    }

    if (search) {
      where.OR = [
        { comment: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
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

// ==========================================
// ADMIN API - Get single review
// ==========================================
export const adminGetReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!review) {
      errorResponse(res, 'Review not found', 404);
      return;
    }

    successResponse(res, review);
  } catch (error) {
    logger.error('Admin get review error:', error);
    errorResponse(res, 'Failed to fetch review', 500, error);
  }
};

// ==========================================
// ADMIN API - Verify/Unverify review
// ==========================================
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

// ==========================================
// ADMIN API - Delete any review
// ==========================================
export const adminDeleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.review.delete({
      where: { id: BigInt(id) },
    });

    successResponse(res, null, 'Review deleted successfully');
  } catch (error) {
    logger.error('Admin delete review error:', error);
    errorResponse(res, 'Failed to delete review', 500, error);
  }
};
