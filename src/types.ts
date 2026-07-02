/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SalesRecord {
  id: string;
  date: string; // YYYY-MM-DD
  region: string;
  employeeName: string;
  productName: string;
  productCategory: string;
  revenue: number;
  orders: number;
  visits: number;
  customers: number;
  target: number; // Employee target for that month
}

export interface Employee {
  name: string;
  region: string;
  target: number;
}

export interface Product {
  name: string;
  category: string;
  price: number;
}

export interface RegionSummary {
  region: string;
  revenue: number;
  orders: number;
  visits: number;
  customers: number;
  target: number;
  percentageToTarget: number;
}

export interface ProductSummary {
  productName: string;
  productCategory: string;
  revenue: number;
  orders: number;
  visits: number;
  conversionRate: number; // orders / visits
}

export interface EmployeePerformance {
  employeeName: string;
  region: string;
  revenue: number;
  orders: number;
  target: number;
  percentageToTarget: number;
}

export interface DailyTrend {
  date: string;
  revenue: number;
  orders: number;
}

export interface MonthlyTrend {
  month: string; // YYYY-MM
  revenue: number;
  orders: number;
  target: number;
}

export interface DatasetSummary {
  totalRevenue: number;
  totalOrders: number;
  totalVisits: number;
  totalCustomers: number;
  totalTarget: number;
  overallProgressToTarget: number;
  averageOrderValue: number;
  overallConversionRate: number; // orders / visits
  rowCount: number;
  regions: RegionSummary[];
  products: ProductSummary[];
  employees: EmployeePerformance[];
  monthlyTrend: MonthlyTrend[];
}

export interface ForecastPoint {
  date: string; // YYYY-MM
  actualRevenue?: number;
  predictedRevenue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ForecastResponse {
  forecastData: ForecastPoint[];
  growthRate: number;
  confidenceLevel: number;
  executiveSummary: string;
  recommendations: string[];
}

export interface AgentChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  structuredData?: any; // If the agent returned structured table/charts
}
