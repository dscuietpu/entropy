"use client";

import { useEffect, useState } from "react";

import { connectSocket, getSocketClient, type AppSocket } from "@/socket/client";

interface UseSocketOptions {
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options;
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const instance = autoConnect ? connectSocket() : getSocketClient();

    if (!instance) {
      return;
    }

    setSocket(instance);
    setIsConnected(instance.connected);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    instance.on("connect", handleConnect);
    instance.on("disconnect", handleDisconnect);

    return () => {
      instance.off("connect", handleConnect);
      instance.off("disconnect", handleDisconnect);
    };
  }, [autoConnect]);

  return {
    socket,
    isConnected,
    connect: connectSocket,
  };
}
