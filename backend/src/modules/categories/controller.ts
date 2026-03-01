import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

// List all categories (public)
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
        imageUrl: true,
        _count: {
          select: { catalogs: true },
        },
      },
    });

    successResponse(res, categories);
  } catch (error) {
    logger.error('List categories error:', error);
    errorResponse(res, 'Failed to fetch categories', 500, error);
  }
};

// Get single category with products
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        catalogs: {
          where: { catalog: { isActive: true } },
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
        },
      },
    });

    if (!category || !category.isActive) {
      errorResponse(res, 'Category not found', 404);
      return;
    }

    successResponse(res, category);
  } catch (error) {
    logger.error('Get category error:', error);
    errorResponse(res, 'Failed to fetch category', 500, error);
  }
};

// Admin: Create category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await prisma.category.create({
      data: req.body,
    });

    successResponse(res, category, 'Category created successfully', 201);
  } catch (error) {
    logger.error('Create category error:', error);
    errorResponse(res, 'Failed to create category', 500, error);
  }
};

// Admin: Update category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await prisma.category.update({
      where: { id: BigInt(id) },
      data: req.body,
    });

    successResponse(res, category, 'Category updated successfully');
  } catch (error) {
    logger.error('Update category error:', error);
    errorResponse(res, 'Failed to update category', 500, error);
  }
};

// Admin: Delete category
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

// Admin: Get single category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: BigInt(id) },
      include: {
        catalogs: {
          select: {
            catalog: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
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
    logger.error('Get category by id error:', error);
    errorResponse(res, 'Failed to fetch category', 500, error);
  }
};
