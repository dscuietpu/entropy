import { Request, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  createIssue,
  deleteIssueById,
  getAllIssues,
  getIssueById,
  updateIssue,
} from "../services/issue.service";
import { jsonSuccess } from "../utils/respond";

export const listIssues = async (req: Request, res: Response): Promise<void> => {
  const result = await getAllIssues({
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
    issueType: req.query.issueType as string | undefined,
    roleType: req.query.roleType as string | undefined,
    hospitalId: req.query.hospitalId as string | undefined,
    city: req.query.city as string | undefined,
    state: req.query.state as string | undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    order: req.query.order as string | undefined,
  });

  jsonSuccess(res, { data: result.data, pagination: result.pagination });
};

export const getIssue = async (req: Request, res: Response): Promise<void> => {
  const issue = await getIssueById(req.params.id);

  jsonSuccess(res, { data: issue });
};

export const createIssuePost = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  const issue = await createIssue(
    {
      createdBy: authReq.user.userId,
      roleType: req.body.roleType,
      issueType: req.body.issueType,
      title: req.body.title,
      description: req.body.description,
      hospitalId: req.body.hospitalId,
    },
    files
  );

  jsonSuccess(res, { message: "Issue created successfully", data: issue }, 201);
};

export const patchIssue = async (req: Request, res: Response): Promise<void> => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  const issue = await updateIssue(
    req.params.id,
    {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      resolvedBy: req.body.resolvedBy,
      resolvedAt: req.body.resolvedAt,
      attachmentMode: req.body.attachmentMode,
    },
    files
  );

  jsonSuccess(res, { message: "Issue updated successfully", data: issue });
};

export const removeIssue = async (req: Request, res: Response): Promise<void> => {
  await deleteIssueById(req.params.id);

  jsonSuccess(res, { message: "Issue deleted successfully" });
};
