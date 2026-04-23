import { relations } from "drizzle-orm";
import {
  users,
  recipients,
  transfers,
  transactionLogs,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  transfers: many(transfers),
  recipients: many(recipients),
}));

export const recipientsRelations = relations(recipients, ({ one, many }) => ({
  user: one(users, { fields: [recipients.userId], references: [users.id] }),
  transfers: many(transfers),
}));

export const transfersRelations = relations(transfers, ({ one, many }) => ({
  user: one(users, { fields: [transfers.userId], references: [users.id] }),
  recipient: one(recipients, {
    fields: [transfers.recipientId],
    references: [recipients.id],
  }),
  logs: many(transactionLogs),
}));

export const transactionLogsRelations = relations(transactionLogs, ({ one }) => ({
  transfer: one(transfers, {
    fields: [transactionLogs.transferId],
    references: [transfers.id],
  }),
}));
