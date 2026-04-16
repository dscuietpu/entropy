import { Server, Socket } from "socket.io";

export const ISSUE_EVENTS = {
  CREATED: "issue:created",
  UPDATED: "issue:updated",
} as const;

export const registerIssueSocket = (_io: Server, _socket: Socket): void => {
  // Reserved for future client -> server issue realtime actions.
};

