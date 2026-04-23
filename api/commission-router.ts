import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  createCommissionLog,
  getCommissionByTransfer,
  getTotalCommissionCollected,
  getCommissionByUser,
  createEmailNotification,
  getEmailsByUser,
  createSecurityAudit,
  getSecurityAuditByUser,
  getRecentSecurityAlerts,
  createCryptoTransaction,
  getCryptoTransactionsByUser,
  updateCryptoStatus,
  createQrCode,
  getQrCodesByUser,
} from "./queries/commission";

// ═══════════════════════════════════════════════
// Commission & Email Router
// ═══════════════════════════════════════════════
export const commissionRouter = createRouter({
  // Commission endpoints
  create: authedQuery
    .input(z.object({
      transferId: z.number(),
      transferAmount: z.string(),
      feeAmount: z.string(),
      feePercentage: z.string().default("1.00"),
      currency: z.string(),
      paymentMethod: z.enum(["stripe", "paypal", "visa", "mastercard", "bitcoin", "ethereum", "bank", "wallet", "cash"]),
    }))
    .mutation(({ ctx, input }) =>
      createCommissionLog({
        ...input,
        userId: ctx.user.id,
      }),
    ),

  byTransfer: authedQuery
    .input(z.object({ transferId: z.number() }))
    .query(({ input }) => getCommissionByTransfer(input.transferId)),

  myCommission: authedQuery.query(({ ctx }) =>
    getCommissionByUser(ctx.user.id),
  ),

  totalCollected: adminQuery.query(() =>
    getTotalCommissionCollected(),
  ),

  // Email notification endpoints
  sendEmail: authedQuery
    .input(z.object({
      transferId: z.number().optional(),
      commissionId: z.number().optional(),
      recipientEmail: z.string().email(),
      senderEmail: z.string().email().optional(),
      subject: z.string(),
      body: z.string(),
      emailType: z.enum([
        "transfer_created", "transfer_completed", "transfer_failed",
        "fee_collected", "welcome", "security_alert", "password_reset",
        "kyc_request", "promotional", "bitcoin_received",
      ]),
    }))
    .mutation(({ ctx, input }) =>
      createEmailNotification({ ...input, userId: ctx.user.id }),
    ),

  myEmails: authedQuery.query(({ ctx }) =>
    getEmailsByUser(ctx.user.id),
  ),
});

// ═══════════════════════════════════════════════
// Security Audit Router
// ═══════════════════════════════════════════════
export const securityRouter = createRouter({
  logEvent: authedQuery
    .input(z.object({
      eventType: z.enum([
        "login", "login_failed", "logout", "password_change",
        "2fa_enabled", "2fa_disabled", "2fa_verify",
        "transfer_created", "transfer_approved", "transfer_flagged",
        "recipient_added", "recipient_deleted", "settings_changed",
        "suspicious_activity", "ip_blocked", "device_changed", "bitcoin_payment",
      ]),
      description: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
      deviceFingerprint: z.string().optional(),
      location: z.string().optional(),
      metadata: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createSecurityAudit({ ...input, userId: ctx.user.id }),
    ),

  myAudit: authedQuery.query(({ ctx }) =>
    getSecurityAuditByUser(ctx.user.id),
  ),

  myAlerts: authedQuery.query(({ ctx }) =>
    getRecentSecurityAlerts(ctx.user.id),
  ),
});

// ═══════════════════════════════════════════════
// Crypto (Bitcoin) Router
// ═══════════════════════════════════════════════
export const cryptoRouter = createRouter({
  create: authedQuery
    .input(z.object({
      transferId: z.number().optional(),
      cryptoType: z.enum(["bitcoin", "ethereum", "litecoin", "ripple", "tether"]).default("bitcoin"),
      cryptoAmount: z.string(),
      fiatAmount: z.string(),
      fiatCurrency: z.string().default("USD"),
      exchangeRate: z.string(),
      networkFee: z.string(),
      platformFee: z.string(),
      toAddress: z.string(),
      fromAddress: z.string().optional(),
      qrCodeData: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createCryptoTransaction({ ...input, userId: ctx.user.id }),
    ),

  myTransactions: authedQuery.query(({ ctx }) =>
    getCryptoTransactionsByUser(ctx.user.id),
  ),

  updateStatus: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "awaiting_payment", "confirming", "confirmed", "completed", "failed", "expired"]),
      transactionHash: z.string().optional(),
    }))
    .mutation(({ input }) =>
      updateCryptoStatus(input.id, input.status, input.transactionHash),
    ),

  // Generate a Bitcoin payment request
  generateBitcoinPayment: authedQuery
    .input(z.object({
      amount: z.string(),
      currency: z.string().default("USD"),
      toAddress: z.string(),
      description: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      // BTC/USD rate ~65,000
      const btcRate = 65000;
      const fiatAmt = parseFloat(input.amount);
      const btcAmt = (fiatAmt / btcRate).toFixed(8);
      const networkFee = (0.0001).toFixed(8);
      const platformFee = (fiatAmt * 0.01).toFixed(2);

      const qrData = `bitcoin:${input.toAddress}?amount=${btcAmt}&message=${encodeURIComponent(input.description || "Makedon Transfer")}`;

      return createCryptoTransaction({
        userId: ctx.user.id,
        cryptoType: "bitcoin",
        cryptoAmount: btcAmt,
        fiatAmount: fiatAmt.toFixed(2),
        fiatCurrency: input.currency,
        exchangeRate: btcRate.toString(),
        networkFee,
        platformFee,
        toAddress: input.toAddress,
        qrCodeData: qrData,
      });
    }),
});

// ═══════════════════════════════════════════════
// QR Code Router
// ═══════════════════════════════════════════════
export const qrRouter = createRouter({
  create: authedQuery
    .input(z.object({
      transferId: z.number().optional(),
      cryptoTransactionId: z.number().optional(),
      qrType: z.enum(["transfer_request", "payment_link", "bitcoin_address", "ethereum_address", "user_profile", "merchant_payment"]),
      qrData: z.string(),
      amount: z.string().optional(),
      currency: z.string().optional(),
      description: z.string().optional(),
      expiresAt: z.string().optional(),
      maxUses: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createQrCode({
        ...input,
        userId: ctx.user.id,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      }),
    ),

  myQrCodes: authedQuery.query(({ ctx }) =>
    getQrCodesByUser(ctx.user.id),
  ),

  scan: authedQuery
    .input(z.object({ qrData: z.string() }))
    .mutation(({ input }) => {
      // Parse QR data
      if (input.qrData.startsWith("bitcoin:")) {
        return { type: "bitcoin", data: input.qrData, parsed: parseBitcoinUri(input.qrData) };
      }
      return { type: "unknown", data: input.qrData };
    }),
});

function parseBitcoinUri(uri: string) {
  const match = uri.match(/bitcoin:([^?]+)(?:\?.*amount=([^&]+))?/);
  return {
    address: match?.[1] || "",
    amount: match?.[2] || "",
  };
}
