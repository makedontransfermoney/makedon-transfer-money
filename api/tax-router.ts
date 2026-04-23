import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  createTaxRecord,
  getTaxRecords,
  getTaxRecordsByUser,
  getTaxRecordById,
  updateTaxPaymentStatus,
  createTaxPayment,
  getTaxPaymentsByRecord,
  updateTaxPaymentRow,
  getTaxStats,
  calculateMacedonianTax,
  TAX_RATES,
} from "./queries/tax";

export const taxRouter = createRouter({
  // ═══════════════════════════════════════════
  // Tax Records
  // ═══════════════════════════════════════════
  create: authedQuery
    .input(z.object({
      transferId: z.number().optional(),
      taxType: z.enum([
        "ddv", "dbp", "income_tax", "capital_gains",
        "transaction_fee", "banking_tax", "other",
      ]),
      taxableAmount: z.string(),
      taxRate: z.string(),
      taxAmount: z.string(),
      totalWithTax: z.string(),
      currency: z.string().optional(),
      payerName: z.string().optional(),
      payerEdb: z.string().optional(),
      payerEmbg: z.string().optional(),
      payerAddress: z.string().optional(),
      institution: z.enum(["ujp", "nbrm", "customs", "other"]).optional(),
      taxPeriod: z.string().optional(),
      taxYear: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createTaxRecord({ ...input, userId: ctx.user.id }),
    ),

  calculate: authedQuery
    .input(z.object({
      amount: z.string(),
      taxType: z.string().optional(),
    }))
    .query(({ input }) => {
      const result = calculateMacedonianTax(
        parseFloat(input.amount) || 0,
        input.taxType || "ddv",
      );
      return result;
    }),

  rates: authedQuery.query(() => TAX_RATES),

  allRecords: adminQuery.query(() => getTaxRecords()),

  myRecords: authedQuery.query(({ ctx }) =>
    getTaxRecordsByUser(ctx.user.id),
  ),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getTaxRecordById(input.id)),

  updateStatus: adminQuery
    .input(z.object({
      id: z.number(),
      status: z.enum([
        "calculated", "pending", "submitted", "paid", "overdue", "waived",
      ]),
      ujpReference: z.string().optional(),
      nbrsmReference: z.string().optional(),
    }))
    .mutation(({ input }) =>
      updateTaxPaymentStatus(input.id, input.status, input.ujpReference, input.nbrsmReference),
    ),

  // ═══════════════════════════════════════════
  // Tax Payments
  // ═══════════════════════════════════════════
  createPayment: authedQuery
    .input(z.object({
      taxRecordId: z.number(),
      amount: z.string(),
      currency: z.string().optional(),
      paymentMethod: z.enum(["bank_transfer", "card", "wallet", "crypto"]).optional(),
      recipientInstitution: z.enum(["ujp", "nbrm", "customs", "other"]).optional(),
      recipientAccount: z.string().optional(),
      recipientBank: z.string().optional(),
      paymentReference: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createTaxPayment({ ...input, userId: ctx.user.id }),
    ),

  paymentsByRecord: authedQuery
    .input(z.object({ taxRecordId: z.number() }))
    .query(({ input }) =>
      getTaxPaymentsByRecord(input.taxRecordId),
    ),

  updatePayment: adminQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "processing", "completed", "failed", "refunded"]),
    }))
    .mutation(({ input }) =>
      updateTaxPaymentRow(input.id, input.status),
    ),

  // ═══════════════════════════════════════════
  // Tax Analytics
  // ═══════════════════════════════════════════
  stats: adminQuery.query(() => getTaxStats()),
});
