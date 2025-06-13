import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { APP_ID, COLLECTIONS } from "../config";
import { UserProfile } from "../types";

export const getUserProfileRef = (uid: string): admin.firestore.DocumentReference => {
  return admin.firestore()
    .collection(COLLECTIONS.ARTIFACTS)
    .doc(APP_ID)
    .collection(COLLECTIONS.USERS)
    .doc(uid)
    .collection(COLLECTIONS.PROFILE)
    .doc(COLLECTIONS.USER_PROFILE_DOC);
};

export const updateUserProfileDocument = async (
  uid: string,
  data: Partial<UserProfile>,
  isNewUser: boolean = false
): Promise<void> => {
  const userProfileRef = getUserProfileRef(uid);
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  let profileData: Partial<UserProfile> = { ...data, updatedAt: now };

  if (isNewUser) {
    try {
      const userRecord = await admin.auth().getUser(uid);
      profileData = {
          email: userRecord.email || data.email || null,
          displayName: userRecord.displayName || data.displayName || null,
          ...profileData,
          createdAt: now,
          plan: "Gratuito",
      };
    } catch (error) {
      functions.logger.error(`Error obteniendo UserRecord para UID: ${uid} durante la creación del perfil.`, error);
      profileData = {
        ...profileData,
        createdAt: now,
        plan: "Gratuito",
      };
    }
  }
  
  await userProfileRef.set(profileData, { merge: true });
  functions.logger.info(`Perfil ${isNewUser ? 'creado' : 'actualizado'} para UID: ${uid}`, { uid, data: profileData });
};