import { getDb } from "./connection";
import { commissionLogs, emailNotifications, securityAuditLog, cryptoTransactions, qrCodes } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ═══════════════════════════════════════════════
// 1% Commission Log Queries
// ═══════════════════════════════════════════════

export async function createCommissionLog(data: {
  transferId: number;
  userId: number;
  transferAmount: string;
  feeAmount: string;
  feePercentage: string;
  currency: string;
  paymentMethod: string;
  emailAddress?: string;
}) {
  return getDb().insert(commissionLogs).values({
    transferId: data.transferId,
    userId: data.userId,
    transferAmount: data.transferAmount,
    feeAmount: data.feeAmount,
    feePercentage: data.feePercentage,
    currency: data.currency,
    paymentMethod: data.paymentMethod as any,
    emailAddress: data.emailAddress || "makedontransfermoney@proton.me",
    status: "collected",
    processedAt: new Date(),
  }).$returningId();
}

export async function getCommissionByTransfer(transferId: number) {
  return getDb().query.commissionLogs.findFirst({
    where: eq(commissionLogs.transferId, transferId),
  });
}

export async function getTotalCommissionCollected() {
  const result = await getDb().select({
    total: sql<string>`SUM(${commissionLogs.feeAmount})`,
    count: sql<number>`COUNT(*)`,
  }).from(commissionLogs)
    .where(eq(commissionLogs.status, "collected"));
  return result[0] || { total: "0", count: 0 };
}

export async function getCommissionByUser(userId: number) {
  return getDb().select().from(commissionLogs)
    .where(eq(commissionLogs.userId, userId))
    .orderBy(desc(commissionLogs.createdAt));
}

// ═══════════════════════════════════════════════
// Email Notification Queries
// ═══════════════════════════════════════════════

export async function createEmailNotification(data: {
  userId: number;
  transferId?: number;
  commissionId?: number;
  recipientEmail: string;
  senderEmail?: string;
  subject: string;
  body: string;
  emailType: string;
}) {
  return getDb().insert(emailNotifications).values({
    userId: data.userId,
    transferId: data.transferId,
    commissionId: data.commissionId,
    recipientEmail: data.recipientEmail,
    senderEmail: data.senderEmail || "makedontransfermoney@proton.me",
    subject: data.subject,
    body: data.body,
    emailType: data.emailType as any,
    status: "sent",
    sentAt: new Date(),
  }).$returningId();
}

export async function getEmailsByUser(userId: number) {
  return getDb().select().from(emailNotifications)
    .where(eq(emailNotifications.userId, userId))
    .orderBy(desc(emailNotifications.createdAt));
}

// ═══════════════════════════════════════════════
// Security Audit Log Queries
// ═══════════════════════════════════════════════

export async function createSecurityAudit(data: {
  userId: number;
  eventType: string;
  description: string;
  severity?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  location?: string;
  metadata?: string;
}) {
  return getDb().insert(securityAuditLog).values({
    userId: data.userId,
    eventType: data.eventType as any,
    description: data.description,
    severity: (data.severity || "low") as any,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    deviceFingerprint: data.deviceFingerprint,
    location: data.location,
    metadata: data.metadata,
  }).$returningId();
}

export async function getSecurityAuditByUser(userId: number) {
  return getDb().select().from(securityAuditLog)
    .where(eq(securityAuditLog.userId, userId))
    .orderBy(desc(securityAuditLog.createdAt))
    .limit(100);
}

export async function getRecentSecurityAlerts(userId: number) {
  return getDb().select().from(securityAuditLog)
    .where(
      and(
        eq(securityAuditLog.userId, userId),
        eq(securityAuditLog.resolved, false)
      )
    )
    .orderBy(desc(securityAuditLog.createdAt))
    .limit(20);
}

// ═══════════════════════════════════════════════
// Crypto (Bitcoin) Transaction Queries
// ═══════════════════════════════════════════════

export async function createCryptoTransaction(data: {
  userId: number;
  transferId?: number;
  cryptoType: string;
  cryptoAmount: string;
  fiatAmount: string;
  fiatCurrency: string;
  exchangeRate: string;
  networkFee: string;
  platformFee: string;
  toAddress: string;
  fromAddress?: string;
  qrCodeData?: string;
}) {
  return getDb().insert(cryptoTransactions).values({
    userId: data.userId,
    transferId: data.transferId,
    cryptoType: data.cryptoType as any,
    cryptoAmount: data.cryptoAmount,
    fiatAmount: data.fiatAmount,
    fiatCurrency: data.fiatCurrency,
    exchangeRate: data.exchangeRate,
    networkFee: data.networkFee,
    platformFee: data.platformFee,
    toAddress: data.toAddress,
    fromAddress: data.fromAddress,
    qrCodeData: data.qrCodeData,
    status: "awaiting_payment",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  }).$returningId();
}

export async function getCryptoTransactionsByUser(userId: number) {
  return getDb().select().from(cryptoTransactions)
    .where(eq(cryptoTransactions.userId, userId))
    .orderBy(desc(cryptoTransactions.createdAt));
}

export async function updateCryptoStatus(id: number, status: string, txHash?: string) {
  return getDb().update(cryptoTransactions)
    .set({
      status: status as any,
      transactionHash: txHash,
      updatedAt: new Date(),
    })
    .where(eq(cryptoTransactions.id, id));
}

// ═══════════════════════════════════════════════
// QR Code Queries
// ═══════════════════════════════════════════════

export async function createQrCode(data: {
  userId: number;
  transferId?: number;
  cryptoTransactionId?: number;
  qrType: string;
  qrData: string;
  amount?: string;
  currency?: string;
  description?: string;
  expiresAt?: Date;
  maxUses?: number;
}) {
  return getDb().insert(qrCodes).values({
    userId: data.userId,
    transferId: data.transferId,
    cryptoTransactionId: data.cryptoTransactionId,
    qrType: data.qrType as any,
    qrData: data.qrData,
    amount: data.amount,
    currency: data.currency,
    description: data.description,
    expiresAt: data.expiresAt,
    maxUses: data.maxUses,
  }).$returningId();
}

export async function getQrCodesByUser(userId: number) {
  return getDb().select().from(qrCodes)
    .where(
      and(
        eq(qrCodes.userId, userId),
        eq(qrCodes.isActive, true)
      )
    )
    .orderBy(desc(qrCodes.createdAt));
}

export async function incrementQrUsage(id: number) {
  return getDb().update(qrCodes)
    .set({
      usedCount: sql`${qrCodes.usedCount} + 1`,
    })
    .where(eq(qrCodes.id, id));
}
