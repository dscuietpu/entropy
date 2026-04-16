import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export const REVIEW_TARGET_TYPES = ["hospital", "doctor"] as const;
export type ReviewTargetType = (typeof REVIEW_TARGET_TYPES)[number];

export interface IReview {
  targetType: ReviewTargetType;
  targetId: Types.ObjectId;
  rating: number;
  comment: string;
  createdBy?: Types.ObjectId;
}

type ReviewModel = Model<IReview>;
export type ReviewDocument = HydratedDocument<IReview>;

const reviewSchema = new Schema<IReview, ReviewModel>(
  {
    targetType: { type: String, enum: REVIEW_TARGET_TYPES, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

reviewSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
reviewSchema.index({ createdBy: 1, createdAt: -1 });

export const Review = model<IReview, ReviewModel>("Review", reviewSchema);
