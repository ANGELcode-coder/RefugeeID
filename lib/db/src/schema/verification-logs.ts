import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  verificationMethodEnum,
  verificationResultEnum,
} from "./enums";

export const verificationLogsTable = pgTable("verification_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  verifierId: uuid("verifier_id").notNull(),
  method: verificationMethodEnum("method").notNull(),
  result: verificationResultEnum("result").notNull(),
  holderAlias: text("holder_alias").notNull(),
  issuer: text("issuer").notNull(),
  credentialType: text("credential_type").notNull(),
  notes: text("notes"),
  subjectDid: text("subject_did").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertVerificationLogSchema = createInsertSchema(
  verificationLogsTable,
).omit({ id: true, createdAt: true });
export type InsertVerificationLog = z.infer<
  typeof insertVerificationLogSchema
>;
export type VerificationLog = typeof verificationLogsTable.$inferSelect;
