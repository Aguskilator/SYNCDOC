import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const setUserAuthClaims = async (uid: string, claims: object): Promise<void> => {
  await admin.auth().setCustomUserClaims(uid, claims);
  functions.logger.info(`Custom claims establecidos para UID: ${uid}`, { uid, claims });
};