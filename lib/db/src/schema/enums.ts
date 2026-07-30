import { pgEnum } from "drizzle-orm/pg-core";

export const appRoleEnum = pgEnum("app_role", [
  "holder",
  "issuer",
  "verifier",
  "admin",
]);

export const credentialStatusEnum = pgEnum("credential_status", [
  "active",
  "revoked",
]);

export const verificationMethodEnum = pgEnum("verification_method", [
  "qr",
  "code",
  "nfc",
]);

export const verificationResultEnum = pgEnum("verification_result", [
  "valid",
  "revoked",
  "unknown",
]);

export const faceVerificationStatusEnum = pgEnum("face_verification_status", [
  "pending",
  "verified",
  "failed",
]);
