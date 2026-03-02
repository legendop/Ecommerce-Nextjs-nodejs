import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// ==========================================
// PUBLIC API - List active categories (flat list)
// ==========================================
export const listCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        cardImage: true,
        bannerImage: true,
        parentId: true,
        sortOrder: true,
        _count: {
          select: { products: true },
        },
      },
    });

    successResponse(res, categories);
  } catch (error) {
    logger.error('List categories error:', error);
    errorResponse(res, 'Failed to fetch categories', 500, error);
  }
};

// ==========================================
// PUBLIC API - Get category with products
// ==========================================
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        cardImage: true,
        bannerImage: true,
        parentId: true,
        sortOrder: true,
        products: {
          where: { product: { isActive: true } },
          select: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                colorName: true,
                colorCode: true,
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                  select: { imageUrl: true },
                },
                listings: {
                  where: { isActive: true },
                  select: {
                    price: true,
                    discountAmount: true,
                  },
                  orderBy: { price: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!category) {
      errorResponse(res, 'Category not found', 404);
      return;
    }

    successResponse(res, category);
  } catch (error) {
    logger.error('Get category error:', error);
    errorResponse(res, 'Failed to fetch category', 500, error);
  }
};

// ==========================================
// ADMIN API - Get all categories with full details (including inactive)
// ==========================================
export const adminListCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as string;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const total = await prisma.category.count({ where });

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      skip,
      take: limit,
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true },
        },
        products: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    paginatedResponse(res, categories, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Admin list categories error:', error);
    errorResponse(res, 'Failed to fetch categories', 500, error);
  }
};

// ==========================================
// ADMIN API - Get single category by ID with all details
// ==========================================
export const adminGetCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: BigInt(id) },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                colorName: true,
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
                listings: {
                  select: { id: true, size: true, price: true, stock: true, isActive: true },
                },
              },
            },
          },
        },
      },
    });

    if (!category) {
      errorResponse(res, 'Category not found', 404);
      return;
    }

    successResponse(res, category);
  } catch (error) {
    logger.error('Admin get category error:', error);
    errorResponse(res, 'Failed to fetch category', 500, error);
  }
};

// ==========================================
// ADMIN API - Create category
// ==========================================
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, cardImage, bannerImage, parentId, sortOrder } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        cardImage,
        bannerImage,
        parentId: parentId ? BigInt(parentId) : null,
        sortOrder: sortOrder || 0,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    successResponse(res, category, 'Category created successfully', 201);
  } catch (error) {
    logger.error('Create category error:', error);
    errorResponse(res, 'Failed to create category', 500, error);
  }
};

// ==========================================
// ADMIN API - Update category
// ==========================================
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, cardImage, bannerImage, parentId, sortOrder, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id: BigInt(id) },
      data: {
        name,
        slug,
        description,
        cardImage,
        bannerImage,
        parentId: parentId ? BigInt(parentId) : null,
        sortOrder,
        isActive,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    successResponse(res, category, 'Category updated successfully');
  } catch (error) {
    logger.error('Update category error:', error);
    errorResponse(res, 'Failed to update category', 500, error);
  }
};

// ==========================================
// ADMIN API - Delete category (soft delete)
// ==========================================
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.category.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });

    successResponse(res, null, 'Category deleted successfully');
  } catch (error) {
    logger.error('Delete category error:', error);
    errorResponse(res, 'Failed to delete category', 500, error);
  }
};

// ==========================================
// ADMIN API - Reorder products within category
// ==========================================
export const reorderCategoryProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productOrders } = req.body; // [{ productId: string, sortOrder: number }]

    if (!Array.isArray(productOrders)) {
      errorResponse(res, 'productOrders must be an array', 400);
      return;
    }

    // Update sortOrder for each product
    await prisma.$transaction(
      productOrders.map((po) =>
        prisma.product.update({
          where: { id: BigInt(po.productId) },
          data: { sortOrder: po.sortOrder },
        })
      )
    );

    successResponse(res, null, 'Products reordered successfully');
  } catch (error) {
    logger.error('Reorder category products error:', error);
    errorResponse(res, 'Failed to reorder products', 500, error);
  }
};
