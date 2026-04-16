import multer, { FileFilterCallback } from "multer";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_FILES_COUNT = 5;

const storage = multer.memoryStorage();

const allowedMimePrefixes = ["image/", "video/"];
const allowedRawMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/json",
];

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const isImageOrVideo = allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix));
  const isAllowedRawType = allowedRawMimeTypes.includes(file.mimetype);

  if (isImageOrVideo || isAllowedRawType) {
    cb(null, true);
    return;
  }

  cb(new Error("Unsupported file type. Allowed: image, video, selected raw files"));
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_COUNT,
  },
});

export const upload = uploadMiddleware;
