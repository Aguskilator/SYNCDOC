import * as functions from "firebase-functions/v1";
import {
  RegisterUserSchema,
  UpdateMyProfileSchema,
  UserProfile,
  getErrorMessageFromZodError,
} from "../types";
import { setUserAuthClaims } from "../helpers/authUtils";
import { getUserProfileRef, updateUserProfileDocument } from "../helpers/firestoreUtils";

export const registerUserWithRole = functions.https.onCall(async (data: unknown, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    functions.logger.warn("registerUserWithRole: Intento no autenticado.");
    throw new functions.https.HttpsError("unauthenticated", "El usuario no está autenticado.");
  }

  const validationResult = RegisterUserSchema.safeParse(data);
  if (!validationResult.success) {
    const errorMessage = getErrorMessageFromZodError(validationResult.error);
    functions.logger.warn(`registerUserWithRole: Validación fallida para UID: ${uid}`, { error: validationResult.error.format() });
    throw new functions.https.HttpsError("invalid-argument", errorMessage);
  }
  
  const { rol, cedula, email, displayName } = validationResult.data;
  functions.logger.info(`registerUserWithRole: Iniciando para UID: ${uid}`, { rol, cedulaPresent: !!cedula, emailPresent: !!email, displayNamePresent: !!displayName });

  try {
    await setUserAuthClaims(uid, { rol });
    const userProfilePayload: Partial<UserProfile> = {
      rol,
      cedula: rol === "medico" ? cedula : null,
      verified: rol === "paciente",
      email,
      displayName,
    };
    await updateUserProfileDocument(uid, userProfilePayload, true);
    return { message: `Rol '${rol}' asignado y perfil creado/actualizado exitosamente.` };
  } catch (error: any) {
    functions.logger.error(`registerUserWithRole: Error para UID: ${uid}`, { error: error.message, stack: error.stack });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Ocurrió un error al registrar el usuario.", error.message);
  }
});

export const getMyProfile = functions.https.onCall(async (data: unknown, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    functions.logger.warn("getMyProfile: Intento no autenticado.");
    throw new functions.https.HttpsError("unauthenticated", "El usuario no está autenticado.");
  }
  functions.logger.info(`getMyProfile: Solicitud para UID: ${uid}`);
  try {
    const userProfileRef = getUserProfileRef(uid);
    const docSnap = await userProfileRef.get();
    if (!docSnap.exists) {
      functions.logger.warn(`getMyProfile: Perfil no encontrado para UID: ${uid}`);
      throw new functions.https.HttpsError("not-found", "Perfil de usuario no encontrado.");
    }
    functions.logger.info(`getMyProfile: Perfil obtenido para UID: ${uid}`);
    return docSnap.data() as UserProfile;
  } catch (error: any) {
    functions.logger.error(`getMyProfile: Error para UID: ${uid}`, { error: error.message, stack: error.stack });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Ocurrió un error al obtener el perfil.", error.message);
  }
});

export const updateMyProfile = functions.https.onCall(async (data: unknown, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    functions.logger.warn("updateMyProfile: Intento no autenticado.");
    throw new functions.https.HttpsError("unauthenticated", "El usuario no está autenticado.");
  }

  const validationResult = UpdateMyProfileSchema.safeParse(data);
  if (!validationResult.success) {
    const errorMessage = getErrorMessageFromZodError(validationResult.error);
    functions.logger.warn(`updateMyProfile: Validación fallida para UID: ${uid}`, { error: validationResult.error.format() });
    throw new functions.https.HttpsError("invalid-argument", errorMessage);
  }

  const profileUpdateData = validationResult.data;
  functions.logger.info(`updateMyProfile: Solicitud para UID: ${uid}`, { dataToUpdate: profileUpdateData });

  try {
    await updateUserProfileDocument(uid, profileUpdateData as Partial<UserProfile>);
    return { message: "Perfil actualizado exitosamente." };
  } catch (error: any) {
    functions.logger.error(`updateMyProfile: Error para UID: ${uid}`, { error: error.message, stack: error.stack });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Ocurrió un error al actualizar el perfil.", error.message);
  }
});