# SalesPilot AI: Autonomous Multi-Agent Sales Supervisor Platform

**SalesPilot AI** is a production-grade, full-stack Enterprise SaaS platform designed to act as an **Autonomous Multi-Agent Sales Supervisor**. It bridges the gap between deep tabular sales telemetry and executive action items, featuring interactive forecasting, professional report generation, automatic email composition, and native speech capabilities.

---

## 🏗️ Platform Architecture

The system utilizes a modern, highly decoupled full-stack architecture running natively in containerized environments:

```
  +------------------+     +--------------------+     +------------------------+
  | Ingest & Cleanup | --> | KPI Analytics      | --> | Seasonality Forecast   |
  | (10k+ Row logs)  |     | (Site-to-deal CV)  |     | (Additive Prophet-style)|
  +------------------+     +--------------------+     +------------------------+
                                                                   |
                                                                   v
  +------------------+     +--------------------+     +------------------------+
  | Email Composer   | <-- | Multi-Agent Chat   | <-- | Supervisor AI Core     |
  | & Audio Synth    |     | (Expert Persona)   |     | (Gemini Flash Model)   |
  +------------------+     +--------------------+     +------------------------+
```

1. **Ingestion & Validation**: Data Cleaning Agent parses uploaded CSV files or triggers our on-the-fly **10,000+ Row Demo Dataset Generator** with built-in seasonal and regional metrics.
2. **Business KPI Engine**: Directly computes critical metrics (Revenue Growth, Conversion Rate, Average Order Value, and Sales Velocity) over the entire transaction history.
3. **Additive Seasonality Forecast**: Employs mathematical linear regression and monthly Fourier seasonality calculations to map 6-month prediction paths with expanding confidence thresholds.
4. **Autonomous Multi-Agent Supervisor**: Translates user prompts into actions, calling upon a collaborative board of AI expert personas managed by the [Manager Agent]:
   - **Sales Analyst Agent**: isolates numerical target deficits and top performance list.
   - **Business Strategy Agent**: devises localized discount authorizations and client visit plans.
   - **Email Agent**: drafts professional templates for warning and team motivation.

---

## 🚀 Key Features

* **Feature 1: Interactive Dashboard**: Beautiful Slate-colored SaaS interface containing total revenue trackers, target achievements, conversion rates, and employee rankings.
* **Feature 2: Advanced KPI Engine**: Computes Sales Velocity, Target Gaps, and MoM Revenue Growth Rates using pure typesafe business formulas.
* **Feature 3: Predictive Forecast Charts**: Interactive Area Charts outlining actuals vs. model projections with expanding confidence interval bands.
* **Feature 4 & 5: Multi-Agent supervisor**: Experience collaborative AI analysis where specialized agents delegate, debate, and deliver structured operations summaries.
* **Feature 6: Voice AI & Speech Synthesis**: Conversational audio transcription (Microphone Speech Recognition) coupled with native verbal speech synthesis (TTS).
* **Feature 7: Executive Reports**: Print-ready, publication-grade corporate reports optimized with full print-media layouts.
* **Feature 8: Email Draft Composer**: Automatically populated email fields matching generated agent insights, with full composer edit and copy functions.
* **Feature 11: High-Performance Data Grid**: Search, sort, and paginated filter over our 10,000+ transactional ledger dynamically.

---

## 🛠️ Quick Installation & Setup

### Local Node.js Development (Recommended)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure your API Key**:
   Create a `.env` file in the root or set it directly in your environment:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The platform is hosted on `http://localhost:3000`.*

### Docker Deployment

1. **Build and launch containers**:
   ```bash
   docker-compose up --build
   ```
   *Instantly containers build and expose the enterprise environment on port 3000.*

---

## 🔮 Future Scope & Integrations

* **ERP System Connectors**: Live webhooks syncing directly into Salesforce, HubSpot, and SAP ERP.
* **Fine-Tuned Voice Cloning**: Custom integration of high-fidelity ElevenLabs voice models for personalized manager coaching.
* **Relational Database Migration**: Out-of-the-box support for migrating the ingestion engine to enterprise PostgreSQL (Cloud SQL) or Google Spanner.
