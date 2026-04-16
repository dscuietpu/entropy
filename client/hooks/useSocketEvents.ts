"use client";

import { useEffect, useRef } from "react";

import { useSocket } from "@/hooks/useSocket";

type EventHandlers = Record<string, (payload: unknown) => void>;

export function useSocketEvents(handlers: EventHandlers, enabled = true) {
  const { socket, connect } = useSocket();
  const handlersRef = useRef(handlers);

  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled || !socket) {
      return;
    }

    connect();

    const entries = Object.keys(handlersRef.current).map((eventName) => {
      const listener = (payload: unknown) => {
        handlersRef.current[eventName]?.(payload);
      };

      socket.on(eventName, listener);
      return { eventName, listener };
    });

    return () => {
      for (const entry of entries) {
        socket.off(entry.eventName, entry.listener);
      }
    };
  }, [connect, enabled, socket]);
}
