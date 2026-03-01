import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { errorResponse } from '../utils/response';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
    }));

    errorResponse(res, 'Validation failed', 400, { errors: errorMessages });
    return;
  }

  next();
};

// Wrapper to run validations and check results
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    validateRequest(req, res, next);
  };
};
