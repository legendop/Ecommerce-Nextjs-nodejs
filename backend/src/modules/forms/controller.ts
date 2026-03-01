import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// Get form by slug (public)
export const getForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const form = await prisma.form.findUnique({
      where: { slug },
      include: {
        fields: {
          where: { isRequired: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            label: true,
            fieldKey: true,
            fieldType: true,
            isRequired: true,
            placeholder: true,
            helpText: true,
            options: true,
            defaultValue: true,
            validation: true,
          },
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

// Submit form (public)
export const submitForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const data = req.body;

    const form = await prisma.form.findUnique({
      where: { slug },
      include: {
        fields: true,
      },
    });

    if (!form || !form.isActive) {
      errorResponse(res, 'Form not found', 404);
      return;
    }

    // Validate required fields
    for (const field of form.fields) {
      if (field.isRequired && !data[field.fieldKey]) {
        errorResponse(res, `${field.label} is required`, 400);
        return;
      }
    }

    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        userId: req.user?.id,
        data,
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined,
      },
    });

    successResponse(res, submission, form.successMessage || 'Form submitted successfully');
  } catch (error) {
    logger.error('Submit form error:', error);
    errorResponse(res, 'Failed to submit form', 500, error);
  }
};

// Admin: List forms
export const listForms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);

    const total = await prisma.form.count();

    const forms = await prisma.form.findMany({
      include: {
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    paginatedResponse(res, forms, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('List forms error:', error);
    errorResponse(res, 'Failed to fetch forms', 500, error);
  }
};

// Admin: Create form
export const createForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const form = await prisma.form.create({
      data: req.body,
    });

    successResponse(res, form, 'Form created successfully', 201);
  } catch (error) {
    logger.error('Create form error:', error);
    errorResponse(res, 'Failed to create form', 500, error);
  }
};

// Admin: Update form
export const updateForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const form = await prisma.form.update({
      where: { id: BigInt(id) },
      data: req.body,
    });

    successResponse(res, form, 'Form updated successfully');
  } catch (error) {
    logger.error('Update form error:', error);
    errorResponse(res, 'Failed to update form', 500, error);
  }
};

// Admin: Delete form
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

// Admin: Add form field
export const addFormField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const field = await prisma.formField.create({
      data: {
        ...req.body,
        formId: BigInt(id),
      },
    });

    successResponse(res, field, 'Field added successfully', 201);
  } catch (error) {
    logger.error('Add form field error:', error);
    errorResponse(res, 'Failed to add field', 500, error);
  }
};

// Admin: Update form field
export const updateFormField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;

    const field = await prisma.formField.update({
      where: { id: BigInt(fieldId) },
      data: req.body,
    });

    successResponse(res, field, 'Field updated successfully');
  } catch (error) {
    logger.error('Update form field error:', error);
    errorResponse(res, 'Failed to update field', 500, error);
  }
};

// Admin: Delete form field
export const deleteFormField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;

    await prisma.formField.delete({
      where: { id: BigInt(fieldId) },
    });

    successResponse(res, null, 'Field deleted successfully');
  } catch (error) {
    logger.error('Delete form field error:', error);
    errorResponse(res, 'Failed to delete field', 500, error);
  }
};

// Admin: Get form submissions
export const getFormSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit, skip } = getPaginationParams(req);

    const total = await prisma.formSubmission.count({
      where: { formId: BigInt(id) },
    });

    const submissions = await prisma.formSubmission.findMany({
      where: { formId: BigInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    paginatedResponse(res, submissions, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Get form submissions error:', error);
    errorResponse(res, 'Failed to fetch submissions', 500, error);
  }
};
