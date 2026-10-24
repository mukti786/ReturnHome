import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

export const analyzeVideo = async (_req: AuthRequest, res: Response) => {
  return res.status(501).json({
    success: false,
    message: 'Video analysis is not connected to an uploaded-file processing workflow. No video was analyzed and no candidate result was created.'
  });
};

