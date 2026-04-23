import { getDb } from "./connection";
import { partnerEarnings, passiveEarningPartners } from "@db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

// ═══════════════════════════════════════════
// PARTNER EARNINGS - REAL PASSIVE INCOME
// ═══════════════════════════════════════════

// Record a new earning for a partner from a transaction
export async function recordPartnerEarning(data: {
  partnerId: number;
  transferId?: number;
  transactionAmount: string;
  transactionCurrency?: string;
  mtmCommissionPercent?: string;
  mtmCommissionAmount: string;
  partnerPercent: string;
  partnerEarningAmount: string;
  description?: string;
}) {
  const db = getDb();
  
  // Insert earning record
  const result = await db.insert(partnerEarnings).values({
    partnerId: data.partnerId,
    transferId: data.transferId,
    transactionAmount: data.transactionAmount,
    transactionCurrency: data.transactionCurrency || "EUR",
    mtmCommissionPercent: data.mtmCommissionPercent || "1.00",
    mtmCommissionAmount: data.mtmCommissionAmount,
    partnerPercent: data.partnerPercent,
    partnerEarningAmount: data.partnerEarningAmount,
    status: "pending",
    description: data.description,
  }).$returningId();

  // Update partner totals
  await db.update(passiveEarningPartners)
    .set({
      totalEarned: sql`${passiveEarningPartners.totalEarned} + ${data.partnerEarningAmount}`,
      totalTransactions: sql`${passiveEarningPartners.totalTransactions} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(passiveEarningPartners.id, data.partnerId));

  return result;
}

// Get all earnings for a partner
export async function getPartnerEarnings(partnerId: number, limit?: number) {
  const db = getDb();
  const query = db.select()
    .from(partnerEarnings)
    .where(eq(partnerEarnings.partnerId, partnerId))
    .orderBy(desc(partnerEarnings.createdAt));
  
  if (limit) {
    return query.limit(limit);
  }
  return query;
}

// Get pending earnings for payout
export async function getPendingEarnings(partnerId: number) {
  return getDb().select()
    .from(partnerEarnings)
    .where(
      and(
        eq(partnerEarnings.partnerId, partnerId),
        eq(partnerEarnings.status, "pending")
      )
    )
    .orderBy(desc(partnerEarnings.createdAt));
}

// Mark earnings as paid
export async function markEarningsAsPaid(earningId: number) {
  return getDb().update(partnerEarnings)
    .set({ status: "paid" as any, paidAt: new Date() })
    .where(eq(partnerEarnings.id, earningId));
}

// Get today's earnings for a partner
export async function getTodayEarnings(partnerId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result = await getDb().select({
    total: sql`COALESCE(SUM(${partnerEarnings.partnerEarningAmount}), 0)`,
    count: sql`COALESCE(COUNT(*), 0)`,
  })
  .from(partnerEarnings)
  .where(
    and(
      eq(partnerEarnings.partnerId, partnerId),
      gte(partnerEarnings.createdAt, today)
    )
  );
  
  return result[0] || { total: 0, count: 0 };
}

// Get this month's earnings for a partner
export async function getMonthEarnings(partnerId: number) {
  const firstDay = new Date();
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);
  
  const result = await getDb().select({
    total: sql`COALESCE(SUM(${partnerEarnings.partnerEarningAmount}), 0)`,
    count: sql`COALESCE(COUNT(*), 0)`,
  })
  .from(partnerEarnings)
  .where(
    and(
      eq(partnerEarnings.partnerId, partnerId),
      gte(partnerEarnings.createdAt, firstDay)
    )
  );
  
  return result[0] || { total: 0, count: 0 };
}

// Get partner dashboard stats
export async function getPartnerDashboard(partnerId: number) {
  const db = getDb();
  
  const partner = await db.select().from(passiveEarningPartners)
    .where(eq(passiveEarningPartners.id, partnerId))
    .then(r => r[0] || null);
  
  if (!partner) return null;
  
  const today = await getTodayEarnings(partnerId);
  const month = await getMonthEarnings(partnerId);
  const pending = await getPendingEarnings(partnerId);
  const pendingTotal = pending.reduce((sum, e) => sum + Number(e.partnerEarningAmount), 0);
  
  // Get last 5 transactions
  const recent = await db.select()
    .from(partnerEarnings)
    .where(eq(partnerEarnings.partnerId, partnerId))
    .orderBy(desc(partnerEarnings.createdAt))
    .limit(5);
  
  return {
    partner,
    todayEarned: Number(today.total),
    todayTransactions: Number(today.count),
    monthEarned: Number(month.total),
    monthTransactions: Number(month.count),
    pendingPayout: pendingTotal,
    pendingCount: pending.length,
    totalEarned: Number(partner.totalEarned),
    totalTransactions: partner.totalTransactions,
    recentTransactions: recent,
  };
}

// Get global passive income stats
export async function getGlobalPassiveStats() {
  const db = getDb();
  
  // Total distributed to partners
  const partnerTotal = await db.select({
    total: sql`COALESCE(SUM(${passiveEarningPartners.totalEarned}), 0)`,
    transactions: sql`COALESCE(SUM(${passiveEarningPartners.totalTransactions}), 0)`,
    activePartners: sql`COUNT(CASE WHEN ${passiveEarningPartners.status} = 'active' THEN 1 END)`,
  }).from(passiveEarningPartners);
  
  // Today's global earnings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEarnings = await db.select({
    total: sql`COALESCE(SUM(${partnerEarnings.partnerEarningAmount}), 0)`,
    count: sql`COALESCE(COUNT(*), 0)`,
  })
  .from(partnerEarnings)
  .where(gte(partnerEarnings.createdAt, today));
  
  // Top earning partners
  const topPartners = await db.select()
    .from(passiveEarningPartners)
    .where(eq(passiveEarningPartners.status, "active"))
    .orderBy(desc(passiveEarningPartners.totalEarned))
    .limit(10);
  
  return {
    totalDistributed: Number(partnerTotal[0]?.total || 0),
    totalTransactions: Number(partnerTotal[0]?.transactions || 0),
    activePartners: Number(partnerTotal[0]?.activePartners || 0),
    todayDistributed: Number(todayEarnings[0]?.total || 0),
    todayTransactions: Number(todayEarnings[0]?.count || 0),
    topPartners,
  };
}

// Simulate a transaction and distribute earnings to ALL active partners
export async function simulateTransactionAndDistribute(data: {
  amount: string;
  currency?: string;
  description?: string;
}) {
  const db = getDb();
  const txAmount = Number(data.amount);
  const currency = data.currency || "EUR";
  
  // 1% MTM commission
  const mtmCommission = (txAmount * 0.01).toFixed(2);
  
  // Get all active partners
  const partners = await db.select()
    .from(passiveEarningPartners)
    .where(eq(passiveEarningPartners.status, "active"));
  
  const results = [];
  
  for (const partner of partners) {
    const partnerPercent = Number(partner.earningPercent);
    const earningAmount = (Number(mtmCommission) * (partnerPercent / 1.0)).toFixed(2);
    
    const earningId = await recordPartnerEarning({
      partnerId: partner.id,
      transactionAmount: txAmount.toFixed(2),
      transactionCurrency: currency,
      mtmCommissionAmount: mtmCommission,
      partnerPercent: partnerPercent.toFixed(2),
      partnerEarningAmount: earningAmount,
      description: data.description || `Earning from ${currency} ${txAmount} transaction`,
    });
    
    results.push({
      partnerId: partner.id,
      partnerName: partner.name,
      category: partner.category,
      percent: partnerPercent,
      earned: earningAmount,
    });
  }
  
  return {
    transactionAmount: txAmount.toFixed(2),
    mtmCommission,
    partnerCount: partners.length,
    distributedTo: results,
  };
}
