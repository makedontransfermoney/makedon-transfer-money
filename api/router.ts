import { authRouter } from "./auth-router";
import { transferRouter } from "./transfer-router";
import { recipientRouter } from "./recipient-router";
import { exchangeRouter } from "./exchange-router";
import { commissionRouter, securityRouter, cryptoRouter, qrRouter } from "./commission-router";
import { fraudRouter } from "./fraud-router";
import { taxRouter } from "./tax-router";
import { uniqueRouter } from "./unique-router";
import { superToolsRouter } from "./super-tools-router";
import { pepRouter } from "./pep-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  transfer: transferRouter,
  recipient: recipientRouter,
  exchange: exchangeRouter,
  commission: commissionRouter,
  security: securityRouter,
  crypto: cryptoRouter,
  qr: qrRouter,
  fraud: fraudRouter,
  tax: taxRouter,
  unique: uniqueRouter,
  superTools: superToolsRouter,
  pep: pepRouter,
});

export type AppRouter = typeof appRouter;
