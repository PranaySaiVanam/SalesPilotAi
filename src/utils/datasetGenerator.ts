/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SalesRecord, Employee, Product } from '../types';
import { LoggerFactory } from './logger';

const logger = LoggerFactory.getLogger('DatasetGenerator');

export class DatasetGenerator {
  private static EMPLOYEES: Employee[] = [
    { name: 'Sarah Jenkins', region: 'North', target: 55000 },
    { name: 'David Chen', region: 'North', target: 48000 },
    { name: 'Maria Rodriguez', region: 'South', target: 52000 },
    { name: 'James Smith', region: 'South', target: 45000 },
    { name: 'Emily Taylor', region: 'East', target: 50000 },
    { name: 'Robert Johnson', region: 'East', target: 47000 },
    { name: 'Michael Chang', region: 'West', target: 58000 },
    { name: 'Jessica Williams', region: 'West', target: 51000 },
  ];

  private static PRODUCTS: Product[] = [
    { name: 'CloudCRM Suite', category: 'Enterprise Software', price: 1200 },
    { name: 'CoreERP Platform', category: 'Enterprise Software', price: 4500 },
    { name: 'DataSync Integrator', category: 'Enterprise Software', price: 800 },
    { name: 'IoTGate Edge Hub', category: 'Hardware & IoT', price: 350 },
    { name: 'SmartSensor Array', category: 'Hardware & IoT', price: 150 },
    { name: 'BizDisplay Terminal', category: 'Hardware & IoT', price: 600 },
    { name: 'TechConsult Strategy', category: 'Consulting & Support', price: 2500 },
    { name: 'PremiumSupport 24/7', category: 'Consulting & Support', price: 1000 },
    { name: 'CustomIntegration Service', category: 'Consulting & Support', price: 3500 },
  ];

  /**
   * Generates a highly realistic, complete 10,000+ row sales dataset for SalesPilot AI.
   * Dates span from 2025-01-01 to 2026-06-30 (18 months / 546 days).
   */
  public static generateDemoDataset(): SalesRecord[] {
    logger.info('Starting generation of 10,000+ row sales dataset...');
    const records: SalesRecord[] = [];
    
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2026-06-30');
    const millisecondsInDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / millisecondsInDay) + 1;

    let idCounter = 1;

    // Loop through each day
    for (let d = 0; d < totalDays; d++) {
      const currentDate = new Date(startDate.getTime() + d * millisecondsInDay);
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0 - 11

      // 1. Calculate general seasonality factor (peaks in Dec, June; low in Jan)
      // Standard sine/cosine seasonality
      const seasonalityFactor = 1.0 + 0.15 * Math.sin((month / 11) * Math.PI * 2) + (month === 11 ? 0.2 : 0);

      // 2. Weekend effect (business-to-business sales drop on weekends)
      const weekendMultiplier = isWeekend ? 0.35 : 1.0;

      // 3. Long-term upward trend (+1.5% average monthly growth)
      const trendFactor = 1.0 + (d / totalDays) * 0.25;

      // For each employee
      for (const emp of this.EMPLOYEES) {
        // Assign monthly target based on employee base target
        // Add seasonality to targets too to make them realistic
        const monthlyTarget = emp.target * seasonalityFactor;
        const dailyTargetEquivalent = monthlyTarget / 22; // approx 22 working days

        // 4. Employee specific factors
        let performanceMultiplier = 1.0;
        if (emp.region === 'North') {
          performanceMultiplier = 1.12; // Overperforming
        } else if (emp.region === 'South') {
          // South regional drop in 2026 due to economic/supply bottlenecks (underperforming!)
          if (year === 2026) {
            performanceMultiplier = 0.68;
          } else {
            performanceMultiplier = 0.95;
          }
        } else if (emp.region === 'West') {
          performanceMultiplier = 1.05 + (d / totalDays) * 0.15; // Growing rapidly
        } else if (emp.region === 'East') {
          performanceMultiplier = 0.98; // Stable
        }

        // Each employee sells a subset of products on any given day.
        // To hit ~10,500 rows, each employee should register an average of 2.5 records per day
        // Let's decide which products they sell today (randomized but deterministic based on date/emp)
        const productsToSell: Product[] = [];
        
        // Use pseudo-randomness based on date and employee index so it's stable and repeatable
        const seed = (d * 8) + this.EMPLOYEES.indexOf(emp);
        const rand = () => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };

        // Standard sales frequency
        const numTransactions = isWeekend ? (rand() > 0.7 ? 1 : 0) : (Math.floor(rand() * 3) + 2); // 2 to 4 transactions on weekdays

        for (let t = 0; t < numTransactions; t++) {
          const prodIndex = Math.floor(rand() * this.PRODUCTS.length);
          const product = this.PRODUCTS[prodIndex];
          
          // Generate metrics
          // Base visits
          const baseVisits = product.category === 'Enterprise Software' ? 4 : 8;
          const visits = Math.max(1, Math.round(baseVisits * (0.8 + rand() * 0.4) * weekendMultiplier));

          // Base conversion rate
          let baseConv = 0.25;
          if (product.category === 'Enterprise Software') baseConv = 0.18;
          if (product.category === 'Consulting & Support') baseConv = 0.12;
          const conversionRate = baseConv * performanceMultiplier * (0.9 + rand() * 0.2);

          // Calculate orders and customers
          const orders = Math.max(0, Math.round(visits * conversionRate));
          const customers = Math.max(0, Math.round(orders * (0.95 + rand() * 0.05)));

          // Calculate revenue
          const priceVariance = 0.95 + rand() * 0.1; // small discounts or upsells
          const revenue = orders * product.price * priceVariance;

          // Target allocation for this row (roughly daily budget)
          const rowTarget = dailyTargetEquivalent / numTransactions;

          records.push({
            id: `TX-${idCounter.toString().padStart(6, '0')}`,
            date: dateString,
            region: emp.region,
            employeeName: emp.name,
            productName: product.name,
            productCategory: product.category,
            revenue: Number(revenue.toFixed(2)),
            orders,
            visits,
            customers,
            target: Number(rowTarget.toFixed(2)),
          });

          idCounter++;
        }
      }
    }

    logger.info(`Successfully generated ${records.length} sales rows! (Target was >10,000)`);
    return records;
  }
}
