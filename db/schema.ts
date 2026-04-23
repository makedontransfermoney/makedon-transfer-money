import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  bigint,
  int,
  boolean,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Users table (managed by auth system)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
  twoFactorSecret: varchar("twoFactorSecret", { length: 255 }),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false),
  encryptionKey: text("encryptionKey"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Recipients table (people who receive money)
export const recipients = mysqlTable(
  "recipients",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 50 }),
    country: varchar("country", { length: 100 }).notNull(),
    city: varchar("city", { length: 100 }),
    bankName: varchar("bankName", { length: 255 }),
    accountNumber: varchar("accountNumber", { length: 255 }),
    iban: varchar("iban", { length: 255 }),
    swiftCode: varchar("swiftCode", { length: 50 }),
    preferredMethod: mysqlEnum("preferredMethod", [
      "bank",
      "cash",
      "mobile",
      "wallet",
    ]).default("bank"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("recipients_userId_idx").on(table.userId),
  })
);

export type Recipient = typeof recipients.$inferSelect;
export type InsertRecipient = typeof recipients.$inferInsert;

// Transfers table (money transfers)
export const transfers = mysqlTable(
  "transfers",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    recipientId: bigint("recipientId", { mode: "number", unsigned: true }).notNull(),
    // Amount sent by user
    sendAmount: decimal("sendAmount", { precision: 18, scale: 2 }).notNull(),
    sendCurrency: varchar("sendCurrency", { length: 3 }).notNull().default("MKD"),
    // Amount received by recipient
    receiveAmount: decimal("receiveAmount", { precision: 18, scale: 2 }).notNull(),
    receiveCurrency: varchar("receiveCurrency", { length: 3 }).notNull().default("EUR"),
    // Exchange rate used
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).notNull(),
    // Fee (1% commission)
    fee: decimal("fee", { precision: 18, scale: 2 }).notNull(),
    feePercentage: decimal("feePercentage", { precision: 5, scale: 2 }).notNull().default("1.00"),
    // Total amount charged from sender
    totalAmount: decimal("totalAmount", { precision: 18, scale: 2 }).notNull(),
    // Transfer status
    status: mysqlEnum("status", [
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled",
      "refunded",
    ]).default("pending").notNull(),
    // Transfer method
    transferMethod: mysqlEnum("transferMethod", [
      "bank",
      "cash",
      "mobile",
      "wallet",
      "crypto",
    ]).default("bank").notNull(),
    // Transfer reference/tracking number
    referenceNumber: varchar("referenceNumber", { length: 50 }).notNull().unique(),
    // Additional notes
    notes: text("notes"),
    // Estimated delivery time
    estimatedDelivery: varchar("estimatedDelivery", { length: 100 }),
    // Actual completion time
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("transfers_userId_idx").on(table.userId),
    recipientIdIdx: index("transfers_recipientId_idx").on(table.recipientId),
    statusIdx: index("transfers_status_idx").on(table.status),
    referenceIdx: index("transfers_reference_idx").on(table.referenceNumber),
    createdAtIdx: index("transfers_createdAt_idx").on(table.createdAt),
  })
);

export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = typeof transfers.$inferInsert;

// Exchange rates table
export const exchangeRates = mysqlTable(
  "exchangeRates",
  {
    id: serial("id").primaryKey(),
    fromCurrency: varchar("fromCurrency", { length: 3 }).notNull(),
    toCurrency: varchar("toCurrency", { length: 3 }).notNull(),
    rate: decimal("rate", { precision: 18, scale: 6 }).notNull(),
    source: varchar("source", { length: 100 }).default("manual"),
    isActive: boolean("isActive").default(true).notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    currencyPairIdx: index("exchange_currency_pair_idx").on(
      table.fromCurrency,
      table.toCurrency
    ),
  })
);

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

// Transactions log table (detailed transaction records)
export const transactionLogs = mysqlTable(
  "transactionLogs",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }).notNull(),
    eventType: mysqlEnum("eventType", [
      "created",
      "payment_received",
      "processing",
      "sent",
      "delivered",
      "completed",
      "failed",
      "cancelled",
      "refunded",
    ]).notNull(),
    description: text("description"),
    metadata: text("metadata"), // JSON string for additional data
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transferIdIdx: index("transactionLogs_transferId_idx").on(table.transferId),
    eventTypeIdx: index("transactionLogs_eventType_idx").on(table.eventType),
  })
);

export type TransactionLog = typeof transactionLogs.$inferSelect;
export type InsertTransactionLog = typeof transactionLogs.$inferInsert;

// Supported countries and methods
export const supportedCountries = mysqlTable("supportedCountries", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 2 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  currencyName: varchar("currencyName", { length: 100 }),
  flag: varchar("flag", { length: 10 }),
  isActive: boolean("isActive").default(true).notNull(),
  methodsAvailable: text("methodsAvailable"), // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportedCountry = typeof supportedCountries.$inferSelect;
export type InsertSupportedCountry = typeof supportedCountries.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: 1% Commission/Fee Log — tracks every fee collected
// ═══════════════════════════════════════════════════════════
export const commissionLogs = mysqlTable(
  "commissionLogs",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Fee breakdown
    transferAmount: decimal("transferAmount", { precision: 18, scale: 2 }).notNull(),
    feeAmount: decimal("feeAmount", { precision: 18, scale: 2 }).notNull(),
    feePercentage: decimal("feePercentage", { precision: 5, scale: 2 }).notNull().default("1.00"),
    currency: varchar("currency", { length: 3 }).notNull(),
    // Where the fee goes
    emailNotificationSent: boolean("emailNotificationSent").default(false),
    emailAddress: varchar("emailAddress", { length: 320 }).default("makedontransfermoney@proton.me"),
    // Payment method used
    paymentMethod: mysqlEnum("paymentMethod", [
      "stripe",
      "paypal",
      "visa",
      "mastercard",
      "bitcoin",
      "ethereum",
      "bank",
      "wallet",
      "cash",
    ]).default("stripe"),
    status: mysqlEnum("status", ["pending", "collected", "payout", "failed"]).default("pending").notNull(),
    // Audit
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    processedAt: timestamp("processedAt"),
  },
  (table) => ({
    transferIdIdx: index("commission_transferId_idx").on(table.transferId),
    userIdIdx: index("commission_userId_idx").on(table.userId),
    statusIdx: index("commission_status_idx").on(table.status),
    emailIdx: index("commission_email_idx").on(table.emailAddress),
    createdAtIdx: index("commission_createdAt_idx").on(table.createdAt),
  })
);

export type CommissionLog = typeof commissionLogs.$inferSelect;
export type InsertCommissionLog = typeof commissionLogs.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Email Notification System
// ═══════════════════════════════════════════════════════════
export const emailNotifications = mysqlTable(
  "emailNotifications",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    commissionId: bigint("commissionId", { mode: "number", unsigned: true }),
    // Email details
    recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
    senderEmail: varchar("senderEmail", { length: 320 }).default("makedontransfermoney@proton.me"),
    subject: varchar("subject", { length: 500 }).notNull(),
    body: text("body").notNull(),
    // Email type
    emailType: mysqlEnum("emailType", [
      "transfer_created",
      "transfer_completed",
      "transfer_failed",
      "fee_collected",
      "welcome",
      "security_alert",
      "password_reset",
      "kyc_request",
      "promotional",
      "bitcoin_received",
    ]).notNull(),
    status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
    sentAt: timestamp("sentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("email_userId_idx").on(table.userId),
    transferIdIdx: index("email_transferId_idx").on(table.transferId),
    statusIdx: index("email_status_idx").on(table.status),
    typeIdx: index("email_type_idx").on(table.emailType),
    createdAtIdx: index("email_createdAt_idx").on(table.createdAt),
  })
);

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Security Audit Log — bank-level tracking
// ═══════════════════════════════════════════════════════════
export const securityAuditLog = mysqlTable(
  "securityAuditLog",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Event details
    eventType: mysqlEnum("eventType", [
      "login",
      "login_failed",
      "logout",
      "password_change",
      "2fa_enabled",
      "2fa_disabled",
      "2fa_verify",
      "transfer_created",
      "transfer_approved",
      "transfer_flagged",
      "recipient_added",
      "recipient_deleted",
      "settings_changed",
      "suspicious_activity",
      "ip_blocked",
      "device_changed",
      "bitcoin_payment",
    ]).notNull(),
    description: text("description").notNull(),
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("low").notNull(),
    // Technical details
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    deviceFingerprint: varchar("deviceFingerprint", { length: 255 }),
    location: varchar("location", { length: 200 }),
    // Metadata
    metadata: text("metadata"), // JSON
    resolved: boolean("resolved").default(false),
    resolvedBy: varchar("resolvedBy", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("audit_userId_idx").on(table.userId),
    eventTypeIdx: index("audit_eventType_idx").on(table.eventType),
    severityIdx: index("audit_severity_idx").on(table.severity),
    createdAtIdx: index("audit_createdAt_idx").on(table.createdAt),
  })
);

export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;
export type InsertSecurityAuditLog = typeof securityAuditLog.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Bitcoin/Crypto Transactions
// ═══════════════════════════════════════════════════════════
export const cryptoTransactions = mysqlTable(
  "cryptoTransactions",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    // Crypto details
    cryptoType: mysqlEnum("cryptoType", [
      "bitcoin",
      "ethereum",
      "litecoin",
      "ripple",
      "tether",
    ]).default("bitcoin").notNull(),
    // Amounts
    cryptoAmount: decimal("cryptoAmount", { precision: 24, scale: 8 }).notNull(),
    fiatAmount: decimal("fiatAmount", { precision: 18, scale: 2 }).notNull(),
    fiatCurrency: varchar("fiatCurrency", { length: 3 }).default("USD").notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 24, scale: 8 }).notNull(),
    // Fee
    networkFee: decimal("networkFee", { precision: 18, scale: 8 }).notNull(),
    platformFee: decimal("platformFee", { precision: 18, scale: 2 }).notNull(),
    // Addresses
    fromAddress: varchar("fromAddress", { length: 100 }),
    toAddress: varchar("toAddress", { length: 100 }).notNull(),
    // Blockchain
    transactionHash: varchar("transactionHash", { length: 100 }).unique(),
    blockConfirmations: int("blockConfirmations").default(0),
    // Status
    status: mysqlEnum("status", [
      "pending",
      "awaiting_payment",
      "confirming",
      "confirmed",
      "completed",
      "failed",
      "expired",
    ]).default("pending").notNull(),
    // QR code
    qrCodeData: text("qrCodeData"),
    qrCodeImageUrl: text("qrCodeImageUrl"),
    // Timestamps
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("crypto_userId_idx").on(table.userId),
    transferIdIdx: index("crypto_transferId_idx").on(table.transferId),
    cryptoTypeIdx: index("crypto_type_idx").on(table.cryptoType),
    statusIdx: index("crypto_status_idx").on(table.status),
    txHashIdx: index("crypto_txHash_idx").on(table.transactionHash),
    createdAtIdx: index("crypto_createdAt_idx").on(table.createdAt),
  })
);

export type CryptoTransaction = typeof cryptoTransactions.$inferSelect;
export type InsertCryptoTransaction = typeof cryptoTransactions.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: QR Code System — special QR codes for transfers
// ═══════════════════════════════════════════════════════════
export const qrCodes = mysqlTable(
  "qrCodes",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    cryptoTransactionId: bigint("cryptoTransactionId", { mode: "number", unsigned: true }),
    // QR code details
    qrType: mysqlEnum("qrType", [
      "transfer_request",
      "payment_link",
      "bitcoin_address",
      "ethereum_address",
      "user_profile",
      "merchant_payment",
    ]).notNull(),
    qrData: text("qrData").notNull(),
    qrImageUrl: text("qrImageUrl"),
    // For payment links
    amount: decimal("amount", { precision: 18, scale: 2 }),
    currency: varchar("currency", { length: 3 }),
    description: text("description"),
    // Expiry
    expiresAt: timestamp("expiresAt"),
    maxUses: int("maxUses"),
    usedCount: int("usedCount").default(0),
    // Status
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("qr_userId_idx").on(table.userId),
    transferIdIdx: index("qr_transferId_idx").on(table.transferId),
    typeIdx: index("qr_type_idx").on(table.qrType),
    isActiveIdx: index("qr_isActive_idx").on(table.isActive),
    createdAtIdx: index("qr_createdAt_idx").on(table.createdAt),
  })
);

export type QrCode = typeof qrCodes.$inferSelect;
export type InsertQrCode = typeof qrCodes.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Fraud Detection & Anti-Money Laundering System
// ═══════════════════════════════════════════════════════════
export const fraudAlerts = mysqlTable(
  "fraudAlerts",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Detection
    alertType: mysqlEnum("alertType", [
      "suspicious_amount",
      "known_fraudster",
      "rapid_transfers",
      "unusual_pattern",
      "sanctions_list",
      "pep_match",
      "high_risk_country",
      "structuring",
      "hacker_detected",
      "fake_transfer",
      "identity_theft",
      "money_laundering",
    ]).notNull(),
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
    description: text("description").notNull(),
    // Detection source
    detectedBy: mysqlEnum("detectedBy", [
      "kimi_support",
      "gpt_advisor",
      "harvey_legal",
      "claude_sentinel",
      "imf_check",
      "world_bank_check",
      "system",
    ]).default("system").notNull(),
    // IMF / World Bank check
    imfCleanStatus: mysqlEnum("imfCleanStatus", ["clean", "suspicious", "flagged", "not_checked"]).default("not_checked"),
    worldBankCleanStatus: mysqlEnum("worldBankCleanStatus", ["clean", "suspicious", "flagged", "not_checked"]).default("not_checked"),
    // Status
    status: mysqlEnum("status", [
      "active",
      "under_review",
      "resolved_clean",
      "confirmed_fraud",
      "blocked",
      "rejected",
      "escalated_interpol",
    ]).default("active").notNull(),
    // Actions
    panicButtonPressed: boolean("panicButtonPressed").default(false),
    transferRejected: boolean("transferRejected").default(false),
    // Interpol
    interpolReported: boolean("interpolReported").default(false),
    interpolEmailSent: boolean("interpolEmailSent").default(false),
    interpolReportId: varchar("interpolReportId", { length: 100 }),
    metadata: text("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  (table) => ({
    transferIdIdx: index("fraud_transferId_idx").on(table.transferId),
    userIdIdx: index("fraud_userId_idx").on(table.userId),
    alertTypeIdx: index("fraud_alertType_idx").on(table.alertType),
    severityIdx: index("fraud_severity_idx").on(table.severity),
    statusIdx: index("fraud_status_idx").on(table.status),
    createdAtIdx: index("fraud_createdAt_idx").on(table.createdAt),
  })
);

export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type InsertFraudAlert = typeof fraudAlerts.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Blocked Users (permanently banned fraudsters)
// ═══════════════════════════════════════════════════════════
export const blockedUsers = mysqlTable(
  "blockedUsers",
  {
    id: serial("id").primaryKey(),
    // Can block by userId, email, phone, or nationalId
    userId: bigint("userId", { mode: "number", unsigned: true }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 50 }),
    nationalId: varchar("nationalId", { length: 100 }),
    deviceFingerprint: varchar("deviceFingerprint", { length: 255 }),
    ipAddress: varchar("ipAddress", { length: 45 }),
    // Reason
    blockReason: mysqlEnum("blockReason", [
      "fraud",
      "hacking",
      "fake_transfer",
      "identity_theft",
      "money_laundering",
      "sanctions",
      "agent_detected",
      "interpol_flagged",
      "manual_block",
    ]).notNull(),
    description: text("description"),
    // Detection
    blockedBy: mysqlEnum("blockedBy", [
      "kimi_support",
      "gpt_advisor",
      "harvey_legal",
      "claude_sentinel",
      "system",
      "admin",
    ]).default("system").notNull(),
    // Permanent flag
    isPermanent: boolean("isPermanent").default(true).notNull(),
    // Appeal
    canAppeal: boolean("canAppeal").default(false),
    appealedAt: timestamp("appealedAt"),
    appealStatus: mysqlEnum("appealStatus", ["none", "pending", "approved", "denied"]).default("none"),
    // Metadata
    metadata: text("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("blocked_userId_idx").on(table.userId),
    emailIdx: index("blocked_email_idx").on(table.email),
    nationalIdIdx: index("blocked_nationalId_idx").on(table.nationalId),
    ipIdx: index("blocked_ip_idx").on(table.ipAddress),
    createdAtIdx: index("blocked_createdAt_idx").on(table.createdAt),
  })
);

export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = typeof blockedUsers.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: National ID Verification (required for every transfer)
// ═══════════════════════════════════════════════════════════
export const idVerifications = mysqlTable(
  "idVerifications",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // National ID details
    nationalIdNumber: varchar("nationalIdNumber", { length: 100 }).notNull(),
    idType: mysqlEnum("idType", [
      "passport",
      "national_id",
      "drivers_license",
      "residence_permit",
      "tax_id",
      "social_security",
    ]).default("national_id").notNull(),
    country: varchar("country", { length: 100 }).notNull(),
    fullName: varchar("fullName", { length: 255 }),
    dateOfBirth: varchar("dateOfBirth", { length: 20 }),
    // Verification
    verifiedBy: mysqlEnum("verifiedBy", [
      "kimi_agent",
      "gpt_agent",
      "harvey_agent",
      "claude_agent",
      "manual_review",
      "system",
    ]).default("system").notNull(),
    verificationCode: varchar("verificationCode", { length: 50 }),
    // Status
    status: mysqlEnum("status", [
      "pending",
      "under_review",
      "verified",
      "rejected",
      "expired",
    ]).default("pending").notNull(),
    // Documents
    documentUrl: text("documentUrl"),
    selfieUrl: text("selfieUrl"),
    // IMF/World Bank
    imfVerified: boolean("imfVerified").default(false),
    worldBankVerified: boolean("worldBankVerified").default(false),
    // Metadata
    metadata: text("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    verifiedAt: timestamp("verifiedAt"),
  },
  (table) => ({
    userIdIdx: index("idv_userId_idx").on(table.userId),
    nationalIdIdx: index("idv_nationalId_idx").on(table.nationalIdNumber),
    statusIdx: index("idv_status_idx").on(table.status),
    createdAtIdx: index("idv_createdAt_idx").on(table.createdAt),
  })
);

export type IdVerification = typeof idVerifications.$inferSelect;
export type InsertIdVerification = typeof idVerifications.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Special Verification Codes (agent-generated)
// ═══════════════════════════════════════════════════════════
export const verificationCodes = mysqlTable(
  "verificationCodes",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    idVerificationId: bigint("idVerificationId", { mode: "number", unsigned: true }),
    // Code details
    code: varchar("code", { length: 50 }).notNull().unique(),
    codeType: mysqlEnum("codeType", [
      "transfer_auth",
      "id_verification",
      "panic_override",
      "agent_override",
      "emergency_access",
      "recon_override",
    ]).notNull(),
    // Generated by
    generatedBy: mysqlEnum("generatedBy", [
      "kimi_support",
      "gpt_advisor",
      "harvey_legal",
      "claude_sentinel",
      "system",
      "admin",
    ]).notNull(),
    // Recognition/Recon system
    requiresRecon: boolean("requiresRecon").default(true),
    reconStatus: mysqlEnum("reconStatus", [
      "pending",
      "scanning",
      "face_match",
      "voice_match",
      "document_verified",
      "biometric_confirmed",
      "failed",
      "bypassed",
    ]).default("pending"),
    // Expiry
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("vc_userId_idx").on(table.userId),
    codeIdx: index("vc_code_idx").on(table.code),
    typeIdx: index("vc_type_idx").on(table.codeType),
    isActiveIdx: index("vc_isActive_idx").on(table.isActive),
    createdAtIdx: index("vc_createdAt_idx").on(table.createdAt),
  })
);

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = typeof verificationCodes.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Interpol Reports
// ═══════════════════════════════════════════════════════════
export const interpolReports = mysqlTable(
  "interpolReports",
  {
    id: serial("id").primaryKey(),
    fraudAlertId: bigint("fraudAlertId", { mode: "number", unsigned: true }).notNull(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    userId: bigint("userId", { mode: "number", unsigned: true }),
    // Report details
    reportType: mysqlEnum("reportType", [
      "fraud_suspicion",
      "money_laundering",
      "identity_theft",
      "cybercrime",
      "hacking",
      "terrorism_financing",
      "sanctions_violation",
    ]).notNull(),
    subjectName: varchar("subjectName", { length: 255 }),
    subjectNationalId: varchar("subjectNationalId", { length: 100 }),
    description: text("description").notNull(),
    evidence: text("evidence"),
    // Interpol communication
    interpolEmail: varchar("interpolEmail", { length: 320 }).default("contact@interpol.int"),
    emailSent: boolean("emailSent").default(false),
    sentAt: timestamp("sentAt"),
    caseNumber: varchar("caseNumber", { length: 100 }),
    // Status
    status: mysqlEnum("status", [
      "draft",
      "submitted",
      "acknowledged",
      "under_investigation",
      "resolved",
      "closed",
    ]).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    fraudAlertIdIdx: index("interpol_fraudAlertId_idx").on(table.fraudAlertId),
    userIdIdx: index("interpol_userId_idx").on(table.userId),
    caseNumberIdx: index("interpol_caseNumber_idx").on(table.caseNumber),
    statusIdx: index("interpol_status_idx").on(table.status),
    createdAtIdx: index("interpol_createdAt_idx").on(table.createdAt),
  })
);

export type InterpolReport = typeof interpolReports.$inferSelect;
export type InsertInterpolReport = typeof interpolReports.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Frozen Assets (Russian & Sanctioned Funds)
// ═══════════════════════════════════════════════════════════
export const frozenAssets = mysqlTable(
  "frozenAssets",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Asset details
    assetType: mysqlEnum("assetType", [
      "russian_frozen",
      "sanctioned_funds",
      "blocked_assets",
      "frozen_reserve",
      "central_bank_assets",
      "oligarch_funds",
      "trade_receivable",
    ]).default("russian_frozen").notNull(),
    assetSource: varchar("assetSource", { length: 100 }).default("Russia"),
    originatingBank: varchar("originatingBank", { length: 255 }),
    // Amount
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("MKD").notNull(),
    // AML / Compliance checks
    amlStatus: mysqlEnum("amlStatus", [
      "pending",
      "under_review",
      "clean",
      "suspicious",
      "flagged",
      "rejected",
    ]).default("pending").notNull(),
    imfStatus: mysqlEnum("imfStatus", [
      "not_checked",
      "checking",
      "clean",
      "flagged",
    ]).default("not_checked"),
    worldBankStatus: mysqlEnum("worldBankStatus", [
      "not_checked",
      "checking",
      "clean",
      "flagged",
    ]).default("not_checked"),
    // Agent approvals (all 4 must approve for Russian frozen assets)
    kimiApproved: boolean("kimiApproved").default(false),
    gptApproved: boolean("gptApproved").default(false),
    harveyApproved: boolean("harveyApproved").default(false),
    claudeApproved: boolean("claudeApproved").default(false),
    approvalNotes: text("approvalNotes"),
    // Transfer permission
    transferAllowed: boolean("transferAllowed").default(false),
    blockedReason: text("blockedReason"),
    approvedAt: timestamp("approvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("frozen_userId_idx").on(table.userId),
    transferIdIdx: index("frozen_transferId_idx").on(table.transferId),
    amlStatusIdx: index("frozen_amlStatus_idx").on(table.amlStatus),
    assetTypeIdx: index("frozen_assetType_idx").on(table.assetType),
    transferAllowedIdx: index("frozen_transferAllowed_idx").on(table.transferAllowed),
    createdAtIdx: index("frozen_createdAt_idx").on(table.createdAt),
  })
);

export type FrozenAsset = typeof frozenAssets.$inferSelect;
export type InsertFrozenAsset = typeof frozenAssets.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Tax Records (UJP & NBRSM Tax Obligations)
// ═══════════════════════════════════════════════════════════
export const taxRecords = mysqlTable(
  "taxRecords",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Tax type (Macedonian tax system)
    taxType: mysqlEnum("taxType", [
      "ddv",              // ДДВ (18% Данок на Додадена Вредност)
      "dbp",              // ДБП - Данок на Бруто Приход
      "income_tax",       // Персонален данок на доход
      "capital_gains",    // Данок на капитални добивки
      "transaction_fee",  // Трансакциска такса
      "banking_tax",      // Банкарска даночна обврска
      "other",
    ]).default("ddv").notNull(),
    // Tax calculation
    taxableAmount: decimal("taxableAmount", { precision: 18, scale: 2 }).notNull(),
    taxRate: decimal("taxRate", { precision: 5, scale: 2 }).notNull(),
    taxAmount: decimal("taxAmount", { precision: 18, scale: 2 }).notNull(),
    totalWithTax: decimal("totalWithTax", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("MKD").notNull(),
    // Payer info
    payerName: varchar("payerName", { length: 255 }),
    payerEdb: varchar("payerEdb", { length: 50 }),      // ЕДБ (Единствен Даночен Број)
    payerEmbg: varchar("payerEmbg", { length: 50 }),    // ЕМБГ (матичен број)
    payerAddress: varchar("payerAddress", { length: 255 }),
    // Institution
    institution: mysqlEnum("institution", [
      "ujp",     // Управа за Јавни Приходи
      "nbrm",    // Народна Банка
      "customs", // Царинска управа
      "other",
    ]).default("ujp").notNull(),
    // Payment status
    paymentStatus: mysqlEnum("paymentStatus", [
      "calculated",    // Пресметано
      "pending",       // Во исчекување
      "submitted",     // Поднесено до УЈП/НБРМ
      "paid",          // Платено
      "overdue",       // Задоцнето
      "waived",        // Ослободено
    ]).default("calculated").notNull(),
    // NBRSM reference
    nbrsmReference: varchar("nbrsmReference", { length: 100 }),
    ujpReference: varchar("ujpReference", { length: 100 }),
    paymentDeadline: timestamp("paymentDeadline"),
    paidAt: timestamp("paidAt"),
    // Period
    taxPeriod: varchar("taxPeriod", { length: 20 }),     // MM/YYYY
    taxYear: varchar("taxYear", { length: 4 }),
    // Description
    description: text("description"),
    // Audit
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("tax_userId_idx").on(table.userId),
    transferIdIdx: index("tax_transferId_idx").on(table.transferId),
    taxTypeIdx: index("tax_type_idx").on(table.taxType),
    institutionIdx: index("tax_institution_idx").on(table.institution),
    statusIdx: index("tax_status_idx").on(table.paymentStatus),
    periodIdx: index("tax_period_idx").on(table.taxPeriod),
    createdAtIdx: index("tax_createdAt_idx").on(table.createdAt),
  })
);

export type TaxRecord = typeof taxRecords.$inferSelect;
export type InsertTaxRecord = typeof taxRecords.$inferInsert;

// ═══════════════════════════════════════════════════════════
// NEW: Tax Payments (actual payments to UJP/NBRM)
// ═══════════════════════════════════════════════════════════
export const taxPayments = mysqlTable(
  "taxPayments",
  {
    id: serial("id").primaryKey(),
    taxRecordId: bigint("taxRecordId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Payment details
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("MKD").notNull(),
    // Payment method
    paymentMethod: mysqlEnum("paymentMethod", [
      "bank_transfer",
      "card",
      "wallet",
      "crypto",
    ]).default("bank_transfer").notNull(),
    // Institution receiving payment
    recipientInstitution: mysqlEnum("recipientInstitution", [
      "ujp",     // Управа за Јавни Приходи
      "nbrm",    // Народна Банка
      "customs",
      "other",
    ]).default("ujp").notNull(),
    // Account details for payment
    recipientAccount: varchar("recipientAccount", { length: 255 }),
    recipientBank: varchar("recipientBank", { length: 255 }),
    // Payment reference
    paymentReference: varchar("paymentReference", { length: 100 }),
    // Status
    status: mysqlEnum("status", [
      "pending",
      "processing",
      "completed",
      "failed",
      "refunded",
    ]).default("pending").notNull(),
    paidAt: timestamp("paidAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    taxRecordIdIdx: index("taxpay_taxRecordId_idx").on(table.taxRecordId),
    userIdIdx: index("taxpay_userId_idx").on(table.userId),
    statusIdx: index("taxpay_status_idx").on(table.status),
    createdAtIdx: index("taxpay_createdAt_idx").on(table.createdAt),
  })
);

export type TaxPayment = typeof taxPayments.$inferSelect;
export type InsertTaxPayment = typeof taxPayments.$inferInsert;

// Relations
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

export const taxRecordsRelations = relations(taxRecords, ({ one, many }) => ({
  user: one(users, { fields: [taxRecords.userId], references: [users.id] }),
  payments: many(taxPayments),
}));

export const taxPaymentsRelations = relations(taxPayments, ({ one }) => ({
  taxRecord: one(taxRecords, { fields: [taxPayments.taxRecordId], references: [taxRecords.id] }),
  user: one(users, { fields: [taxPayments.userId], references: [users.id] }),
}));

// ═══════════════════════════════════════════════════════════
// 7 UNIQUE FEATURES — WORLD'S FIRST
// ═══════════════════════════════════════════════════════════

// 1. MONEY JOURNEY — 3D animated transfer tracking
export const transferJourneys = mysqlTable(
  "transferJourneys",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Route
    fromCountry: varchar("fromCountry", { length: 100 }).notNull(),
    fromCity: varchar("fromCity", { length: 100 }),
    fromLat: varchar("fromLat", { length: 20 }),
    fromLng: varchar("fromLng", { length: 20 }),
    toCountry: varchar("toCountry", { length: 100 }).notNull(),
    toCity: varchar("toCity", { length: 100 }),
    toLat: varchar("toLat", { length: 20 }),
    toLng: varchar("toLng", { length: 20 }),
    // Journey stages
    currentStage: mysqlEnum("currentStage", [
      "initiated",      // Иницијализирано
      "processing",     // Во обработка
      "crossing_border",// Преминува граница
      "intermediate",   // Меѓустаница
      "arriving",       // Пристигнува
      "delivered",      // Испорачано
      "completed",      // Завршено
    ]).default("initiated").notNull(),
    // Progress (0-100)
    progressPercent: int("progressPercent").default(0).notNull(),
    estimatedMinutes: int("estimatedMinutes").default(30),
    actualMinutes: int("actualMinutes"),
    // Timeline
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    transferIdIdx: index("journey_transferId_idx").on(table.transferId),
    userIdIdx: index("journey_userId_idx").on(table.userId),
    stageIdx: index("journey_stage_idx").on(table.currentStage),
  })
);

export type TransferJourney = typeof transferJourneys.$inferSelect;
export type InsertTransferJourney = typeof transferJourneys.$inferInsert;

// 2. AI CURRENCY ORACLE — Predict exchange rates
export const currencyPredictions = mysqlTable(
  "currencyPredictions",
  {
    id: serial("id").primaryKey(),
    fromCurrency: varchar("fromCurrency", { length: 3 }).notNull(),
    toCurrency: varchar("toCurrency", { length: 3 }).notNull(),
    currentRate: decimal("currentRate", { precision: 18, scale: 6 }).notNull(),
    predictedRate: decimal("predictedRate", { precision: 18, scale: 6 }).notNull(),
    predictedChange: decimal("predictedChange", { precision: 18, scale: 6 }),
    confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%
    // AI analysis
    trendDirection: mysqlEnum("trendDirection", [
      "up",
      "down",
      "stable",
      "volatile",
    ]).default("stable").notNull(),
    recommendation: text("recommendation"), // "Wait until Friday for better rate"
    bestDayToSend: varchar("bestDayToSend", { length: 20 }),
    bestTimeToSend: varchar("bestTimeToSend", { length: 10 }),
    // Analysis factors
    marketSentiment: varchar("marketSentiment", { length: 50 }), // bullish/bearish
    volatilityIndex: decimal("volatilityIndex", { precision: 5, scale: 2 }),
    // Source
    agentName: varchar("agentName", { length: 50 }).default("Oracle AI"), // Which AI made prediction
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"), // Prediction valid until
  },
  (table) => ({
    currencyPairIdx: index("oracle_pair_idx").on(table.fromCurrency, table.toCurrency),
    trendIdx: index("oracle_trend_idx").on(table.trendDirection),
  })
);

export type CurrencyPrediction = typeof currencyPredictions.$inferSelect;
export type InsertCurrencyPrediction = typeof currencyPredictions.$inferInsert;

// 3. SANDE'S GOLDEN BOOK — Hall of Fame
export const goldenBookEntries = mysqlTable(
  "goldenBookEntries",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    // Record type
    recordType: mysqlEnum("recordType", [
      "largest_transfer",      // Најголем трансфер
      "fastest_transfer",      // Најбрз трансфер
      "most_transfers_month",  // Најмногу трансфери во месец
      "longest_streak",        // Најдолга серија
      "top_referrer",          // Најдобар реферер
      "crypto_pioneer",        // Прв крипто трансфер
      "loyalty_champion",      // Најлоялен корисник
      "diaspora_star",         // Ѕвезда на дијаспората
    ]).notNull(),
    // Record details
    recordValue: varchar("recordValue", { length: 100 }).notNull(), // e.g. "500,000 MKD"
    recordDescription: text("recordDescription"),
    // Badge
    badgeTier: mysqlEnum("badgeTier", [
      "bronze",    // 🥉
      "silver",    // 🥈
      "gold",      // 🥇
      "diamond",   // 💎
      "platinum",  // 👑
    ]).default("bronze").notNull(),
    badgeName: varchar("badgeName", { length: 100 }).notNull(),
    badgeIcon: varchar("badgeIcon", { length: 50 }), // Lucide icon name
    // Recognition
    recognizedBy: varchar("recognizedBy", { length: 255 }).default("Doc. Dr. Sande Smiljanov"),
    recognitionNote: text("recognitionNote"),
    featured: boolean("featured").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("golden_userId_idx").on(table.userId),
    typeIdx: index("golden_type_idx").on(table.recordType),
    tierIdx: index("golden_tier_idx").on(table.badgeTier),
  })
);

export type GoldenBookEntry = typeof goldenBookEntries.$inferSelect;
export type InsertGoldenBookEntry = typeof goldenBookEntries.$inferInsert;

// 4. FAMILY POOL — Shared family account
export const familyPools = mysqlTable(
  "familyPools",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(), // "Семејство Смилјанови"
    creatorId: bigint("creatorId", { mode: "number", unsigned: true }).notNull(),
    // Pool details
    totalBalance: decimal("totalBalance", { precision: 18, scale: 2 }).default("0").notNull(),
    currency: varchar("currency", { length: 3 }).default("MKD").notNull(),
    memberCount: int("memberCount").default(1).notNull(),
    // Settings
    autoSplitEnabled: boolean("autoSplitEnabled").default(false),
    autoSplitPercent: decimal("autoSplitPercent", { precision: 5, scale: 2 }).default("50"),
    monthlyGoal: decimal("monthlyGoal", { precision: 18, scale: 2 }),
    // Status
    status: mysqlEnum("status", [
      "active",
      "paused",
      "closed",
    ]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    creatorIdIdx: index("pool_creatorId_idx").on(table.creatorId),
    statusIdx: index("pool_status_idx").on(table.status),
  })
);

export type FamilyPool = typeof familyPools.$inferSelect;
export type InsertFamilyPool = typeof familyPools.$inferInsert;

export const familyPoolMembers = mysqlTable(
  "familyPoolMembers",
  {
    id: serial("id").primaryKey(),
    poolId: bigint("poolId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Member details
    role: mysqlEnum("role", [
      "owner",     // Сопственик
      "admin",     // Администратор
      "member",    // Член
      "child",     // Дете (ограничен пристап)
    ]).default("member").notNull(),
    nickname: varchar("nickname", { length: 100 }), // "Баба", "Внукот", "Тато"
    contribution: decimal("contribution", { precision: 18, scale: 2 }).default("0"),
    withdrawLimit: decimal("withdrawLimit", { precision: 18, scale: 2 }),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  (table) => ({
    poolIdIdx: index("fpm_poolId_idx").on(table.poolId),
    userIdIdx: index("fpm_userId_idx").on(table.userId),
  })
);

export type FamilyPoolMember = typeof familyPoolMembers.$inferSelect;
export type InsertFamilyPoolMember = typeof familyPoolMembers.$inferInsert;

// 5. VIDEO MESSAGES — Send video with transfer
export const videoMessages = mysqlTable(
  "videoMessages",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }).notNull(),
    senderId: bigint("senderId", { mode: "number", unsigned: true }).notNull(),
    // Video
    videoUrl: text("videoUrl").notNull(),
    thumbnailUrl: text("thumbnailUrl"),
    durationSeconds: int("durationSeconds"),
    fileSizeMb: decimal("fileSizeMb", { precision: 6, scale: 2 }),
    // Message
    textMessage: text("textMessage"), // Optional text alongside video
    language: varchar("language", { length: 10 }).default("mk"),
    // Status
    status: mysqlEnum("status", [
      "uploading",
      "processing",
      "ready",
      "sent",
      "viewed",
      "expired",
    ]).default("uploading").notNull(),
    viewedAt: timestamp("viewedAt"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transferIdIdx: index("vid_transferId_idx").on(table.transferId),
    senderIdIdx: index("vid_senderId_idx").on(table.senderId),
  })
);

export type VideoMessage = typeof videoMessages.$inferSelect;
export type InsertVideoMessage = typeof videoMessages.$inferInsert;

// 6. EMERGENCY CASH NETWORK — 30 min delivery
export const emergencyRequests = mysqlTable(
  "emergencyRequests",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Delivery details
    deliveryAddress: text("deliveryAddress").notNull(),
    deliveryCity: varchar("deliveryCity", { length: 100 }).notNull(),
    deliveryCountry: varchar("deliveryCountry", { length: 100 }).notNull(),
    recipientPhone: varchar("recipientPhone", { length: 50 }).notNull(),
    deliveryInstructions: text("deliveryInstructions"),
    // Amount
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("MKD").notNull(),
    // Agent assignment
    agentId: bigint("agentId", { mode: "number", unsigned: true }), // Assigned delivery agent
    agentName: varchar("agentName", { length: 255 }),
    agentPhone: varchar("agentPhone", { length: 50 }),
    // Timing
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    promisedMinutes: int("promisedMinutes").default(30).notNull(),
    deliveredAt: timestamp("deliveredAt"),
    // Status
    status: mysqlEnum("status", [
      "searching_agent", // Барање агент
      "agent_assigned",  // Агент доделен
      "in_transit",      // Во транзит
      "nearby",          // Близу
      "delivered",       // Испорачано
      "cancelled",       // Откажано
      "failed",          // Неуспешно
    ]).default("searching_agent").notNull(),
    // Ratings
    recipientRating: int("recipientRating"), // 1-5 stars
    recipientComment: text("recipientComment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transferIdIdx: index("emerg_transferId_idx").on(table.transferId),
    userIdIdx: index("emerg_userId_idx").on(table.userId),
    statusIdx: index("emerg_status_idx").on(table.status),
  })
);

export type EmergencyRequest = typeof emergencyRequests.$inferSelect;
export type InsertEmergencyRequest = typeof emergencyRequests.$inferInsert;

// 7. AI NEGOTIATOR — 4 AI agents negotiate with 500+ banks
export const negotiationBids = mysqlTable(
  "negotiationBids",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Bank details
    bankName: varchar("bankName", { length: 255 }).notNull(),
    bankCountry: varchar("bankCountry", { length: 100 }),
    // Original vs Negotiated
    originalRate: decimal("originalRate", { precision: 18, scale: 6 }).notNull(),
    negotiatedRate: decimal("negotiatedRate", { precision: 18, scale: 6 }).notNull(),
    savingsPercent: decimal("savingsPercent", { precision: 5, scale: 2 }),
    savingsAmount: decimal("savingsAmount", { precision: 18, scale: 2 }),
    // AI Agent
    negotiatingAgent: mysqlEnum("negotiatingAgent", [
      "kimi",
      "gpt",
      "harvey",
      "claude",
    ]).notNull(),
    agentStrategy: text("agentStrategy"), // How the agent negotiated
    // Negotiation transcript
    negotiationLog: text("negotiationLog"), // Full conversation
    roundsCount: int("roundsCount").default(1), // How many back-and-forth
    // Result
    accepted: boolean("accepted").default(false),
    rejectedReason: text("rejectedReason"),
    // Timestamps
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transferIdIdx: index("neg_transferId_idx").on(table.transferId),
    userIdIdx: index("neg_userId_idx").on(table.userId),
    agentIdx: index("neg_agent_idx").on(table.negotiatingAgent),
  })
);

export type NegotiationBid = typeof negotiationBids.$inferSelect;
export type InsertNegotiationBid = typeof negotiationBids.$inferInsert;

// ═══════════════════════════════════════════════════════════
// SUPER TOOLS — 5 Missing Features (Multi-Currency, Recurring, BillPay, Referral, Insurance)
// ═══════════════════════════════════════════════════════════

// 1. MULTI-CURRENCY ACCOUNTS — Hold 10 currencies in one account
export const multiCurrencyAccounts = mysqlTable(
  "multiCurrencyAccounts",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(), // EUR, USD, CHF, GBP, MKD, etc.
    balance: decimal("balance", { precision: 18, scale: 2 }).default("0").notNull(),
    convertedFromMkd: decimal("convertedFromMkd", { precision: 18, scale: 2 }).default("0"),
    conversionRate: decimal("conversionRate", { precision: 18, scale: 6 }).default("1"),
    isPrimary: boolean("isPrimary").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("mca_userId_idx").on(table.userId),
    currencyIdx: index("mca_currency_idx").on(table.currency),
  })
);

export type MultiCurrencyAccount = typeof multiCurrencyAccounts.$inferSelect;
export type InsertMultiCurrencyAccount = typeof multiCurrencyAccounts.$inferInsert;

// 2. RECURRING TRANSFERS — Automatic monthly transfers
export const recurringTransfers = mysqlTable(
  "recurringTransfers",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    recipientId: bigint("recipientId", { mode: "number", unsigned: true }).notNull(),
    // Schedule
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("MKD").notNull(),
    frequency: mysqlEnum("frequency", [
      "weekly",
      "biweekly",
      "monthly",
      "bimonthly",
      "quarterly",
    ]).default("monthly").notNull(),
    dayOfMonth: int("dayOfMonth").default(1), // 1-31
    // Status
    status: mysqlEnum("status", [
      "active",
      "paused",
      "cancelled",
      "completed",
    ]).default("active").notNull(),
    nextExecution: timestamp("nextExecution"),
    lastExecution: timestamp("lastExecution"),
    totalExecuted: int("totalExecuted").default(0),
    totalAmountSent: decimal("totalAmountSent", { precision: 18, scale: 2 }).default("0"),
    // Metadata
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("rt_userId_idx").on(table.userId),
    recipientIdIdx: index("rt_recipientId_idx").on(table.recipientId),
    statusIdx: index("rt_status_idx").on(table.status),
  })
);

export type RecurringTransfer = typeof recurringTransfers.$inferSelect;
export type InsertRecurringTransfer = typeof recurringTransfers.$inferInsert;

// 3. BILL PAYMENTS — Pay Macedonian bills from diaspora
export const billPayments = mysqlTable(
  "billPayments",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Bill details
    billType: mysqlEnum("billType", [
      "evn",           // EVN Струја
      "vodovod",       // Водовод
      "telekom",       // Македонски Телеком
      "a1",            // А1 Македонија
      "ujp",           // Управата за Јавни Приходи
      "katastar",      // Катастар
      "komunalna",     // Комунална такса
      "grejanje",      // Греење
      "internet",      // Интернет
      "osiguruvanje",  // Здравствено осигурување
      "other",
    ]).notNull(),
    subscriberNumber: varchar("subscriberNumber", { length: 100 }).notNull(),
    subscriberName: varchar("subscriberName", { length: 255 }),
    // Amount
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("MKD").notNull(),
    // Payment
    paymentStatus: mysqlEnum("paymentStatus", [
      "pending",
      "processing",
      "paid",
      "failed",
      "refunded",
    ]).default("pending").notNull(),
    paidAt: timestamp("paidAt"),
    // For period
    billPeriod: varchar("billPeriod", { length: 20 }), // 04/2026
    // Receipt
    receiptNumber: varchar("receiptNumber", { length: 100 }),
    receiptUrl: text("receiptUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("bp_userId_idx").on(table.userId),
    billTypeIdx: index("bp_billType_idx").on(table.billType),
    statusIdx: index("bp_status_idx").on(table.paymentStatus),
  })
);

export type BillPayment = typeof billPayments.$inferSelect;
export type InsertBillPayment = typeof billPayments.$inferInsert;

// 4. REFERRALS — Referral program
export const referrals = mysqlTable(
  "referrals",
  {
    id: serial("id").primaryKey(),
    referrerId: bigint("referrerId", { mode: "number", unsigned: true }).notNull(),
    referredId: bigint("referredId", { mode: "number", unsigned: true }),
    // Code
    referralCode: varchar("referralCode", { length: 20 }).notNull(),
    // Status
    status: mysqlEnum("status", [
      "pending",      // Code generated, not used
      "registered",   // Referred user registered
      "first_transfer", // First transfer completed
      "rewarded",     // Reward given
    ]).default("pending").notNull(),
    // Rewards
    signupBonus: decimal("signupBonus", { precision: 18, scale: 2 }).default("5"), // 5 EUR bonus
    lifetimeRate: decimal("lifetimeRate", { precision: 5, scale: 3 }).default("0.001"), // 0.1%
    totalEarned: decimal("totalEarned", { precision: 18, scale: 2 }).default("0"),
    // Timestamps
    registeredAt: timestamp("registeredAt"),
    firstTransferAt: timestamp("firstTransferAt"),
    rewardedAt: timestamp("rewardedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    referrerIdIdx: index("ref_referrerId_idx").on(table.referrerId),
    codeIdx: index("ref_code_idx").on(table.referralCode),
    statusIdx: index("ref_status_idx").on(table.status),
  })
);

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// 5. TRANSFER INSURANCE — Free insurance on every transfer
export const transferInsurances = mysqlTable(
  "transferInsurances",
  {
    id: serial("id").primaryKey(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    // Insurance details
    insuredAmount: decimal("insuredAmount", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("MKD").notNull(),
    // Coverage
    coverageType: mysqlEnum("coverageType", [
      "standard",   // Free: full refund
      "premium",    // Paid: refund + 100 EUR compensation
    ]).default("standard").notNull(),
    // Status
    status: mysqlEnum("status", [
      "active",      // Transfer in progress
      "delivered",   // Money arrived
      "delayed",     // More than 24h
      "claimed",     // User claimed insurance
      "paid_out",    // Insurance paid
      "expired",     // Policy expired
    ]).default("active").notNull(),
    // Timing
    promisedHours: int("promisedHours").default(24),
    deliveredAt: timestamp("deliveredAt"),
    claimedAt: timestamp("claimedAt"),
    paidOutAt: timestamp("paidOutAt"),
    compensationAmount: decimal("compensationAmount", { precision: 18, scale: 2 }).default("0"),
    // Metadata
    claimReason: text("claimReason"),
    resolutionNotes: text("resolutionNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transferIdIdx: index("ti_transferId_idx").on(table.transferId),
    userIdIdx: index("ti_userId_idx").on(table.userId),
    statusIdx: index("ti_status_idx").on(table.status),
  })
);

export type TransferInsurance = typeof transferInsurances.$inferSelect;
export type InsertTransferInsurance = typeof transferInsurances.$inferInsert;

// ═══════════════════════════════════════════════════════════
// PASSIVE EARNING PARTNERS (PEP) NETWORK
// ═══════════════════════════════════════════════════════════

export const passiveEarningPartners = mysqlTable(
  "passiveEarningPartners",
  {
    id: serial("id").primaryKey(),
    // Partner identification
    name: varchar("name", { length: 255 }).notNull(),
    category: mysqlEnum("category", [
      "bank",           // Банки (Комерцијална, НЛБ, Стопанска, Халкбанк...)
      "telecom",        // Телекомуникации (Телеком, А1...)
      "internet",       // Интернет провајдери
      "utility",        // Јавни претпријатија (ЕВН, Водовод, БЕГ...)
      "government",     // Државни институции (УЈП, ФЗОМ, ПИОМ...)
      "international",  // Меѓународни институции (ММФ, Светска Банка, ЕБОР...)
      "payment",        // Платежни системи (Visa, MasterCard, SWIFT...)
      "crypto",         // Крипто мрежи (BTC, ETH, USDT...)
      "exchange",       // Менувачници и exchange платформи
      "aggregator",     // Агрегатори и посредници
      "referral",       // Реферал партнери (физички лица)
      "other",          // Други
    ]).default("other").notNull(),
    // Contact & web
    website: varchar("website", { length: 255 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    country: varchar("country", { length: 100 }).default("North Macedonia"),
    city: varchar("city", { length: 100 }),
    // Earning model
    earningPercent: decimal("earningPercent", { precision: 5, scale: 2 }).default("0.10").notNull(), // % од 1% провизија
    earningType: mysqlEnum("earningType", [
      "per_transaction",  // По трансакција
      "monthly_fixed",    // Месечен фиксен
      "revenue_share",    // Дел од приходот
      "hybrid",           // Хибриден модел
    ]).default("per_transaction").notNull(),
    // Financials
    totalEarned: decimal("totalEarned", { precision: 18, scale: 2 }).default("0").notNull(),
    totalTransactions: int("totalTransactions").default(0).notNull(),
    // Status
    status: mysqlEnum("status", [
      "active",
      "pending",
      "suspended",
      "terminated",
    ]).default("active").notNull(),
    // Description
    description: text("description"),
    logoUrl: varchar("logoUrl", { length: 500 }),
    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("pep_category_idx").on(table.category),
    statusIdx: index("pep_status_idx").on(table.status),
  })
);

export type PassiveEarningPartner = typeof passiveEarningPartners.$inferSelect;
export type InsertPassiveEarningPartner = typeof passiveEarningPartners.$inferInsert;

// ═══════════════════════════════════════════════════════════
// PARTNER EARNINGS - Real passive income tracking per transaction
// ═══════════════════════════════════════════════════════════

export const partnerEarnings = mysqlTable(
  "partnerEarnings",
  {
    id: serial("id").primaryKey(),
    partnerId: bigint("partnerId", { mode: "number", unsigned: true }).notNull(),
    transferId: bigint("transferId", { mode: "number", unsigned: true }),
    // Transaction details
    transactionAmount: decimal("transactionAmount", { precision: 18, scale: 2 }).notNull(),
    transactionCurrency: varchar("transactionCurrency", { length: 3 }).default("EUR").notNull(),
    mtmCommissionPercent: decimal("mtmCommissionPercent", { precision: 5, scale: 2 }).default("1.00").notNull(),
    mtmCommissionAmount: decimal("mtmCommissionAmount", { precision: 18, scale: 2 }).notNull(),
    // Partner share
    partnerPercent: decimal("partnerPercent", { precision: 5, scale: 2 }).notNull(),
    partnerEarningAmount: decimal("partnerEarningAmount", { precision: 18, scale: 2 }).notNull(),
    partnerShareOfTotal: decimal("partnerShareOfTotal", { precision: 5, scale: 2 }).default("70.00").notNull(),
    // Status
    status: mysqlEnum("status", ["pending", "paid", "scheduled", "hold"]).default("pending").notNull(),
    paidAt: timestamp("paidAt"),
    // Description
    description: text("description"),
    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    partnerIdx: index("pe_partner_idx").on(table.partnerId),
    statusIdx: index("pe_status_idx").on(table.status),
    createdIdx: index("pe_created_idx").on(table.createdAt),
  })
);

export type PartnerEarning = typeof partnerEarnings.$inferSelect;
export type InsertPartnerEarning = typeof partnerEarnings.$inferInsert;
