import * as functions from "firebase-functions/v1";
import {
  VerifyMedicoSchema,
  UserProfile,
  getErrorMessageFromZodError,
} from "../types";
import { updateUserProfileDocument } from "../helpers/firestoreUtils";

export const verifyMedicoProfile = functions.https.onCall(async (data: unknown, context) => {
  const callerUid = context.auth?.uid;
  const callerClaims = context.auth?.token;

  if (!callerClaims || callerClaims.rol !== "admin") {
    functions.logger.warn(`verifyMedicoProfile: Intento no autorizado por UID: ${callerUid}. Rol: ${callerClaims?.rol}`);
    throw new functions.https.HttpsError("permission-denied", "Acción no permitida. Se requieren privilegios de administrador.");
  }

  const validationResult = VerifyMedicoSchema.safeParse(data);
  if (!validationResult.success) {
    const errorMessage = getErrorMessageFromZodError(validationResult.error);
    functions.logger.warn(`verifyMedicoProfile: Validación fallida por Admin UID: ${callerUid}`, { error: validationResult.error.format() });
    throw new functions.https.HttpsError("invalid-argument", errorMessage);
  }

  const { uid: medicoUid, approved } = validationResult.data;
  functions.logger.info(`verifyMedicoProfile: Solicitud por Admin UID: ${callerUid} para Médico UID: ${medicoUid}`, { approved });

  try {
    await updateUserProfileDocument(medicoUid, { verified: approved } as Partial<UserProfile>);
    const message = approved ? "Médico verificado exitosamente." : "Se ha actualizado el estado del médico a no verificado.";
    functions.logger.info(`verifyMedicoProfile: Médico UID: ${medicoUid} ${approved ? 'verificado' : 'desverificado'} por Admin UID: ${callerUid}`);
    return { message };
  } catch (error: any) {
    functions.logger.error(`verifyMedicoProfile: Error para Médico UID: ${medicoUid} por Admin UID: ${callerUid}`, { error: error.message, stack: error.stack });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Ocurrió un error al verificar el perfil del médico.", error.message);
  }
});