import { Router } from "express";

import { listRoomMessages, postMessage } from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { upload } from "../middleware/upload.middleware";
import { asyncHandler } from "../utils/async-handler";

const chatRouter = Router();

chatRouter.get(
  "/rooms/:chatRoomId/messages",
  authenticate,
  authorizeRoles("patient", "hospital_admin", "doctor"),
  asyncHandler(listRoomMessages)
);

chatRouter.post(
  "/messages",
  authenticate,
  authorizeRoles("patient", "hospital_admin", "doctor"),
  upload.array("attachments", 5),
  asyncHandler(postMessage)
);

export default chatRouter;
