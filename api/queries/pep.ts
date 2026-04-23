import { getDb } from "./connection";
import { passiveEarningPartners } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ═══════════════════════════════════════════
// PASSIVE EARNING PARTNERS (PEP) QUERIES
// ═══════════════════════════════════════════

export async function getAllPartners(category?: string) {
  const db = getDb();
  if (category && category !== "all") {
    return db.select().from(passiveEarningPartners)
      .where(eq(passiveEarningPartners.category, category as any))
      .orderBy(desc(passiveEarningPartners.totalEarned));
  }
  return db.select().from(passiveEarningPartners)
    .orderBy(desc(passiveEarningPartners.totalEarned));
}

export async function getActivePartners() {
  return getDb().select().from(passiveEarningPartners)
    .where(eq(passiveEarningPartners.status, "active"))
    .orderBy(desc(passiveEarningPartners.totalEarned));
}

export async function getPartnerById(id: number) {
  const result = await getDb().select().from(passiveEarningPartners)
    .where(eq(passiveEarningPartners.id, id));
  return result[0] || null;
}

export async function createPartner(data: {
  name: string;
  category: string;
  website?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  earningPercent?: string;
  earningType?: string;
  description?: string;
  logoUrl?: string;
}) {
  return getDb().insert(passiveEarningPartners).values({
    name: data.name,
    category: data.category as any,
    website: data.website,
    email: data.email,
    phone: data.phone,
    country: data.country || "North Macedonia",
    city: data.city,
    earningPercent: data.earningPercent || "0.10",
    earningType: (data.earningType as any) || "per_transaction",
    description: data.description,
    logoUrl: data.logoUrl,
    status: "active",
  }).$returningId();
}

export async function updatePartnerEarnings(id: number, amount: string) {
  return getDb().update(passiveEarningPartners)
    .set({
      totalEarned: sql`${passiveEarningPartners.totalEarned} + ${amount}`,
      totalTransactions: sql`${passiveEarningPartners.totalTransactions} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(passiveEarningPartners.id, id));
}

export async function updatePartnerStatus(id: number, status: string) {
  return getDb().update(passiveEarningPartners)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(passiveEarningPartners.id, id));
}

export async function getNetworkStats() {
  const db = getDb();
  const all = await db.select().from(passiveEarningPartners);

  const totalPartners = all.length;
  const activePartners = all.filter(p => p.status === "active").length;
  const totalEarned = all.reduce((sum, p) => sum + Number(p.totalEarned), 0);
  const totalTransactions = all.reduce((sum, p) => sum + p.totalTransactions, 0);

  // By category
  const byCategory: Record<string, { count: number; earned: number }> = {};
  for (const p of all) {
    if (!byCategory[p.category]) byCategory[p.category] = { count: 0, earned: 0 };
    byCategory[p.category].count++;
    byCategory[p.category].earned += Number(p.totalEarned);
  }

  return { totalPartners, activePartners, totalEarned, totalTransactions, byCategory };
}

// Seed initial partners
export async function seedPartners() {
  const db = getDb();
  const existing = await db.select().from(passiveEarningPartners);
  if (existing.length > 0) return; // Already seeded

  const partners = [
    // БАНКИ
    { name: "Комерцијална Банка", category: "bank", website: "https://online.kb.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.15", earningType: "per_transaction", description: "Најголема банка во Македонија. Заработува од секоја трансакција преку нивната мрежа." },
    { name: "Стопанска Банка", category: "bank", website: "https://www.stb.com.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.12", earningType: "per_transaction", description: "Part of OTP Group. Посредник во меѓународни трансфери." },
    { name: "НЛБ Банка", category: "bank", website: "https://www.nlb.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.12", earningType: "per_transaction", description: "НЛБ Групација. Евро трансфери и кореспондентски сметки." },
    { name: "Халкбанк", category: "bank", website: "https://www.halkbank.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.10", earningType: "per_transaction", description: "Халкбанк АД Скопје. Турски лира трансфери." },
    { name: "ПроКредит Банка", category: "bank", website: "https://www.pcb.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.10", earningType: "per_transaction", description: "ПроКредит групација. Микро и средни трансфери." },
    { name: "Силк Роуд Банка", category: "bank", website: "https://www.srb.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.08", earningType: "per_transaction", description: "СРБ АД Скопје. Азиски пазар трансфери." },
    { name: "УниБанка", category: "bank", website: "https://www.unibank.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.08", earningType: "per_transaction", description: "УниБанка АД. Регионални трансфери." },
    { name: "Алта Банка", category: "bank", website: "https://altabanka.com.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.08", earningType: "per_transaction", description: "Алта Банка АД. Дигитални трансакции." },
    { name: "ТТК Банка", category: "bank", website: "https://www.ttk.com.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.08", earningType: "per_transaction", description: "ТТК Банка АД Скопје. Технолошки трансфери." },

    // ТЕЛЕКОМУНИКАЦИИ
    { name: "Македонски Телеком", category: "telecom", website: "https://www.telekom.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.05", earningType: "per_transaction", description: "Национален телеком. SMS/Мобилно потврдување на трансакции." },
    { name: "A1 Македонија", category: "telecom", website: "https://www.a1.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.05", earningType: "per_transaction", description: "A1 Македонија. Мобилен банкинг и потврди." },

    // ИНТЕРНЕТ ПРОВАЈДЕРИ
    { name: "Випонет (Вип)", category: "internet", website: "https://www.vip.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.03", earningType: "per_transaction", description: "Интернет инфраструктура за онлајн трансакции." },
    { name: "Телеком Интернет", category: "internet", website: "https://www.telekom.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.03", earningType: "per_transaction", description: "Fiber оптика и интернет конективитет." },
    { name: "А1 Интернет", category: "internet", website: "https://www.a1.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.03", earningType: "per_transaction", description: "A1 интернет услуги за платформата." },

    // ЈАВНИ ПРЕТПРИЈАТИЈА
    { name: "ЕВН Македонија", category: "utility", website: "https://www.evn.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.05", earningType: "revenue_share", description: "Електрична енергија. Плаќање на сметки преку платформата." },
    { name: "Водовод Скопје", category: "utility", website: "https://vodovod-skopje.com.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.05", earningType: "revenue_share", description: "Водоснабдување. Плаќање на водни сметки од дијаспора." },
    { name: "ЕСМ / Електрани", category: "utility", website: "https://esm.com.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.05", earningType: "revenue_share", description: "Електрани на Македонија. Енергетски трансфери." },
    { name: "Комунална Хигиена", category: "utility", website: "https://e.khigiena.com.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.03", earningType: "revenue_share", description: "Комунална такса и хигиена." },
    { name: "БЕГ (Топлификација)", category: "utility", website: "https://www.beg.com.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.05", earningType: "revenue_share", description: "Топлинска енергија и греење." },

    // ДРЖАВНИ ИНСТИТУЦИИ
    { name: "УЈП - Управа за Јавни Приходи", category: "government", website: "https://www.ujp.gov.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.10", earningType: "revenue_share", description: "Даночни приходи од трансакции. 1% провизија вклучува данок." },
    { name: "ФЗОМ - Фонд за Здравствено Осигурување", category: "government", website: "https://www.fzom.gov.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.05", earningType: "revenue_share", description: "Здравствено осигурување од трансфери." },
    { name: "ПИОМ - Пензиско Осигурување", category: "government", website: "https://www.piom.com.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.05", earningType: "revenue_share", description: "Пензиски придонеси од меѓународни трансфери." },
    { name: "Општина Скопје", category: "government", website: "https://skopje.gov.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.02", earningType: "revenue_share", description: "Локални такси и комуналии." },
    { name: "УВМК / Водовод и Канализација", category: "government", website: "https://e-portal.uvmk.gov.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.02", earningType: "revenue_share", description: "Водовод и канализација." },
    { name: "e-Услуги (eGov)", category: "government", website: "https://uslugi.gov.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.02", earningType: "revenue_share", description: "Електронски државни услуги." },

    // МЕЃУНАРОДНИ ИНСТИТУЦИИ
    { name: "ММФ - Меѓународен Монетарен Фонд", category: "international", website: "https://www.imf.org/", country: "USA", city: "Washington DC", earningPercent: "0.05", earningType: "hybrid", description: "Глобална финансиска стабилност и монетарна политика." },
    { name: "Светска Банка", category: "international", website: "https://www.worldbank.org/", country: "USA", city: "Washington DC", earningPercent: "0.05", earningType: "hybrid", description: "Развојни проекти и финансиска поддршка." },
    { name: "Европска Инвестициска Банка (ЕИБ)", category: "international", website: "https://www.eib.org/", country: "Luxembourg", city: "Luxembourg", earningPercent: "0.03", earningType: "hybrid", description: "ЕУ инвестициска политика." },
    { name: "ЕБОР - Европска Банка за Обнова", category: "international", website: "https://www.ebrd.com/", country: "UK", city: "London", earningPercent: "0.03", earningType: "hybrid", description: "Обнова и развој на регионот." },
    { name: "БИС - Банка за Меѓународни Порамнувања", category: "international", website: "https://www.bis.org/", country: "Switzerland", city: "Basel", earningPercent: "0.02", earningType: "hybrid", description: "Централна банка на централни банки." },

    // ПЛАТЕЖНИ СИСТЕМИ
    { name: "SWIFT", category: "payment", website: "https://www.swift.com/", country: "Belgium", city: "Brussels", earningPercent: "0.10", earningType: "per_transaction", description: "Меѓународна банкарска комуникација." },
    { name: "Visa", category: "payment", website: "https://www.visa.com/", country: "USA", city: "San Francisco", earningPercent: "0.08", earningType: "per_transaction", description: "Глобална платежна мрежа." },
    { name: "MasterCard", category: "payment", website: "https://www.mastercard.com/", country: "USA", city: "New York", earningPercent: "0.08", earningType: "per_transaction", description: "Глобална платежна мрежа." },
    { name: "Western Union", category: "payment", website: "https://www.westernunion.com/", country: "USA", city: "Denver", earningPercent: "0.05", earningType: "per_transaction", description: "Традиционални money transfer услуги." },
    { name: "MoneyGram", category: "payment", website: "https://www.moneygram.com/", country: "USA", city: "Dallas", earningPercent: "0.05", earningType: "per_transaction", description: "Глобални парични трансфери." },
    { name: "Wise (TransferWise)", category: "payment", website: "https://wise.com/", country: "UK", city: "London", earningPercent: "0.03", earningType: "per_transaction", description: "Дигитални трансфери." },

    // КРИПТО МРЕЖИ
    { name: "Bitcoin Network", category: "crypto", website: "https://bitcoin.org/", country: "Global", city: "Decentralized", earningPercent: "0.05", earningType: "per_transaction", description: "BTC трансакции на blockchain." },
    { name: "Ethereum Network", category: "crypto", website: "https://ethereum.org/", country: "Global", city: "Decentralized", earningPercent: "0.05", earningType: "per_transaction", description: "ETH и ERC-20 трансакции." },
    { name: "Tether (USDT)", category: "crypto", website: "https://tether.to/", country: "Global", city: "Decentralized", earningPercent: "0.03", earningType: "per_transaction", description: "Stablecoin трансакции." },
    { name: "Litecoin Network", category: "crypto", website: "https://litecoin.org/", country: "Global", city: "Decentralized", earningPercent: "0.03", earningType: "per_transaction", description: "LTC трансакции." },

    // РЕФЕРАЛ ПАРТНЕРИ
    { name: "Doc. Dr. Sande Smiljanov", category: "referral", website: "https://makedontransfer.mk/", country: "North Macedonia", city: "Skopje", earningPercent: "0.50", earningType: "revenue_share", description: "Innovator and Founder. 50% од секоја провизија." },
  ];

  for (const p of partners) {
    await db.insert(passiveEarningPartners).values(p as any);
  }
}
