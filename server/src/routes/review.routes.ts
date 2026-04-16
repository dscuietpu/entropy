import { Router } from "express";

import {
  createReviewRecord,
  getReview,
  listReviews,
  patchReview,
  removeReview,
} from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const reviewRouter = Router();

reviewRouter.get("/", asyncHandler(listReviews));
reviewRouter.get("/:id", asyncHandler(getReview));

reviewRouter.post(
  "/",
  authenticate,
  authorizeRoles("patient", "hospital_admin", "doctor"),
  asyncHandler(createReviewRecord)
);
reviewRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("patient", "hospital_admin", "doctor"),
  asyncHandler(patchReview)
);
reviewRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("patient", "hospital_admin"),
  asyncHandler(removeReview)
);

export default reviewRouter;

