import { UploadApiResponse } from "cloudinary";

import { cloudinary } from "../config/cloudinary";
import { CloudinaryResourceType, IMediaAttachment } from "../models";

interface UploadFileOptions {
  folder: string;
  file: Express.Multer.File;
  resourceType?: CloudinaryResourceType;
}

interface UploadMultipleFilesOptions {
  folder: string;
  files: Express.Multer.File[];
  resourceType?: CloudinaryResourceType;
}

const detectResourceTypeFromMime = (mimeType: string): CloudinaryResourceType => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "raw";
};

const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: CloudinaryResourceType,
  originalFilename: string
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        filename_override: originalFilename,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });

const mapUploadResultToAttachment = (
  result: UploadApiResponse,
  originalName: string
): IMediaAttachment => ({
  url: result.secure_url,
  publicId: result.public_id,
  resourceType: result.resource_type as CloudinaryResourceType,
  format: result.format,
  bytes: result.bytes,
  originalName,
});

export const uploadFileToCloudinary = async ({
  folder,
  file,
  resourceType,
}: UploadFileOptions): Promise<IMediaAttachment> => {
  const resolvedResourceType = resourceType ?? detectResourceTypeFromMime(file.mimetype);
  const uploadResult = await uploadBufferToCloudinary(
    file.buffer,
    folder,
    resolvedResourceType,
    file.originalname
  );

  return mapUploadResultToAttachment(uploadResult, file.originalname);
};

export const uploadMultipleFilesToCloudinary = async ({
  folder,
  files,
  resourceType,
}: UploadMultipleFilesOptions): Promise<IMediaAttachment[]> => {
  if (!files.length) {
    return [];
  }

  const uploads = files.map((file) =>
    uploadFileToCloudinary({
      folder,
      file,
      resourceType,
    })
  );

  return Promise.all(uploads);
};

export const deleteCloudinaryAsset = async (
  publicId: string,
  resourceType: CloudinaryResourceType = "image"
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
