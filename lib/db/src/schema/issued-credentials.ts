import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  credentialStatusEnum,
  faceVerificationStatusEnum,
} from "./enums";

export const issuedCredentialsTable = pgTable("issued_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  givenName: text("given_name").notNull(),
  familyName: text("family_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  nationality: text("nationality").notNull(),
  gender: text("gender").notNull(),
  caseNumber: text("case_number").notNull(),
  arrivalSite: text("arrival_site").notNull(),
  status: credentialStatusEnum("status").notNull().default("active"),
  issuerId: uuid("issuer_id").notNull(),
  issuerDid: text("issuer_did").notNull(),
  subjectDid: text("subject_did").notNull(),
  subjectUserId: uuid("subject_user_id"),
  claimCode: text("claim_code"),
  claimCodeExpiresAt: timestamp("claim_code_expires_at", {
    withTimezone: true,
  }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  faceImageUrl: text("face_image_url"),
  faceEmbedding: text("face_embedding"),
  faceVerificationStatus: faceVerificationStatusEnum("face_verification_status").default("pending"),
  vcId: text("vc_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertIssuedCredentialSchema = createInsertSchema(
  issuedCredentialsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIssuedCredential = z.infer<
  typeof insertIssuedCredentialSchema
>;
export type IssuedCredential =
  typeof issuedCredentialsTable.$inferSelect;
