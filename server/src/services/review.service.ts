import { FilterQuery, Types, isValidObjectId } from "mongoose";

import {
  Doctor,
  Hospital,
  IReview,
  REVIEW_TARGET_TYPES,
  Review,
  ReviewTargetType,
} from "../models";
import { HttpError } from "../utils/http-error";

interface ReviewFilters {
  targetType?: string;
  targetId?: string;
  page?: string;
  limit?: string;
}

interface CreateReviewPayload {
  targetType?: string;
  targetId?: string;
  rating?: number;
  comment?: string;
  createdBy?: string;
}

interface UpdateReviewPayload {
  targetType?: string;
  targetId?: string;
  rating?: number;
  comment?: string;
}

interface ReviewListResponse {
  data: IReview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const validateTargetType = (targetType: string): ReviewTargetType => {
  if (!REVIEW_TARGET_TYPES.includes(targetType as ReviewTargetType)) {
    throw new HttpError(400, "Invalid targetType");
  }
  return targetType as ReviewTargetType;
};

const validateObjectId = (value: string, fieldName: string): string => {
  if (!isValidObjectId(value)) {
    throw new HttpError(400, `Invalid ${fieldName}`);
  }
  return value;
};

const validateRating = (rating: number): number => {
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, "rating must be between 1 and 5");
  }
  return rating;
};

const ensureTargetExists = async (targetType: ReviewTargetType, targetId: string): Promise<void> => {
  const exists =
    targetType === "doctor"
      ? await Doctor.exists({ _id: targetId })
      : await Hospital.exists({ _id: targetId });

  if (!exists) {
    throw new HttpError(404, `${targetType} not found for provided targetId`);
  }
};

const recalculateTargetAverageRating = async (
  targetType: ReviewTargetType,
  targetId: string | Types.ObjectId
): Promise<void> => {
  const normalizedTargetId = typeof targetId === "string" ? new Types.ObjectId(targetId) : targetId;

  const [result] = await Review.aggregate<{ avgRating: number }>([
    { $match: { targetType, targetId: normalizedTargetId } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]);

  const averageRating = Number((result?.avgRating ?? 0).toFixed(2));

  if (targetType === "doctor") {
    await Doctor.findByIdAndUpdate(normalizedTargetId, { averageRating });
  } else {
    await Hospital.findByIdAndUpdate(normalizedTargetId, { averageRating });
  }
};

export const getReviews = async (filters: ReviewFilters): Promise<ReviewListResponse> => {
  const page = toPositiveNumber(filters.page, 1);
  const limit = Math.min(toPositiveNumber(filters.limit, 10), 100);
  const skip = (page - 1) * limit;

  const query: FilterQuery<IReview> = {};

  if (filters.targetType) {
    query.targetType = validateTargetType(filters.targetType);
  }

  if (filters.targetId) {
    query.targetId = validateObjectId(filters.targetId, "targetId");
  }

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(query),
  ]);

  return {
    data: reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getReviewById = async (id: string): Promise<IReview> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid review id");
  }

  const review = await Review.findById(id).populate("createdBy", "name email role").lean();
  if (!review) {
    throw new HttpError(404, "Review not found");
  }

  return review;
};

export const createReview = async (payload: CreateReviewPayload): Promise<IReview> => {
  const { targetType, targetId, rating, comment, createdBy } = payload;

  if (!targetType || !targetId || rating === undefined || !comment) {
    throw new HttpError(400, "targetType, targetId, rating, and comment are required");
  }

  const parsedTargetType = validateTargetType(targetType);
  const parsedTargetId = validateObjectId(targetId, "targetId");
  const parsedRating = validateRating(rating);
  const trimmedComment = comment.trim();

  if (!trimmedComment) {
    throw new HttpError(400, "comment cannot be empty");
  }

  await ensureTargetExists(parsedTargetType, parsedTargetId);

  let parsedCreatedBy: Types.ObjectId | undefined;
  if (createdBy) {
    parsedCreatedBy = new Types.ObjectId(validateObjectId(createdBy, "createdBy"));
  }

  const review = await Review.create({
    targetType: parsedTargetType,
    targetId: new Types.ObjectId(parsedTargetId),
    rating: parsedRating,
    comment: trimmedComment,
    createdBy: parsedCreatedBy,
  });

  await recalculateTargetAverageRating(parsedTargetType, parsedTargetId);

  const created = await Review.findById(review._id).populate("createdBy", "name email role").lean();
  return created as IReview;
};

export const updateReview = async (id: string, payload: UpdateReviewPayload): Promise<IReview> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid review id");
  }

  const review = await Review.findById(id);
  if (!review) {
    throw new HttpError(404, "Review not found");
  }

  const hasUpdateField = [
    payload.targetType,
    payload.targetId,
    payload.rating,
    payload.comment,
  ].some((value) => value !== undefined);

  if (!hasUpdateField) {
    throw new HttpError(400, "No valid update fields provided");
  }

  const previousTargetType = review.targetType;
  const previousTargetId = review.targetId;

  if (payload.targetType !== undefined) {
    review.targetType = validateTargetType(payload.targetType);
  }
  if (payload.targetId !== undefined) {
    review.targetId = new Types.ObjectId(validateObjectId(payload.targetId, "targetId"));
  }
  if (payload.rating !== undefined) {
    review.rating = validateRating(payload.rating);
  }
  if (payload.comment !== undefined) {
    const value = payload.comment.trim();
    if (!value) throw new HttpError(400, "comment cannot be empty");
    review.comment = value;
  }

  await ensureTargetExists(review.targetType, review.targetId.toString());
  await review.save();

  await recalculateTargetAverageRating(review.targetType, review.targetId);

  if (
    previousTargetType !== review.targetType ||
    previousTargetId.toString() !== review.targetId.toString()
  ) {
    await recalculateTargetAverageRating(previousTargetType, previousTargetId);
  }

  const updated = await Review.findById(review._id).populate("createdBy", "name email role").lean();
  return updated as IReview;
};

export const deleteReview = async (id: string): Promise<void> => {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, "Invalid review id");
  }

  const review = await Review.findById(id);
  if (!review) {
    throw new HttpError(404, "Review not found");
  }

  const targetType = review.targetType;
  const targetId = review.targetId;

  await review.deleteOne();
  await recalculateTargetAverageRating(targetType, targetId);
};

