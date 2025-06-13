import { z } from "zod";
import * as admin from "firebase-admin";

// --- Esquemas de Validación con Zod ---
export const RegisterUserSchema = z.object({
  rol: z.enum(["paciente", "medico"]),
  cedula: z.string().regex(/^\d{7,8}$/, "Cédula profesional inválida").optional(),
  email: z.string().email("Email inválido").optional(),
  displayName: z.string().min(1, "Nombre para mostrar no puede estar vacío").max(100, "Nombre para mostrar demasiado largo").optional(),
}).refine(data => !(data.rol === "medico" && !data.cedula), {
  message: "Cédula es requerida para el rol de médico",
  path: ["cedula"],
});

export const UpdateMyProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, "Número de teléfono inválido").optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "Se debe proporcionar al menos un campo para actualizar.",
});

export const VerifyMedicoSchema = z.object({
  uid: z.string().min(1, "UID del médico es requerido."),
  approved: z.boolean(),
});

// --- Tipos Derivados e Interfaces ---
export type UserProfile = {
  rol: "paciente" | "medico";
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  cedula?: string | null;
  verified: boolean;
  plan: string;
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
  updatedAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
  [key: string]: any;
};

// Tipos para datos de entrada de funciones (inferidos de Zod)
export type RegisterUserData = z.infer<typeof RegisterUserSchema>;
export type UpdateMyProfileData = z.infer<typeof UpdateMyProfileSchema>;
export type VerifyMedicoData = z.infer<typeof VerifyMedicoSchema>;

// Helper para mensajes de error de Zod
export const getErrorMessageFromZodError = (error: z.ZodError): string => {
  const firstIssue = error.issues[0];
  if (firstIssue) {
    return `${firstIssue.path.join(".")} - ${firstIssue.message}`;
  }
  return "Error de validación.";
};