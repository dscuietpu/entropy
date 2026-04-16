import { Request, Response } from "express";

import { chat, smartSearchQuery, summarizeReviews } from "../services/ai.service";
import { jsonSuccess } from "../utils/respond";

export const summarizeReviewsHandler = async (req: Request, res: Response): Promise<void> => {
  const reviewTexts = req.body.reviewTexts as string[] | undefined;
  const summary = await summarizeReviews(reviewTexts ?? []);

  jsonSuccess(res, { data: { summary } });
};

export const chatHandler = async (req: Request, res: Response): Promise<void> => {
  const responseText = await chat({
    message: req.body.message,
    context: req.body.context,
  });

  jsonSuccess(res, { data: { response: responseText } });
};

export const smartSearchQueryHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await smartSearchQuery(req.body.query);

  jsonSuccess(res, { data: result });
};

