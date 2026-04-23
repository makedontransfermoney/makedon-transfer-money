import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findRecipientsByUser,
  findRecipientById,
  createRecipient,
  updateRecipient,
  deleteRecipient,
} from "./queries/transfers";

export const recipientRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findRecipientsByUser(ctx.user.id),
  ),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findRecipientById(input.id)),

  create: authedQuery
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      country: z.string().min(1),
      city: z.string().optional(),
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      iban: z.string().optional(),
      swiftCode: z.string().optional(),
      preferredMethod: z.enum(["bank", "cash", "mobile", "wallet"]).default("bank"),
    }))
    .mutation(({ ctx, input }) =>
      createRecipient({ ...input, userId: ctx.user.id }),
    ),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      country: z.string().min(1).optional(),
      city: z.string().optional(),
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      iban: z.string().optional(),
      swiftCode: z.string().optional(),
      preferredMethod: z.enum(["bank", "cash", "mobile", "wallet"]).optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateRecipient(id, data);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteRecipient(input.id)),
});
