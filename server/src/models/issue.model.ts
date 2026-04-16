import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

import { IMediaAttachment, mediaAttachmentSchema } from "./media-attachment.schema";

export const ISSUE_ROLE_TYPES = ["patient", "hospital"] as const;
export const ISSUE_TYPES = ["public-help", "equipment-shortage", "ambulance-request", "general"] as const;
export const ISSUE_STATUSES = ["open", "in-progress", "resolved"] as const;

export type IssueRoleType = (typeof ISSUE_ROLE_TYPES)[number];
export type IssueType = (typeof ISSUE_TYPES)[number];
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export interface IIssue {
  createdBy: Types.ObjectId;
  roleType: IssueRoleType;
  issueType: IssueType;
  title: string;
  description: string;
  hospitalId?: Types.ObjectId;
  status: IssueStatus;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  attachments: IMediaAttachment[];
}

type IssueModel = Model<IIssue>;
export type IssueDocument = HydratedDocument<IIssue>;

const issueSchema = new Schema<IIssue, IssueModel>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roleType: { type: String, enum: ISSUE_ROLE_TYPES, required: true },
    issueType: { type: String, enum: ISSUE_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", index: true },
    status: { type: String, enum: ISSUE_STATUSES, default: "open", required: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    attachments: { type: [mediaAttachmentSchema], default: [] },
  },
  { timestamps: true }
);

issueSchema.index({ status: 1, issueType: 1, createdAt: -1 });
issueSchema.index({ hospitalId: 1, status: 1, createdAt: -1 });

export const Issue = model<IIssue, IssueModel>("Issue", issueSchema);
