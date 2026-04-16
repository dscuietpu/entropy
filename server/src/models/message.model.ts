import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

import { IMediaAttachment, mediaAttachmentSchema } from "./media-attachment.schema";

export const MESSAGE_SENDER_ROLES = ["patient", "hospital_admin", "doctor"] as const;
export type MessageSenderRole = (typeof MESSAGE_SENDER_ROLES)[number];

export interface IMessage {
  chatRoomId: string;
  senderId: Types.ObjectId;
  senderRole: MessageSenderRole;
  message: string;
  attachments?: IMediaAttachment[];
  readBy?: Types.ObjectId[];
}

type MessageModel = Model<IMessage>;
export type MessageDocument = HydratedDocument<IMessage>;

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    chatRoomId: { type: String, required: true, trim: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderRole: { type: String, enum: MESSAGE_SENDER_ROLES, required: true },
    message: { type: String, required: true, trim: true },
    attachments: { type: [mediaAttachmentSchema], default: [] },
    readBy: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

messageSchema.index({ chatRoomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

export const Message = model<IMessage, MessageModel>("Message", messageSchema);
