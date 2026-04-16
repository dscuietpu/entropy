import { Server, Socket } from "socket.io";

export const CHAT_EVENTS = {
  MESSAGE: "chat:message",
} as const;

export const registerChatSocket = (io: Server, socket: Socket): void => {
  socket.on("chat:join", (payload: { chatRoomId: string }) => {
    if (!payload?.chatRoomId) {
      return;
    }
    void socket.join(payload.chatRoomId);
  });

  socket.on("chat:leave", (payload: { chatRoomId: string }) => {
    if (!payload?.chatRoomId) {
      return;
    }
    void socket.leave(payload.chatRoomId);
  });

  socket.on(
    "chat:message",
    (payload: { chatRoomId: string; message: unknown; senderId?: string }) => {
      if (!payload?.chatRoomId) {
        return;
      }

      io.to(payload.chatRoomId).emit(CHAT_EVENTS.MESSAGE, {
        chatRoomId: payload.chatRoomId,
        message: payload.message,
        senderId: payload.senderId,
        createdAt: new Date().toISOString(),
      });
    }
  );
};

