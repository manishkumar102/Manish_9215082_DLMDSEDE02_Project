// ============================================================================
// E-Commerce Clickstream Analytics Pipeline - Dashboard Data
// Deterministic 24-month dataset (Jan 2024 - Dec 2025)
// Based on Alibaba Taobao User Behavior Dataset
// Columns: user_id, item_id, category_id, behavior_type, timestamp
// ============================================================================

// ============================================================================
// Interfaces
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
// Seeded Random Number Generator
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

const CATEGORIES = [
  'Cat 1-500',
  'Cat 501-1000',
  'Cat 1001-2000',
  'Cat 2001-3000',
  'Cat 3001-4000',
  'Cat 4001-5000',
];

const CATEGORY_WEIGHTS: Record<string, number> = {
  'Cat 1-500': 0.25,
  'Cat 501-1000': 0.22,
  'Cat 1001-2000': 0.20,
  'Cat 2001-3000': 0.15,
  'Cat 3001-4000': 0.10,
  'Cat 4001-5000': 0.08,
};

const SEGMENTS = ['Browsers Only', 'Cart Adders', 'Favoriters', 'Buyers'];
const SEGMENT_WEIGHTS = [0.55, 0.20, 0.15, 0.10];

const SEGMENT_PURCHASE_RATES = [0.00, 0.05, 0.12, 0.55]; // percentage
const SEGMENT_AVG_EVENTS = [3, 8, 12, 25]; // avg events per user per month

// Seasonal multiplier by month (1 = baseline)
const SEASONAL: Record<number, number> = {
  1: 0.78, 2: 0.82, 3: 0.92, 4: 0.96, 5: 1.02, 6: 1.05,
  7: 1.08, 8: 1.04, 9: 1.0, 10: 1.06, 11: 1.25, 12: 1.35,
};

// Category seasonal boost during holidays
const CATEGORY_HOLIDAY_BOOST: Record<string, number> = {
  'Cat 1-500': 1.35,
  'Cat 501-1000': 1.30,
  'Cat 1001-2000': 1.20,
  'Cat 2001-3000': 1.15,
  'Cat 3001-4000': 1.10,
  'Cat 4001-5000': 1.05,
};

const HOURS_OF_DAY = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
];

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
// Growth Function (20% over 24 months)
// ============================================================================

function getGrowthFactor(year: number, month: number): number {
  const monthsElapsed = (year - 2024) * 12 + (month - 1);
  return 1 + (monthsElapsed / 24) * 0.2;
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
        const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.18 : 1.0;
        // Mid-week dip (Tue/Wed)
        const midweekFactor = dayOfWeek === 2 || dayOfWeek === 3 ? 0.95 : 1.0;

        const baseDAU = 12500;
        const dailyNoise = 0.85 + seededRandom(seed) * 0.3;
        const dau = Math.round(baseDAU * growth * seasonal * weekendBoost * midweekFactor * dailyNoise);

        // pageViews = pv events (main behavior)
        const basePVPerUser = 8 + seededRandom(seed + 1) * 4;
        const pageViews = Math.round(dau * basePVPerUser);

        const favRate = 0.03 + seededRandom(seed + 2) * 0.02;
        const favorites = Math.round(pageViews * favRate);

        const cartRate = 0.06 + seededRandom(seed + 3) * 0.03;
        const carts = Math.round(pageViews * cartRate);

        // conversionRate = purchases / pageViews
        const convImprovement = (year - 2024) * 12 + (month - 1);
        const baseConvRate = 0.10 + (convImprovement / 24) * 0.05 + (seededRandom(seed + 4) * 0.03 - 0.015);
        const purchases = Math.round(pageViews * baseConvRate);
        const conversionRate = Number(((purchases / Math.max(pageViews, 1)) * 100).toFixed(2));

        // totalEvents = pv + cart + fav + buy
        const totalEvents = pageViews + carts + favorites + purchases;

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

      // Total unique users estimate (cumulative new + returning base)
      const baseMonthlyUsers = 85000 + year * 15000 + month * 1200;
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
// Generate Category Monthly Data (6 categories × 24 months = 144 rows)
// ============================================================================

function generateCategoryData(daily: DailyDataPoint[]): CategoryMonthlyData[] {
  const data: CategoryMonthlyData[] = [];

  for (let year = 2024; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthDaily = daily.filter((d) => d.year === year && d.month === month);
      if (monthDaily.length === 0) continue;

      const totalPV = monthDaily.reduce((s, d) => s + d.pageViews, 0);
      const growth = getGrowthFactor(year, month);
      const seasonal = SEASONAL[month];

      for (const category of CATEGORIES) {
        const seed = dateToSeed(year, month, 1) + CATEGORIES.indexOf(category) * 1000;
        const weight = CATEGORY_WEIGHTS[category];
        const holidayBoost = (month >= 11 || month <= 1)
          ? CATEGORY_HOLIDAY_BOOST[category]
          : 1.0;

        const catNoise = 0.9 + seededRandom(seed) * 0.2;
        const views = Math.round(totalPV * weight * catNoise * holidayBoost / seasonal + totalPV * weight * (holidayBoost - 1));
        const catFavRate = 0.03 + seededRandom(seed + 1) * 0.02;
        const catCartRate = 0.06 + seededRandom(seed + 2) * 0.03;
        const catConvRate = 0.10 + seededRandom(seed + 3) * 0.06;
        const favorites = Math.round(views * catFavRate);
        const carts = Math.round(views * catCartRate);
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
// Generate Segment Monthly Data (4 segments × 24 months = 96 rows)
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
        const noise = 0.95 + seededRandom(seed) * 0.1;

        const count = Math.round(totalEstUsers * weight * noise);
        const purchaseRate = Number(
          (SEGMENT_PURCHASE_RATES[si] * 100 + seededRandom(seed + 2) * 2 - 1).toFixed(1)
        );
        const avgEvents = SEGMENT_AVG_EVENTS[si] + seededRandom(seed + 3) * 5;

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

      const baseCohortSize = 12000;
      const cohortSize = Math.round(baseCohortSize * growth * seasonal * (0.9 + seededRandom(seed) * 0.2));

      // Retention improves slightly over time
      const monthsElapsed = (year - 2024) * 12 + (month - 1);
      const improvementFactor = 1 + (monthsElapsed / 24) * 0.08;

      const day1Base = 0.42 + seededRandom(seed + 1) * 0.08;
      const day3Base = 0.28 + seededRandom(seed + 2) * 0.06;
      const day7Base = 0.18 + seededRandom(seed + 3) * 0.05;
      const day14Base = 0.12 + seededRandom(seed + 4) * 0.04;
      const day30Base = 0.07 + seededRandom(seed + 5) * 0.03;

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
  const hourlyPattern = [
    0.15, 0.08, 0.05, 0.04, 0.05, 0.08,
    0.18, 0.35, 0.60, 0.75, 0.82, 0.88,
    0.78, 0.72, 0.68, 0.74, 0.82, 0.90,
    0.95, 0.85, 0.72, 0.55, 0.40, 0.25,
  ];

  const peakDays = [
    'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday', 'Saturday', 'Sunday',
    'Sunday', 'Friday', 'Saturday', 'Saturday', 'Sunday',
    'Friday', 'Saturday', 'Saturday', 'Sunday', 'Sunday',
    'Saturday', 'Friday', 'Saturday', 'Sunday',
  ];

  return HOURS_OF_DAY.map((hour) => {
    const seed = hour * 137;
    const avgDAU = 13500; // average across 24 months
    const pattern = hourlyPattern[hour];
    const noise = 0.95 + seededRandom(seed) * 0.1;

    return {
      hour,
      avgPageViews: Math.round(avgDAU * pattern * noise * (8 + seededRandom(seed + 1) * 3)),
      avgPurchases: Math.round(avgDAU * pattern * noise * (1.2 + seededRandom(seed + 2) * 0.4)),
      peakDay: peakDays[hour],
    };
  });
}

// ============================================================================
// Generate All Data
// ============================================================================

const dailyDataAll = generateDailyData();
const monthlySummariesAll = generateMonthlySummaries(dailyDataAll);
const categoryDataAll = generateCategoryData(dailyDataAll);
const segmentDataAll = generateSegmentData(dailyDataAll);
const retentionDataAll = generateRetentionData(dailyDataAll);
const hourlyDataAll = generateHourlyData();

export const dailyData: DailyDataPoint[] = dailyDataAll;
export const monthlySummaries: MonthlySummary[] = monthlySummariesAll;
export const categoryMonthlyData: CategoryMonthlyData[] = categoryDataAll;
export const segmentMonthlyData: SegmentMonthlyData[] = segmentDataAll;
export const retentionMonthlyData: RetentionMonthlyData[] = retentionDataAll;
export const hourlyTrafficData: HourlyTrafficData[] = hourlyDataAll;

// ============================================================================
// Helper Functions
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
