import { getDb } from "../queries/connection";
import { transfers, recipients, exchangeRates, supportedCountries, transactionLogs } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

// ===================== TRANSFER QUERIES =====================

export async function findTransfersByUser(userId: number, limit = 50, offset = 0) {
  return getDb().query.transfers.findMany({
    where: eq(transfers.userId, userId),
    with: {
      recipient: true,
    },
    orderBy: [desc(transfers.createdAt)],
    limit,
    offset,
  });
}

export async function findTransferById(id: number) {
  return getDb().query.transfers.findFirst({
    where: eq(transfers.id, id),
    with: {
      recipient: true,
      logs: true,
    },
  });
}

export async function findTransferByReference(referenceNumber: string) {
  return getDb().query.transfers.findFirst({
    where: eq(transfers.referenceNumber, referenceNumber),
    with: {
      recipient: true,
      logs: true,
    },
  });
}

export async function createTransfer(data: {
  userId: number;
  recipientId: number;
  sendAmount: string;
  sendCurrency: string;
  receiveAmount: string;
  receiveCurrency: string;
  exchangeRate: string;
  fee: string;
  feePercentage: string;
  totalAmount: string;
  transferMethod: string;
  referenceNumber: string;
  notes?: string;
  estimatedDelivery?: string;
}) {
  const db = getDb();
  const result = await db.insert(transfers).values({
    userId: data.userId,
    recipientId: data.recipientId,
    sendAmount: data.sendAmount,
    sendCurrency: data.sendCurrency,
    receiveAmount: data.receiveAmount,
    receiveCurrency: data.receiveCurrency,
    exchangeRate: data.exchangeRate,
    fee: data.fee,
    feePercentage: data.feePercentage,
    totalAmount: data.totalAmount,
    transferMethod: data.transferMethod as any,
    referenceNumber: data.referenceNumber,
    notes: data.notes,
    estimatedDelivery: data.estimatedDelivery,
    status: "pending",
  }).$returningId();
  
  const transferId = result[0].id;
  
  // Create initial transaction log
  await db.insert(transactionLogs).values({
    transferId,
    eventType: "created",
    description: `Transfer created with reference ${data.referenceNumber}`,
  });
  
  return findTransferById(transferId);
}

export async function updateTransferStatus(
  id: number, 
  status: string, 
  description?: string
) {
  const db = getDb();
  await db.update(transfers)
    .set({ 
      status: status as any,
      completedAt: status === "completed" ? new Date() : undefined,
    })
    .where(eq(transfers.id, id));
  
  // Add transaction log
  await db.insert(transactionLogs).values({
    transferId: id,
    eventType: status as any,
    description: description || `Status updated to ${status}`,
  });
  
  return findTransferById(id);
}

export async function getTransferStats(userId: number) {
  const db = getDb();
  const userTransfers = await db.select()
    .from(transfers)
    .where(eq(transfers.userId, userId));
  
  const totalSent = userTransfers.reduce((sum, t) => sum + Number(t.totalAmount), 0);
  const totalCount = userTransfers.length;
  const completedCount = userTransfers.filter(t => t.status === "completed").length;
  const pendingCount = userTransfers.filter(t => t.status === "pending" || t.status === "processing").length;
  
  return {
    totalSent: totalSent.toFixed(2),
    totalCount,
    completedCount,
    pendingCount,
  };
}

// ===================== RECIPIENT QUERIES =====================

export async function findRecipientsByUser(userId: number) {
  return getDb().query.recipients.findMany({
    where: eq(recipients.userId, userId),
    orderBy: [desc(recipients.createdAt)],
  });
}

export async function findRecipientById(id: number) {
  return getDb().query.recipients.findFirst({
    where: eq(recipients.id, id),
  });
}

export async function createRecipient(data: {
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  country: string;
  city?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  preferredMethod?: string;
}) {
  const db = getDb();
  const result = await db.insert(recipients).values({
    userId: data.userId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    country: data.country,
    city: data.city,
    bankName: data.bankName,
    accountNumber: data.accountNumber,
    iban: data.iban,
    swiftCode: data.swiftCode,
    preferredMethod: data.preferredMethod as any,
  }).$returningId();
  
  return findRecipientById(result[0].id);
}

export async function updateRecipient(id: number, data: Partial<{
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  preferredMethod: "bank" | "cash" | "mobile" | "wallet";
}>) {
  await getDb().update(recipients)
    .set(data)
    .where(eq(recipients.id, id));
  
  return findRecipientById(id);
}

export async function deleteRecipient(id: number) {
  await getDb().delete(recipients).where(eq(recipients.id, id));
}

// ===================== EXCHANGE RATE QUERIES =====================

export async function findExchangeRate(fromCurrency: string, toCurrency: string) {
  return getDb().query.exchangeRates.findFirst({
    where: and(
      eq(exchangeRates.fromCurrency, fromCurrency),
      eq(exchangeRates.toCurrency, toCurrency),
      eq(exchangeRates.isActive, true)
    ),
  });
}

export async function findAllExchangeRates() {
  return getDb().select().from(exchangeRates).where(eq(exchangeRates.isActive, true));
}

export async function createOrUpdateExchangeRate(data: {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  source?: string;
}) {
  const existing = await findExchangeRate(data.fromCurrency, data.toCurrency);
  
  if (existing) {
    await getDb().update(exchangeRates)
      .set({ rate: data.rate, source: data.source || "manual" })
      .where(eq(exchangeRates.id, existing.id));
    return findExchangeRate(data.fromCurrency, data.toCurrency);
  }
  
  const result = await getDb().insert(exchangeRates).values({
    fromCurrency: data.fromCurrency,
    toCurrency: data.toCurrency,
    rate: data.rate,
    source: data.source || "manual",
  }).$returningId();
  
  return getDb().query.exchangeRates.findFirst({
    where: eq(exchangeRates.id, result[0].id),
  });
}

// ===================== COUNTRY QUERIES =====================

export async function findAllSupportedCountries() {
  return getDb().select().from(supportedCountries).where(eq(supportedCountries.isActive, true));
}

export async function findCountryByCode(code: string) {
  return getDb().query.supportedCountries.findFirst({
    where: eq(supportedCountries.code, code),
  });
}

// ===================== SEED DATA =====================

export async function seedExchangeRates() {
  // NBRSM Middle Exchange Rates (MKD as base currency)
  // Source: National Bank of the Republic of North Macedonia
  const commonRates = [
    // MKD base rates (NBRSM official middle rates)
    { from: "MKD", to: "EUR", rate: "0.01626" },   // 1 MKD = 0.01626 EUR (1 EUR = 61.50 MKD)
    { from: "MKD", to: "USD", rate: "0.01709" },   // 1 MKD = 0.01709 USD (1 USD = 58.50 MKD)
    { from: "MKD", to: "GBP", rate: "0.01399" },   // 1 MKD = 0.01399 GBP (1 GBP = 71.50 MKD)
    { from: "MKD", to: "CHF", rate: "0.01618" },   // 1 MKD = 0.01618 CHF (1 CHF = 61.80 MKD)
    { from: "MKD", to: "CAD", rate: "0.02393" },   // 1 MKD = 0.02393 CAD (1 CAD = 41.80 MKD)
    { from: "MKD", to: "AUD", rate: "0.02655" },   // 1 MKD = 0.02655 AUD (1 AUD = 37.67 MKD)
    { from: "MKD", to: "JPY", rate: "1.8872" },    // 1 MKD = 1.8872 JPY
    { from: "MKD", to: "CNY", rate: "0.1103" },    // 1 MKD = 0.1103 CNY
    { from: "MKD", to: "INR", rate: "1.2735" },    // 1 MKD = 1.2735 INR
    { from: "MKD", to: "BRL", rate: "0.0894" },    // 1 MKD = 0.0894 BRL
    { from: "MKD", to: "MXN", rate: "0.3442" },    // 1 MKD = 0.3442 MXN
    { from: "MKD", to: "ZAR", rate: "0.2534" },    // 1 MKD = 0.2534 ZAR
    { from: "MKD", to: "TRY", rate: "0.1482" },    // 1 MKD = 0.1482 TRY
    { from: "MKD", to: "RUB", rate: "1.2561" },    // 1 MKD = 1.2561 RUB
    { from: "MKD", to: "SEK", rate: "0.1693" },    // 1 MKD = 0.1693 SEK
    { from: "MKD", to: "NOK", rate: "0.1659" },    // 1 MKD = 0.1659 NOK
    { from: "MKD", to: "DKK", rate: "0.1211" },    // 1 MKD = 0.1211 DKK
    { from: "MKD", to: "PLN", rate: "0.0698" },    // 1 MKD = 0.0698 PLN
    { from: "MKD", to: "RSD", rate: "1.9050" },    // 1 MKD = 1.9050 RSD (Serbian Dinar)
    { from: "MKD", to: "ALL", rate: "1.5980" },    // 1 MKD = 1.5980 ALL (Albanian Lek)
    { from: "MKD", to: "BAM", rate: "0.03180" },   // 1 MKD = 0.03180 BAM
    // Reverse rates (to MKD)
    { from: "EUR", to: "MKD", rate: "61.5000" },
    { from: "USD", to: "MKD", rate: "58.5000" },
    { from: "GBP", to: "MKD", rate: "71.5000" },
    { from: "CHF", to: "MKD", rate: "61.8000" },
    { from: "CAD", to: "MKD", rate: "41.8000" },
    { from: "AUD", to: "MKD", rate: "37.6700" },
    { from: "JPY", to: "MKD", rate: "0.5299" },
    { from: "CNY", to: "MKD", rate: "9.0660" },
    { from: "INR", to: "MKD", rate: "0.7852" },
    { from: "BRL", to: "MKD", rate: "11.1900" },
    { from: "MXN", to: "MKD", rate: "2.9050" },
    { from: "ZAR", to: "MKD", rate: "3.9460" },
    { from: "TRY", to: "MKD", rate: "6.7480" },
    { from: "RUB", to: "MKD", rate: "0.7961" },
    { from: "SEK", to: "MKD", rate: "5.9060" },
    { from: "NOK", to: "MKD", rate: "6.0270" },
    { from: "DKK", to: "MKD", rate: "8.2580" },
    { from: "PLN", to: "MKD", rate: "14.3300" },
    { from: "RSD", to: "MKD", rate: "0.5249" },
    { from: "ALL", to: "MKD", rate: "0.6258" },
    { from: "BAM", to: "MKD", rate: "31.4500" },
    // Cross rates
    { from: "USD", to: "EUR", rate: "0.8500" },
    { from: "EUR", to: "USD", rate: "1.1800" },
    { from: "USD", to: "GBP", rate: "0.7300" },
    { from: "GBP", to: "USD", rate: "1.3700" },
    { from: "EUR", to: "GBP", rate: "0.8600" },
    { from: "GBP", to: "EUR", rate: "1.1600" },
  ];
  
  for (const rate of commonRates) {
    await createOrUpdateExchangeRate({
      fromCurrency: rate.from,
      toCurrency: rate.to,
      rate: rate.rate,
      source: "seed",
    });
  }
}

export async function seedCountries() {
  const db = getDb();
  const existing = await db.select().from(supportedCountries).limit(1);
  if (existing.length > 0) return;
  
  const countries = [
    { code: "US", name: "United States", currency: "USD", currencyName: "US Dollar", flag: "🇺🇸", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "GB", name: "United Kingdom", currency: "GBP", currencyName: "British Pound", flag: "🇬🇧", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "DE", name: "Germany", currency: "EUR", currencyName: "Euro", flag: "🇩🇪", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "FR", name: "France", currency: "EUR", currencyName: "Euro", flag: "🇫🇷", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "IT", name: "Italy", currency: "EUR", currencyName: "Euro", flag: "🇮🇹", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "ES", name: "Spain", currency: "EUR", currencyName: "Euro", flag: "🇪🇸", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "CA", name: "Canada", currency: "CAD", currencyName: "Canadian Dollar", flag: "🇨🇦", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "AU", name: "Australia", currency: "AUD", currencyName: "Australian Dollar", flag: "🇦🇺", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "JP", name: "Japan", currency: "JPY", currencyName: "Japanese Yen", flag: "🇯🇵", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "CN", name: "China", currency: "CNY", currencyName: "Chinese Yuan", flag: "🇨🇳", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "IN", name: "India", currency: "INR", currencyName: "Indian Rupee", flag: "🇮🇳", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "BR", name: "Brazil", currency: "BRL", currencyName: "Brazilian Real", flag: "🇧🇷", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "MX", name: "Mexico", currency: "MXN", currencyName: "Mexican Peso", flag: "🇲🇽", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "ZA", name: "South Africa", currency: "ZAR", currencyName: "South African Rand", flag: "🇿🇦", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "NG", name: "Nigeria", currency: "NGN", currencyName: "Nigerian Naira", flag: "🇳🇬", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "KE", name: "Kenya", currency: "KES", currencyName: "Kenyan Shilling", flag: "🇰🇪", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "PH", name: "Philippines", currency: "PHP", currencyName: "Philippine Peso", flag: "🇵🇭", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "ID", name: "Indonesia", currency: "IDR", currencyName: "Indonesian Rupiah", flag: "🇮🇩", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "TH", name: "Thailand", currency: "THB", currencyName: "Thai Baht", flag: "🇹🇭", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "KR", name: "South Korea", currency: "KRW", currencyName: "South Korean Won", flag: "🇰🇷", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "RU", name: "Russia", currency: "RUB", currencyName: "Russian Ruble", flag: "🇷🇺", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TR", name: "Turkey", currency: "TRY", currencyName: "Turkish Lira", flag: "🇹🇷", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "PL", name: "Poland", currency: "PLN", currencyName: "Polish Zloty", flag: "🇵🇱", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "SE", name: "Sweden", currency: "SEK", currencyName: "Swedish Krona", flag: "🇸🇪", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "NO", name: "Norway", currency: "NOK", currencyName: "Norwegian Krone", flag: "🇳🇴", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "DK", name: "Denmark", currency: "DKK", currencyName: "Danish Krone", flag: "🇩🇰", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "CH", name: "Switzerland", currency: "CHF", currencyName: "Swiss Franc", flag: "🇨🇭", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "NL", name: "Netherlands", currency: "EUR", currencyName: "Euro", flag: "🇳🇱", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "BE", name: "Belgium", currency: "EUR", currencyName: "Euro", flag: "🇧🇪", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "AT", name: "Austria", currency: "EUR", currencyName: "Euro", flag: "🇦🇹", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "PT", name: "Portugal", currency: "EUR", currencyName: "Euro", flag: "🇵🇹", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "GR", name: "Greece", currency: "EUR", currencyName: "Euro", flag: "🇬🇷", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "IE", name: "Ireland", currency: "EUR", currencyName: "Euro", flag: "🇮🇪", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "FI", name: "Finland", currency: "EUR", currencyName: "Euro", flag: "🇫🇮", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "NZ", name: "New Zealand", currency: "NZD", currencyName: "New Zealand Dollar", flag: "🇳🇿", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "SG", name: "Singapore", currency: "SGD", currencyName: "Singapore Dollar", flag: "🇸🇬", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "HK", name: "Hong Kong", currency: "HKD", currencyName: "Hong Kong Dollar", flag: "🇭🇰", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "MY", name: "Malaysia", currency: "MYR", currencyName: "Malaysian Ringgit", flag: "🇲🇾", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "VN", name: "Vietnam", currency: "VND", currencyName: "Vietnamese Dong", flag: "🇻🇳", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "PK", name: "Pakistan", currency: "PKR", currencyName: "Pakistani Rupee", flag: "🇵🇰", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "BD", name: "Bangladesh", currency: "BDT", currencyName: "Bangladeshi Taka", flag: "🇧🇩", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "EG", name: "Egypt", currency: "EGP", currencyName: "Egyptian Pound", flag: "🇪🇬", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "MA", name: "Morocco", currency: "MAD", currencyName: "Moroccan Dirham", flag: "🇲🇦", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GH", name: "Ghana", currency: "GHS", currencyName: "Ghanaian Cedi", flag: "🇬🇭", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "TZ", name: "Tanzania", currency: "TZS", currencyName: "Tanzanian Shilling", flag: "🇹🇿", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "UG", name: "Uganda", currency: "UGX", currencyName: "Ugandan Shilling", flag: "🇺🇬", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "RW", name: "Rwanda", currency: "RWF", currencyName: "Rwandan Franc", flag: "🇷🇼", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "ET", name: "Ethiopia", currency: "ETB", currencyName: "Ethiopian Birr", flag: "🇪🇹", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CO", name: "Colombia", currency: "COP", currencyName: "Colombian Peso", flag: "🇨🇴", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "PE", name: "Peru", currency: "PEN", currencyName: "Peruvian Sol", flag: "🇵🇪", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "CL", name: "Chile", currency: "CLP", currencyName: "Chilean Peso", flag: "🇨🇱", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "AR", name: "Argentina", currency: "ARS", currencyName: "Argentine Peso", flag: "🇦🇷", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "UY", name: "Uruguay", currency: "UYU", currencyName: "Uruguayan Peso", flag: "🇺🇾", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "UA", name: "Ukraine", currency: "UAH", currencyName: "Ukrainian Hryvnia", flag: "🇺🇦", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "RO", name: "Romania", currency: "RON", currencyName: "Romanian Leu", flag: "🇷🇴", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "CZ", name: "Czech Republic", currency: "CZK", currencyName: "Czech Koruna", flag: "🇨🇿", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "HU", name: "Hungary", currency: "HUF", currencyName: "Hungarian Forint", flag: "🇭🇺", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "BG", name: "Bulgaria", currency: "BGN", currencyName: "Bulgarian Lev", flag: "🇧🇬", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "HR", name: "Croatia", currency: "EUR", currencyName: "Euro", flag: "🇭🇷", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "SI", name: "Slovenia", currency: "EUR", currencyName: "Euro", flag: "🇸🇮", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "SK", name: "Slovakia", currency: "EUR", currencyName: "Euro", flag: "🇸🇰", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "LT", name: "Lithuania", currency: "EUR", currencyName: "Euro", flag: "🇱🇹", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "LV", name: "Latvia", currency: "EUR", currencyName: "Euro", flag: "🇱🇻", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "EE", name: "Estonia", currency: "EUR", currencyName: "Euro", flag: "🇪🇪", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "IS", name: "Iceland", currency: "ISK", currencyName: "Icelandic Krona", flag: "🇮🇸", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "MT", name: "Malta", currency: "EUR", currencyName: "Euro", flag: "🇲🇹", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "CY", name: "Cyprus", currency: "EUR", currencyName: "Euro", flag: "🇨🇾", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "LU", name: "Luxembourg", currency: "EUR", currencyName: "Euro", flag: "🇱🇺", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "MK", name: "North Macedonia", currency: "MKD", currencyName: "Macedonian Denar", flag: "🇲🇰", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AL", name: "Albania", currency: "ALL", currencyName: "Albanian Lek", flag: "🇦🇱", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "RS", name: "Serbia", currency: "RSD", currencyName: "Serbian Dinar", flag: "🇷🇸", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "ME", name: "Montenegro", currency: "EUR", currencyName: "Euro", flag: "🇲🇪", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BA", name: "Bosnia and Herzegovina", currency: "BAM", currencyName: "Bosnia Convertible Mark", flag: "🇧🇦", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GE", name: "Georgia", currency: "GEL", currencyName: "Georgian Lari", flag: "🇬🇪", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AM", name: "Armenia", currency: "AMD", currencyName: "Armenian Dram", flag: "🇦🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AZ", name: "Azerbaijan", currency: "AZN", currencyName: "Azerbaijani Manat", flag: "🇦🇿", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "KZ", name: "Kazakhstan", currency: "KZT", currencyName: "Kazakhstani Tenge", flag: "🇰🇿", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "UZ", name: "Uzbekistan", currency: "UZS", currencyName: "Uzbekistani Som", flag: "🇺🇿", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "KG", name: "Kyrgyzstan", currency: "KGS", currencyName: "Kyrgystani Som", flag: "🇰🇬", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TJ", name: "Tajikistan", currency: "TJS", currencyName: "Tajikistani Somoni", flag: "🇹🇯", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TM", name: "Turkmenistan", currency: "TMT", currencyName: "Turkmenistani Manat", flag: "🇹🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MN", name: "Mongolia", currency: "MNT", currencyName: "Mongolian Tugrik", flag: "🇲🇳", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "NP", name: "Nepal", currency: "NPR", currencyName: "Nepalese Rupee", flag: "🇳🇵", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "LK", name: "Sri Lanka", currency: "LKR", currencyName: "Sri Lankan Rupee", flag: "🇱🇰", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "MM", name: "Myanmar", currency: "MMK", currencyName: "Myanmar Kyat", flag: "🇲🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "KH", name: "Cambodia", currency: "KHR", currencyName: "Cambodian Riel", flag: "🇰🇭", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "LA", name: "Laos", currency: "LAK", currencyName: "Lao Kip", flag: "🇱🇦", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BT", name: "Bhutan", currency: "BTN", currencyName: "Bhutanese Ngultrum", flag: "🇧🇹", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MV", name: "Maldives", currency: "MVR", currencyName: "Maldivian Rufiyaa", flag: "🇲🇻", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AF", name: "Afghanistan", currency: "AFN", currencyName: "Afghan Afghani", flag: "🇦🇫", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "IQ", name: "Iraq", currency: "IQD", currencyName: "Iraqi Dinar", flag: "🇮🇶", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "JO", name: "Jordan", currency: "JOD", currencyName: "Jordanian Dinar", flag: "🇯🇴", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "LB", name: "Lebanon", currency: "LBP", currencyName: "Lebanese Pound", flag: "🇱🇧", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SY", name: "Syria", currency: "SYP", currencyName: "Syrian Pound", flag: "🇸🇾", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "YE", name: "Yemen", currency: "YER", currencyName: "Yemeni Rial", flag: "🇾🇪", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "OM", name: "Oman", currency: "OMR", currencyName: "Omani Rial", flag: "🇴🇲", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "QA", name: "Qatar", currency: "QAR", currencyName: "Qatari Rial", flag: "🇶🇦", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "BH", name: "Bahrain", currency: "BHD", currencyName: "Bahraini Dinar", flag: "🇧🇭", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "KW", name: "Kuwait", currency: "KWD", currencyName: "Kuwaiti Dinar", flag: "🇰🇼", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "SA", name: "Saudi Arabia", currency: "SAR", currencyName: "Saudi Riyal", flag: "🇸🇦", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "AE", name: "United Arab Emirates", currency: "AED", currencyName: "UAE Dirham", flag: "🇦🇪", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "IL", name: "Israel", currency: "ILS", currencyName: "Israeli Shekel", flag: "🇮🇱", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "PS", name: "Palestine", currency: "ILS", currencyName: "Israeli Shekel", flag: "🇵🇸", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TN", name: "Tunisia", currency: "TND", currencyName: "Tunisian Dinar", flag: "🇹🇳", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "DZ", name: "Algeria", currency: "DZD", currencyName: "Algerian Dinar", flag: "🇩🇿", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "LY", name: "Libya", currency: "LYD", currencyName: "Libyan Dinar", flag: "🇱🇾", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SD", name: "Sudan", currency: "SDG", currencyName: "Sudanese Pound", flag: "🇸🇩", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SS", name: "South Sudan", currency: "SSP", currencyName: "South Sudanese Pound", flag: "🇸🇸", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "ER", name: "Eritrea", currency: "ERN", currencyName: "Eritrean Nakfa", flag: "🇪🇷", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "DJ", name: "Djibouti", currency: "DJF", currencyName: "Djiboutian Franc", flag: "🇩🇯", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SO", name: "Somalia", currency: "SOS", currencyName: "Somali Shilling", flag: "🇸🇴", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MR", name: "Mauritania", currency: "MRU", currencyName: "Mauritanian Ouguiya", flag: "🇲🇷", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "ML", name: "Mali", currency: "XOF", currencyName: "West African CFA Franc", flag: "🇲🇱", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SN", name: "Senegal", currency: "XOF", currencyName: "West African CFA Franc", flag: "🇸🇳", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GM", name: "Gambia", currency: "GMD", currencyName: "Gambian Dalasi", flag: "🇬🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GW", name: "Guinea-Bissau", currency: "XOF", currencyName: "West African CFA Franc", flag: "🇬🇼", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GN", name: "Guinea", currency: "GNF", currencyName: "Guinean Franc", flag: "🇬🇳", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SL", name: "Sierra Leone", currency: "SLL", currencyName: "Sierra Leonean Leone", flag: "🇸🇱", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "LR", name: "Liberia", currency: "LRD", currencyName: "Liberian Dollar", flag: "🇱🇷", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CI", name: "Cote d'Ivoire", currency: "XOF", currencyName: "West African CFA Franc", flag: "🇨🇮", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BF", name: "Burkina Faso", currency: "XOF", currencyName: "West African CFA Franc", flag: "🇧🇫", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "NE", name: "Niger", currency: "XOF", currencyName: "West African CFA Franc", flag: "🇳🇪", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TG", name: "Togo", currency: "XOF", currencyName: "West African CFA Franc", flag: "🇹🇬", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BJ", name: "Benin", currency: "XOF", currencyName: "West African CFA Franc", flag: "🇧🇯", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CM", name: "Cameroon", currency: "XAF", currencyName: "Central African CFA Franc", flag: "🇨🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CF", name: "Central African Republic", currency: "XAF", currencyName: "Central African CFA Franc", flag: "🇨🇫", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TD", name: "Chad", currency: "XAF", currencyName: "Central African CFA Franc", flag: "🇹🇩", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CG", name: "Congo", currency: "XAF", currencyName: "Central African CFA Franc", flag: "🇨🇬", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GA", name: "Gabon", currency: "XAF", currencyName: "Central African CFA Franc", flag: "🇬🇦", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GQ", name: "Equatorial Guinea", currency: "XAF", currencyName: "Central African CFA Franc", flag: "🇬🇶", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AO", name: "Angola", currency: "AOA", currencyName: "Angolan Kwanza", flag: "🇦🇴", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CD", name: "DR Congo", currency: "CDF", currencyName: "Congolese Franc", flag: "🇨🇩", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BI", name: "Burundi", currency: "BIF", currencyName: "Burundian Franc", flag: "🇧🇮", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MZ", name: "Mozambique", currency: "MZN", currencyName: "Mozambican Metical", flag: "🇲🇿", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "ZM", name: "Zambia", currency: "ZMW", currencyName: "Zambian Kwacha", flag: "🇿🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MW", name: "Malawi", currency: "MWK", currencyName: "Malawian Kwacha", flag: "🇲🇼", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "ZW", name: "Zimbabwe", currency: "ZWL", currencyName: "Zimbabwean Dollar", flag: "🇿🇼", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BW", name: "Botswana", currency: "BWP", currencyName: "Botswana Pula", flag: "🇧🇼", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SZ", name: "Eswatini", currency: "SZL", currencyName: "Swazi Lilangeni", flag: "🇸🇿", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "LS", name: "Lesotho", currency: "LSL", currencyName: "Lesotho Loti", flag: "🇱🇸", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "NA", name: "Namibia", currency: "NAD", currencyName: "Namibian Dollar", flag: "🇳🇦", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MG", name: "Madagascar", currency: "MGA", currencyName: "Malagasy Ariary", flag: "🇲🇬", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MU", name: "Mauritius", currency: "MUR", currencyName: "Mauritian Rupee", flag: "🇲🇺", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "SC", name: "Seychelles", currency: "SCR", currencyName: "Seychellois Rupee", flag: "🇸🇨", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "KM", name: "Comoros", currency: "KMF", currencyName: "Comorian Franc", flag: "🇰🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CV", name: "Cape Verde", currency: "CVE", currencyName: "Cape Verdean Escudo", flag: "🇨🇻", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "ST", name: "Sao Tome and Principe", currency: "STN", currencyName: "Sao Tome Dobra", flag: "🇸🇹", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CR", name: "Costa Rica", currency: "CRC", currencyName: "Costa Rican Colon", flag: "🇨🇷", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "PA", name: "Panama", currency: "PAB", currencyName: "Panamanian Balboa", flag: "🇵🇦", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "GT", name: "Guatemala", currency: "GTQ", currencyName: "Guatemalan Quetzal", flag: "🇬🇹", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "HN", name: "Honduras", currency: "HNL", currencyName: "Honduran Lempira", flag: "🇭🇳", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "SV", name: "El Salvador", currency: "USD", currencyName: "US Dollar", flag: "🇸🇻", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "NI", name: "Nicaragua", currency: "NIO", currencyName: "Nicaraguan Cordoba", flag: "🇳🇮", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BZ", name: "Belize", currency: "BZD", currencyName: "Belize Dollar", flag: "🇧🇿", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "JM", name: "Jamaica", currency: "JMD", currencyName: "Jamaican Dollar", flag: "🇯🇲", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "HT", name: "Haiti", currency: "HTG", currencyName: "Haitian Gourde", flag: "🇭🇹", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "DO", name: "Dominican Republic", currency: "DOP", currencyName: "Dominican Peso", flag: "🇩🇴", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "CU", name: "Cuba", currency: "CUP", currencyName: "Cuban Peso", flag: "🇨🇺", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BS", name: "Bahamas", currency: "BSD", currencyName: "Bahamian Dollar", flag: "🇧🇸", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "BB", name: "Barbados", currency: "BBD", currencyName: "Barbadian Dollar", flag: "🇧🇧", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "TT", name: "Trinidad and Tobago", currency: "TTD", currencyName: "Trinidad Dollar", flag: "🇹🇹", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "GD", name: "Grenada", currency: "XCD", currencyName: "East Caribbean Dollar", flag: "🇬🇩", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "LC", name: "Saint Lucia", currency: "XCD", currencyName: "East Caribbean Dollar", flag: "🇱🇨", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "VC", name: "Saint Vincent", currency: "XCD", currencyName: "East Caribbean Dollar", flag: "🇻🇨", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AG", name: "Antigua and Barbuda", currency: "XCD", currencyName: "East Caribbean Dollar", flag: "🇦🇬", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "DM", name: "Dominica", currency: "XCD", currencyName: "East Caribbean Dollar", flag: "🇩🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "KN", name: "Saint Kitts", currency: "XCD", currencyName: "East Caribbean Dollar", flag: "🇰🇳", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GY", name: "Guyana", currency: "GYD", currencyName: "Guyanese Dollar", flag: "🇬🇾", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SR", name: "Suriname", currency: "SRD", currencyName: "Surinamese Dollar", flag: "🇸🇷", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "PY", name: "Paraguay", currency: "PYG", currencyName: "Paraguayan Guarani", flag: "🇵🇾", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BO", name: "Bolivia", currency: "BOB", currencyName: "Bolivian Boliviano", flag: "🇧🇴", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "EC", name: "Ecuador", currency: "USD", currencyName: "US Dollar", flag: "🇪🇨", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "VE", name: "Venezuela", currency: "VES", currencyName: "Venezuelan Bolivar", flag: "🇻🇪", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GF", name: "French Guiana", currency: "EUR", currencyName: "Euro", flag: "🇬🇫", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MQ", name: "Martinique", currency: "EUR", currencyName: "Euro", flag: "🇲🇶", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GP", name: "Guadeloupe", currency: "EUR", currencyName: "Euro", flag: "🇬🇵", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "RE", name: "Reunion", currency: "EUR", currencyName: "Euro", flag: "🇷🇪", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "YT", name: "Mayotte", currency: "EUR", currencyName: "Euro", flag: "🇾🇹", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "PF", name: "French Polynesia", currency: "XPF", currencyName: "CFP Franc", flag: "🇵🇫", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "NC", name: "New Caledonia", currency: "XPF", currencyName: "CFP Franc", flag: "🇳🇨", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "WF", name: "Wallis and Futuna", currency: "XPF", currencyName: "CFP Franc", flag: "🇼🇫", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AS", name: "American Samoa", currency: "USD", currencyName: "US Dollar", flag: "🇦🇸", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GU", name: "Guam", currency: "USD", currencyName: "US Dollar", flag: "🇬🇺", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MP", name: "Northern Mariana Islands", currency: "USD", currencyName: "US Dollar", flag: "🇲🇵", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "PR", name: "Puerto Rico", currency: "USD", currencyName: "US Dollar", flag: "🇵🇷", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "VI", name: "US Virgin Islands", currency: "USD", currencyName: "US Dollar", flag: "🇻🇮", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "KY", name: "Cayman Islands", currency: "KYD", currencyName: "Cayman Dollar", flag: "🇰🇾", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BM", name: "Bermuda", currency: "BMD", currencyName: "Bermudian Dollar", flag: "🇧🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AI", name: "Anguilla", currency: "XCD", currencyName: "East Caribbean Dollar", flag: "🇦🇮", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MS", name: "Montserrat", currency: "XCD", currencyName: "East Caribbean Dollar", flag: "🇲🇸", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TC", name: "Turks and Caicos", currency: "USD", currencyName: "US Dollar", flag: "🇹🇨", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "FK", name: "Falkland Islands", currency: "FKP", currencyName: "Falkland Pound", flag: "🇫🇰", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GI", name: "Gibraltar", currency: "GIP", currencyName: "Gibraltar Pound", flag: "🇬🇮", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "FO", name: "Faroe Islands", currency: "DKK", currencyName: "Danish Krone", flag: "🇫🇴", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GL", name: "Greenland", currency: "DKK", currencyName: "Danish Krone", flag: "🇬🇱", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AX", name: "Aland Islands", currency: "EUR", currencyName: "Euro", flag: "🇦🇽", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SJ", name: "Svalbard", currency: "NOK", currencyName: "Norwegian Krone", flag: "🇸🇯", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AD", name: "Andorra", currency: "EUR", currencyName: "Euro", flag: "🇦🇩", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MC", name: "Monaco", currency: "EUR", currencyName: "Euro", flag: "🇲🇨", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SM", name: "San Marino", currency: "EUR", currencyName: "Euro", flag: "🇸🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "VA", name: "Vatican", currency: "EUR", currencyName: "Euro", flag: "🇻🇦", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "LI", name: "Liechtenstein", currency: "CHF", currencyName: "Swiss Franc", flag: "🇱🇮", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "IM", name: "Isle of Man", currency: "GBP", currencyName: "British Pound", flag: "🇮🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "JE", name: "Jersey", currency: "GBP", currencyName: "British Pound", flag: "🇯🇪", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GG", name: "Guernsey", currency: "GBP", currencyName: "British Pound", flag: "🇬🇬", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "JE", name: "Jersey", currency: "GBP", currencyName: "British Pound", flag: "🇯🇪", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MO", name: "Macau", currency: "MOP", currencyName: "Macanese Pataca", flag: "🇲🇴", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "TW", name: "Taiwan", currency: "TWD", currencyName: "New Taiwan Dollar", flag: "🇹🇼", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "MO", name: "Macau", currency: "MOP", currencyName: "Macanese Pataca", flag: "🇲🇴", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "HK", name: "Hong Kong", currency: "HKD", currencyName: "Hong Kong Dollar", flag: "🇭🇰", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "BN", name: "Brunei", currency: "BND", currencyName: "Brunei Dollar", flag: "🇧🇳", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "BT", name: "Bhutan", currency: "BTN", currencyName: "Bhutanese Ngultrum", flag: "🇧🇹", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TL", name: "Timor-Leste", currency: "USD", currencyName: "US Dollar", flag: "🇹🇱", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "FM", name: "Micronesia", currency: "USD", currencyName: "US Dollar", flag: "🇫🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MH", name: "Marshall Islands", currency: "USD", currencyName: "US Dollar", flag: "🇲🇭", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "PW", name: "Palau", currency: "USD", currencyName: "US Dollar", flag: "🇵🇼", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "KI", name: "Kiribati", currency: "AUD", currencyName: "Australian Dollar", flag: "🇰🇮", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "NR", name: "Nauru", currency: "AUD", currencyName: "Australian Dollar", flag: "🇳🇷", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TV", name: "Tuvalu", currency: "AUD", currencyName: "Australian Dollar", flag: "🇹🇻", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TO", name: "Tonga", currency: "TOP", currencyName: "Tongan Pa'anga", flag: "🇹🇴", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "WS", name: "Samoa", currency: "WST", currencyName: "Samoan Tala", flag: "🇼🇸", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "FJ", name: "Fiji", currency: "FJD", currencyName: "Fijian Dollar", flag: "🇫🇯", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "SB", name: "Solomon Islands", currency: "SBD", currencyName: "Solomon Dollar", flag: "🇸🇧", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "VU", name: "Vanuatu", currency: "VUV", currencyName: "Vanuatu Vatu", flag: "🇻🇺", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "PG", name: "Papua New Guinea", currency: "PGK", currencyName: "Papua Kina", flag: "🇵🇬", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CK", name: "Cook Islands", currency: "NZD", currencyName: "New Zealand Dollar", flag: "🇨🇰", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "NU", name: "Niue", currency: "NZD", currencyName: "New Zealand Dollar", flag: "🇳🇺", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TK", name: "Tokelau", currency: "NZD", currencyName: "New Zealand Dollar", flag: "🇹🇰", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "WF", name: "Wallis and Futuna", currency: "XPF", currencyName: "CFP Franc", flag: "🇼🇫", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "PM", name: "Saint Pierre", currency: "EUR", currencyName: "Euro", flag: "🇵🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BL", name: "Saint Barthelemy", currency: "EUR", currencyName: "Euro", flag: "🇧🇱", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "MF", name: "Saint Martin", currency: "EUR", currencyName: "Euro", flag: "🇲🇫", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SX", name: "Sint Maarten", currency: "ANG", currencyName: "Netherlands Antillean Guilder", flag: "🇸🇽", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CW", name: "Curacao", currency: "ANG", currencyName: "Netherlands Antillean Guilder", flag: "🇨🇼", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "BQ", name: "Bonaire", currency: "USD", currencyName: "US Dollar", flag: "🇧🇶", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AW", name: "Aruba", currency: "AWG", currencyName: "Aruban Florin", flag: "🇦🇼", methodsAvailable: '["bank","cash","mobile","wallet"]' },
    { code: "SR", name: "Suriname", currency: "SRD", currencyName: "Surinamese Dollar", flag: "🇸🇷", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GY", name: "Guyana", currency: "GYD", currencyName: "Guyanese Dollar", flag: "🇬🇾", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "FK", name: "Falkland Islands", currency: "FKP", currencyName: "Falkland Pound", flag: "🇫🇰", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "GS", name: "South Georgia", currency: "GBP", currencyName: "British Pound", flag: "🇬🇸", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "SH", name: "Saint Helena", currency: "SHP", currencyName: "Saint Helena Pound", flag: "🇸🇭", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AC", name: "Ascension Island", currency: "SHP", currencyName: "Saint Helena Pound", flag: "🇦🇨", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "TA", name: "Tristan da Cunha", currency: "GBP", currencyName: "British Pound", flag: "🇹🇦", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "IO", name: "British Indian Ocean", currency: "USD", currencyName: "US Dollar", flag: "🇮🇴", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CC", name: "Cocos Islands", currency: "AUD", currencyName: "Australian Dollar", flag: "🇨🇨", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "CX", name: "Christmas Island", currency: "AUD", currencyName: "Australian Dollar", flag: "🇨🇽", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "NF", name: "Norfolk Island", currency: "AUD", currencyName: "Australian Dollar", flag: "🇳🇫", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "HM", name: "Heard Island", currency: "AUD", currencyName: "Australian Dollar", flag: "🇭🇲", methodsAvailable: '["bank","cash","mobile"]' },
    { code: "AQ", name: "Antarctica", currency: "USD", currencyName: "US Dollar", flag: "🇦🇶", methodsAvailable: '["bank","cash"]' },
  ];
  
  for (const country of countries) {
    await db.insert(supportedCountries).values(country).onDuplicateKeyUpdate({
      set: { name: country.name, currency: country.currency, flag: country.flag, methodsAvailable: country.methodsAvailable },
    });
  }
}
