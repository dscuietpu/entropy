import { FilterQuery, Types } from "mongoose";

import {
  IMessage,
  IMediaAttachment,
  MESSAGE_SENDER_ROLES,
  Message,
  MessageSenderRole,
} from "../models";
import { User } from "../models";
import { emitChatMessage } from "../sockets";
import { uploadMultipleFilesToCloudinary } from "./cloudinary.service";
import { HttpError } from "../utils/http-error";

interface MessageListFilters {
  chatRoomId: string;
  page?: string;
  limit?: string;
}

interface CreateChatMessagePayload {
  senderId: string;
  senderRole: string;
  chatRoomId?: string;
  message?: string;
}

interface SenderSummary {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
}

export interface ChatMessageResponse {
  id: string;
  chatRoomId: string;
  message: string;
  senderRole: MessageSenderRole;
  attachments: IMediaAttachment[];
  readBy: string[];
  sender: SenderSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const isMessageSenderRole = (value: string): value is MessageSenderRole =>
  (MESSAGE_SENDER_ROLES as readonly string[]).includes(value);

const mapDocToResponse = (doc: Record<string, unknown>): ChatMessageResponse => {
  const senderRaw = doc.senderId as
    | { _id: Types.ObjectId; name: string; email: string; role: string; phone: string }
    | null
    | undefined;

  const sender: SenderSummary | null = senderRaw
    ? {
        _id: String(senderRaw._id),
        name: senderRaw.name,
        email: senderRaw.email,
        role: senderRaw.role,
        phone: senderRaw.phone,
      }
    : null;

  const readBy = (doc.readBy as Types.ObjectId[] | undefined)?.map((id) => String(id)) ?? [];

  return {
    id: String(doc._id),
    chatRoomId: String(doc.chatRoomId),
    message: String(doc.message),
    senderRole: doc.senderRole as MessageSenderRole,
    attachments: (doc.attachments as IMediaAttachment[] | undefined) ?? [],
    readBy,
    sender,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
};

export const getMessagesForRoom = async (
  filters: MessageListFilters
): Promise<{
  data: ChatMessageResponse[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> => {
  const chatRoomId = filters.chatRoomId?.trim();
  if (!chatRoomId) {
    throw new HttpError(400, "chatRoomId is required");
  }

  const page = toPositiveNumber(filters.page, 1);
  const limit = Math.min(toPositiveNumber(filters.limit, 20), 100);
  const skip = (page - 1) * limit;

  const query: FilterQuery<IMessage> = { chatRoomId };

  const [rawMessages, total] = await Promise.all([
    Message.find(query)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name email role phone")
      .lean(),
    Message.countDocuments(query),
  ]);

  const data = rawMessages.map((m) => mapDocToResponse(m as Record<string, unknown>));

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const createChatMessage = async (
  payload: CreateChatMessagePayload,
  files: Express.Multer.File[]
): Promise<ChatMessageResponse> => {
  const chatRoomId = payload.chatRoomId?.trim();
  if (!chatRoomId) {
    throw new HttpError(400, "chatRoomId is required");
  }

  const text = (payload.message ?? "").trim();
  const hasFiles = files.length > 0;

  if (!text && !hasFiles) {
    throw new HttpError(400, "Message text or at least one attachment is required");
  }

  if (!isMessageSenderRole(payload.senderRole)) {
    throw new HttpError(400, "Invalid sender role");
  }

  const senderExists = await User.exists({ _id: payload.senderId });
  if (!senderExists) {
    throw new HttpError(404, "Sender not found");
  }

  const attachments = await uploadMultipleFilesToCloudinary({
    folder: "chat-messages",
    files,
  });

  const messageText = text || (hasFiles ? "[Attachment]" : text);

  const created = await Message.create({
    chatRoomId,
    senderId: new Types.ObjectId(payload.senderId),
    senderRole: payload.senderRole,
    message: messageText,
    attachments,
  });

  const populated = await Message.findById(created._id)
    .populate("senderId", "name email role phone")
    .lean();

  if (!populated) {
    throw new HttpError(500, "Failed to load created message");
  }

  const response = mapDocToResponse(populated as Record<string, unknown>);

  emitChatMessage(chatRoomId, {
    persisted: true,
    ...response,
  });

  return response;
};
