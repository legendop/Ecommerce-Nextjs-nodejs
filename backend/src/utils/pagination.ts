import { Request } from 'express';
import config from '../config';
import { createPaginationMeta } from './response';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationParams = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    config.MAX_PAGE_SIZE,
    Math.max(1, parseInt(req.query.limit as string) || config.DEFAULT_PAGE_SIZE)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const getSortParams = (
  req: Request,
  allowedFields: string[],
  defaultSort: string = 'createdAt'
): { field: string; order: 'asc' | 'desc' } => {
  const sortParam = (req.query.sort as string) || defaultSort;
  const order = sortParam.startsWith('-') ? 'desc' : 'asc';
  const field = sortParam.replace(/^-/, '');

  // Validate field
  if (!allowedFields.includes(field)) {
    return { field: defaultSort, order: 'desc' };
  }

  return { field, order };
};

export const getSearchQuery = (
  req: Request,
  searchableFields: string[]
): { OR?: unknown[] } | {} => {
  const search = req.query.search as string;

  if (!search || search.trim() === '') {
    return {};
  }

  return {
    OR: searchableFields.map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive',
      },
    })),
  };
};

export { createPaginationMeta };
