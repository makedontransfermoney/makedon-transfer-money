import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import {
  getAllPartners,
  getActivePartners,
  getPartnerById,
  createPartner,
  updatePartnerEarnings,
  updatePartnerStatus,
  getNetworkStats,
  seedPartners,
} from "./queries/pep";
import {
  recordPartnerEarning,
  getPartnerEarnings,
  getPendingEarnings,
  markEarningsAsPaid,
  getTodayEarnings,
  getMonthEarnings,
  getPartnerDashboard,
  getGlobalPassiveStats,
  simulateTransactionAndDistribute,
} from "./queries/pep-earnings";

export const pepRouter = createRouter({
  // ═══════ BASIC PARTNER CRUD ═══════
  list: publicQuery
    .input(z.object({ category: z.string().optional() }).optional())
    .query(({ input }) => getAllPartners(input?.category)),

  activeList: publicQuery.query(() => getActivePartners()),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPartnerById(input.id)),

  create: publicQuery
    .input(z.object({
      name: z.string().min(1),
      category: z.string(),
      website: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      earningPercent: z.string().optional(),
      earningType: z.string().optional(),
      description: z.string().optional(),
      logoUrl: z.string().optional(),
    }))
    .mutation(({ input }) => createPartner(input)),

  updateStatus: publicQuery
    .input(z.object({ id: z.number(), status: z.enum(["active", "pending", "suspended", "terminated"]) }))
    .mutation(({ input }) => updatePartnerStatus(input.id, input.status)),

  stats: publicQuery.query(() => getNetworkStats()),

  seed: publicQuery.mutation(() => seedPartners()),

  // ═══════ REAL PASSIVE INCOME ═══════

  // Record earning from transaction
  recordEarning: publicQuery
    .input(z.object({
      partnerId: z.number(),
      transferId: z.number().optional(),
      transactionAmount: z.string(),
      transactionCurrency: z.string().optional(),
      mtmCommissionAmount: z.string(),
      partnerPercent: z.string(),
      partnerEarningAmount: z.string(),
      description: z.string().optional(),
    }))
    .mutation(({ input }) => recordPartnerEarning(input)),

  // Get earnings history for a partner
  earningsHistory: publicQuery
    .input(z.object({ partnerId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getPartnerEarnings(input.partnerId, input.limit)),

  // Get pending earnings
  pendingEarnings: publicQuery
    .input(z.object({ partnerId: z.number() }))
    .query(({ input }) => getPendingEarnings(input.partnerId)),

  // Mark as paid
  markPaid: publicQuery
    .input(z.object({ earningId: z.number() }))
    .mutation(({ input }) => markEarningsAsPaid(input.earningId)),

  // Get partner dashboard (full stats)
  dashboard: publicQuery
    .input(z.object({ partnerId: z.number() }))
    .query(({ input }) => getPartnerDashboard(input.partnerId)),

  // Get global passive income stats
  globalStats: publicQuery.query(() => getGlobalPassiveStats()),

  // Simulate transaction and distribute to ALL partners
  simulateTransaction: publicQuery
    .input(z.object({
      amount: z.string(),
      currency: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(({ input }) => simulateTransactionAndDistribute(input)),
});
