import app from "./app";
import { connectToDatabase } from "./config/db";
import { env } from "./config/env";
import { initSockets } from "./sockets";
import http from "http";

const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();

    const httpServer = http.createServer(app);
    initSockets(httpServer);

    httpServer.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Server startup failed", error);
    process.exit(1);
  }
};

void startServer();
