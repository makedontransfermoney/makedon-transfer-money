import { getDb } from "./connection";
import {
  multiCurrencyAccounts,
  recurringTransfers,
  billPayments,
  referrals,
  transferInsurances,
} from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

// ═══════════════════════════════════════════
// 1. MULTI-CURRENCY
// ═══════════════════════════════════════════

export async function getMultiCurrencyAccounts(userId: number) {
  return getDb().select().from(multiCurrencyAccounts)
    .where(eq(multiCurrencyAccounts.userId, userId))
    .orderBy(desc(multiCurrencyAccounts.isPrimary));
}

export async function createMultiCurrencyAccount(data: {
  userId: number;
  currency: string;
  balance?: string;
  isPrimary?: boolean;
}) {
  return getDb().insert(multiCurrencyAccounts).values({
    userId: data.userId,
    currency: data.currency,
    balance: data.balance || "0",
    isPrimary: data.isPrimary || false,
  }).$returningId();
}

export async function updateMultiCurrencyBalance(id: number, newBalance: string) {
  return getDb().update(multiCurrencyAccounts)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(multiCurrencyAccounts.id, id));
}

// ═══════════════════════════════════════════
// 2. RECURRING TRANSFERS
// ═══════════════════════════════════════════

export async function getRecurringTransfers(userId: number) {
  return getDb().select().from(recurringTransfers)
    .where(eq(recurringTransfers.userId, userId))
    .orderBy(desc(recurringTransfers.createdAt));
}

export async function createRecurringTransfer(data: {
  userId: number;
  recipientId: number;
  amount: string;
  currency?: string;
  frequency?: string;
  dayOfMonth?: number;
  description?: string;
}) {
  return getDb().insert(recurringTransfers).values({
    userId: data.userId,
    recipientId: data.recipientId,
    amount: data.amount,
    currency: data.currency || "MKD",
    frequency: data.frequency as any || "monthly",
    dayOfMonth: data.dayOfMonth || 1,
    description: data.description,
    status: "active",
    nextExecution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }).$returningId();
}

export async function updateRecurringStatus(id: number, status: string) {
  return getDb().update(recurringTransfers)
    .set({ status: status as any })
    .where(eq(recurringTransfers.id, id));
}

// ═══════════════════════════════════════════
// 3. BILL PAYMENTS
// ═══════════════════════════════════════════

export async function getBillPayments(userId: number) {
  return getDb().select().from(billPayments)
    .where(eq(billPayments.userId, userId))
    .orderBy(desc(billPayments.createdAt));
}

export async function createBillPayment(data: {
  userId: number;
  billType: string;
  subscriberNumber: string;
  subscriberName?: string;
  amount: string;
  currency?: string;
  billPeriod?: string;
}) {
  return getDb().insert(billPayments).values({
    userId: data.userId,
    billType: data.billType as any,
    subscriberNumber: data.subscriberNumber,
    subscriberName: data.subscriberName,
    amount: data.amount,
    currency: data.currency || "MKD",
    billPeriod: data.billPeriod,
    paymentStatus: "pending",
  }).$returningId();
}

export async function updateBillPaymentStatus(id: number, status: string, receiptNumber?: string) {
  return getDb().update(billPayments)
    .set({
      paymentStatus: status as any,
      receiptNumber,
      paidAt: status === "paid" ? new Date() : undefined,
    })
    .where(eq(billPayments.id, id));
}

// ═══════════════════════════════════════════
// 4. REFERRALS
// ═══════════════════════════════════════════

export async function getReferralsByUser(userId: number) {
  return getDb().select().from(referrals)
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));
}

export async function createReferralCode(userId: number, code: string) {
  return getDb().insert(referrals).values({
    referrerId: userId,
    referralCode: code,
    status: "pending",
  }).$returningId();
}

export async function getReferralStats(userId: number) {
  const all = await getDb().select().from(referrals)
    .where(eq(referrals.referrerId, userId));

  const totalReferrals = all.length;
  const registered = all.filter(r => r.status !== "pending").length;
  const firstTransfer = all.filter(r => r.status === "first_transfer" || r.status === "rewarded").length;
  const totalEarned = all.reduce((sum, r) => sum + Number(r.totalEarned), 0);

  return { totalReferrals, registered, firstTransfer, totalEarned };
}

// ═══════════════════════════════════════════
// 5. INSURANCE
// ═══════════════════════════════════════════

export async function getInsurancesByUser(userId: number) {
  return getDb().select().from(transferInsurances)
    .where(eq(transferInsurances.userId, userId))
    .orderBy(desc(transferInsurances.createdAt));
}

export async function createTransferInsurance(data: {
  transferId: number;
  userId: number;
  insuredAmount: string;
  currency?: string;
  coverageType?: string;
  promisedHours?: number;
}) {
  return getDb().insert(transferInsurances).values({
    transferId: data.transferId,
    userId: data.userId,
    insuredAmount: data.insuredAmount,
    currency: data.currency || "MKD",
    coverageType: data.coverageType as any || "standard",
    promisedHours: data.promisedHours || 24,
    status: "active",
  }).$returningId();
}

export async function claimInsurance(id: number, reason: string) {
  return getDb().update(transferInsurances)
    .set({
      status: "claimed",
      claimedAt: new Date(),
      claimReason: reason,
    })
    .where(eq(transferInsurances.id, id));
}
