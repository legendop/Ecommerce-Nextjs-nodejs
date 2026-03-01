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
      const itemData = await prisma.item.findUnique({
        where: { id: BigInt(item.itemId || item.productId) },
        include: { catalog: true },
      });

      if (!itemData || !itemData.isActive) {
        validatedItems.push({
          itemId: BigInt(item.itemId || item.productId),
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
      if (itemData.stock < item.quantity) {
        validatedItems.push({
          itemId: itemData.id,
          name: itemData.catalog.name,
          price: Number(itemData.price),
          quantity: item.quantity,
          stock: itemData.stock,
          imageUrl: itemData.catalog.imageUrl,
          total: Number(itemData.price) * item.quantity,
        });
        hasError = true;
        continue;
      }

      const total = Number(itemData.price) * item.quantity;
      subtotal += total;

      validatedItems.push({
        itemId: itemData.id,
        name: itemData.catalog.name,
        price: Number(itemData.price),
        quantity: item.quantity,
        stock: itemData.stock,
        imageUrl: itemData.catalog.imageUrl,
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
        item: {
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

    const { productId, quantity } = req.body;

    // Get item price
    const itemData = await prisma.item.findUnique({
      where: { id: BigInt(productId) },
    });

    if (!itemData) {
      errorResponse(res, 'Product not found', 404);
      return;
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_itemId: {
          userId: req.user.id,
          itemId: BigInt(productId),
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId: req.user.id,
        itemId: BigInt(productId),
        quantity,
      },
    });

    successResponse(res, cartItem, 'Item added to cart');
  } catch (error) {
    logger.error('Add to cart error:', error);
    errorResponse(res, 'Failed to add to cart', 500, error);
  }
};

// Update cart item
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: { id: BigInt(id) },
      });
      successResponse(res, null, 'Item removed from cart');
      return;
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: BigInt(id) },
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
      where: { id: BigInt(id) },
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
