import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  createJourney,
  getJourneysByUser,
  getActiveJourneys,
  updateJourneyProgress,
  createPrediction,
  getPredictions,
  getLatestPrediction,
  generateOraclePrediction,
  createGoldenEntry,
  getGoldenBookEntries,
  getFeaturedEntries,
  createFamilyPool,
  addFamilyMember,
  getFamilyPoolsByUser,
  getPoolMembers,
  createVideoMessage,
  getVideoByTransfer,
  createEmergencyRequest,
  getEmergencyRequests,
  assignAgent,
  updateEmergencyStatus,
  createNegotiationBid,
  getNegotiationBids,
  acceptBid,
  simulateNegotiation,
} from "./queries/unique";

export const uniqueRouter = createRouter({
  // ═══════════════════════════════════════════
  // 1. MONEY JOURNEY
  // ═══════════════════════════════════════════
  createJourney: authedQuery
    .input(z.object({
      transferId: z.number(),
      fromCountry: z.string(),
      fromCity: z.string().optional(),
      fromLat: z.string().optional(),
      fromLng: z.string().optional(),
      toCountry: z.string(),
      toCity: z.string().optional(),
      toLat: z.string().optional(),
      toLng: z.string().optional(),
      estimatedMinutes: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createJourney({ ...input, userId: ctx.user.id }),
    ),

  myJourneys: authedQuery.query(({ ctx }) =>
    getJourneysByUser(ctx.user.id),
  ),

  activeJourneys: authedQuery.query(() => getActiveJourneys()),

  updateJourney: adminQuery
    .input(z.object({
      id: z.number(),
      stage: z.enum([
        "initiated", "processing", "crossing_border",
        "intermediate", "arriving", "delivered", "completed",
      ]),
      progress: z.number().min(0).max(100),
    }))
    .mutation(({ input }) =>
      updateJourneyProgress(input.id, input.stage, input.progress),
    ),

  // ═══════════════════════════════════════════
  // 2. AI CURRENCY ORACLE
  // ═══════════════════════════════════════════
  generatePrediction: authedQuery
    .input(z.object({
      fromCurrency: z.string(),
      toCurrency: z.string(),
      currentRate: z.string(),
    }))
    .query(({ input }) => {
      const result = generateOraclePrediction(
        parseFloat(input.currentRate),
        `${input.fromCurrency}-${input.toCurrency}`,
      );
      return result;
    }),

  savePrediction: authedQuery
    .input(z.object({
      fromCurrency: z.string(),
      toCurrency: z.string(),
      currentRate: z.string(),
      predictedRate: z.string(),
      predictedChange: z.string(),
      confidence: z.string(),
      trendDirection: z.string().optional(),
      recommendation: z.string().optional(),
      bestDayToSend: z.string().optional(),
      bestTimeToSend: z.string().optional(),
      marketSentiment: z.string().optional(),
      volatilityIndex: z.string().optional(),
      agentName: z.string().optional(),
    }))
    .mutation(({ input }) => createPrediction(input)),

  predictions: authedQuery
    .input(z.object({ pair: z.string() }))
    .query(({ input }) => getPredictions(input.pair)),

  latestPrediction: authedQuery
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(({ input }) =>
      getLatestPrediction(input.from, input.to),
    ),

  // ═══════════════════════════════════════════
  // 3. GOLDEN BOOK
  // ═══════════════════════════════════════════
  createGoldenEntry: authedQuery
    .input(z.object({
      transferId: z.number().optional(),
      recordType: z.enum([
        "largest_transfer", "fastest_transfer", "most_transfers_month",
        "longest_streak", "top_referrer", "crypto_pioneer",
        "loyalty_champion", "diaspora_star",
      ]),
      recordValue: z.string(),
      recordDescription: z.string().optional(),
      badgeTier: z.enum(["bronze", "silver", "gold", "diamond", "platinum"]).optional(),
      badgeName: z.string(),
      badgeIcon: z.string().optional(),
      recognitionNote: z.string().optional(),
      featured: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createGoldenEntry({ ...input, userId: ctx.user.id }),
    ),

  goldenBook: authedQuery.query(() => getGoldenBookEntries()),
  featuredEntries: authedQuery.query(() => getFeaturedEntries()),

  // ═══════════════════════════════════════════
  // 4. FAMILY POOL
  // ═══════════════════════════════════════════
  createPool: authedQuery
    .input(z.object({
      name: z.string(),
      currency: z.string().optional(),
      monthlyGoal: z.string().optional(),
      autoSplitEnabled: z.boolean().optional(),
      autoSplitPercent: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createFamilyPool({ ...input, creatorId: ctx.user.id }),
    ),

  addMember: authedQuery
    .input(z.object({
      poolId: z.number(),
      userId: z.number(),
      role: z.enum(["owner", "admin", "member", "child"]).optional(),
      nickname: z.string().optional(),
      withdrawLimit: z.string().optional(),
    }))
    .mutation(({ input }) => addFamilyMember(input)),

  myPools: authedQuery.query(({ ctx }) =>
    getFamilyPoolsByUser(ctx.user.id),
  ),

  poolMembers: authedQuery
    .input(z.object({ poolId: z.number() }))
    .query(({ input }) => getPoolMembers(input.poolId)),

  // ═══════════════════════════════════════════
  // 5. VIDEO MESSAGES
  // ═══════════════════════════════════════════
  createVideo: authedQuery
    .input(z.object({
      transferId: z.number(),
      videoUrl: z.string(),
      thumbnailUrl: z.string().optional(),
      durationSeconds: z.number().optional(),
      textMessage: z.string().optional(),
      language: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createVideoMessage({ ...input, senderId: ctx.user.id }),
    ),

  videoByTransfer: authedQuery
    .input(z.object({ transferId: z.number() }))
    .query(({ input }) => getVideoByTransfer(input.transferId)),

  // ═══════════════════════════════════════════
  // 6. EMERGENCY CASH
  // ═══════════════════════════════════════════
  createEmergency: authedQuery
    .input(z.object({
      transferId: z.number(),
      deliveryAddress: z.string(),
      deliveryCity: z.string(),
      deliveryCountry: z.string(),
      recipientPhone: z.string(),
      deliveryInstructions: z.string().optional(),
      amount: z.string(),
      currency: z.string().optional(),
      promisedMinutes: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createEmergencyRequest({ ...input, userId: ctx.user.id }),
    ),

  emergencyList: adminQuery.query(() => getEmergencyRequests()),

  assignAgent: adminQuery
    .input(z.object({
      id: z.number(),
      agentName: z.string(),
      agentPhone: z.string(),
    }))
    .mutation(({ input }) =>
      assignAgent(input.id, input.agentName, input.agentPhone),
    ),

  updateEmergency: adminQuery
    .input(z.object({
      id: z.number(),
      status: z.enum([
        "searching_agent", "agent_assigned", "in_transit",
        "nearby", "delivered", "cancelled", "failed",
      ]),
    }))
    .mutation(({ input }) =>
      updateEmergencyStatus(input.id, input.status),
    ),

  // ═══════════════════════════════════════════
  // 7. AI NEGOTIATOR
  // ═══════════════════════════════════════════
  simulateNegotiation: authedQuery
    .input(z.object({
      originalRate: z.string(),
      bankName: z.string(),
      agent: z.enum(["kimi", "gpt", "harvey", "claude"]),
    }))
    .query(({ input }) =>
      simulateNegotiation(parseFloat(input.originalRate), input.bankName, input.agent),
    ),

  saveBid: authedQuery
    .input(z.object({
      transferId: z.number().optional(),
      bankName: z.string(),
      bankCountry: z.string().optional(),
      originalRate: z.string(),
      negotiatedRate: z.string(),
      savingsPercent: z.string().optional(),
      savingsAmount: z.string().optional(),
      negotiatingAgent: z.enum(["kimi", "gpt", "harvey", "claude"]),
      agentStrategy: z.string().optional(),
      negotiationLog: z.string().optional(),
      roundsCount: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createNegotiationBid({ ...input, userId: ctx.user.id }),
    ),

  myBids: authedQuery.query(({ ctx }) =>
    getNegotiationBids(ctx.user.id),
  ),

  acceptBid: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => acceptBid(input.id)),
});
