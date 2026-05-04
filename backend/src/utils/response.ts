import { Response } from 'express';

/**
 * Standardized API response helpers
 * Ensures consistent response format across all endpoints
 */

export const success = (res: Response, data: any, message: string = 'Success', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const error = (res: Response, message: string = 'Something went wrong', statusCode: number = 500, errors: any = null) => {
  const response: any = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const paginated = (res: Response, data: any[], total: number, page: any, limit: any, message: string = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};
