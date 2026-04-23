import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findTransfersByUser,
  findTransferById,
  findTransferByReference,
  createTransfer,
  updateTransferStatus,
  getTransferStats,
} from "./queries/transfers";

function generateReferenceNumber(): string {
  const prefix = "SDR";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const transferRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findTransfersByUser(ctx.user.id),
  ),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findTransferById(input.id)),

  byReference: authedQuery
    .input(z.object({ reference: z.string() }))
    .query(({ input }) => findTransferByReference(input.reference)),

  stats: authedQuery.query(({ ctx }) =>
    getTransferStats(ctx.user.id),
  ),

  create: authedQuery
    .input(z.object({
      recipientId: z.number(),
      sendAmount: z.string(),
      sendCurrency: z.string().length(3).default("USD"),
      receiveAmount: z.string(),
      receiveCurrency: z.string().length(3).default("EUR"),
      exchangeRate: z.string(),
      fee: z.string(),
      feePercentage: z.string().default("1.00"),
      totalAmount: z.string(),
      transferMethod: z.enum(["bank", "cash", "mobile", "wallet", "crypto"]).default("bank"),
      notes: z.string().optional(),
      estimatedDelivery: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      createTransfer({
        ...input,
        userId: ctx.user.id,
        referenceNumber: generateReferenceNumber(),
      }),
    ),

  updateStatus: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "processing", "completed", "failed", "cancelled", "refunded"]),
      description: z.string().optional(),
    }))
    .mutation(({ input }) =>
      updateTransferStatus(input.id, input.status, input.description),
    ),
});
