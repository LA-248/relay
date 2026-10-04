import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

export default function handleMulterError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      console.error(
        `${err}: File size limit exceeded. Maximum file size allowed is 10MB.`,
      );
      return res.status(400).json({
        error: 'File size limit exceeded. Maximum file size allowed is 10MB.',
      });
    }
    // Handle other multer errors if needed
    console.error('Multer upload error:', err);
    return res.status(400).json({
      error: err.message,
    });
  }
  // For other types of errors, pass them to the next error handler
  next(err);
}
