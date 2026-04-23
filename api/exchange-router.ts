import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findExchangeRate,
  findAllExchangeRates,
  createOrUpdateExchangeRate,
  findAllSupportedCountries,
  findCountryByCode,
  seedExchangeRates,
  seedCountries,
} from "./queries/transfers";

export const exchangeRouter = createRouter({
  rate: publicQuery
    .input(z.object({ from: z.string().length(3), to: z.string().length(3) }))
    .query(({ input }) => findExchangeRate(input.from, input.to)),

  allRates: publicQuery.query(() => findAllExchangeRates()),

  createRate: publicQuery
    .input(z.object({
      fromCurrency: z.string().length(3),
      toCurrency: z.string().length(3),
      rate: z.string(),
      source: z.string().optional(),
    }))
    .mutation(({ input }) => createOrUpdateExchangeRate(input)),

  countries: publicQuery.query(() => findAllSupportedCountries()),

  countryByCode: publicQuery
    .input(z.object({ code: z.string().length(2) }))
    .query(({ input }) => findCountryByCode(input.code)),

  seed: publicQuery.query(async () => {
    await seedExchangeRates();
    await seedCountries();
    return { success: true };
  }),
});
