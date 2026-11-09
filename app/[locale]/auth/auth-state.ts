/**
 * Kept separate from actions.ts: a "use server" file may only export async
 * functions -- exporting these plain object constants from that file
 * causes a module-evaluation error ("A 'use server' file can only export
 * async functions, found object") that surfaces at runtime, not build
 * time. Found via a Playwright console-error check during Phase 1
 * verification.
 */
export type LoginState = {
  status: "idle" | "error";
  errorCode?: "INVALID_CREDENTIALS" | "EMAIL_NOT_CONFIRMED";
};

export const initialLoginState: LoginState = { status: "idle" };

export type RegisterState = {
  status: "idle" | "error" | "success";
  errorCode?: "VALIDATION" | "PASSWORD_MISMATCH" | "GENERIC" | "EMAIL_TAKEN";
};

export const initialRegisterState: RegisterState = { status: "idle" };

export type ForgotPasswordState = {
  status: "idle" | "error" | "success";
  errorCode?: "VALIDATION" | "GENERIC";
};

export const initialForgotPasswordState: ForgotPasswordState = { status: "idle" };

export type ResetPasswordState = {
  status: "idle" | "error" | "success";
  errorCode?: "VALIDATION" | "PASSWORD_MISMATCH" | "GENERIC";
  // TEMPORARY -- remove once the live "Something went wrong" reset-password
  // bug is actually diagnosed. Surfaces the real Supabase error message so
  // it's visible without Vercel log access.
  debugMessage?: string;
};

export const initialResetPasswordState: ResetPasswordState = { status: "idle" };
