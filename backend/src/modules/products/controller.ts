import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// ==========================================
// PUBLIC API - List products with filters
// ==========================================
export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { category, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const where: Record<string, unknown> = {
      isActive: true,
    };

    // Category filter
    if (category) {
      where.categories = {
        some: {
          category: {
            OR: [
              { slug: category as string },
              { id: !isNaN(Number(category)) ? BigInt(category as string) : undefined },
            ],
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

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      orderBy: { [sortBy as string]: sortOrder },
      skip,
      take: limit,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        listings: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: { listings: true, reviews: true },
        },
      },
    });

    // Calculate min/max price and total stock
    const formattedProducts = products.map((product) => {
      const activeListings = product.listings.filter((l) => l.stock > 0);
      const minPriceListing = activeListings.length > 0
        ? activeListings.reduce((min, l) => (l.price < min.price ? l : min), activeListings[0])
        : product.listings[0];

      const totalStock = product.listings.reduce((sum, l) => sum + l.stock, 0);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        colorName: product.colorName,
        colorCode: product.colorCode,
        gender: product.gender,
        firstImage: product.images[0]?.imageUrl || null,
        price: minPriceListing?.price || null,
        discountAmount: minPriceListing?.discountAmount || null,
        totalStock,
        sizes: product.listings.map((l) => l.size).filter(Boolean),
        categories: product.categories.map((c) => c.category),
        listingCount: product._count.listings,
        reviewCount: product._count.reviews,
      };
    });

    // Filter by price range
    let filteredProducts = formattedProducts;
    if (minPrice || maxPrice) {
      filteredProducts = formattedProducts.filter((p) => {
        if (!p.price) return false;
        const price = Number(p.price);
        if (minPrice && price < parseFloat(minPrice as string)) return false;
        if (maxPrice && price > parseFloat(maxPrice as string)) return false;
        return true;
      });
    }

    paginatedResponse(res, filteredProducts, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('List products error:', error);
    errorResponse(res, 'Failed to fetch products', 500, error);
  }
};

// ==========================================
// PUBLIC API - Get product details (for product page)
// ==========================================
export const getProductDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        listings: {
          where: { isActive: true },
          orderBy: { size: 'asc' },
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        reviews: {
          where: { isVerified: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!product || !product.isActive) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    // Calculate average rating
    const reviews = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
    });

    const response = {
      ...product,
      averageRating: reviews._avg.rating || 0,
      totalReviews: product._count.reviews,
      categories: product.categories.map((c) => c.category),
    };

    successResponse(res, response);
  } catch (error) {
    logger.error('Get product details error:', error);
    errorResponse(res, 'Failed to fetch product details', 500, error);
  }
};

// ==========================================
// ADMIN API - List all products with full details
// ==========================================
export const adminListProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { search, categoryId, isActive } = req.query;

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (categoryId) {
      where.categories = {
        some: { categoryId: BigInt(categoryId as string) },
      };
    }

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      skip,
      take: limit,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        listings: {
          orderBy: { size: 'asc' },
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: { listings: true, reviews: true },
        },
      },
    });

    paginatedResponse(res, products, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Admin list products error:', error);
    errorResponse(res, 'Failed to fetch products', 500, error);
  }
};

// ==========================================
// ADMIN API - Get single product with all details
// ==========================================
export const adminGetProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        listings: {
          orderBy: { size: 'asc' },
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { listings: true, reviews: true },
        },
      },
    });

    if (!product) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    successResponse(res, product);
  } catch (error) {
    logger.error('Admin get product error:', error);
    errorResponse(res, 'Failed to fetch product', 500, error);
  }
};

// ==========================================
// ADMIN API - Create product with listings and images
// ==========================================
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      slug,
      description,
      bulletPoints,
      extraData,
      colorName,
      colorCode,
      gender,
      categoryIds,
      images,
      listings,
      isActive,
      sortOrder,
    } = req.body;

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug,
          description,
          colorName,
          colorCode,
          gender,
          bulletPoints: bulletPoints || [],
          extraData: extraData || {},
          isActive: isActive ?? true,
          sortOrder: sortOrder || 0,
          categories: categoryIds?.length > 0 ? {
            create: categoryIds.map((id: string) => ({ categoryId: BigInt(id) })),
          } : undefined,
          images: images?.length > 0 ? {
            create: images.map((img: { imageUrl: string; sortOrder?: number }, idx: number) => ({
              imageUrl: img.imageUrl,
              sortOrder: img.sortOrder ?? idx,
            })),
          } : undefined,
          listings: listings?.length > 0 ? {
            create: listings.map((listing: {
              skuCode?: string;
              size?: string;
              price: number;
              discountAmount?: number;
              stock?: number;
              isActive?: boolean;
            }) => ({
              skuCode: listing.skuCode,
              size: listing.size,
              price: listing.price,
              discountAmount: listing.discountAmount || 0,
              stock: listing.stock || 0,
              isActive: listing.isActive ?? true,
            })),
          } : undefined,
        },
        include: {
          images: true,
          listings: true,
          categories: {
            include: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      });

      return newProduct;
    });

    successResponse(res, product, 'Product created successfully', 201);
  } catch (error) {
    logger.error('Create product error:', error);
    errorResponse(res, 'Failed to create product', 500, error);
  }
};

// ==========================================
// ADMIN API - Update product with listings and images
// ==========================================
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      bulletPoints,
      extraData,
      colorName,
      colorCode,
      gender,
      categoryIds,
      images,
      listings,
      isActive,
      sortOrder,
    } = req.body;

    const product = await prisma.$transaction(async (tx) => {
      // Update basic product info
      await tx.product.update({
        where: { id: BigInt(id) },
        data: {
          name,
          slug,
          description,
          colorName,
          colorCode,
          gender,
          bulletPoints,
          extraData,
          isActive,
          sortOrder,
        },
      });

      // Update categories if provided
      if (categoryIds !== undefined) {
        await tx.productCategory.deleteMany({ where: { productId: BigInt(id) } });
        if (categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIds.map((catId: string) => ({
              productId: BigInt(id),
              categoryId: BigInt(catId),
            })),
          });
        }
      }

      // Update images if provided
      if (images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: BigInt(id) } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img: { imageUrl: string; sortOrder?: number }, idx: number) => ({
              productId: BigInt(id),
              imageUrl: img.imageUrl,
              sortOrder: img.sortOrder ?? idx,
            })),
          });
        }
      }

      // Update listings if provided
      if (listings !== undefined) {
        const existingListings = await tx.listing.findMany({
          where: { productId: BigInt(id) },
          select: { id: true },
        });
        const existingIds = existingListings.map((l) => l.id.toString());
        const incomingIds = listings.filter((l: { id?: string }) => l.id).map((l: { id: string }) => l.id);

        const toDelete = existingIds.filter((lid) => !incomingIds.includes(lid));
        for (const delId of toDelete) {
          await tx.listing.delete({ where: { id: BigInt(delId) } });
        }

        for (const listing of listings) {
          if (listing.id) {
            await tx.listing.update({
              where: { id: BigInt(listing.id) },
              data: {
                skuCode: listing.skuCode,
                size: listing.size,
                price: listing.price,
                discountAmount: listing.discountAmount,
                stock: listing.stock,
                isActive: listing.isActive,
              },
            });
          } else {
            await tx.listing.create({
              data: {
                productId: BigInt(id),
                skuCode: listing.skuCode,
                size: listing.size,
                price: listing.price,
                discountAmount: listing.discountAmount || 0,
                stock: listing.stock || 0,
                isActive: listing.isActive ?? true,
              },
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id: BigInt(id) },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          listings: { orderBy: { size: 'asc' } },
          categories: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });
    });

    successResponse(res, product, 'Product updated successfully');
  } catch (error) {
    logger.error('Update product error:', error);
    errorResponse(res, 'Failed to update product', 500, error);
  }
};

// ==========================================
// ADMIN API - Delete product (soft delete)
// ==========================================
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.product.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });

    successResponse(res, null, 'Product deleted successfully');
  } catch (error) {
    logger.error('Delete product error:', error);
    errorResponse(res, 'Failed to delete product', 500, error);
  }
};

// ==========================================
// ADMIN API - Toggle product status
// ==========================================
export const toggleProductStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: BigInt(id) },
      select: { isActive: true },
    });

    if (!product) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    const updated = await prisma.product.update({
      where: { id: BigInt(id) },
      data: { isActive: !product.isActive },
    });

    successResponse(res, updated, `Product ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    logger.error('Toggle product status error:', error);
    errorResponse(res, 'Failed to toggle product status', 500, error);
  }
};
