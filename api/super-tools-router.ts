import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  getMultiCurrencyAccounts,
  createMultiCurrencyAccount,
  updateMultiCurrencyBalance,
  getRecurringTransfers,
  createRecurringTransfer,
  updateRecurringStatus,
  getBillPayments,
  createBillPayment,
  updateBillPaymentStatus,
  getReferralsByUser,
  createReferralCode,
  getReferralStats,
  getInsurancesByUser,
  createTransferInsurance,
  claimInsurance,
} from "./queries/superTools";

export const superToolsRouter = createRouter({
  // 1. MULTI-CURRENCY
  multiCurrencyList: authedQuery.query(({ ctx }) =>
    getMultiCurrencyAccounts(ctx.user.id),
  ),
  createMultiCurrency: authedQuery
    .input(z.object({
      currency: z.string(),
      balance: z.string().optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createMultiCurrencyAccount({ ...input, userId: ctx.user.id }),
    ),
  updateMultiCurrencyBalance: authedQuery
    .input(z.object({ id: z.number(), newBalance: z.string() }))
    .mutation(({ input }) =>
      updateMultiCurrencyBalance(input.id, input.newBalance),
    ),

  // 2. RECURRING
  recurringList: authedQuery.query(({ ctx }) =>
    getRecurringTransfers(ctx.user.id),
  ),
  createRecurring: authedQuery
    .input(z.object({
      recipientId: z.number(),
      amount: z.string(),
      currency: z.string().optional(),
      frequency: z.enum(["weekly", "biweekly", "monthly", "bimonthly", "quarterly"]).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      description: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createRecurringTransfer({ ...input, userId: ctx.user.id }),
    ),
  updateRecurring: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "paused", "cancelled", "completed"]),
    }))
    .mutation(({ input }) =>
      updateRecurringStatus(input.id, input.status),
    ),

  // 3. BILL PAYMENTS
  billList: authedQuery.query(({ ctx }) =>
    getBillPayments(ctx.user.id),
  ),
  createBill: authedQuery
    .input(z.object({
      billType: z.enum([
        "evn", "vodovod", "telekom", "a1", "ujp",
        "katastar", "komunalna", "grejanje", "internet", "osiguruvanje", "other",
      ]),
      subscriberNumber: z.string(),
      subscriberName: z.string().optional(),
      amount: z.string(),
      currency: z.string().optional(),
      billPeriod: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createBillPayment({ ...input, userId: ctx.user.id }),
    ),
  payBill: authedQuery
    .input(z.object({ id: z.number(), receiptNumber: z.string().optional() }))
    .mutation(({ input }) =>
      updateBillPaymentStatus(input.id, "paid", input.receiptNumber),
    ),

  // 4. REFERRALS
  referralList: authedQuery.query(({ ctx }) =>
    getReferralsByUser(ctx.user.id),
  ),
  createReferral: authedQuery
    .input(z.object({ code: z.string() }))
    .mutation(({ ctx, input }) =>
      createReferralCode(ctx.user.id, input.code),
    ),
  referralStats: authedQuery.query(({ ctx }) =>
    getReferralStats(ctx.user.id),
  ),

  // 5. INSURANCE
  insuranceList: authedQuery.query(({ ctx }) =>
    getInsurancesByUser(ctx.user.id),
  ),
  createInsurance: authedQuery
    .input(z.object({
      transferId: z.number(),
      insuredAmount: z.string(),
      currency: z.string().optional(),
      coverageType: z.enum(["standard", "premium"]).optional(),
      promisedHours: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createTransferInsurance({ ...input, userId: ctx.user.id }),
    ),
  claimInsurance: authedQuery
    .input(z.object({ id: z.number(), reason: z.string() }))
    .mutation(({ input }) =>
      claimInsurance(input.id, input.reason),
    ),
});
