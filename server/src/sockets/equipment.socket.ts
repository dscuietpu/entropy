import { Server, Socket } from "socket.io";

export const EQUIPMENT_EVENTS = {
  UPDATED: "equipment:updated",
} as const;

export const registerEquipmentSocket = (_io: Server, _socket: Socket): void => {
  // Reserved for future client -> server equipment realtime actions.
};

