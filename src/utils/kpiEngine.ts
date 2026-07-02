/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SalesRecord, DatasetSummary, RegionSummary, ProductSummary, EmployeePerformance, MonthlyTrend } from '../types';
import { LoggerFactory } from './logger';

const logger = LoggerFactory.getLogger('KpiEngine');

export class KpiEngine {
  /**
   * Calculate complete business KPIs and summaries from an array of SalesRecords.
   * Highly modular, fully typesafe.
   */
  public static calculateKPIs(records: SalesRecord[]): DatasetSummary {
    logger.info(`Calculating enterprise KPIs for ${records.length} rows...`);

    if (records.length === 0) {
      return this.emptySummary();
    }

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalVisits = 0;
    let totalCustomers = 0;
    let totalTarget = 0;

    // Intermediate groupings
    const regionGroups: Record<string, { r: number; o: number; v: number; c: number; t: number }> = {};
    const productGroups: Record<string, { cat: string; r: number; o: number; v: number }> = {};
    const employeeGroups: Record<string, { reg: string; r: number; o: number; t: number }> = {};
    const monthlyGroups: Record<string, { r: number; o: number; t: number }> = {};

    for (const rec of records) {
      totalRevenue += rec.revenue;
      totalOrders += rec.orders;
      totalVisits += rec.visits;
      totalCustomers += rec.customers;
      totalTarget += rec.target;

      // Group by Region
      if (!regionGroups[rec.region]) {
        regionGroups[rec.region] = { r: 0, o: 0, v: 0, c: 0, t: 0 };
      }
      regionGroups[rec.region].r += rec.revenue;
      regionGroups[rec.region].o += rec.orders;
      regionGroups[rec.region].v += rec.visits;
      regionGroups[rec.region].c += rec.customers;
      regionGroups[rec.region].t += rec.target;

      // Group by Product
      if (!productGroups[rec.productName]) {
        productGroups[rec.productName] = { cat: rec.productCategory, r: 0, o: 0, v: 0 };
      }
      productGroups[rec.productName].r += rec.revenue;
      productGroups[rec.productName].o += rec.orders;
      productGroups[rec.productName].v += rec.visits;

      // Group by Employee
      if (!employeeGroups[rec.employeeName]) {
        employeeGroups[rec.employeeName] = { reg: rec.region, r: 0, o: 0, t: 0 };
      }
      employeeGroups[rec.employeeName].r += rec.revenue;
      employeeGroups[rec.employeeName].o += rec.orders;
      employeeGroups[rec.employeeName].t += rec.target;

      // Group by Month (YYYY-MM)
      const monthStr = rec.date.substring(0, 7);
      if (!monthlyGroups[monthStr]) {
        monthlyGroups[monthStr] = { r: 0, o: 0, t: 0 };
      }
      monthlyGroups[monthStr].r += rec.revenue;
      monthlyGroups[monthStr].o += rec.orders;
      monthlyGroups[monthStr].t += rec.target;
    }

    // Process Region Summaries
    const regions: RegionSummary[] = Object.entries(regionGroups).map(([region, val]) => {
      const targetAchievement = val.t > 0 ? (val.r / val.t) * 100 : 0;
      return {
        region,
        revenue: Number(val.r.toFixed(2)),
        orders: val.o,
        visits: val.v,
        customers: val.c,
        target: Number(val.t.toFixed(2)),
        percentageToTarget: Number(targetAchievement.toFixed(2)),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Process Product Summaries
    const products: ProductSummary[] = Object.entries(productGroups).map(([productName, val]) => {
      const conversionRate = val.v > 0 ? (val.o / val.v) * 100 : 0;
      return {
        productName,
        productCategory: val.cat,
        revenue: Number(val.r.toFixed(2)),
        orders: val.o,
        visits: val.v,
        conversionRate: Number(conversionRate.toFixed(2)),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Process Employee Summaries
    const employees: EmployeePerformance[] = Object.entries(employeeGroups).map(([employeeName, val]) => {
      const percentageToTarget = val.t > 0 ? (val.r / val.t) * 100 : 0;
      return {
        employeeName,
        region: val.reg,
        revenue: Number(val.r.toFixed(2)),
        orders: val.o,
        target: Number(val.t.toFixed(2)),
        percentageToTarget: Number(percentageToTarget.toFixed(2)),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Process Monthly Trend Summaries
    const monthlyTrend: MonthlyTrend[] = Object.entries(monthlyGroups).map(([month, val]) => {
      return {
        month,
        revenue: Number(val.r.toFixed(2)),
        orders: val.o,
        target: Number(val.t.toFixed(2)),
      };
    }).sort((a, b) => a.month.localeCompare(b.month));

    // Global Derived Calculations
    const overallProgressToTarget = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const overallConversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalVisits,
      totalCustomers,
      totalTarget: Number(totalTarget.toFixed(2)),
      overallProgressToTarget: Number(overallProgressToTarget.toFixed(2)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      overallConversionRate: Number(overallConversionRate.toFixed(2)),
      rowCount: records.length,
      regions,
      products,
      employees,
      monthlyTrend,
    };
  }

  /**
   * Helper to return empty state summary safely
   */
  private static emptySummary(): DatasetSummary {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalVisits: 0,
      totalCustomers: 0,
      totalTarget: 0,
      overallProgressToTarget: 0,
      averageOrderValue: 0,
      overallConversionRate: 0,
      rowCount: 0,
      regions: [],
      products: [],
      employees: [],
      monthlyTrend: [],
    };
  }

  /**
   * Helper to calculate sales velocity: (Visits * Conversion Rate * AOV) / Period Length
   * Measured as Revenue per Day
   */
  public static calculateSalesVelocity(revenue: number, days: number): number {
    return days > 0 ? revenue / days : 0;
  }

  /**
   * Calculates Mean Absolute Percentage Error (MAPE) between actual and predicted.
   */
  public static calculateMAPE(actuals: number[], predictions: number[]): number {
    if (actuals.length !== predictions.length || actuals.length === 0) return 0;
    let sumError = 0;
    let count = 0;
    for (let i = 0; i < actuals.length; i++) {
      if (actuals[i] !== 0) {
        sumError += Math.abs((actuals[i] - predictions[i]) / actuals[i]);
        count++;
      }
    }
    return count > 0 ? (sumError / count) * 100 : 0;
  }
}
