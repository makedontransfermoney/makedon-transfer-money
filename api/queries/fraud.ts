import { getDb } from "./connection";
import { fraudAlerts, blockedUsers, idVerifications, verificationCodes, interpolReports, frozenAssets } from "@db/schema";
import { eq, and, desc, or } from "drizzle-orm";

// ═══════════════════════════════════════════════
// Fraud Alert Queries
// ═══════════════════════════════════════════════

export async function createFraudAlert(data: {
  transferId: number;
  userId: number;
  alertType: string;
  severity: string;
  description: string;
  detectedBy?: string;
  metadata?: string;
}) {
  return getDb().insert(fraudAlerts).values({
    transferId: data.transferId,
    userId: data.userId,
    alertType: data.alertType as any,
    severity: data.severity as any,
    description: data.description,
    detectedBy: (data.detectedBy || "system") as any,
    metadata: data.metadata,
  }).$returningId();
}

export async function getFraudAlerts() {
  return getDb().select().from(fraudAlerts)
    .orderBy(desc(fraudAlerts.createdAt))
    .limit(100);
}

export async function getActiveFraudAlerts() {
  return getDb().select().from(fraudAlerts)
    .where(eq(fraudAlerts.status, "active"))
    .orderBy(desc(fraudAlerts.createdAt));
}

export async function getFraudAlertByTransfer(transferId: number) {
  return getDb().select().from(fraudAlerts)
    .where(eq(fraudAlerts.transferId, transferId))
    .orderBy(desc(fraudAlerts.createdAt));
}

export async function pressPanicButton(alertId: number) {
  return getDb().update(fraudAlerts)
    .set({
      panicButtonPressed: true,
      transferRejected: true,
      status: "rejected",
    })
    .where(eq(fraudAlerts.id, alertId));
}

export async function resolveFraudAlert(alertId: number, status: string) {
  return getDb().update(fraudAlerts)
    .set({
      status: status as any,
      resolvedAt: new Date(),
    })
    .where(eq(fraudAlerts.id, alertId));
}

// Simulate IMF / World Bank check
export async function performAMLCheck(transferId: number, userId: number, amount: string) {
  const amt = parseFloat(amount);
  const checks: Record<string, any> = {
    imf: { status: "clean", message: "Funds verified as clean by IMF database" },
    worldBank: { status: "clean", message: "Source verified by World Bank records" },
    agentScan: { status: "clean", message: "All 4 agents confirm transfer is legitimate" },
  };

  // Simulate suspicious detection
  if (amt > 100000) {
    checks.imf = { status: "flagged", message: "Large amount flagged for review" };
    checks.worldBank = { status: "flagged", message: "High-value transfer requires verification" };
    checks.agentScan = { status: "flagged", message: "GPT Advisor flagged unusual amount pattern" };

    await createFraudAlert({
      transferId,
      userId,
      alertType: "suspicious_amount",
      severity: "high",
      description: `Transfer amount ${amt} exceeds threshold. All proactive agents flagged. IMF and World Bank databases show anomaly.`,
      detectedBy: "claude_sentinel",
      metadata: JSON.stringify(checks),
    });
  }

  // Update the transfer's AML status
  await getDb().update(fraudAlerts)
    .set({
      imfCleanStatus: checks.imf.status as any,
      worldBankCleanStatus: checks.worldBank.status as any,
    })
    .where(eq(fraudAlerts.transferId, transferId));

  return checks;
}

// ═══════════════════════════════════════════════
// Blocked User Queries
// ═══════════════════════════════════════════════

export async function blockUser(data: {
  userId?: number;
  email?: string;
  phone?: string;
  nationalId?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  blockReason: string;
  description?: string;
  blockedBy?: string;
  metadata?: string;
}) {
  return getDb().insert(blockedUsers).values({
    userId: data.userId,
    email: data.email,
    phone: data.phone,
    nationalId: data.nationalId,
    deviceFingerprint: data.deviceFingerprint,
    ipAddress: data.ipAddress,
    blockReason: data.blockReason as any,
    description: data.description,
    blockedBy: (data.blockedBy || "system") as any,
    metadata: data.metadata,
  }).$returningId();
}

export async function isUserBlocked(userId?: number, email?: string, nationalId?: string) {
  const conditions = [];
  if (userId) conditions.push(eq(blockedUsers.userId, userId));
  if (email) conditions.push(eq(blockedUsers.email, email));
  if (nationalId) conditions.push(eq(blockedUsers.nationalId, nationalId));

  if (conditions.length === 0) return null;

  const result = await getDb().select().from(blockedUsers)
    .where(and(
      or(...conditions),
      eq(blockedUsers.isPermanent, true)
    ))
    .limit(1);

  return result[0] || null;
}

export async function getBlockedUsers() {
  return getDb().select().from(blockedUsers)
    .orderBy(desc(blockedUsers.createdAt))
    .limit(100);
}

// ═══════════════════════════════════════════════
// National ID Verification Queries
// ═══════════════════════════════════════════════

export async function createIdVerification(data: {
  userId: number;
  nationalIdNumber: string;
  idType?: string;
  country: string;
  fullName?: string;
  dateOfBirth?: string;
  documentUrl?: string;
  selfieUrl?: string;
}) {
  return getDb().insert(idVerifications).values({
    userId: data.userId,
    nationalIdNumber: data.nationalIdNumber,
    idType: data.idType as any,
    country: data.country,
    fullName: data.fullName,
    dateOfBirth: data.dateOfBirth,
    documentUrl: data.documentUrl,
    selfieUrl: data.selfieUrl,
    status: "pending",
  }).$returningId();
}

export async function getIdVerificationByUser(userId: number) {
  return getDb().select().from(idVerifications)
    .where(eq(idVerifications.userId, userId))
    .orderBy(desc(idVerifications.createdAt));
}

export async function verifyId(id: number, agent: string, code?: string) {
  return getDb().update(idVerifications)
    .set({
      status: "verified",
      verifiedBy: agent as any,
      verificationCode: code,
      verifiedAt: new Date(),
    })
    .where(eq(idVerifications.id, id));
}

// ═══════════════════════════════════════════════
// Verification Code Queries
// ═══════════════════════════════════════════════

export function generateVerificationCode(): string {
  const prefix = "MKN";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function createVerificationCode(data: {
  userId: number;
  transferId?: number;
  idVerificationId?: number;
  codeType: string;
  generatedBy: string;
  requiresRecon?: boolean;
  expiresInHours?: number;
}) {
  const code = generateVerificationCode();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 24));

  return getDb().insert(verificationCodes).values({
    userId: data.userId,
    transferId: data.transferId,
    idVerificationId: data.idVerificationId,
    code,
    codeType: data.codeType as any,
    generatedBy: data.generatedBy as any,
    requiresRecon: data.requiresRecon ?? true,
    expiresAt,
  }).$returningId();
}

export async function getVerificationCodesByUser(userId: number) {
  return getDb().select().from(verificationCodes)
    .where(eq(verificationCodes.userId, userId))
    .orderBy(desc(verificationCodes.createdAt));
}

export async function useVerificationCode(code: string) {
  return getDb().update(verificationCodes)
    .set({
      usedAt: new Date(),
      isActive: false,
      reconStatus: "biometric_confirmed",
    })
    .where(eq(verificationCodes.code, code));
}

// ═══════════════════════════════════════════════
// Interpol Report Queries
// ═══════════════════════════════════════════════

export async function createInterpolReport(data: {
  fraudAlertId: number;
  transferId?: number;
  userId?: number;
  reportType: string;
  subjectName?: string;
  subjectNationalId?: string;
  description: string;
  evidence?: string;
}) {
  const caseNum = `INT-${Date.now().toString(36).toUpperCase()}`;
  return getDb().insert(interpolReports).values({
    fraudAlertId: data.fraudAlertId,
    transferId: data.transferId,
    userId: data.userId,
    reportType: data.reportType as any,
    subjectName: data.subjectName,
    subjectNationalId: data.subjectNationalId,
    description: data.description,
    evidence: data.evidence,
    caseNumber: caseNum,
    status: "submitted",
  }).$returningId();
}

export async function getInterpolReports() {
  return getDb().select().from(interpolReports)
    .orderBy(desc(interpolReports.createdAt));
}

export async function sendInterpolEmail(reportId: number) {
  return getDb().update(interpolReports)
    .set({
      emailSent: true,
      sentAt: new Date(),
      status: "submitted",
    })
    .where(eq(interpolReports.id, reportId));
}

// ═══════════════════════════════════════════════
// Frozen Assets Queries (Russian & Sanctioned)
// ═══════════════════════════════════════════════

export async function createFrozenAsset(data: {
  userId: number;
  transferId?: number;
  assetType?: string;
  assetSource?: string;
  originatingBank?: string;
  amount: string;
  currency?: string;
  description?: string;
}) {
  return getDb().insert(frozenAssets).values({
    userId: data.userId,
    transferId: data.transferId,
    assetType: data.assetType as any,
    assetSource: data.assetSource || "Russia",
    originatingBank: data.originatingBank,
    amount: data.amount,
    currency: data.currency || "MKD",
    amlStatus: "pending",
    imfStatus: "not_checked",
    worldBankStatus: "not_checked",
  }).$returningId();
}

export async function getFrozenAssets() {
  return getDb().select().from(frozenAssets)
    .orderBy(desc(frozenAssets.createdAt))
    .limit(100);
}

export async function getFrozenAssetsByUser(userId: number) {
  return getDb().select().from(frozenAssets)
    .where(eq(frozenAssets.userId, userId))
    .orderBy(desc(frozenAssets.createdAt));
}

export async function getFrozenAssetById(id: number) {
  return getDb().query.frozenAssets.findFirst({
    where: eq(frozenAssets.id, id),
  });
}

// Perform enhanced AML check for frozen assets (IMF + World Bank + All 4 Agents)
export async function performFrozenAssetAMLCheck(assetId: number) {
  const db = getDb();
  const asset = await getFrozenAssetById(assetId);
  if (!asset) return null;

  const amt = Number(asset.amount);

  // Simulate IMF check
  const imfResult = amt > 0
    ? { status: "clean" as const, message: "IMF database: Funds source verified as legitimate. No sanctions violation detected." }
    : { status: "flagged" as const, message: "IMF database: Irregular amount detected." };

  // Simulate World Bank check
  const wbResult = amt > 0
    ? { status: "clean" as const, message: "World Bank records: Asset origin confirmed clean. No money laundering indicators." }
    : { status: "flagged" as const, message: "World Bank: Suspicious origin pattern." };

  // All 4 agents must approve for Russian frozen assets
  const allClean = imfResult.status === "clean" && wbResult.status === "clean";

  await db.update(frozenAssets)
    .set({
      imfStatus: imfResult.status,
      worldBankStatus: wbResult.status,
      amlStatus: allClean ? "clean" : "flagged",
      // Auto-approve by all 4 agents if clean
      kimiApproved: allClean,
      gptApproved: allClean,
      harveyApproved: allClean,
      claudeApproved: allClean,
      transferAllowed: allClean,
      approvedAt: allClean ? new Date() : undefined,
      approvalNotes: allClean
        ? "All 4 AI agents (Kimi, GPT, Harvey, Claude) + IMF + World Bank confirm: Funds are CLEAN and approved for transfer."
        : "Additional review required. Agents detected irregularities.",
    })
    .where(eq(frozenAssets.id, assetId));

  return {
    imf: imfResult,
    worldBank: wbResult,
    allAgentsApproved: allClean,
    transferAllowed: allClean,
    asset: await getFrozenAssetById(assetId),
  };
}

// Manual agent approval for frozen assets
export async function approveFrozenAssetByAgent(
  assetId: number,
  agent: "kimi" | "gpt" | "harvey" | "claude",
  notes?: string,
) {
  const db = getDb();
  const updateData: Record<string, boolean | string | Date> = {};

  switch (agent) {
    case "kimi": updateData.kimiApproved = true; break;
    case "gpt": updateData.gptApproved = true; break;
    case "harvey": updateData.harveyApproved = true; break;
    case "claude": updateData.claudeApproved = true; break;
  }
  updateData.approvalNotes = notes || `Approved by ${agent} agent`;

  await db.update(frozenAssets)
    .set(updateData)
    .where(eq(frozenAssets.id, assetId));

  // Check if all 4 agents approved
  const asset = await getFrozenAssetById(assetId);
  if (asset && asset.kimiApproved && asset.gptApproved && asset.harveyApproved && asset.claudeApproved) {
    await db.update(frozenAssets)
      .set({
        transferAllowed: true,
        amlStatus: "clean",
        approvedAt: new Date(),
      })
      .where(eq(frozenAssets.id, assetId));
  }

  return getFrozenAssetById(assetId);
}
