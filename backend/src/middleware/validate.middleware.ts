import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, body, param, query } from 'express-validator';
import { errorResponse } from '../utils/response';
import { ERROR_MESSAGES } from '../config/constants';

/**
 * Validation middleware - processes validation results
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
      value: err.type === 'field' ? err.value : undefined,
    }));

    errorResponse(res, ERROR_MESSAGES.VALIDATION_ERROR, 400, formattedErrors);
    return;
  }

  next();
};

/**
 * Common validation chains
 */
export const validators = {
  // Auth
  phone: body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any')
    .withMessage('Invalid phone number')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be 10-15 characters'),

  otp: body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isNumeric()
    .withMessage('OTP must be numeric')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),

  // User
  email: body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),

  name: body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Name must be 2-120 characters'),

  // IDs
  idParam: param('id')
    .notEmpty()
    .withMessage('ID is required'),

  slugParam: param('slug')
    .notEmpty()
    .withMessage('Slug is required'),

  // Pagination
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  // Products
  productName: body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be 2-255 characters'),

  price: body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  quantity: body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  // Addresses
  addressLine: body('line1')
    .notEmpty()
    .withMessage('Address line is required')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be 5-500 characters'),

  city: body('city')
    .notEmpty()
    .withMessage('City is required')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('City must be 2-120 characters'),

  state: body('state')
    .notEmpty()
    .withMessage('State is required')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('State must be 2-120 characters'),

  pincode: body('pincode')
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),

  // Orders
  orderStatus: body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'])
    .withMessage('Invalid status value'),

  // Coupons
  couponCode: body('code')
    .notEmpty()
    .withMessage('Coupon code is required')
    .trim()
    .toUpperCase()
    .isLength({ min: 3, max: 50 })
    .withMessage('Coupon code must be 3-50 characters'),
};

/**
 * Create validation middleware array from validators
 */
export const createValidation = (...validationChains: ValidationChain[]) => [
  ...validationChains,
  validate,
];

export default validate;
