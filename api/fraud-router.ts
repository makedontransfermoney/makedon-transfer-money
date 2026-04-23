import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  createFraudAlert,
  getFraudAlerts,
  getActiveFraudAlerts,
  getFraudAlertByTransfer,
  pressPanicButton,
  resolveFraudAlert,
  performAMLCheck,
  blockUser,
  isUserBlocked,
  getBlockedUsers,
  createIdVerification,
  getIdVerificationByUser,
  verifyId,
  createVerificationCode,
  getVerificationCodesByUser,
  useVerificationCode,
  createInterpolReport,
  getInterpolReports,
  sendInterpolEmail,
  createFrozenAsset,
  getFrozenAssets,
  getFrozenAssetsByUser,
  performFrozenAssetAMLCheck,
  approveFrozenAssetByAgent,
} from "./queries/fraud";

export const fraudRouter = createRouter({
  // ═══════════════════════════════════════════
  // Fraud Alerts
  // ═══════════════════════════════════════════
  createAlert: authedQuery
    .input(z.object({
      transferId: z.number(),
      alertType: z.enum([
        "suspicious_amount", "known_fraudster", "rapid_transfers",
        "unusual_pattern", "sanctions_list", "pep_match",
        "high_risk_country", "structuring", "hacker_detected",
        "fake_transfer", "identity_theft", "money_laundering",
      ]),
      severity: z.enum(["low", "medium", "high", "critical"]),
      description: z.string(),
      detectedBy: z.enum([
        "kimi_support", "gpt_advisor", "harvey_legal", "claude_sentinel",
        "imf_check", "world_bank_check", "system",
      ]).optional(),
      metadata: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createFraudAlert({ ...input, userId: ctx.user.id }),
    ),

  allAlerts: adminQuery.query(() => getFraudAlerts()),

  activeAlerts: adminQuery.query(() => getActiveFraudAlerts()),

  byTransfer: authedQuery
    .input(z.object({ transferId: z.number() }))
    .query(({ input }) => getFraudAlertByTransfer(input.transferId)),

  panic: authedQuery
    .input(z.object({ alertId: z.number() }))
    .mutation(({ input }) => pressPanicButton(input.alertId)),

  resolve: adminQuery
    .input(z.object({
      alertId: z.number(),
      status: z.enum(["active", "under_review", "resolved_clean", "confirmed_fraud", "blocked", "rejected", "escalated_interpol"]),
    }))
    .mutation(({ input }) => resolveFraudAlert(input.alertId, input.status)),

  amlCheck: authedQuery
    .input(z.object({
      transferId: z.number(),
      amount: z.string(),
    }))
    .mutation(({ ctx, input }) =>
      performAMLCheck(input.transferId, ctx.user.id, input.amount),
    ),

  // ═══════════════════════════════════════════
  // Blocked Users
  // ═══════════════════════════════════════════
  block: adminQuery
    .input(z.object({
      userId: z.number().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      nationalId: z.string().optional(),
      blockReason: z.enum([
        "fraud", "hacking", "fake_transfer", "identity_theft",
        "money_laundering", "sanctions", "agent_detected",
        "interpol_flagged", "manual_block",
      ]),
      description: z.string().optional(),
      blockedBy: z.enum([
        "kimi_support", "gpt_advisor", "harvey_legal",
        "claude_sentinel", "system", "admin",
      ]).optional(),
    }))
    .mutation(({ input }) => blockUser(input)),

  checkBlocked: authedQuery
    .input(z.object({
      userId: z.number().optional(),
      email: z.string().optional(),
      nationalId: z.string().optional(),
    }))
    .query(({ input }) =>
      isUserBlocked(input.userId, input.email, input.nationalId),
    ),

  blockedList: adminQuery.query(() => getBlockedUsers()),

  // ═══════════════════════════════════════════
  // National ID Verification
  // ═══════════════════════════════════════════
  submitId: authedQuery
    .input(z.object({
      nationalIdNumber: z.string().min(1),
      idType: z.enum([
        "passport", "national_id", "drivers_license",
        "residence_permit", "tax_id", "social_security",
      ]).optional(),
      country: z.string().min(1),
      fullName: z.string().optional(),
      dateOfBirth: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createIdVerification({ ...input, userId: ctx.user.id }),
    ),

  myId: authedQuery.query(({ ctx }) =>
    getIdVerificationByUser(ctx.user.id),
  ),

  verify: adminQuery
    .input(z.object({
      id: z.number(),
      agent: z.enum(["kimi_agent", "gpt_agent", "harvey_agent", "claude_agent", "manual_review", "system"]),
      code: z.string().optional(),
    }))
    .mutation(({ input }) => verifyId(input.id, input.agent, input.code)),

  // ═══════════════════════════════════════════
  // Verification Codes
  // ═══════════════════════════════════════════
  generateCode: authedQuery
    .input(z.object({
      transferId: z.number().optional(),
      idVerificationId: z.number().optional(),
      codeType: z.enum([
        "transfer_auth", "id_verification", "panic_override",
        "agent_override", "emergency_access", "recon_override",
      ]),
      generatedBy: z.enum([
        "kimi_support", "gpt_advisor", "harvey_legal",
        "claude_sentinel", "system", "admin",
      ]),
      expiresInHours: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createVerificationCode({ ...input, userId: ctx.user.id }),
    ),

  myCodes: authedQuery.query(({ ctx }) =>
    getVerificationCodesByUser(ctx.user.id),
  ),

  useCode: authedQuery
    .input(z.object({ code: z.string() }))
    .mutation(({ input }) => useVerificationCode(input.code)),

  // ═══════════════════════════════════════════
  // Interpol Reports
  // ═══════════════════════════════════════════
  reportToInterpol: adminQuery
    .input(z.object({
      fraudAlertId: z.number(),
      transferId: z.number().optional(),
      userId: z.number().optional(),
      reportType: z.enum([
        "fraud_suspicion", "money_laundering", "identity_theft",
        "cybercrime", "hacking", "terrorism_financing", "sanctions_violation",
      ]),
      subjectName: z.string().optional(),
      subjectNationalId: z.string().optional(),
      description: z.string(),
      evidence: z.string().optional(),
    }))
    .mutation(({ input }) => createInterpolReport(input)),

  interpolReports: adminQuery.query(() => getInterpolReports()),

  sendInterpol: adminQuery
    .input(z.object({ reportId: z.number() }))
    .mutation(({ input }) => sendInterpolEmail(input.reportId)),

  // ═══════════════════════════════════════════
  // Frozen Assets (Russian & Sanctioned Funds)
  // ═══════════════════════════════════════════
  createFrozenAsset: authedQuery
    .input(z.object({
      transferId: z.number().optional(),
      assetType: z.enum([
        "russian_frozen", "sanctioned_funds", "blocked_assets",
        "frozen_reserve", "central_bank_assets", "oligarch_funds", "trade_receivable",
      ]).optional(),
      assetSource: z.string().optional(),
      originatingBank: z.string().optional(),
      amount: z.string(),
      currency: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createFrozenAsset({ ...input, userId: ctx.user.id }),
    ),

  allFrozenAssets: adminQuery.query(() => getFrozenAssets()),

  myFrozenAssets: authedQuery.query(({ ctx }) =>
    getFrozenAssetsByUser(ctx.user.id),
  ),

  frozenAMLCheck: authedQuery
    .input(z.object({ assetId: z.number() }))
    .mutation(({ input }) =>
      performFrozenAssetAMLCheck(input.assetId),
    ),

  approveFrozenAsset: adminQuery
    .input(z.object({
      assetId: z.number(),
      agent: z.enum(["kimi", "gpt", "harvey", "claude"]),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) =>
      approveFrozenAssetByAgent(input.assetId, input.agent, input.notes),
    ),
});
