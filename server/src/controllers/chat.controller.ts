import { Request, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createChatMessage, getMessagesForRoom } from "../services/chat.service";
import { jsonSuccess } from "../utils/respond";

export const listRoomMessages = async (req: Request, res: Response): Promise<void> => {
  const result = await getMessagesForRoom({
    chatRoomId: req.params.chatRoomId,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });

  jsonSuccess(res, { data: result.data, pagination: result.pagination });
};

export const postMessage = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  const message = await createChatMessage(
    {
      senderId: authReq.user.userId,
      senderRole: authReq.user.role,
      chatRoomId: req.body.chatRoomId,
      message: req.body.message,
    },
    files
  );

  jsonSuccess(res, { message: "Message sent successfully", data: message }, 201);
};
