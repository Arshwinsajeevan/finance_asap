import { Router, Request, Response } from 'express';
import upload from '../middleware/upload';
import { success, error } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, (req: Request, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      return error(res, err.message, 400);
    }

    if (!req.file) {
      return error(res, 'No file uploaded', 400);
    }

    // Return the relative URL to the file
    const fileUrl = `/uploads/${req.file.filename}`;
    
    return success(res, {
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    }, 'File uploaded successfully');
  });
});

export default router;
