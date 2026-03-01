import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams, getSortParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// List all products (public)
export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { field, order } = getSortParams(req, ['name', 'createdAt'], 'createdAt');
    const { category, min, max, search } = req.query;

    // Build where clause for catalog
    const where: Record<string, unknown> = {
      isActive: true,
    };

    // Category filter - filter by category relation
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.catalog.count({ where });

    // Get products with items for price/stock
    const catalogs = await prisma.catalog.findMany({
      where,
      include: {
        categories: {
          include: {
            category: {
              select: { name: true, slug: true },
            },
          },
        },
        items: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 1, // Get first item for display price
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { [field]: order },
      skip,
      take: limit,
    });

    // Map to product response format
    const products = catalogs.map((catalog) => {
      const firstItem = catalog.items[0];
      const totalStock = catalog.items.reduce((sum, item) => sum + item.stock, 0);

      return {
        id: catalog.id,
        name: catalog.name,
        slug: catalog.slug,
        shortDesc: catalog.shortDesc,
        imageUrl: catalog.imageUrl,
        isActive: catalog.isActive,
        createdAt: catalog.createdAt,
        // From first item
        price: firstItem?.price || 0,
        comparePrice: firstItem?.discount
          ? Number(firstItem.price) + Number(firstItem.discount)
          : null,
        stock: totalStock,
        sku: firstItem?.skuCode,
        // Category info
        category: catalog.categories[0]?.category,
        categoryId: catalog.categories[0]?.categoryId,
        // Variant count
        variantCount: catalog._count.items,
      };
    });

    // Filter by price range in memory (since price is on items)
    let filteredProducts = products;
    if (min || max) {
      filteredProducts = products.filter((p) => {
        const price = Number(p.price);
        if (min && price < parseFloat(min as string)) return false;
        if (max && price > parseFloat(max as string)) return false;
        return true;
      });
    }

    paginatedResponse(res, filteredProducts, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('List products error:', error);
    errorResponse(res, 'Failed to fetch products', 500, error);
  }
};

// Get single product
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const catalog = await prisma.catalog.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        items: {
          where: { isActive: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!catalog || !catalog.isActive) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    const totalStock = catalog.items.reduce((sum, item) => sum + item.stock, 0);
    const firstItem = catalog.items[0];

    const product = {
      id: catalog.id,
      name: catalog.name,
      slug: catalog.slug,
      description: catalog.description,
      shortDesc: catalog.shortDesc,
      bullets: catalog.bullets,
      extraData: catalog.extraData,
      imageUrl: catalog.imageUrl,
      isActive: catalog.isActive,
      createdAt: catalog.createdAt,
      // Aggregated from items
      price: firstItem?.price || 0,
      stock: totalStock,
      items: catalog.items,
      // Category
      category: catalog.categories[0]?.category,
      categoryId: catalog.categories[0]?.categoryId,
      // Images
      images: catalog.images,
    };

    successResponse(res, product);
  } catch (error) {
    logger.error('Get product error:', error);
    errorResponse(res, 'Failed to fetch product', 500, error);
  }
};

// Admin: Create product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, shortDescription, price, stock, imageUrl, isActive, categoryId } = req.body;

    // Create catalog with default item
    const catalog = await prisma.catalog.create({
      data: {
        name,
        slug,
        description,
        shortDesc: shortDescription,
        imageUrl,
        isActive: isActive ?? true,
        categories: categoryId ? {
          create: { categoryId: BigInt(categoryId) }
        } : undefined,
        items: {
          create: {
            skuCode: slug.toUpperCase(),
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            isActive: true,
          }
        }
      },
      include: {
        items: true,
        categories: {
          include: { category: { select: { name: true } } }
        }
      },
    });

    successResponse(res, catalog, 'Product created successfully', 201);
  } catch (error) {
    logger.error('Create product error:', error);
    errorResponse(res, 'Failed to create product', 500, error);
  }
};

// Admin: Update product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.catalog.update({
      where: { id: BigInt(id) },
      data: req.body,
      include: {
        categories: {
          include: { category: { select: { name: true } } }
        },
      },
    });

    successResponse(res, product, 'Product updated successfully');
  } catch (error) {
    logger.error('Update product error:', error);
    errorResponse(res, 'Failed to update product', 500, error);
  }
};

// Admin: Delete product (soft delete)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.catalog.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });

    successResponse(res, null, 'Product deleted successfully');
  } catch (error) {
    logger.error('Delete product error:', error);
    errorResponse(res, 'Failed to delete product', 500, error);
  }
};

// Admin: List all products (including inactive)
export const adminListProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as string;

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const total = await prisma.catalog.count({ where });

    const catalogs = await prisma.catalog.findMany({
      where,
      include: {
        categories: {
          include: {
            category: {
              select: { name: true },
            },
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Map to frontend-friendly format
    const products = catalogs.map((catalog) => {
      const firstItem = catalog.items[0];
      const totalStock = catalog.items.reduce((sum, item) => sum + item.stock, 0);

      return {
        id: catalog.id,
        name: catalog.name,
        slug: catalog.slug,
        description: catalog.description,
        shortDesc: catalog.shortDesc,
        imageUrl: catalog.imageUrl,
        isActive: catalog.isActive,
        createdAt: catalog.createdAt,
        // From first item
        price: firstItem?.price || 0,
        stock: totalStock,
        sku: firstItem?.skuCode,
        items: catalog.items,
        // Category info
        categories: catalog.categories,
        categoryId: catalog.categories[0]?.categoryId,
      };
    });

    paginatedResponse(res, products, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Admin list products error:', error);
    errorResponse(res, 'Failed to fetch products', 500, error);
  }
};

// Admin: Toggle product status
export const toggleProductStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const catalog = await prisma.catalog.findUnique({
      where: { id: BigInt(id) },
      select: { isActive: true },
    });

    if (!catalog) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    const updated = await prisma.catalog.update({
      where: { id: BigInt(id) },
      data: { isActive: !catalog.isActive },
    });

    successResponse(res, updated, `Product ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    logger.error('Toggle product status error:', error);
    errorResponse(res, 'Failed to toggle product status', 500, error);
  }
};

// ==========================================
// CATALOG MANAGEMENT
// ==========================================

// List all catalogs (admin)
export const listCatalogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as string;

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const total = await prisma.catalog.count({ where });

    const catalogs = await prisma.catalog.findMany({
      where,
      include: {
        categories: {
          include: {
            category: {
              select: { name: true, slug: true },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    paginatedResponse(res, catalogs, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('List catalogs error:', error);
    errorResponse(res, 'Failed to fetch catalogs', 500, error);
  }
};

// Get single catalog (admin)
export const getCatalog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const catalog = await prisma.catalog.findUnique({
      where: { id: BigInt(id) },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        items: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!catalog) {
      errorResponse(res, 'Catalog not found', 404);
      return;
    }

    successResponse(res, catalog);
  } catch (error) {
    logger.error('Get catalog error:', error);
    errorResponse(res, 'Failed to fetch catalog', 500, error);
  }
};

// Create catalog (admin)
export const createCatalog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, shortDesc, bullets, imageUrl, categoryIds } = req.body;

    const catalog = await prisma.catalog.create({
      data: {
        name,
        slug,
        description,
        shortDesc,
        bullets,
        imageUrl,
        categories: categoryIds?.length > 0 ? {
          create: categoryIds.map((id: string) => ({ categoryId: BigInt(id) })),
        } : undefined,
      },
      include: {
        categories: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });

    successResponse(res, catalog, 'Catalog created successfully', 201);
  } catch (error) {
    logger.error('Create catalog error:', error);
    errorResponse(res, 'Failed to create catalog', 500, error);
  }
};

// Update catalog (admin)
export const updateCatalog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, shortDesc, bullets, imageUrl, isActive } = req.body;

    const catalog = await prisma.catalog.update({
      where: { id: BigInt(id) },
      data: {
        name,
        slug,
        description,
        shortDesc,
        bullets,
        imageUrl,
        isActive,
      },
      include: {
        categories: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });

    successResponse(res, catalog, 'Catalog updated successfully');
  } catch (error) {
    logger.error('Update catalog error:', error);
    errorResponse(res, 'Failed to update catalog', 500, error);
  }
};

// Delete catalog (admin)
export const deleteCatalog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.catalog.delete({
      where: { id: BigInt(id) },
    });

    successResponse(res, null, 'Catalog deleted successfully');
  } catch (error) {
    logger.error('Delete catalog error:', error);
    errorResponse(res, 'Failed to delete catalog', 500, error);
  }
};
