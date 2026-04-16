import { Schema } from "mongoose";

export const CLOUDINARY_RESOURCE_TYPES = ["image", "video", "raw"] as const;

export type CloudinaryResourceType = (typeof CLOUDINARY_RESOURCE_TYPES)[number];

export interface IMediaAttachment {
  url: string;
  publicId: string;
  resourceType: CloudinaryResourceType;
  format?: string;
  bytes?: number;
  originalName?: string;
}

export const mediaAttachmentSchema = new Schema<IMediaAttachment>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    resourceType: { type: String, enum: CLOUDINARY_RESOURCE_TYPES, required: true },
    format: { type: String, trim: true },
    bytes: { type: Number, min: 0 },
    originalName: { type: String, trim: true },
  },
  { _id: false }
);
