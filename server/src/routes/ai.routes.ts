import { Router } from "express";

import {
  chatHandler,
  smartSearchQueryHandler,
  summarizeReviewsHandler,
} from "../controllers/ai.controller";
import { asyncHandler } from "../utils/async-handler";

const aiRouter = Router();

aiRouter.post("/summarize-reviews", asyncHandler(summarizeReviewsHandler));
aiRouter.post("/chat", asyncHandler(chatHandler));
aiRouter.post("/smart-search-query", asyncHandler(smartSearchQueryHandler));

export default aiRouter;

