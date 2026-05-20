// ============================================================================
// Amazon E-Commerce Analytics Dashboard - Mockup Data
// Deterministic 24-month dataset (Jan 2024 - Dec 2025)
// Based on Kaggle "Amazon E-Commerce" Dataset by sharmajicoder
// 1,000,000 transactions, 20 columns, 5 categories
// ============================================================================

// ============================================================================
// Interfaces (same as dashboard-data.ts)
// ============================================================================

export interface MonthlySummary {
  year: number;
  month: number;
  monthLabel: string;
  totalUsers: number;
  avgDAU: number;
  peakDAU: number;
  totalPageViews: number;
  totalPurchases: number;
  totalEvents: number;
  avgConversionRate: number;
  totalFavorites: number;
  totalCarts: number;
}

export interface DailyDataPoint {
  date: string;
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  dau: number;
  pageViews: number;
  favorites: number;
  carts: number;
  purchases: number;
  conversionRate: number;
  totalEvents: number;
}

export interface CategoryMonthlyData {
  year: number;
  month: number;
  monthLabel: string;
  category: string;
  views: number;
  favorites: number;
  carts: number;
  purchases: number;
  conversionRate: number;
}

export interface SegmentMonthlyData {
  year: number;
  month: number;
  monthLabel: string;
  segment: string;
  count: number;
  purchaseRate: number;
  avgEventsPerUser: number;
}

export interface RetentionMonthlyData {
  year: number;
  month: number;
  monthLabel: string;
  cohortSize: number;
  day1Retention: number;
  day3Retention: number;
  day7Retention: number;
  day14Retention: number;
  day30Retention: number;
}

export interface HourlyTrafficData {
  hour: number;
  avgPageViews: number;
  avgPurchases: number;
  peakDay: string;
}

// ============================================================================
// Amazon-Specific Interfaces
// ============================================================================

export interface AmazonStats {
  totalTransactions: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgRating: number;
  returnRate: number;
  totalCategories: number;
  totalSellers: number;
  topCategory: string;
  fastestGrowingCategory: string;
  avgShippingDays: number;
  totalCities: number;
  dateRange: { start: string; end: string };
}

export interface DeviceDistribution {
  device: string;
  percentage: number;
  sessions: number;
}

export interface PaymentDistribution {
  method: string;
  percentage: number;
  transactions: number;
}

export interface LocationData {
  city: string;
  percentage: number;
  orders: number;
  revenue: number;
}

// ============================================================================
// Seeded Random Number Generator (same algorithm as dashboard-data.ts)
// ============================================================================

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

function seededInt(seed: number, min: number, max: number): number {
  return Math.floor(seededRange(seed, min, max + 1));
}

// ============================================================================
// Constants
// ============================================================================

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Amazon categories (from Kaggle dataset)
const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Beauty & Health',
  'Home & Kitchen',
  'Sports & Outdoors',
];

// Category weights: Electronics highest revenue, Clothing highest volume
const CATEGORY_WEIGHTS: Record<string, number> = {
  'Electronics': 0.30,       // Highest revenue share
  'Clothing': 0.25,           // Highest volume share
  'Beauty & Health': 0.18,    // Highest growth rate
  'Home & Kitchen': 0.17,
  'Sports & Outdoors': 0.10,
};

// Category-specific conversion rates (Electronics is higher due to intent)
const CATEGORY_CONV_RATES: Record<string, [number, number]> = {
  'Electronics': [0.12, 0.18],
  'Clothing': [0.08, 0.14],
  'Beauty & Health': [0.10, 0.16],
  'Home & Kitchen': [0.09, 0.15],
  'Sports & Outdoors': [0.07, 0.13],
};

// Category growth multipliers (Beauty grows fastest)
const CATEGORY_GROWTH: Record<string, number> = {
  'Electronics': 1.10,
  'Clothing': 1.12,
  'Beauty & Health': 1.22,
  'Home & Kitchen': 1.08,
  'Sports & Outdoors': 1.15,
};

// Amazon device segments
const SEGMENTS = ['Mobile Users', 'Web Users', 'Tablet Users'];
const SEGMENT_WEIGHTS = [0.55, 0.35, 0.10];

// Purchase rates per segment (Web users convert better)
const SEGMENT_PURCHASE_RATES = [0.08, 0.14, 0.06];
const SEGMENT_AVG_EVENTS = [6, 10, 5];

// Seasonal multipliers — Amazon-specific events:
//   Prime Day (mid-July), Black Friday/Cyber Monday (Nov), Holiday (Dec)
const SEASONAL: Record<number, number> = {
  1: 0.72,  // Post-holiday slump
  2: 0.78,
  3: 0.88,
  4: 0.94,
  5: 1.00,
  6: 1.03,
  7: 1.22,  // Prime Day boost
  8: 1.02,
  9: 0.98,
  10: 1.05,
  11: 1.30, // Black Friday / Cyber Monday
  12: 1.38, // Holiday shopping
};

// Prime Day window: days 12-16 of July get extra boost
const PRIME_DAY_DAYS = [12, 13, 14, 15, 16];
// Black Friday: 4th Thursday of Nov (day varies, we approximate)
// Cyber Monday: Monday after Black Friday
const BLACK_FRIDAY_DAYS = [24, 25, 26, 27, 28];
const CYBER_MONDAY_DAYS = [29, 30];

// Category seasonal boost during holiday months
const CATEGORY_HOLIDAY_BOOST: Record<string, number> = {
  'Electronics': 1.45,     // Huge holiday electronics demand
  'Clothing': 1.30,
  'Beauty & Health': 1.25,
  'Home & Kitchen': 1.35,
  'Sports & Outdoors': 1.10,
};

// Amazon Prime Day category boost
const CATEGORY_PRIME_BOOST: Record<string, number> = {
  'Electronics': 1.40,
  'Clothing': 1.15,
  'Beauty & Health': 1.20,
  'Home & Kitchen': 1.30,
  'Sports & Outdoors': 1.10,
};

const HOURS_OF_DAY = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
];

// Amazon location data (top Indian cities from the dataset)
const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad',
];

const CITY_WEIGHTS = [0.22, 0.20, 0.14, 0.10, 0.08, 0.07, 0.06, 0.05, 0.04, 0.04];

// Payment methods from the dataset
const PAYMENT_METHODS = ['UPI', 'Card', 'COD'];
const PAYMENT_WEIGHTS = [0.45, 0.35, 0.20];

// ============================================================================
// Date Helpers
// ============================================================================

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function dateToSeed(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day;
}

function getMonthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

// ============================================================================
// Growth Function (15% over 24 months — slower than Taobao's 20%)
// ============================================================================

function getGrowthFactor(year: number, month: number): number {
  const monthsElapsed = (year - 2024) * 12 + (month - 1);
  return 1 + (monthsElapsed / 24) * 0.15;
}

// ============================================================================
// Amazon-Specific Event Multipliers
// ============================================================================

function getEventDayMultiplier(year: number, month: number, day: number): number {
  // Prime Day boost (July 12-16)
  if (month === 7 && PRIME_DAY_DAYS.includes(day)) {
    return 1.45;
  }
  // Black Friday boost (Nov 24-28)
  if (month === 11 && BLACK_FRIDAY_DAYS.includes(day)) {
    return 1.55;
  }
  // Cyber Monday boost (Nov 29-30)
  if (month === 11 && CYBER_MONDAY_DAYS.includes(day)) {
    return 1.40;
  }
  return 1.0;
}

// ============================================================================
// Generate Daily Data (730 points)
// ============================================================================

function generateDailyData(): DailyDataPoint[] {
  const data: DailyDataPoint[] = [];

  for (let year = 2024; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = getDaysInMonth(year, month);
      const growth = getGrowthFactor(year, month);
      const seasonal = SEASONAL[month];

      for (let day = 1; day <= daysInMonth; day++) {
        const seed = dateToSeed(year, month, day);
        const dayOfWeek = new Date(year, month - 1, day).getDay();

        // Weekend boost (Sat=6, Sun=0)
        const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.15 : 1.0;
        // Mid-week dip (Tue/Wed)
        const midweekFactor = dayOfWeek === 2 || dayOfWeek === 3 ? 0.94 : 1.0;
        // Event-specific boost (Prime Day, Black Friday, etc.)
        const eventMultiplier = getEventDayMultiplier(year, month, day);

        // Base DAU ~18,000 for Amazon (bigger platform)
        const baseDAU = 18000;
        const dailyNoise = 0.87 + seededRandom(seed) * 0.26;
        const dau = Math.round(
          baseDAU * growth * seasonal * weekendBoost * midweekFactor * eventMultiplier * dailyNoise
        );

        // Amazon users browse more (higher pageViews per session)
        const basePVPerUser = 10 + seededRandom(seed + 1) * 5;
        const pageViews = Math.round(dau * basePVPerUser);

        // Wishlist rate (favorites = Amazon wishlists)
        const wishRate = 0.025 + seededRandom(seed + 2) * 0.015;
        const favorites = Math.round(pageViews * wishRate);

        // Add-to-cart rate
        const cartRate = 0.07 + seededRandom(seed + 3) * 0.04;
        const carts = Math.round(pageViews * cartRate);

        // Conversion rate: purchases / pageViews
        const convImprovement = (year - 2024) * 12 + (month - 1);
        const baseConvRate = 0.08 + (convImprovement / 24) * 0.04 + (seededRandom(seed + 4) * 0.025 - 0.0125);
        const purchases = Math.round(pageViews * baseConvRate);
        const conversionRate = Number(((purchases / Math.max(pageViews, 1)) * 100).toFixed(2));

        // totalEvents = browse (pv) + wishlist + add-to-cart + purchase
        const totalEvents = pageViews + favorites + carts + purchases;

        data.push({
          date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          year,
          month,
          day,
          dayOfWeek,
          dau,
          pageViews,
          favorites,
          carts,
          purchases,
          conversionRate,
          totalEvents,
        });
      }
    }
  }

  return data;
}

// ============================================================================
// Generate Monthly Summaries
// ============================================================================

function generateMonthlySummaries(daily: DailyDataPoint[]): MonthlySummary[] {
  const summaries: MonthlySummary[] = [];

  for (let year = 2024; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthData = daily.filter((d) => d.year === year && d.month === month);
      if (monthData.length === 0) continue;

      const totalPageViews = monthData.reduce((s, d) => s + d.pageViews, 0);
      const totalPurchases = monthData.reduce((s, d) => s + d.purchases, 0);
      const totalEvents = monthData.reduce((s, d) => s + d.totalEvents, 0);
      const avgConversionRate = Number(
        (monthData.reduce((s, d) => s + d.conversionRate, 0) / monthData.length).toFixed(2)
      );
      const peakDAU = Math.max(...monthData.map((d) => d.dau));
      const avgDAU = Math.round(monthData.reduce((s, d) => s + d.dau, 0) / monthData.length);
      const totalFavorites = monthData.reduce((s, d) => s + d.favorites, 0);
      const totalCarts = monthData.reduce((s, d) => s + d.carts, 0);

      // Total unique users estimate — Amazon has a larger base
      const baseMonthlyUsers = 120000 + year * 18000 + month * 1500;
      const totalUsers = Math.round(
        baseMonthlyUsers * getGrowthFactor(year, month) * SEASONAL[month]
      );

      summaries.push({
        year,
        month,
        monthLabel: getMonthLabel(year, month),
        totalUsers,
        avgDAU,
        peakDAU,
        totalPageViews,
        totalPurchases,
        totalEvents,
        avgConversionRate,
        totalFavorites,
        totalCarts,
      });
    }
  }

  return summaries;
}

// ============================================================================
// Generate Category Monthly Data (5 categories × 24 months = 120 rows)
// ============================================================================

function generateCategoryData(daily: DailyDataPoint[]): CategoryMonthlyData[] {
  const data: CategoryMonthlyData[] = [];

  for (let year = 2024; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthDaily = daily.filter((d) => d.year === year && d.month === month);
      if (monthDaily.length === 0) continue;

      const totalPV = monthDaily.reduce((s, d) => s + d.pageViews, 0);
      const growth = getGrowthFactor(year, month);
      const monthsElapsed = (year - 2024) * 12 + (month - 1);
      const seasonal = SEASONAL[month];

      for (let ci = 0; ci < CATEGORIES.length; ci++) {
        const category = CATEGORIES[ci];
        const seed = dateToSeed(year, month, 1) + ci * 1000;
        const weight = CATEGORY_WEIGHTS[category];
        const catGrowth = CATEGORY_GROWTH[category];

        // Apply growth factor for each category
        const catGrowthFactor = 1 + ((monthsElapsed / 24) * 0.15) * (catGrowth - 1);

        // Holiday boost
        const holidayBoost = (month === 11 || month === 12)
          ? CATEGORY_HOLIDAY_BOOST[category]
          : month === 1
            ? 1.0
            : 1.0;

        // Prime Day boost (July)
        const primeBoost = month === 7 ? CATEGORY_PRIME_BOOST[category] : 1.0;

        const catNoise = 0.92 + seededRandom(seed) * 0.16;
        const views = Math.round(
          totalPV * weight * catNoise * catGrowthFactor * (holidayBoost > 1 ? holidayBoost : 1) * (primeBoost > 1 ? primeBoost : 1) / seasonal
        );

        // Wishlist rate per category
        const catWishRate = 0.02 + seededRandom(seed + 1) * 0.015;
        const favorites = Math.round(views * catWishRate);

        // Cart rate per category
        const catCartRate = 0.06 + seededRandom(seed + 2) * 0.04;
        const carts = Math.round(views * catCartRate);

        // Conversion rate per category (use category-specific ranges)
        const [convMin, convMax] = CATEGORY_CONV_RATES[category];
        const catConvRate = convMin + seededRandom(seed + 3) * (convMax - convMin);
        const purchases = Math.round(views * catConvRate);
        const conversionRate = Number(((purchases / Math.max(views, 1)) * 100).toFixed(2));

        data.push({
          year,
          month,
          monthLabel: getMonthLabel(year, month),
          category,
          views,
          favorites,
          carts,
          purchases,
          conversionRate,
        });
      }
    }
  }

  return data;
}

// ============================================================================
// Generate Segment Monthly Data (3 segments × 24 months = 72 rows)
// ============================================================================

function generateSegmentData(daily: DailyDataPoint[]): SegmentMonthlyData[] {
  const data: SegmentMonthlyData[] = [];

  for (let year = 2024; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthDaily = daily.filter((d) => d.year === year && d.month === month);
      if (monthDaily.length === 0) continue;

      const avgDAU = Math.round(monthDaily.reduce((s, d) => s + d.dau, 0) / monthDaily.length);
      const growth = getGrowthFactor(year, month);
      const totalEstUsers = Math.round(avgDAU * 30 * growth);

      for (let si = 0; si < SEGMENTS.length; si++) {
        const segment = SEGMENTS[si];
        const seed = dateToSeed(year, month, 1) + si * 500;
        const weight = SEGMENT_WEIGHTS[si];
        const noise = 0.94 + seededRandom(seed) * 0.12;

        const count = Math.round(totalEstUsers * weight * noise);
        const purchaseRate = Number(
          (SEGMENT_PURCHASE_RATES[si] * 100 + seededRandom(seed + 2) * 3 - 1.5).toFixed(1)
        );
        const avgEvents = SEGMENT_AVG_EVENTS[si] + seededRandom(seed + 3) * 4;

        data.push({
          year,
          month,
          monthLabel: getMonthLabel(year, month),
          segment,
          count,
          purchaseRate,
          avgEventsPerUser: Number(avgEvents.toFixed(1)),
        });
      }
    }
  }

  return data;
}

// ============================================================================
// Generate Retention Data (24 months)
// ============================================================================

function generateRetentionData(daily: DailyDataPoint[]): RetentionMonthlyData[] {
  const data: RetentionMonthlyData[] = [];

  for (let year = 2024; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const seed = dateToSeed(year, month, 1);
      const growth = getGrowthFactor(year, month);
      const seasonal = SEASONAL[month];

      // Amazon has slightly higher base cohort due to Prime membership
      const baseCohortSize = 16000;
      const cohortSize = Math.round(baseCohortSize * growth * seasonal * (0.92 + seededRandom(seed) * 0.16));

      // Retention improves over time (Amazon's engagement keeps users)
      const monthsElapsed = (year - 2024) * 12 + (month - 1);
      const improvementFactor = 1 + (monthsElapsed / 24) * 0.06;

      const day1Base = 0.48 + seededRandom(seed + 1) * 0.08;
      const day3Base = 0.33 + seededRandom(seed + 2) * 0.06;
      const day7Base = 0.22 + seededRandom(seed + 3) * 0.05;
      const day14Base = 0.15 + seededRandom(seed + 4) * 0.04;
      const day30Base = 0.10 + seededRandom(seed + 5) * 0.03;

      data.push({
        year,
        month,
        monthLabel: getMonthLabel(year, month),
        cohortSize,
        day1Retention: Number((day1Base * improvementFactor * 100).toFixed(1)),
        day3Retention: Number((day3Base * improvementFactor * 100).toFixed(1)),
        day7Retention: Number((day7Base * improvementFactor * 100).toFixed(1)),
        day14Retention: Number((day14Base * improvementFactor * 100).toFixed(1)),
        day30Retention: Number((day30Base * improvementFactor * 100).toFixed(1)),
      });
    }
  }

  return data;
}

// ============================================================================
// Generate Hourly Traffic Data (24 hours)
// ============================================================================

function generateHourlyData(): HourlyTrafficData[] {
  // Amazon shopping pattern — slightly different from Taobao
  // Peak during evening prime hours (8-10 PM) and lunch (12-1 PM)
  const hourlyPattern = [
    0.12, 0.06, 0.04, 0.03, 0.04, 0.07,
    0.15, 0.30, 0.55, 0.70, 0.78, 0.82,
    0.85, 0.68, 0.62, 0.66, 0.72, 0.82,
    0.92, 0.96, 0.88, 0.70, 0.48, 0.28,
  ];

  const peakDays = [
    'Sunday', 'Saturday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday', 'Sunday', 'Saturday',
    'Sunday', 'Friday', 'Saturday', 'Sunday', 'Sunday',
    'Saturday', 'Friday', 'Saturday', 'Saturday', 'Sunday',
    'Sunday', 'Saturday', 'Friday', 'Saturday',
  ];

  return HOURS_OF_DAY.map((hour) => {
    const seed = hour * 137 + 42; // offset to differentiate from Taobao
    const avgDAU = 19200; // average across 24 months (higher than Taobao)
    const pattern = hourlyPattern[hour];
    const noise = 0.94 + seededRandom(seed) * 0.12;

    // Amazon users view more pages per session
    return {
      hour,
      avgPageViews: Math.round(avgDAU * pattern * noise * (10 + seededRandom(seed + 1) * 4)),
      avgPurchases: Math.round(avgDAU * pattern * noise * (1.0 + seededRandom(seed + 2) * 0.5)),
      peakDay: peakDays[hour],
    };
  });
}

// ============================================================================
// Generate Amazon-Specific Data
// ============================================================================

function generateAmazonStats(daily: DailyDataPoint[]): AmazonStats {
  const totalPurchases = daily.reduce((s, d) => s + d.purchases, 0);

  // Average order value based on Amazon pricing ($10-$500 range, avg ~$65)
  const avgOrderValue = 65;
  const totalRevenue = totalPurchases * avgOrderValue;

  // Average rating: 3.8-4.2
  const avgRating = 3.95;

  // Return rate: 8-15%
  const returnRate = 11.2;

  return {
    totalTransactions: totalPurchases,
    totalRevenue,
    avgOrderValue,
    avgRating,
    returnRate,
    totalCategories: CATEGORIES.length,
    totalSellers: 4850,
    topCategory: 'Electronics',
    fastestGrowingCategory: 'Beauty & Health',
    avgShippingDays: 3.2,
    totalCities: CITIES.length,
    dateRange: { start: '2024-01-01', end: '2025-12-31' },
  };
}

function generateDeviceDistribution(year: number, month: number): DeviceDistribution[] {
  const seed = dateToSeed(year, month, 1) + 99999;
  const growth = getGrowthFactor(year, month);
  const seasonal = SEASONAL[month];
  const baseDAU = 18000;
  const avgDAU = Math.round(baseDAU * growth * seasonal);
  const monthlySessions = avgDAU * 30;

  return SEGMENTS.map((device, i) => {
    // Mobile share grows slightly over time
    const mobileShift = i === 0 ? 1 + ((year - 2024) * 12 + (month - 1)) * 0.003 : 1;
    const tabletShift = i === 2 ? 1 - ((year - 2024) * 12 + (month - 1)) * 0.002 : 1;
    const rawPercentage = SEGMENT_WEIGHTS[i] * mobileShift * tabletShift;
    const noise = 0.97 + seededRandom(seed + i) * 0.06;
    const percentage = Number((rawPercentage * noise * 100).toFixed(1));
    const sessions = Math.round(monthlySessions * (percentage / 100));

    return {
      device: device.replace(' Users', ''),
      percentage,
      sessions,
    };
  });
}

function generatePaymentDistribution(year: number, month: number): PaymentDistribution[] {
  const seed = dateToSeed(year, month, 1) + 88888;
  const growth = getGrowthFactor(year, month);
  const seasonal = SEASONAL[month];
  const baseDAU = 18000;
  const avgDAU = Math.round(baseDAU * growth * seasonal);
  const convRate = 0.09;
  const monthlyTransactions = Math.round(avgDAU * 30 * convRate);

  return PAYMENT_METHODS.map((method, i) => {
    // UPI adoption grows over time in India
    const upiGrowth = i === 0 ? 1 + ((year - 2024) * 12 + (month - 1)) * 0.005 : 1;
    const codDecline = i === 2 ? 1 - ((year - 2024) * 12 + (month - 1)) * 0.004 : 1;
    const rawPercentage = PAYMENT_WEIGHTS[i] * upiGrowth * codDecline;
    const noise = 0.96 + seededRandom(seed + i) * 0.08;
    const percentage = Number((rawPercentage * noise * 100).toFixed(1));
    const transactions = Math.round(monthlyTransactions * (percentage / 100));

    return {
      method,
      percentage,
      transactions,
    };
  });
}

function generateLocationData(year: number, month: number): LocationData[] {
  const seed = dateToSeed(year, month, 1) + 77777;
  const growth = getGrowthFactor(year, month);
  const seasonal = SEASONAL[month];
  const baseDAU = 18000;
  const avgDAU = Math.round(baseDAU * growth * seasonal);
  const convRate = 0.09;
  const monthlyOrders = Math.round(avgDAU * 30 * convRate);
  const avgOrderValue = 65;
  const monthlyRevenue = monthlyOrders * avgOrderValue;

  return CITIES.map((city, i) => {
    const noise = 0.94 + seededRandom(seed + i) * 0.12;
    const percentage = Number((CITY_WEIGHTS[i] * noise * 100).toFixed(1));
    const orders = Math.round(monthlyOrders * (percentage / 100));
    const revenue = Math.round(orders * (avgOrderValue + seededRange(seed + i + 50, -10, 20)));

    return {
      city,
      percentage,
      orders,
      revenue,
    };
  });
}

// ============================================================================
// Pre-generate All Data
// ============================================================================

const dailyDataAll = generateDailyData();
const monthlySummariesAll = generateMonthlySummaries(dailyDataAll);
const categoryDataAll = generateCategoryData(dailyDataAll);
const segmentDataAll = generateSegmentData(dailyDataAll);
const retentionDataAll = generateRetentionData(dailyDataAll);
const hourlyDataAll = generateHourlyData();
const amazonStatsAll = generateAmazonStats(dailyDataAll);

export const dailyData: DailyDataPoint[] = dailyDataAll;
export const monthlySummaries: MonthlySummary[] = monthlySummariesAll;
export const categoryMonthlyData: CategoryMonthlyData[] = categoryDataAll;
export const segmentMonthlyData: SegmentMonthlyData[] = segmentDataAll;
export const retentionMonthlyData: RetentionMonthlyData[] = retentionDataAll;
export const hourlyTrafficData: HourlyTrafficData[] = hourlyDataAll;
export const amazonStats: AmazonStats = amazonStatsAll;

// ============================================================================
// Helper Functions (same signatures as dashboard-data.ts)
// ============================================================================

export function getDailyDataForMonth(year: number, month: number): DailyDataPoint[] {
  return dailyDataAll.filter((d) => d.year === year && d.month === month);
}

export function getMonthlySummary(year: number, month: number): MonthlySummary | undefined {
  return monthlySummariesAll.find((m) => m.year === year && m.month === month);
}

export function getCategoryDataForMonth(year: number, month: number): CategoryMonthlyData[] {
  return categoryDataAll.filter((c) => c.year === year && c.month === month);
}

export function getSegmentDataForMonth(year: number, month: number): SegmentMonthlyData[] {
  return segmentDataAll.filter((s) => s.year === year && s.month === month);
}

export function getRetentionDataForMonth(year: number, month: number): RetentionMonthlyData | undefined {
  return retentionDataAll.find((r) => r.year === year && r.month === month);
}

export function getAllMonths(): { year: number; month: number; label: string }[] {
  const months: { year: number; month: number; label: string }[] = [];
  for (let year = 2024; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      months.push({ year, month, label: getMonthLabel(year, month) });
    }
  }
  return months;
}

// ============================================================================
// Amazon-Specific Helper Functions
// ============================================================================

export function getDeviceDistribution(year: number, month: number): DeviceDistribution[] {
  return generateDeviceDistribution(year, month);
}

export function getPaymentDistribution(year: number, month: number): PaymentDistribution[] {
  return generatePaymentDistribution(year, month);
}

export function getLocationData(year: number, month: number): LocationData[] {
  return generateLocationData(year, month);
}
