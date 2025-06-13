// filepath: functions/src/config.ts
import * as functions from "firebase-functions/v1";

export const APP_ID = functions.config().app?.id || "default-app-id";

export const COLLECTIONS = {
  ARTIFACTS: "artifacts",
  USERS: "users",
  PROFILE: "profile",
  USER_PROFILE_DOC: "userProfile",
};