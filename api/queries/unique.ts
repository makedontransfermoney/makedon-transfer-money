import { getDb } from "./connection";
import {
  transferJourneys,
  currencyPredictions,
  goldenBookEntries,
  familyPools,
  familyPoolMembers,
  videoMessages,
  emergencyRequests,
  negotiationBids,
} from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// 1. MONEY JOURNEY
// ═══════════════════════════════════════════════════════════

export async function createJourney(data: {
  transferId: number;
  userId: number;
  fromCountry: string;
  fromCity?: string;
  fromLat?: string;
  fromLng?: string;
  toCountry: string;
  toCity?: string;
  toLat?: string;
  toLng?: string;
  estimatedMinutes?: number;
}) {
  return getDb().insert(transferJourneys).values({
    transferId: data.transferId,
    userId: data.userId,
    fromCountry: data.fromCountry,
    fromCity: data.fromCity,
    fromLat: data.fromLat,
    fromLng: data.fromLng,
    toCountry: data.toCountry,
    toCity: data.toCity,
    toLat: data.toLat,
    toLng: data.toLng,
    estimatedMinutes: data.estimatedMinutes || 30,
    currentStage: "initiated",
    progressPercent: 0,
  }).$returningId();
}

export async function getJourneysByUser(userId: number) {
  return getDb().select().from(transferJourneys)
    .where(eq(transferJourneys.userId, userId))
    .orderBy(desc(transferJourneys.startedAt));
}

export async function getActiveJourneys() {
  return getDb().select().from(transferJourneys)
    .where(
      and(
        eq(transferJourneys.currentStage, "processing"),
      ),
    )
    .orderBy(desc(transferJourneys.startedAt));
}

export async function updateJourneyProgress(
  id: number,
  stage: string,
  progress: number,
) {
  return getDb().update(transferJourneys)
    .set({
      currentStage: stage as any,
      progressPercent: progress,
      completedAt: progress >= 100 ? new Date() : undefined,
    })
    .where(eq(transferJourneys.id, id));
}

// ═══════════════════════════════════════════════════════════
// 2. AI CURRENCY ORACLE
// ═══════════════════════════════════════════════════════════

export async function createPrediction(data: {
  fromCurrency: string;
  toCurrency: string;
  currentRate: string;
  predictedRate: string;
  predictedChange: string;
  confidence: string;
  trendDirection?: string;
  recommendation?: string;
  bestDayToSend?: string;
  bestTimeToSend?: string;
  marketSentiment?: string;
  volatilityIndex?: string;
  agentName?: string;
}) {
  return getDb().insert(currencyPredictions).values({
    fromCurrency: data.fromCurrency,
    toCurrency: data.toCurrency,
    currentRate: data.currentRate,
    predictedRate: data.predictedRate,
    predictedChange: data.predictedChange,
    confidence: data.confidence,
    trendDirection: data.trendDirection as any,
    recommendation: data.recommendation,
    bestDayToSend: data.bestDayToSend,
    bestTimeToSend: data.bestTimeToSend,
    marketSentiment: data.marketSentiment,
    volatilityIndex: data.volatilityIndex,
    agentName: data.agentName || "Oracle AI",
  }).$returningId();
}

export async function getPredictions(pair: string) {
  const [from, to] = pair.split("-");
  return getDb().select().from(currencyPredictions)
    .where(
      and(
        eq(currencyPredictions.fromCurrency, from),
        eq(currencyPredictions.toCurrency, to),
      ),
    )
    .orderBy(desc(currencyPredictions.createdAt))
    .limit(10);
}

export async function getLatestPrediction(from: string, to: string) {
  return getDb().query.currencyPredictions.findFirst({
    where: and(
      eq(currencyPredictions.fromCurrency, from),
      eq(currencyPredictions.toCurrency, to),
    ),
    orderBy: desc(currencyPredictions.createdAt),
  });
}

// Generate prediction with AI logic
export function generateOraclePrediction(currentRate: number, pair: string) {
  const days = ["Понеделник", "Вторник", "Среда", "Четврток", "Петок", "Сабота", "Недела"];
  const times = ["09:00", "11:30", "14:00", "16:30"];
  
  // Simulate AI analysis
  const changePercent = (Math.random() * 2 - 0.5); // -0.5% to +1.5%
  const predictedRate = currentRate * (1 + changePercent / 100);
  const confidence = 60 + Math.random() * 35; // 60-95%
  
  const direction = changePercent > 0.3 ? "up" : changePercent < -0.2 ? "down" : "stable";
  
  const recommendations: Record<string, string[]> = {
    up: [
      `Курсот се очекува да порасне за ${changePercent.toFixed(2)}%. Почекајте до петок за подобар договор.`,
      `Биковски пазар очекуван. Најдобро време за испраќање: четврток по 14:00.`,
      `Силен тренд нагоре. Препорака: испратете ги парите утре пред 11:00.`,
    ],
    down: [
      `Курсот опаѓа. Испратете веднаш пред понатамошен пад!`,
      `Мечкавски сигнали. Денес е подобро од утре — испратете сега.`,
      `Очекуван пад од ${Math.abs(changePercent).toFixed(2)}%. Итна препорака: трансфер веднаш.`,
    ],
    stable: [
      `Курсот е стабилен. Можете слободно да испратите било кога оваа недела.`,
      `Малку движење очекувано. Најдобар ден: среда, најдобро време: 14:00.`,
      `Пазарот е мирен. Нема потреба да чекате — курсот ќе остане сличен.`,
    ],
  };
  
  const recs = recommendations[direction] || recommendations.stable;
  
  return {
    currentRate: currentRate.toFixed(6),
    predictedRate: predictedRate.toFixed(6),
    predictedChange: changePercent.toFixed(4),
    confidence: confidence.toFixed(2),
    trendDirection: direction,
    recommendation: recs[Math.floor(Math.random() * recs.length)],
    bestDayToSend: days[Math.floor(Math.random() * 5)],
    bestTimeToSend: times[Math.floor(Math.random() * times.length)],
    marketSentiment: direction === "up" ? "bullish" : direction === "down" ? "bearish" : "neutral",
    volatilityIndex: (Math.random() * 20 + 5).toFixed(2),
    agentName: ["Kimi Oracle", "GPT Prophet", "Harvester", "Claude Vision"][Math.floor(Math.random() * 4)],
  };
}

// ═══════════════════════════════════════════════════════════
// 3. GOLDEN BOOK
// ═══════════════════════════════════════════════════════════

export async function createGoldenEntry(data: {
  userId: number;
  transferId?: number;
  recordType: string;
  recordValue: string;
  recordDescription?: string;
  badgeTier?: string;
  badgeName: string;
  badgeIcon?: string;
  recognitionNote?: string;
  featured?: boolean;
}) {
  return getDb().insert(goldenBookEntries).values({
    userId: data.userId,
    transferId: data.transferId,
    recordType: data.recordType as any,
    recordValue: data.recordValue,
    recordDescription: data.recordDescription,
    badgeTier: data.badgeTier as any,
    badgeName: data.badgeName,
    badgeIcon: data.badgeIcon,
    recognitionNote: data.recognitionNote,
    featured: data.featured,
  }).$returningId();
}

export async function getGoldenBookEntries() {
  return getDb().select().from(goldenBookEntries)
    .orderBy(desc(goldenBookEntries.createdAt))
    .limit(50);
}

export async function getFeaturedEntries() {
  return getDb().select().from(goldenBookEntries)
    .where(eq(goldenBookEntries.featured, true))
    .orderBy(desc(goldenBookEntries.createdAt));
}

// ═══════════════════════════════════════════════════════════
// 4. FAMILY POOL
// ═══════════════════════════════════════════════════════════

export async function createFamilyPool(data: {
  name: string;
  creatorId: number;
  currency?: string;
  monthlyGoal?: string;
  autoSplitEnabled?: boolean;
  autoSplitPercent?: string;
}) {
  const db = getDb();
  const [pool] = await db.insert(familyPools).values({
    name: data.name,
    creatorId: data.creatorId,
    currency: data.currency || "MKD",
    monthlyGoal: data.monthlyGoal,
    autoSplitEnabled: data.autoSplitEnabled || false,
    autoSplitPercent: data.autoSplitPercent || "50",
  }).$returningId();

  // Add creator as owner
  await db.insert(familyPoolMembers).values({
    poolId: pool.id,
    userId: data.creatorId,
    role: "owner",
    nickname: "Сопственик",
  });

  return pool;
}

export async function addFamilyMember(data: {
  poolId: number;
  userId: number;
  role?: string;
  nickname?: string;
  withdrawLimit?: string;
}) {
  return getDb().insert(familyPoolMembers).values({
    poolId: data.poolId,
    userId: data.userId,
    role: data.role as any,
    nickname: data.nickname,
    withdrawLimit: data.withdrawLimit,
  }).$returningId();
}

export async function getFamilyPoolsByUser(userId: number) {
  return getDb().select().from(familyPools)
    .where(eq(familyPools.creatorId, userId))
    .orderBy(desc(familyPools.createdAt));
}

export async function getPoolMembers(poolId: number) {
  return getDb().select().from(familyPoolMembers)
    .where(eq(familyPoolMembers.poolId, poolId));
}

// ═══════════════════════════════════════════════════════════
// 5. VIDEO MESSAGES
// ═══════════════════════════════════════════════════════════

export async function createVideoMessage(data: {
  transferId: number;
  senderId: number;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  textMessage?: string;
  language?: string;
}) {
  return getDb().insert(videoMessages).values({
    transferId: data.transferId,
    senderId: data.senderId,
    videoUrl: data.videoUrl,
    thumbnailUrl: data.thumbnailUrl,
    durationSeconds: data.durationSeconds,
    textMessage: data.textMessage,
    language: data.language || "mk",
    status: "ready",
  }).$returningId();
}

export async function getVideoByTransfer(transferId: number) {
  return getDb().query.videoMessages.findFirst({
    where: eq(videoMessages.transferId, transferId),
  });
}

// ═══════════════════════════════════════════════════════════
// 6. EMERGENCY CASH
// ═══════════════════════════════════════════════════════════

export async function createEmergencyRequest(data: {
  transferId: number;
  userId: number;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryCountry: string;
  recipientPhone: string;
  deliveryInstructions?: string;
  amount: string;
  currency?: string;
  promisedMinutes?: number;
}) {
  return getDb().insert(emergencyRequests).values({
    transferId: data.transferId,
    userId: data.userId,
    deliveryAddress: data.deliveryAddress,
    deliveryCity: data.deliveryCity,
    deliveryCountry: data.deliveryCountry,
    recipientPhone: data.recipientPhone,
    deliveryInstructions: data.deliveryInstructions,
    amount: data.amount,
    currency: data.currency || "MKD",
    promisedMinutes: data.promisedMinutes || 30,
    status: "searching_agent",
  }).$returningId();
}

export async function getEmergencyRequests() {
  return getDb().select().from(emergencyRequests)
    .orderBy(desc(emergencyRequests.requestedAt))
    .limit(50);
}

export async function assignAgent(id: number, agentName: string, agentPhone: string) {
  return getDb().update(emergencyRequests)
    .set({
      agentName,
      agentPhone,
      status: "agent_assigned",
    })
    .where(eq(emergencyRequests.id, id));
}

export async function updateEmergencyStatus(id: number, status: string) {
  return getDb().update(emergencyRequests)
    .set({
      status: status as any,
      deliveredAt: status === "delivered" ? new Date() : undefined,
    })
    .where(eq(emergencyRequests.id, id));
}

// ═══════════════════════════════════════════════════════════
// 7. AI NEGOTIATOR
// ═══════════════════════════════════════════════════════════

export async function createNegotiationBid(data: {
  transferId?: number;
  userId: number;
  bankName: string;
  bankCountry?: string;
  originalRate: string;
  negotiatedRate: string;
  savingsPercent?: string;
  savingsAmount?: string;
  negotiatingAgent: string;
  agentStrategy?: string;
  negotiationLog?: string;
  roundsCount?: number;
  accepted?: boolean;
}) {
  return getDb().insert(negotiationBids).values({
    transferId: data.transferId,
    userId: data.userId,
    bankName: data.bankName,
    bankCountry: data.bankCountry,
    originalRate: data.originalRate,
    negotiatedRate: data.negotiatedRate,
    savingsPercent: data.savingsPercent,
    savingsAmount: data.savingsAmount,
    negotiatingAgent: data.negotiatingAgent as any,
    agentStrategy: data.agentStrategy,
    negotiationLog: data.negotiationLog,
    roundsCount: data.roundsCount || 1,
    accepted: data.accepted || false,
  }).$returningId();
}

export async function getNegotiationBids(userId: number) {
  return getDb().select().from(negotiationBids)
    .where(eq(negotiationBids.userId, userId))
    .orderBy(desc(negotiationBids.createdAt));
}

export async function acceptBid(id: number) {
  return getDb().update(negotiationBids)
    .set({ accepted: true, completedAt: new Date() })
    .where(eq(negotiationBids.id, id));
}

// Simulate AI negotiation
export function simulateNegotiation(originalRate: number, bankName: string, agent: string) {
  const savingsPct = Math.random() * 1.5 + 0.1; // 0.1% to 1.5% savings
  const negotiatedRate = originalRate * (1 + savingsPct / 100);
  const savingsAmount = (savingsPct / 100) * 100000; // Example on 100k MKD

  const strategies: Record<string, string[]> = {
    kimi: [
      "Kimi ги анализираше competitor цените и го притисна банката со споредба.",
      "Користејќи емпатска анализа, Kimi го убеди агентот да даде попуст.",
      "Kimi претстави долгорочна партнерска стратегија за подобар договор.",
    ],
    gpt: [
      "GPT изврши комплексна анализа на пазарните трендови и идентификуваше слаба точка.",
      "GPT претстави математички модел што ја докажува заштедата за банката.",
      "GPT креираше персонализирана понуда базирана на историјата на трансакции.",
    ],
    harvey: [
      "Harvey го цитираше законот за еднаков третман и регулација на провизии.",
      "Harvey претстави правен аргумент за транспарентност на курсевите.",
      "Harvey закани со поднесување на претставка до НБРМ.",
    ],
    claude: [
      "Claude детектираше неправилност во курсот според НБРМ листата.",
      "Claude пресмета дека банката заработува 3.2% маржа и побара попуст.",
      "Claude искористи real-time податоци од 12 извори за докажување на поправилноста.",
    ],
  };

  const agentStrats = strategies[agent] || strategies.kimi;

  return {
    originalRate: originalRate.toFixed(6),
    negotiatedRate: negotiatedRate.toFixed(6),
    savingsPercent: savingsPct.toFixed(2),
    savingsAmount: savingsAmount.toFixed(2),
    agentStrategy: agentStrats[Math.floor(Math.random() * agentStrats.length)],
    negotiationLog: `${agent.toUpperCase()}: "Почнувам преговори со ${bankName}..."\n${bankName}: "Нашата стапка е фиксна."\n${agent.toUpperCase()}: "Анализиравме пазарот - competitor X нуди подобар курс."\n${bankName}: "Можеме да понудиме мал попуст."\n${agent.toUpperCase()}: "Прифаќам, но очекувам идна соработка со подобри услови."`,
    roundsCount: Math.floor(Math.random() * 4) + 2,
  };
}
