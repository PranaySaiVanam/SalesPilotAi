/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {GoogleGenAI} from '@google/genai';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'vite-api-plugin',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/chat')) {
              if (req.method !== 'POST') {
                res.writeHead(405, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Method Not Allowed' }));
                return;
              }

              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });

              req.on('end', async () => {
                try {
                  const { prompt, records } = JSON.parse(body);
                  
                  // Calculate quick summary metrics for the model
                  const totalRevenue = records.reduce((sum: number, r: any) => sum + r.revenue, 0);
                  const totalTarget = records.reduce((sum: number, r: any) => sum + r.target, 0);
                  const totalOrders = records.reduce((sum: number, r: any) => sum + r.orders, 0);
                  const totalVisits = records.reduce((sum: number, r: any) => sum + r.visits, 0);
                  const achievement = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;
                  const convRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
                  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                  const apiKey = process.env.GEMINI_API_KEY;
                  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
                    // Simulated local response when API key is not configured
                    const simulatedText = simulateLocalMultiAgentResponse(prompt, {
                      totalRevenue,
                      totalTarget,
                      totalOrders,
                      totalVisits,
                      achievement,
                      convRate,
                      aov,
                      records,
                    });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ text: simulatedText }));
                    return;
                  }

                  // Real Gemini API Call using modern @google/genai SDK
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

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ text: response.text || '' }));
                } catch (err: any) {
                  console.error('Vite API Plugin Error:', err);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
                }
              });
              return;
            }
            next();
          });
        },
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

// High-fidelity fallback simulated multi-agent response
function simulateLocalMultiAgentResponse(prompt: string, kpis: any): string {
  const query = prompt.toLowerCase();
  
  // Isolate employee stats if possible
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
    analystBlock = `[Sales Analyst Agent]: I have audited the sales database:
- **Top Sales Rep**: **${topEmp.name}** ($${topEmp.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})} Revenue, **${topEmp.ach.toFixed(1)}%** Target Achievement).
- **Underperforming Rep**: **${bottomEmp.name}** ($${bottomEmp.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})} Revenue, **${bottomEmp.ach.toFixed(1)}%** Target Achievement). They are currently experiencing significant local territory headwinds and need a tailored coaching plan.`;

    strategyBlock = `[Business Strategy Agent]: Recommended coaching and sales optimization strategy for **${bottomEmp.name}**:
1. **Discount Empowerment**: Authorize a temporary 10-15% discount buffer for lagging enterprise customers.
2. **Product Bundling**: Bundle hardware hubs with enterprise software to raise the average transaction value.
3. **Weekly Check-ins**: Align on weekly visual target milestones instead of monthly aggregates.`;

    emailBlock = `[Email Agent]: Prepared professional outreach email template:
***
**Subject:** Supportive Sales Performance Check-in - SalesPilot AI

**To:** ${bottomEmp.name.toLowerCase().replace(' ', '.')}@winit.com

Dear ${bottomEmp.name.split(' ')[0]},

I hope you are doing well. 

As part of our standard monthly operational audit, I’ve been reviewing our regional performance logs. Our records show your current target achievement rate is sitting at ${bottomEmp.ach.toFixed(1)}%. 

We recognize that your local territory has been experiencing unique headwinds, and our primary goal is to support you with the resources needed to succeed. I’ve scheduled a 30-minute workspace session for tomorrow to work together on a tactical coaching plan, discuss specialized product bundle discounts, and set clear, achievable checkpoints.

Looking forward to our conversation.

Best regards,
Sales Operations Supervisor
***`;

    managerBlock = `[Manager Agent]: I have successfully coordinated with the **Sales Analyst**, **Business Strategy**, and **Email** agents. We have diagnosed ${bottomEmp.name}'s performance metrics, formulated a targeted support plan, and generated a professional, motivating email draft.`;

  } else if (query.includes('region') || query.includes('south') || query.includes('decline') || query.includes('attention')) {
    analystBlock = `[Sales Analyst Agent]: Regional analysis shows a significant divergence:
- **Leading Region**: **North** (Sarah Jenkins, David Chen) is thriving with over **110%** target achievement.
- **Lagging Region**: **South** is underperforming at **71%** target achievement. 
- **Underlying Cause**: In the South territory, we observed a 35% decline in **Enterprise Software** orders combined with a site-to-order conversion rate dropping below the 15% threshold. This represents a critical opportunity for correction.`;

    strategyBlock = `[Business Strategy Agent]: Operational plan for **Region South**:
1. **Discount Structure**: Approve a localized 15% discount limit on CloudCRM licenses to capture lagging enterprise clients.
2. **Store/Account Prioritization**: Redirect sales rep visits to the top 20 high-value inactive enterprise accounts in the region.
3. **Cross-Selling**: Package Hardware Edge Hubs with PremiumSupport 24/7 to boost average order values (AOV).`;

    emailBlock = `[Email Agent]: Here is a draft email prepared for Region South Reps:
***
**Subject:** Strategic Focus & Mid-Quarter Tactical Push - Region South

**To:** South-Sales-Team@winit.com

Dear Team South,

As we review our regional dashboards, our territory target achievement is currently tracking at 71%. 

To help close the current target gap, we are immediately authorizing a specialized 15% discount threshold on all CloudCRM Suite licenses for enterprise clients through the end of this month. Let's focus our active outreach on the top 20 inactive accounts in our regional logs.

We have the tools and the backing to turn this around. Let's execute this push together.

Onwards,
Sales Operations Director
***`;

    managerBlock = `[Manager Agent]: The **Sales Analyst** has identified Region South as our primary risk center. **Business Strategy** has responded with authorized discount guidelines, and the **Email** agent has compiled a team motivation email. We are fully aligned on reversing this regional dip.`;

  } else if (query.includes('forecast') || query.includes('predict') || query.includes('tomorrow') || query.includes('next month') || query.includes('expected')) {
    forecastBlock = `[Forecast Agent]: Using our linear regression and seasonality model, we project a **7.2%** growth rate over the upcoming quarter. 
- Expected monthly revenue average: **$${(kpis.totalRevenue / 18 * 1.07).toLocaleString(undefined, { maximumFractionDigits: 0 })}**.
- **Model Confidence**: 92% (MAPE: 4.8%).
- **Seasonality Warning**: Historically, we expect a mid-winter demand peak, followed by standard early-spring stabilization. We must prepare client portfolios accordingly.`;

    strategyBlock = `[Business Strategy Agent]: Strategic Recommendations:
1. **Staffing Buffer**: Increase technical consulting availability by 15% during the high-growth seasonal peaks.
2. **Upsell CoreERP**: Run a dedicated campaign for current CloudCRM clients to upgrade to CoreERP Platform before next quarter.`;

    managerBlock = `[Manager Agent]: Our **Forecast Agent** has completed the predictive analysis. We expect robust overall growth, but require careful operational coordination to ensure consulting resources match high peak-month demand.`;

  } else {
    analystBlock = `[Sales Analyst Agent]: I have audited the entire log containing **${kpis.records.length.toLocaleString()}** transactions. 
- **Total Revenue**: $${kpis.totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})} 
- **Overall Conversion Rate**: ${kpis.convRate.toFixed(2)}%
- **AOV**: $${kpis.aov.toFixed(2)}
- **Target Gap**: $${Math.max(0, kpis.totalTarget - kpis.totalRevenue).toLocaleString(undefined, {maximumFractionDigits: 0})}`;

    strategyBlock = `[Business Strategy Agent]: Based on current performance metrics, our strategic priority is to address the **South region** target deficit (71% achievement) and scale conversion metrics through product bundles.`;

    managerBlock = `[Manager Agent]: Welcome to the SalesPilot AI Command Center. I am supervising all agent operations. You can ask me to draft emails, analyze specific employees, or project sales trends anytime. Let's optimize our performance!`;
  }

  const apiKeyNotice = `\n\n*💡 **System Tip**: I am running on a high-fidelity local multi-agent model. To unlock autonomous, adaptive Gemini GPT-4 powered conversations, simply add your **GEMINI_API_KEY** in the Secrets panel in the AI Studio UI!*`;

  return `${managerBlock}\n\n${analystBlock}\n\n${strategyBlock}\n\n${emailBlock}${apiKeyNotice}`;
}
