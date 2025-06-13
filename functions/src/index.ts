import * as admin from "firebase-admin";

// Inicializar Firebase Admin SDK
admin.initializeApp();

// Exportar funciones callable
export * from "./callable/userFunctions";
export * from "./callable/adminFunctions";

// Si en el futuro agregas triggers, los exportarías aquí también:
// export * from "./triggers/authTriggers";