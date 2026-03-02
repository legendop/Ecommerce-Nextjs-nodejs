import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse } from '../../utils/response';
import { ValidatedCartItem } from '../../types/express';
import logger from '../../utils/logger';

// Validate cart items
export const validateCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      errorResponse(res, 'Cart is empty', 400);
      return;
    }

    const validatedItems: ValidatedCartItem[] = [];
    let subtotal = 0;
    let hasError = false;

    for (const item of items) {
      const listingId = item.listingId || item.productId;
      if (!listingId) {
        hasError = true;
        continue;
      }
      const listingData = await prisma.listing.findUnique({
        where: { id: BigInt(listingId) },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
      });

      if (!listingData || !listingData.isActive) {
        validatedItems.push({
          listingId: BigInt(listingId),
          name: 'Product not found',
          price: 0,
          quantity: item.quantity,
          stock: 0,
          imageUrl: null,
          total: 0,
        });
        hasError = true;
        continue;
      }

      // Check stock
      if (listingData.stock < item.quantity) {
        validatedItems.push({
          listingId: listingData.id,
          name: listingData.product.name,
          price: Number(listingData.price),
          quantity: item.quantity,
          stock: listingData.stock,
          imageUrl: listingData.product.images[0]?.imageUrl || null,
          total: Number(listingData.price) * item.quantity,
        });
        hasError = true;
        continue;
      }

      const total = Number(listingData.price) * item.quantity;
      subtotal += total;

      validatedItems.push({
        listingId: listingData.id,
        name: listingData.product.name,
        price: Number(listingData.price),
        quantity: item.quantity,
        stock: listingData.stock,
        imageUrl: listingData.product.images[0]?.imageUrl || null,
        total,
      });
    }

    successResponse(res, {
      valid: !hasError,
      subtotal,
      items: validatedItems,
      message: hasError ? 'Some items have issues' : 'Cart is valid',
    });
  } catch (error) {
    logger.error('Validate cart error:', error);
    errorResponse(res, 'Failed to validate cart', 500, error);
  }
};

// Get user's cart (if using persistent cart)
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const cart = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
    });

    successResponse(res, { items: cart });
  } catch (error) {
    logger.error('Get cart error:', error);
    errorResponse(res, 'Failed to fetch cart', 500, error);
  }
};

// Add to cart
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { listingId, quantity } = req.body;

    // Get listing
    const listingData = await prisma.listing.findUnique({
      where: { id: BigInt(listingId) },
    });

    if (!listingData) {
      errorResponse(res, 'Listing not found', 404);
      return;
    }

    // Check if already in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_listingId: {
          userId: req.user.id,
          listingId: BigInt(listingId),
        },
      },
    });

    let cartItem;
    if (existingCartItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: req.user.id,
          listingId: BigInt(listingId),
          quantity,
        },
      });
    }

    successResponse(res, cartItem, 'Item added to cart');
  } catch (error) {
    logger.error('Add to cart error:', error);
    errorResponse(res, 'Failed to add to cart', 500, error);
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await prisma.cartItem.delete({
        where: { id: BigInt(id), userId: req.user.id },
      });
      successResponse(res, null, 'Item removed from cart');
      return;
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: BigInt(id), userId: req.user.id },
      data: { quantity },
    });

    successResponse(res, cartItem, 'Cart updated');
  } catch (error) {
    logger.error('Update cart error:', error);
    errorResponse(res, 'Failed to update cart', 500, error);
  }
};

// Remove from cart
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;

    await prisma.cartItem.delete({
      where: { id: BigInt(id), userId: req.user.id },
    });

    successResponse(res, null, 'Item removed from cart');
  } catch (error) {
    logger.error('Remove from cart error:', error);
    errorResponse(res, 'Failed to remove from cart', 500, error);
  }
};

// Clear cart
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id },
    });

    successResponse(res, null, 'Cart cleared');
  } catch (error) {
    logger.error('Clear cart error:', error);
    errorResponse(res, 'Failed to clear cart', 500, error);
  }
};

// Sync cart (for guest users who sign in)
export const syncCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { items } = req.body; // Array of { listingId, quantity }

    if (!Array.isArray(items)) {
      errorResponse(res, 'Invalid items format', 400);
      return;
    }

    // Delete existing cart items
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id },
    });

    // Create new cart items
    if (items.length > 0) {
      await prisma.cartItem.createMany({
        data: items.map((item: { listingId: string; quantity: number }) => ({
          userId: req.user!.id,
          listingId: BigInt(item.listingId),
          quantity: item.quantity,
        })),
      });
    }

    // Return updated cart
    const cart = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: { take: 1 } },
            },
          },
        },
      },
    });

    successResponse(res, { items: cart }, 'Cart synced successfully');
  } catch (error) {
    logger.error('Sync cart error:', error);
    errorResponse(res, 'Failed to sync cart', 500, error);
  }
};
