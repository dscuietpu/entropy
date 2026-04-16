import { Router } from "express";

import {
  createIssuePost,
  getIssue,
  listIssues,
  patchIssue,
  removeIssue,
} from "../controllers/issue.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { upload } from "../middleware/upload.middleware";
import { asyncHandler } from "../utils/async-handler";

const issueRouter = Router();

issueRouter.get("/", asyncHandler(listIssues));
issueRouter.get("/:id", asyncHandler(getIssue));
issueRouter.post(
  "/",
  authenticate,
  authorizeRoles("patient", "hospital_admin", "doctor"),
  upload.array("attachments", 5),
  asyncHandler(createIssuePost)
);
issueRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("hospital_admin", "doctor"),
  upload.array("attachments", 5),
  asyncHandler(patchIssue)
);
issueRouter.delete("/:id", authenticate, authorizeRoles("hospital_admin"), asyncHandler(removeIssue));

export default issueRouter;
