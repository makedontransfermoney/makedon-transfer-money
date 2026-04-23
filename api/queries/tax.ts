import { getDb } from "./connection";
import { taxRecords, taxPayments } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ═══════════════════════════════════════════════
// Tax Record Queries
// ═══════════════════════════════════════════════

export async function createTaxRecord(data: {
  transferId?: number;
  userId: number;
  taxType: string;
  taxableAmount: string;
  taxRate: string;
  taxAmount: string;
  totalWithTax: string;
  currency?: string;
  payerName?: string;
  payerEdb?: string;
  payerEmbg?: string;
  payerAddress?: string;
  institution?: string;
  taxPeriod?: string;
  taxYear?: string;
  description?: string;
}) {
  return getDb().insert(taxRecords).values({
    transferId: data.transferId,
    userId: data.userId,
    taxType: data.taxType as any,
    taxableAmount: data.taxableAmount,
    taxRate: data.taxRate,
    taxAmount: data.taxAmount,
    totalWithTax: data.totalWithTax,
    currency: data.currency || "MKD",
    payerName: data.payerName,
    payerEdb: data.payerEdb,
    payerEmbg: data.payerEmbg,
    payerAddress: data.payerAddress,
    institution: (data.institution || "ujp") as any,
    taxPeriod: data.taxPeriod,
    taxYear: data.taxYear,
    description: data.description,
    paymentStatus: "calculated",
  }).$returningId();
}

export async function getTaxRecords() {
  return getDb().select().from(taxRecords)
    .orderBy(desc(taxRecords.createdAt))
    .limit(100);
}

export async function getTaxRecordsByUser(userId: number) {
  return getDb().select().from(taxRecords)
    .where(eq(taxRecords.userId, userId))
    .orderBy(desc(taxRecords.createdAt));
}

export async function getTaxRecordById(id: number) {
  return getDb().query.taxRecords.findFirst({
    where: eq(taxRecords.id, id),
  });
}

export async function updateTaxPaymentStatus(
  id: number,
  status: string,
  ujpRef?: string,
  nbrsmRef?: string,
) {
  return getDb().update(taxRecords)
    .set({
      paymentStatus: status as any,
      ujpReference: ujpRef,
      nbrsmReference: nbrsmRef,
      paidAt: status === "paid" ? new Date() : undefined,
    })
    .where(eq(taxRecords.id, id));
}

// ═══════════════════════════════════════════════
// Tax Payment Queries
// ═══════════════════════════════════════════════

export async function createTaxPayment(data: {
  taxRecordId: number;
  userId: number;
  amount: string;
  currency?: string;
  paymentMethod?: string;
  recipientInstitution?: string;
  recipientAccount?: string;
  recipientBank?: string;
  paymentReference?: string;
}) {
  return getDb().insert(taxPayments).values({
    taxRecordId: data.taxRecordId,
    userId: data.userId,
    amount: data.amount,
    currency: data.currency || "MKD",
    paymentMethod: data.paymentMethod as any,
    recipientInstitution: (data.recipientInstitution || "ujp") as any,
    recipientAccount: data.recipientAccount,
    recipientBank: data.recipientBank,
    paymentReference: data.paymentReference,
  }).$returningId();
}

export async function getTaxPaymentsByRecord(taxRecordId: number) {
  return getDb().select().from(taxPayments)
    .where(eq(taxPayments.taxRecordId, taxRecordId))
    .orderBy(desc(taxPayments.createdAt));
}

export async function updateTaxPaymentRow(
  id: number,
  status: string,
) {
  return getDb().update(taxPayments)
    .set({
      status: status as any,
      paidAt: status === "completed" ? new Date() : undefined,
    })
    .where(eq(taxPayments.id, id));
}

// ═══════════════════════════════════════════════
// Tax Analytics Queries
// ═══════════════════════════════════════════════

export async function getTaxStats() {
  const db = getDb();

  const allRecords = await db.select().from(taxRecords);

  const totalTaxCollected = allRecords.reduce((sum, r) => sum + Number(r.taxAmount), 0);
  const totalTaxable = allRecords.reduce((sum, r) => sum + Number(r.taxableAmount), 0);
  const totalWithTax = allRecords.reduce((sum, r) => sum + Number(r.totalWithTax), 0);

  const paidCount = allRecords.filter(r => r.paymentStatus === "paid").length;
  const pendingCount = allRecords.filter(r => r.paymentStatus === "pending" || r.paymentStatus === "calculated").length;
  const overdueCount = allRecords.filter(r => r.paymentStatus === "overdue").length;

  // By tax type
  const byType: Record<string, number> = {};
  for (const r of allRecords) {
    byType[r.taxType] = (byType[r.taxType] || 0) + Number(r.taxAmount);
  }

  // By institution
  const byInstitution: Record<string, number> = {};
  for (const r of allRecords) {
    byInstitution[r.institution] = (byInstitution[r.institution] || 0) + Number(r.taxAmount);
  }

  return {
    totalTaxCollected: totalTaxCollected.toFixed(2),
    totalTaxable: totalTaxable.toFixed(2),
    totalWithTax: totalWithTax.toFixed(2),
    recordCount: allRecords.length,
    paidCount,
    pendingCount,
    overdueCount,
    byType,
    byInstitution,
  };
}

// ═══════════════════════════════════════════════
// Auto-calculate tax on transfer
// ═══════════════════════════════════════════════

// Macedonian tax rates
const TAX_RATES: Record<string, { rate: number; institution: string; name: string }> = {
  ddv: { rate: 18, institution: "ujp", name: "ДДВ" },
  dbp: { rate: 10, institution: "ujp", name: "ДБП" },
  income_tax: { rate: 10, institution: "ujp", name: "Данок на доход" },
  capital_gains: { rate: 15, institution: "ujp", name: "Данок на капитални добивки" },
  transaction_fee: { rate: 0.5, institution: "nbrm", name: "Трансакциска такса" },
  banking_tax: { rate: 12, institution: "ujp", name: "Банкарска даночна обврска" },
};

export function calculateMacedonianTax(amount: number, taxType: string = "ddv") {
  const config = TAX_RATES[taxType] || TAX_RATES.ddv;
  const taxAmount = amount * (config.rate / 100);
  const totalWithTax = amount + taxAmount;

  return {
    taxableAmount: amount.toFixed(2),
    taxRate: config.rate.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalWithTax: totalWithTax.toFixed(2),
    institution: config.institution,
    taxName: config.name,
    currency: "MKD",
  };
}

export { TAX_RATES };
