import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// ==========================================
// PUBLIC API - Get form by slug
// ==========================================
export const getForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const form = await prisma.form.findUnique({
      where: { slug },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!form || !form.isActive) {
      errorResponse(res, 'Form not found', 404);
      return;
    }

    successResponse(res, form);
  } catch (error) {
    logger.error('Get form error:', error);
    errorResponse(res, 'Failed to fetch form', 500, error);
  }
};

// ==========================================
// PUBLIC API - Submit form
// ==========================================
export const submitForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { data } = req.body;

    const form = await prisma.form.findUnique({
      where: { slug },
    });

    if (!form || !form.isActive) {
      errorResponse(res, 'Form not found', 404);
      return;
    }

    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        userId: req.user?.id,
        data,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    successResponse(res, submission, 'Form submitted successfully', 201);
  } catch (error) {
    logger.error('Submit form error:', error);
    errorResponse(res, 'Failed to submit form', 500, error);
  }
};

// ==========================================
// ADMIN API - List forms
// ==========================================
export const adminListForms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);

    const total = await prisma.form.count();

    const forms = await prisma.form.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    paginatedResponse(res, forms, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Admin list forms error:', error);
    errorResponse(res, 'Failed to fetch forms', 500, error);
  }
};

// ==========================================
// ADMIN API - Get form with submissions
// ==========================================
export const adminGetForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const form = await prisma.form.findUnique({
      where: { id: BigInt(id) },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!form) {
      errorResponse(res, 'Form not found', 404);
      return;
    }

    successResponse(res, form);
  } catch (error) {
    logger.error('Admin get form error:', error);
    errorResponse(res, 'Failed to fetch form', 500, error);
  }
};

// ==========================================
// ADMIN API - Create form
// ==========================================
export const createForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, submitText, successMessage } = req.body;

    const form = await prisma.form.create({
      data: {
        name,
        slug,
        description,
        submitText,
        successMessage,
      },
    });

    successResponse(res, form, 'Form created successfully', 201);
  } catch (error) {
    logger.error('Create form error:', error);
    errorResponse(res, 'Failed to create form', 500, error);
  }
};

// ==========================================
// ADMIN API - Update form
// ==========================================
export const updateForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isActive, submitText, successMessage } = req.body;

    const form = await prisma.form.update({
      where: { id: BigInt(id) },
      data: {
        name,
        description,
        isActive,
        submitText,
        successMessage,
      },
    });

    successResponse(res, form, 'Form updated successfully');
  } catch (error) {
    logger.error('Update form error:', error);
    errorResponse(res, 'Failed to update form', 500, error);
  }
};

// ==========================================
// ADMIN API - Delete form
// ==========================================
export const deleteForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.form.delete({
      where: { id: BigInt(id) },
    });

    successResponse(res, null, 'Form deleted successfully');
  } catch (error) {
    logger.error('Delete form error:', error);
    errorResponse(res, 'Failed to delete form', 500, error);
  }
};

// ==========================================
// ADMIN API - Add form field
// ==========================================
export const addFormField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { formId } = req.params;
    const { label, fieldKey, fieldType, isRequired, options, sortOrder } = req.body;

    const field = await prisma.formField.create({
      data: {
        formId: BigInt(formId),
        label,
        fieldKey,
        fieldType,
        isRequired: isRequired ?? false,
        options,
        sortOrder: sortOrder || 0,
      },
    });

    successResponse(res, field, 'Field added successfully', 201);
  } catch (error) {
    logger.error('Add form field error:', error);
    errorResponse(res, 'Failed to add field', 500, error);
  }
};

// ==========================================
// ADMIN API - Delete form field
// ==========================================
export const deleteFormField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.formField.delete({
      where: { id: BigInt(id) },
    });

    successResponse(res, null, 'Field deleted successfully');
  } catch (error) {
    logger.error('Delete form field error:', error);
    errorResponse(res, 'Failed to delete field', 500, error);
  }
};
