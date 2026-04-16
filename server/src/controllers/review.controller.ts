import { Request, Response } from "express";

import {
  createReview,
  deleteReview,
  getReviewById,
  getReviews,
  updateReview,
} from "../services/review.service";
import { jsonSuccess } from "../utils/respond";

export const listReviews = async (req: Request, res: Response): Promise<void> => {
  const result = await getReviews({
    targetType: req.query.targetType as string | undefined,
    targetId: req.query.targetId as string | undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });

  jsonSuccess(res, { data: result.data, pagination: result.pagination });
};

export const getReview = async (req: Request, res: Response): Promise<void> => {
  const review = await getReviewById(req.params.id);

  jsonSuccess(res, { data: review });
};

export const createReviewRecord = async (req: Request, res: Response): Promise<void> => {
  const review = await createReview({
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    rating: req.body.rating,
    comment: req.body.comment,
    createdBy: req.user?.userId ?? req.body.createdBy,
  });

  jsonSuccess(res, { message: "Review created successfully", data: review }, 201);
};

export const patchReview = async (req: Request, res: Response): Promise<void> => {
  const review = await updateReview(req.params.id, {
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  jsonSuccess(res, { message: "Review updated successfully", data: review });
};

export const removeReview = async (req: Request, res: Response): Promise<void> => {
  await deleteReview(req.params.id);

  jsonSuccess(res, { message: "Review deleted successfully" });
};

