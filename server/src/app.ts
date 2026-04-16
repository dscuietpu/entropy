import cors from "cors";
import express from "express";

import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import aiRouter from "./routes/ai.routes";
import ambulanceRouter from "./routes/ambulance.routes";
import appointmentRouter from "./routes/appointment.routes";
import authRouter from "./routes/auth.routes";
import chatRouter from "./routes/chat.routes";
import doctorRouter from "./routes/doctor.routes";
import equipmentRouter from "./routes/equipment.routes";
import healthRouter from "./routes/health.routes";
import hospitalRouter from "./routes/hospital.routes";
import issueRouter from "./routes/issue.routes";
import medicalShopRouter from "./routes/medicalShop.routes";
import reviewRouter from "./routes/review.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/ai", aiRouter);
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/issues", issueRouter);
app.use("/api/hospitals", hospitalRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/equipment", equipmentRouter);
app.use("/api/ambulances", ambulanceRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/medical-shops", medicalShopRouter);
app.use("/api/reviews", reviewRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
