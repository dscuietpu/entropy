import { FilterQuery, Types, isValidObjectId } from "mongoose";

import {
  IIssue,
  ISSUE_ROLE_TYPES,
  ISSUE_STATUSES,
  ISSUE_TYPES,
  IMediaAttachment,
  Issue,
  IssueRoleType,
  IssueStatus,
  IssueType,
} from "../models";
import { deleteCloudinaryAsset, uploadMultipleFilesToCloudinary } from "./cloudinary.service";
import { HttpError } from "../utils/http-error";
import { emitIssueCreated, emitIssueUpdated } from "../sockets";

interface IssueListFilters {
  status?: string;
  issueType?: string;
  roleType?: string;
  hospitalId?: string;
  page?: string;
  limit?: string;
}

interface CreateIssuePayload {
  createdBy: string;
  roleType?: string;
  issueType?: string;
  title?: string;
  description?: string;
  hospitalId?: string;
}

interface UpdateIssuePayload {
  title?: string;
  description?: string;
  status?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  attachmentMode?: string;
}

const isValidEnumValue = <T extends readonly string[]>(value: string, values: T): boolean =>
  values.includes(value as T[number]);

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const validateObjectId = (value: string, fieldName: string): Types.ObjectId => {
  if (!isValidObjectId(value)) {
    throw new HttpError(400, `Invalid ${fieldName}`);
  }

  return new Types.ObjectId(value);
};

export const getAllIssues = async (
  filters: IssueListFilters
): Promise<{
  data: IIssue[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> => {
  const page = toPositiveNumber(filters.page, 1);
  const limit = Math.min(toPositiveNumber(filters.limit, 10), 100);
  const skip = (page - 1) * limit;

  const query: FilterQuery<IIssue> = {};

  if (filters.status) {
    if (!isValidEnumValue(filters.status, ISSUE_STATUSES)) {
      throw new HttpError(400, "Invalid status filter");
    }
    query.status = filters.status as IssueStatus;
  }

  if (filters.issueType) {
    if (!isValidEnumValue(filters.issueType, ISSUE_TYPES)) {
      throw new HttpError(400, "Invalid issueType filter");
    }
    query.issueType = filters.issueType as IssueType;
  }

  if (filters.roleType) {
    if (!isValidEnumValue(filters.roleType, ISSUE_ROLE_TYPES)) {
      throw new HttpError(400, "Invalid roleType filter");
    }
    query.roleType = filters.roleType as IssueRoleType;
  }

  if (filters.hospitalId) {
    query.hospitalId = validateObjectId(filters.hospitalId, "hospitalId");
  }

  const [issues, total] = await Promise.all([
    Issue.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Issue.countDocuments(query),
  ]);

  return {
    data: issues,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getIssueById = async (id: string): Promise<IIssue> => {
  const issueId = validateObjectId(id, "issue id");
  const issue = await Issue.findById(issueId).lean();

  if (!issue) {
    throw new HttpError(404, "Issue not found");
  }

  return issue;
};

export const createIssue = async (
  payload: CreateIssuePayload,
  files: Express.Multer.File[] = []
): Promise<IIssue> => {
  const { createdBy, roleType, issueType, title, description, hospitalId } = payload;

  if (!roleType || !issueType || !title || !description) {
    throw new HttpError(
      400,
      "roleType, issueType, title and description are required fields"
    );
  }

  if (!isValidEnumValue(roleType, ISSUE_ROLE_TYPES)) {
    throw new HttpError(400, "Invalid roleType");
  }

  if (!isValidEnumValue(issueType, ISSUE_TYPES)) {
    throw new HttpError(400, "Invalid issueType");
  }

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (!trimmedTitle) {
    throw new HttpError(400, "title cannot be empty");
  }

  if (!trimmedDescription) {
    throw new HttpError(400, "description cannot be empty");
  }

  const attachments: IMediaAttachment[] = files.length
    ? await uploadMultipleFilesToCloudinary({
        folder: "hackathonn/issues",
        files,
      })
    : [];

  const newIssue = await Issue.create({
    createdBy: validateObjectId(createdBy, "createdBy"),
    roleType,
    issueType,
    title: trimmedTitle,
    description: trimmedDescription,
    hospitalId: hospitalId ? validateObjectId(hospitalId, "hospitalId") : undefined,
    attachments,
  });

  const created = newIssue.toObject();
  emitIssueCreated(created);
  return created;
};

export const updateIssue = async (
  id: string,
  payload: UpdateIssuePayload,
  files: Express.Multer.File[] = []
): Promise<IIssue> => {
  const issueId = validateObjectId(id, "issue id");
  const issue = await Issue.findById(issueId);

  if (!issue) {
    throw new HttpError(404, "Issue not found");
  }

  if (payload.title !== undefined) {
    const trimmedTitle = payload.title.trim();
    if (!trimmedTitle) {
      throw new HttpError(400, "title cannot be empty");
    }
    issue.title = trimmedTitle;
  }

  if (payload.description !== undefined) {
    const trimmedDescription = payload.description.trim();
    if (!trimmedDescription) {
      throw new HttpError(400, "description cannot be empty");
    }
    issue.description = trimmedDescription;
  }

  if (payload.status) {
    if (!isValidEnumValue(payload.status, ISSUE_STATUSES)) {
      throw new HttpError(400, "Invalid status");
    }
    issue.status = payload.status as IssueStatus;
  }

  if (payload.resolvedBy) {
    issue.resolvedBy = validateObjectId(payload.resolvedBy, "resolvedBy");
  }

  if (payload.resolvedAt) {
    const resolvedAtDate = new Date(payload.resolvedAt);
    if (Number.isNaN(resolvedAtDate.getTime())) {
      throw new HttpError(400, "Invalid resolvedAt date");
    }
    issue.resolvedAt = resolvedAtDate;
  }

  const attachmentMode = payload.attachmentMode ?? "append";
  if (!["append", "replace"].includes(attachmentMode)) {
    throw new HttpError(400, "attachmentMode must be either 'append' or 'replace'");
  }

  if (attachmentMode === "replace" && files.length) {
    const existingAttachments = issue.attachments ?? [];
    if (existingAttachments.length) {
      await Promise.all(
        existingAttachments.map((attachment) =>
          deleteCloudinaryAsset(attachment.publicId, attachment.resourceType)
        )
      );
    }
    issue.attachments = [];
  }

  if (files.length) {
    const newAttachments = await uploadMultipleFilesToCloudinary({
      folder: "hackathonn/issues",
      files,
    });
    issue.attachments.push(...newAttachments);
  }

  if (
    payload.title === undefined &&
    payload.description === undefined &&
    payload.status === undefined &&
    payload.resolvedBy === undefined &&
    payload.resolvedAt === undefined &&
    files.length === 0
  ) {
    throw new HttpError(400, "No valid update fields provided");
  }

  await issue.save();

  const updatedIssue = issue.toObject();
  emitIssueUpdated(updatedIssue);
  return updatedIssue;
};

export const deleteIssueById = async (id: string): Promise<void> => {
  const issueId = validateObjectId(id, "issue id");
  const issue = await Issue.findById(issueId);

  if (!issue) {
    throw new HttpError(404, "Issue not found");
  }

  const attachmentsToDelete = issue.attachments ?? [];
  if (attachmentsToDelete.length) {
    await Promise.all(
      attachmentsToDelete.map((attachment) =>
        deleteCloudinaryAsset(attachment.publicId, attachment.resourceType)
      )
    );
  }

  await issue.deleteOne();
};
