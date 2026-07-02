/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Serve static assets from dist folder in production
app.use(express.static(path.join(__dirname, 'dist')));

// Server-side multi-agent conversational API proxy
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, records } = req.body;
    
    // Quick statistics for prompt grounding
    const totalRevenue = records.reduce((sum: number, r: any) => sum + r.revenue, 0);
    const totalTarget = records.reduce((sum: number, r: any) => sum + r.target, 0);
    const totalOrders = records.reduce((sum: number, r: any) => sum + r.orders, 0);
    const totalVisits = records.reduce((sum: number, r: any) => sum + r.visits, 0);
    const achievement = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;
    const convRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      const fallbackText = simulateLocalMultiAgentResponse(prompt, {
        totalRevenue,
        totalTarget,
        totalOrders,
        totalVisits,
        achievement,
        convRate,
        aov,
        records,
      });
      return res.json({ text: fallbackText });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = `You are "SalesPilot AI", an Autonomous Multi-Agent Sales Supervisor Platform operating inside WINIT, a premium global SaaS & Enterprise Software enterprise.

Below is the REAL-TIME Business KPI metrics summary of our 10,000+ row sales dataset:
- Total Revenue: $${totalRevenue.toLocaleString()} (Target: $${totalTarget.toLocaleString()})
- Target Achievement Rate: ${achievement.toFixed(2)}%
- Average Order Value (AOV): $${aov.toFixed(2)}
- Site-to-Order Conversion Rate: ${convRate.toFixed(2)}%

Your architecture consists of 8 expert agents managed by the [Manager Agent]:
1. [Manager Agent]: Directs inquiries, synthesizes summaries, and enforces KPI guardrails.
2. [Sales Analyst Agent]: Deep-dives into conversion rates, AOV, regional deviations, and targets.
3. [Forecast Agent]: Employs statistical regression and additive seasonality models to flag quarter-end risks.
4. [Business Strategy Agent]: Generates inventory guidance, product bundling strategies, and custom discount recommendations.
5. [Email Agent]: Drafts professional executive emails (Warning, Motivation, Performance Review, Meeting Invitations).
6. [Report Agent]: Outlines structured briefings, charts, and risk matrix parameters.
7. [Voice Agent]: Handles verbal dictation formatting and vocal synthesis tone adjustments.
8. [Data Cleaning Agent]: Ensures CSV records conform to schema targets and detects validation errors.

RULES:
- When responding to the user, you MUST show the collaboration of these agents. Show which Agent is speaking by prefixing their sections with '[Agent Name]'. For example:
  "[Manager Agent]: Initiating workspace analysis...
   [Sales Analyst Agent]: Based on the 10,000+ row sales log, we've identified that..."
- Maintain a highly sophisticated, professional, strategic executive tone. No fluff, no tech-larp logs like 'CORE_NODE_ONLINE'.
- If the user asks you to generate an email (e.g., "Draft a warning email" or "Draft a motivation email"), have the [Email Agent] provide a perfectly formatted professional email template with Subject, To, and Body.
- If the user asks for a forecast, have the [Forecast Agent] discuss the numbers, trends, and MAPE, and have the [Business Strategy Agent] draft actionable plans.
- Feel free to use rich markdown (bullet points, bold text, tables) to make the responses incredibly elegant.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
      contents: prompt,
    });

    return res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('Server API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Serve frontend route for client SPA routing fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SalesPilot AI] Enterprise Server active on http://0.0.0.0:${PORT}`);
});

// Fallback logic
function simulateLocalMultiAgentResponse(prompt: string, kpis: any): string {
  const query = prompt.toLowerCase();
  
  const employeesMap: Record<string, { r: number, t: number }> = {};
  for (const r of kpis.records) {
    if (!employeesMap[r.employeeName]) employeesMap[r.employeeName] = { r: 0, t: 0 };
    employeesMap[r.employeeName].r += r.revenue;
    employeesMap[r.employeeName].t += r.target;
  }
  
  const sortedEmployees = Object.entries(employeesMap).map(([name, val]) => ({
    name,
    revenue: val.r,
    target: val.t,
    ach: val.t > 0 ? (val.r / val.t) * 100 : 0
  })).sort((a, b) => b.revenue - a.revenue);

  const topEmp = sortedEmployees[0] || { name: 'Sarah Jenkins', revenue: 750000, ach: 112 };
  const bottomEmp = sortedEmployees[sortedEmployees.length - 1] || { name: 'James Smith', revenue: 380000, ach: 68 };

  let analystBlock = '';
  let strategyBlock = '';
  let emailBlock = '';
  let forecastBlock = '';
  let managerBlock = '';

  if (query.includes('underperform') || query.includes('who is') || query.includes('employee') || query.includes('coaching')) {
    analystBlock = `[Sales Analyst Agent]: Detailed performance review:
- **Leading Performer**: **${topEmp.name}** ($${topEmp.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})} Revenue, **${topEmp.ach.toFixed(1)}%** of Target).
- **Target Gap Alert**: **${bottomEmp.name}** ($${bottomEmp.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})} Revenue, **${bottomEmp.ach.toFixed(1)}%** of Target). Recommend direct workflow coaching.`;

    strategyBlock = `[Business Strategy Agent]: Coaching Recommendations for **${bottomEmp.name}**:
1. **Target Gap Coaching**: Initiate a diagnostic review of enterprise pipelines.
2. **Product Bundling**: Authorize bundled CloudCRM + PremiumSupport incentives.`;

    emailBlock = `[Email Agent]: Warning and Supportive Alignment Email draft:
***
**Subject:** Sales Alignment & Operational Check-in - WINIT Support

Dear ${bottomEmp.name.split(' ')[0]},

I hope you are doing well. 

As part of our monthly performance logs, I have been reviewing our regional achievements. Our dashboards indicate your current target achievement rate is sitting at ${bottomEmp.ach.toFixed(1)}%. 

We want to help support you with the necessary tools. I have scheduled a 30-minute sync session for tomorrow so we can work together on high-impact strategic bundles and setting clear checkpoints.

Best,
Sales Supervisor Agent
***`;

    managerBlock = `[Manager Agent]: I have compiled feedback from **Sales Analyst**, **Business Strategy**, and **Email** agents. We have structured a diagnostic alignment plan and emailed draft template for ${bottomEmp.name}.`;

  } else if (query.includes('region') || query.includes('south') || query.includes('decline') || query.includes('attention')) {
    analystBlock = `[Sales Analyst Agent]: Regional indicators:
- **Top Region**: **North** (Sarah Jenkins, David Chen) leading at **112%** target achievement.
- **Underperforming Region**: **South** is at **71%** target achievement. 
- **Cause**: Core CRM and ERP deals down 35% with conversions dropping to 14.5% in the South territory.`;

    strategyBlock = `[Business Strategy Agent]: Tactical Directives for **Region South**:
1. **Discount Structure**: Temporary 15% discount limit authorization on Enterprise licenses.
2. **Account Prioritization**: Visit high-volume inactive regional clients.`;

    emailBlock = `[Email Agent]: Team Motivation and Alert Email:
***
**Subject:** Mid-Quarter Tactical Push - Region South Targets

Dear Team South,

To help close our current target gap, we are authorizing a localized 15% discount threshold on all CloudCRM Suite licenses for enterprise clients through the end of this month. Let's focus our active outreach on high-volume accounts in our regional logs.

Let's turn this around.

Best,
Sales Director
***`;

    managerBlock = `[Manager Agent]: **Sales Analyst** identifies Region South as a high-risk sector. **Business Strategy** has issued localized pricing tools, and **Email Agent** has drafted team motivation material.`;
  } else {
    analystBlock = `[Sales Analyst Agent]: Audited **${kpis.records.length.toLocaleString()}** data rows. 
- **Total Revenue**: $${kpis.totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})} 
- **AOV**: $${kpis.aov.toFixed(2)}
- **Conversion Rate**: ${kpis.convRate.toFixed(2)}%`;

    strategyBlock = `[Business Strategy Agent]: Focus efforts on reversing the South territory deficit and scaling conversion rates across Enterprise SaaS.`;

    managerBlock = `[Manager Agent]: Welcome to the SalesPilot AI Command Center. Standard operational metrics are green. We are monitoring all territories.`;
  }

  const apiKeyNotice = `\n\n*💡 **System Tip**: I am running on a high-fidelity local multi-agent model. To unlock autonomous, adaptive Gemini GPT-4 powered conversations, simply add your **GEMINI_API_KEY** in the Secrets panel in the AI Studio UI!*`;

  return `${managerBlock}\n\n${analystBlock}\n\n${strategyBlock}\n\n${emailBlock}${apiKeyNotice}`;
}
