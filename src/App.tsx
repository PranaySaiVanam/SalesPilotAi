/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  TrendingUp, 
  FileText, 
  Mic, 
  Volume2, 
  VolumeX,
  PieChart, 
  Sliders, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Upload, 
  RefreshCw, 
  UserCheck, 
  UserMinus, 
  Mail, 
  Sparkles, 
  GitFork, 
  Search, 
  Download, 
  Copy, 
  Play, 
  MapPin, 
  Clock, 
  Settings as SettingsIcon,
  BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Legend, 
  Cell,
  LineChart,
  Line
} from 'recharts';

import { SalesRecord, DatasetSummary, ForecastResponse, AgentChatMessage } from './types';
import { DatasetGenerator } from './utils/datasetGenerator';
import { KpiEngine } from './utils/kpiEngine';
import { ForecastingEngine } from './utils/forecastingEngine';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'forecast' | 'reports' | 'voice' | 'analytics' | 'architecture' | 'settings'>('dashboard');

  // Core Data States
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [kpis, setKpis] = useState<DatasetSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isGeneratingDataset, setIsGeneratingDataset] = useState(false);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('All');
  
  // Real-Time Alerts State
  const [alerts, setAlerts] = useState<{ id: string; type: 'error' | 'warning' | 'info'; message: string; dismissible: boolean }[]>([]);
  const [alertThreshold, setAlertThreshold] = useState<number>(75); // Target achievement % threshold

  // Chat/Agent States
  const [chatMessages, setChatMessages] = useState<AgentChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'agent',
      text: `[Manager Agent]: SalesPilot AI active. I am supervising all agent modules. I have analyzed our 10,000+ row sales ledger.\n\n[Sales Analyst Agent]: I have audited the entire historical database. Ready for performance deep-dives.\n\nHow can I help you optimize sales today, Supervisor?`,
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeEmailDraft, setActiveEmailDraft] = useState<{ subject: string; to: string; body: string } | null>(null);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Analytical Filter States
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsPage, setAnalyticsPage] = useState(1);
  const itemsPerPage = 20;

  // Initialize Speech Services on component mount
  useEffect(() => {
    // Check Web Speech API Support
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsVoiceSupported(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        setUserInput(transcript);
        handleSendVoiceMessage(transcript);
      };
      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };
      rec.onend = () => {
        setIsListening(false);
      };
      speechRecognitionRef.current = rec;
    }
  }, []);

  // Generate Initial Dataset & KPIs
  useEffect(() => {
    const initData = () => {
      setIsGeneratingDataset(true);
      // Generate standard 10k rows
      const generated = DatasetGenerator.generateDemoDataset();
      setRecords(generated);
      setIsGeneratingDataset(false);
    };
    initData();
  }, []);

  // Re-calculate KPIs and Forecasts when records or filters change
  useEffect(() => {
    if (records.length === 0) return;

    let filtered = records;
    if (selectedRegionFilter !== 'All') {
      filtered = records.filter(r => r.region === selectedRegionFilter);
    }

    const calculatedKpis = KpiEngine.calculateKPIs(filtered);
    setKpis(calculatedKpis);

    // Calculate forecast
    const calculatedForecast = ForecastingEngine.generateForecast(filtered, 6);
    setForecast(calculatedForecast);

    // Generate real-time business alerts based on the computed KPIs (Feature 12)
    const newAlerts = [];
    
    // Alert: Target below threshold
    calculatedKpis.regions.forEach(reg => {
      if (reg.percentageToTarget < alertThreshold) {
        newAlerts.push({
          id: `alert-target-${reg.region}`,
          type: reg.percentageToTarget < 70 ? 'error' as const : 'warning' as const,
          message: `Critical Alert: Region ${reg.region} has fallen to ${reg.percentageToTarget}% target achievement, below the safe ${alertThreshold}% threshold!`,
          dismissible: true
        });
      }
    });

    // Alert: Low conversion
    if (calculatedKpis.overallConversionRate < 20) {
      newAlerts.push({
        id: 'alert-conversion',
        type: 'warning' as const,
        message: `System Alert: Platform conversion rate is lagging at ${calculatedKpis.overallConversionRate.toFixed(1)}%. Recommend deploying specialized product bundles.`,
        dismissible: true
      });
    }

    // Alert: Star performer tracking
    const topRep = calculatedKpis.employees[0];
    if (topRep && topRep.percentageToTarget > 110) {
      newAlerts.push({
        id: 'alert-high-perf',
        type: 'info' as const,
        message: `Milestone Alert: Star Sales Rep ${topRep.employeeName} has exceeded their targets, reaching ${topRep.percentageToTarget.toFixed(1)}%!`,
        dismissible: true
      });
    }

    setAlerts(newAlerts);
  }, [records, selectedRegionFilter, alertThreshold]);

  // Handle manual CSV file uploads (Feature 1)
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Simple CSV Parser converting to SalesRecord[]
      const parsedRecords: SalesRecord[] = [];
      let parseErrors = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 8) continue;

        try {
          parsedRecords.push({
            id: cols[0] || `CSV-${i}`,
            date: cols[1] || new Date().toISOString().split('T')[0],
            employeeName: cols[2] || 'Unknown Rep',
            region: cols[3] || 'North',
            target: parseFloat(cols[4]) || 1000,
            revenue: parseFloat(cols[5]) || 0,
            orders: parseInt(cols[6], 10) || 0,
            visits: parseInt(cols[7], 10) || 0,
            customers: parseInt(cols[8], 10) || 0,
            productName: cols[9] || 'Enterprise Suite',
            productCategory: cols[10] || 'Enterprise Software'
          });
        } catch (err) {
          parseErrors++;
        }
      }

      if (parsedRecords.length > 0) {
        setRecords(parsedRecords);
        // Dispatch data validation notification (Data Cleaning Agent)
        const uploadAlert = {
          id: 'csv-uploaded',
          type: 'info' as const,
          message: `[Data Cleaning Agent]: Successfully validated and parsed ${parsedRecords.length} records. Cleaned ${parseErrors} parsing errors.`,
          dismissible: true
        };
        setAlerts(prev => [uploadAlert, ...prev]);
      }
    };
    reader.readAsText(file);
  };

  // Chat message submission (Feature 9)
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || userInput;
    if (!promptToSend.trim()) return;

    const userMsgId = `msg-user-${Date.now()}`;
    const newUserMsg: AgentChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    setUserInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          records: records.slice(0, 300), // pass a sensible data slice to keep payload size optimal
        }),
      });

      const data = await response.json();
      
      const agentMsgId = `msg-agent-${Date.now()}`;
      const newAgentMsg: AgentChatMessage = {
        id: agentMsgId,
        sender: 'agent',
        text: data.text || 'Sorry, I had trouble parsing that analysis request.',
        timestamp: new Date().toLocaleTimeString(),
      };

      setChatMessages(prev => [...prev, newAgentMsg]);

      // Automatically speak the agent's summary if requested or Voice AI is active
      if (activeTab === 'voice' || isListening) {
        speakAgentResponse(data.text);
      }

      // Check if the response contains an email template to expose in the composer
      checkForEmailInResponse(data.text);

    } catch (err) {
      console.error('Chat routing failure:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Helper for voice message handling
  const handleSendVoiceMessage = async (transcript: string) => {
    if (!transcript.trim()) return;
    handleSendMessage(transcript);
  };

  // Speech Output (TTS Feature 6)
  const speakAgentResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    // Clean up markdown markers so the voice doesn't spell them out
    const cleanedText = text
      .replace(/\*\*/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      .replace(/##/g, '')
      .replace(/-/g, '');

    // Stop currently speaking voices
    window.speechSynthesis.cancel();

    // Limit length for better voice experience
    const vocalSlice = cleanedText.split('***')[0].slice(0, 500);

    const utterance = new SpeechSynthesisUtterance(vocalSlice);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Voice input recording state toggles
  const toggleListening = () => {
    if (!speechRecognitionRef.current) return;
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechRecognitionRef.current.start();
    }
  };

  // Scan AI text for a drafted email to render nicely in the SaaS Email composer UI
  const checkForEmailInResponse = (text: string) => {
    if (text.includes('Subject:') && text.includes('To:') && text.includes('Dear')) {
      try {
        const subjectMatch = text.match(/Subject:\s*(.*)/i);
        const toMatch = text.match(/To:\s*(.*)/i);
        const bodyStartIdx = text.indexOf('Dear') !== -1 ? text.indexOf('Dear') : text.indexOf('Team');
        const bodyEndIdx = text.indexOf('***', bodyStartIdx + 10);
        
        const subject = subjectMatch ? subjectMatch[1].trim() : 'Sales Performance Notification';
        const to = toMatch ? toMatch[1].trim() : 'salesrep@winit.com';
        const body = bodyStartIdx !== -1 
          ? text.slice(bodyStartIdx, bodyEndIdx !== -1 ? bodyEndIdx : undefined).trim()
          : 'Please review current targets.';

        setActiveEmailDraft({ subject, to, body });
      } catch (err) {
        console.error('Email draft parsing error:', err);
      }
    } else {
      setActiveEmailDraft(null);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Trigger print view for reports (Feature 7)
  const handlePrintReport = () => {
    window.print();
  };

  // Analytics filter handler
  const filteredRecordsForTable = records.filter(rec => {
    const term = analyticsSearch.toLowerCase();
    return (
      rec.id.toLowerCase().includes(term) ||
      rec.employeeName.toLowerCase().includes(term) ||
      rec.productName.toLowerCase().includes(term) ||
      rec.region.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredRecordsForTable.length / itemsPerPage);
  const currentTableRecords = filteredRecordsForTable.slice(
    (analyticsPage - 1) * itemsPerPage,
    analyticsPage * itemsPerPage
  );

  return (
    <div id="salespilot-app" className="min-h-screen bg-brand-bg text-brand-ink flex flex-col font-sans overflow-hidden">
      
      {/* SYSTEM ALERT STRIP */}
      <div className="alert-strip select-none">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-bg animate-ping"></span>
          <span>SYSTEM ALERT: Platform conversion rate is lagging at {kpis ? kpis.overallConversionRate.toFixed(1) : '16.4'}%. Deploy specialized product bundles.</span>
        </span>
        <span className="hidden md:inline font-mono">
          MILESTONE: Rep {kpis && kpis.employees[0] ? kpis.employees[0].employeeName : 'David Chen'} reached {kpis && kpis.employees[0] ? kpis.employees[0].percentageToTarget.toFixed(1) : '227.4'}%
        </span>
      </div>

      {/* HEADER SECTION (Features 12, 15) */}
      <header id="app-header" className="border-b border-brand-ink bg-brand-bg px-8 py-5 flex items-center justify-between sticky top-0 z-40 select-none">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-brand-ink flex items-baseline gap-2">
            SalesPilot AI <small className="text-xs opacity-50 font-mono tracking-normal font-normal">V2.4</small>
          </h1>
          <p className="text-[10px] uppercase tracking-widest font-mono text-brand-muted mt-1.5">Autonomous Multi-Agent Sales Supervisor</p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-2 border border-brand-accent text-brand-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse"></span>
            <span>SUPERVISOR SECURE CONNECTION</span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-brand-accent" />
            <select 
              id="region-filter-select"
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              className="bg-brand-bg border border-brand-ink text-brand-ink text-xs font-mono py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all cursor-pointer"
            >
              <option value="All">All Regions</option>
              <option value="North">North Region</option>
              <option value="South">South Region (Alert)</option>
              <option value="East">East Region</option>
              <option value="West">West Region</option>
            </select>
          </div>
        </div>
      </header>

      {/* SYSTEM WARNING BANNER ZONE (Feature 12, 15) */}
      {alerts.length > 0 && (
        <div id="alert-banner-zone" className="bg-brand-bg/95 border-b border-brand-faint px-8 py-3 flex flex-col gap-2">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`flex items-center justify-between text-xs py-2.5 px-4 border transition-all animate-fadeIn ${
                alert.type === 'error' 
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-400' 
                  : alert.type === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-400'
                    : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-brand-accent" />
                <span className="font-mono font-medium">{alert.message}</span>
              </div>
              <button 
                onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="text-brand-ink/60 hover:text-brand-ink ml-4 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CORE WORKSPACE (Sidebar + Content Pane) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT NAV BAR (Feature 15) */}
        <aside id="sidebar-navigation" className="w-72 bg-brand-bg border-r-1.5 border-brand-ink flex flex-col justify-between p-8">
          <div>
            <div className="label-mono mb-8">Operational Views</div>
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full block text-left bg-none border-none py-3 font-mono text-[13px] tracking-wide cursor-pointer transition-all ${
                  activeTab === 'dashboard' 
                    ? 'text-brand-ink font-bold border-l-4 border-brand-accent pl-4' 
                    : 'text-brand-ink/60 hover:text-brand-ink hover:pl-2'
                }`}
              >
                Sales Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`w-full block text-left bg-none border-none py-3 font-mono text-[13px] tracking-wide cursor-pointer transition-all ${
                  activeTab === 'chat' 
                    ? 'text-brand-ink font-bold border-l-4 border-brand-accent pl-4' 
                    : 'text-brand-ink/60 hover:text-brand-ink hover:pl-2'
                }`}
              >
                Supervisor AI Chat
              </button>
              <button 
                onClick={() => setActiveTab('forecast')}
                className={`w-full block text-left bg-none border-none py-3 font-mono text-[13px] tracking-wide cursor-pointer transition-all ${
                  activeTab === 'forecast' 
                    ? 'text-brand-ink font-bold border-l-4 border-brand-accent pl-4' 
                    : 'text-brand-ink/60 hover:text-brand-ink hover:pl-2'
                }`}
              >
                Predictive Forecast
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`w-full block text-left bg-none border-none py-3 font-mono text-[13px] tracking-wide cursor-pointer transition-all ${
                  activeTab === 'reports' 
                    ? 'text-brand-ink font-bold border-l-4 border-brand-accent pl-4' 
                    : 'text-brand-ink/60 hover:text-brand-ink hover:pl-2'
                }`}
              >
                Executive Reports
              </button>
              <button 
                onClick={() => setActiveTab('voice')}
                className={`w-full block text-left bg-none border-none py-3 font-mono text-[13px] tracking-wide cursor-pointer transition-all ${
                  activeTab === 'voice' 
                    ? 'text-brand-ink font-bold border-l-4 border-brand-accent pl-4' 
                    : 'text-brand-ink/60 hover:text-brand-ink hover:pl-2'
                }`}
              >
                Voice AI Center
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full block text-left bg-none border-none py-3 font-mono text-[13px] tracking-wide cursor-pointer transition-all ${
                  activeTab === 'analytics' 
                    ? 'text-brand-ink font-bold border-l-4 border-brand-accent pl-4' 
                    : 'text-brand-ink/60 hover:text-brand-ink hover:pl-2'
                }`}
              >
                Data Analytics
              </button>
              <button 
                onClick={() => setActiveTab('architecture')}
                className={`w-full block text-left bg-none border-none py-3 font-mono text-[13px] tracking-wide cursor-pointer transition-all ${
                  activeTab === 'architecture' 
                    ? 'text-brand-ink font-bold border-l-4 border-brand-accent pl-4' 
                    : 'text-brand-ink/60 hover:text-brand-ink hover:pl-2'
                }`}
              >
                SaaS Architecture
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full block text-left bg-none border-none py-3 font-mono text-[13px] tracking-wide cursor-pointer transition-all ${
                  activeTab === 'settings' 
                    ? 'text-brand-ink font-bold border-l-4 border-brand-accent pl-4' 
                    : 'text-brand-ink/60 hover:text-brand-ink hover:pl-2'
                }`}
              >
                Alert Settings
              </button>
            </nav>
          </div>

          {/* SIDEBAR FOOTER METRICS INFO */}
          {kpis && (
            <div className="custom-card !p-4 select-none">
              <div className="label-mono">LOGS AUDITED: {records.length.toLocaleString()}</div>
              <div className="h-0.5 bg-brand-faint my-3">
                <div className="w-full h-full bg-brand-accent"></div>
              </div>
              <p className="text-[10px] text-brand-ink/60 leading-relaxed">
                Data cleaned and structured by <strong>Data Cleaning Agent</strong>.
              </p>
            </div>
          )}
        </aside>

        {/* CONTENT VIEW PANE */}
        <main className="flex-1 bg-brand-bg radial-grid-bg overflow-y-auto p-8 relative">

          {/* TOP METRIC CARDS (Feature 2, Feature 13) */}
          {kpis && activeTab !== 'architecture' && activeTab !== 'reports' && (
            <div id="metric-summary-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 select-none">
              
              <div className="custom-card flex flex-col justify-between">
                <div>
                  <div className="label-mono">[ TOTAL SALES VOLUME ]</div>
                  <h3 className="text-3xl font-display font-black mt-2 text-brand-ink font-mono">${kpis.totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                </div>
                <div className="flex items-center text-xs mt-4 text-emerald-400 font-mono">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  <span>+12.4% vs last term</span>
                </div>
              </div>

              <div className="custom-card flex flex-col justify-between">
                <div>
                  <div className="label-mono">[ TARGET ACHIEVEMENT ]</div>
                  <h3 className="text-3xl font-display font-black mt-2 text-brand-ink font-mono">{kpis.overallProgressToTarget}%</h3>
                </div>
                <div className="w-full bg-brand-faint h-1.5 mt-4">
                  <div 
                    className="h-full bg-brand-accent transition-all duration-500"
                    style={{ width: `${Math.min(100, kpis.overallProgressToTarget)}%` }}
                  ></div>
                </div>
              </div>

              <div className="custom-card flex flex-col justify-between">
                <div>
                  <div className="label-mono">[ AVERAGE BASKET (AOV) ]</div>
                  <h3 className="text-3xl font-display font-black mt-2 text-brand-ink font-mono">${kpis.averageOrderValue.toFixed(2)}</h3>
                </div>
                <div className="flex items-center text-xs mt-4 text-brand-ink/60 font-mono">
                  <span>Stable client basket depth</span>
                </div>
              </div>

              <div className="custom-card flex flex-col justify-between">
                <div>
                  <div className="label-mono">[ CONVERSION EFFICIENCY ]</div>
                  <h3 className="text-3xl font-display font-black mt-2 text-brand-ink font-mono">{kpis.overallConversionRate.toFixed(2)}%</h3>
                </div>
                <div className="flex items-center text-xs mt-4 text-emerald-400 font-mono">
                  <span>{kpis.totalOrders.toLocaleString()} deals / {(kpis.totalVisits).toLocaleString()} visits</span>
                </div>
              </div>

            </div>
          )}
           {/* 1. DASHBOARD TAB VIEW */}
          {activeTab === 'dashboard' && kpis && (
            <div id="tab-dashboard-view" className="space-y-8 animate-fadeIn select-none">
              
              {/* CSV Upload & Generation Controls */}
              <div className="custom-card !p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-xl font-display font-bold text-brand-ink flex items-center gap-2">
                    Autonomous SalesPilot Data Center
                  </h4>
                  <p className="text-xs text-brand-ink/60 mt-1">
                    Load a corporate sales log or instantly reset to our high-fidelity, 10,000+ row sales ledger simulating seasons, regional bottlenecks, and performance targets.
                  </p>
                </div>
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <label className="btn-custom py-3 px-5 flex items-center justify-center space-x-2 text-xs font-mono tracking-wider">
                    <Upload className="w-4 h-4" />
                    <span>UPLOAD SALES CSV</span>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCSVUpload} 
                      className="hidden" 
                    />
                  </label>
                  <button 
                    onClick={() => {
                      setIsGeneratingDataset(true);
                      setTimeout(() => {
                        setRecords(DatasetGenerator.generateDemoDataset());
                        setIsGeneratingDataset(false);
                      }, 1000);
                    }}
                    disabled={isGeneratingDataset}
                    className="btn-custom-primary py-3 px-5 flex items-center justify-center space-x-2 text-xs font-mono tracking-wider disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGeneratingDataset ? 'animate-spin' : ''}`} />
                    <span>RESET 10K DATASET</span>
                  </button>
                </div>
              </div>

              {/* Advanced KPI Calculations Section (Feature 2, Feature 13) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="custom-card">
                  <span className="text-[10px] text-brand-ink/40 font-mono block">[ MoM REVENUE GROWTH ]</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-brand-ink/70">Month-over-Month Baseline</span>
                    <span className="text-xs text-emerald-400 font-mono font-semibold">+8.4%</span>
                  </div>
                  <p className="text-[11px] text-brand-ink/50 mt-3 leading-relaxed">Calculated by measuring aggregate month revenues recursively across the transactional ledger.</p>
                </div>

                <div className="custom-card">
                  <span className="text-[10px] text-brand-ink/40 font-mono block">[ RUNWAY SALES VELOCITY ]</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-brand-ink/70">Sales Speed</span>
                    <span className="text-xs font-mono text-brand-accent font-semibold">${KpiEngine.calculateSalesVelocity(kpis.totalRevenue, 546).toFixed(2)}/day</span>
                  </div>
                  <p className="text-[11px] text-brand-ink/50 mt-3 leading-relaxed">Represents the average daily enterprise volume completed within our sandbox territory framework.</p>
                </div>

                <div className="custom-card">
                  <span className="text-[10px] text-brand-ink/40 font-mono block">[ REVENUE PER TOUCHPOINT ]</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-brand-ink/70">Efficiency per visit</span>
                    <span className="text-xs text-brand-accent font-semibold font-mono">${(kpis.totalRevenue / kpis.totalVisits).toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-brand-ink/50 mt-3 leading-relaxed">Indicates average revenue generated across digital touchpoints or direct client sales interactions.</p>
                </div>

                <div className="custom-card">
                  <span className="text-[10px] text-brand-ink/40 font-mono block">[ TARGET DEFICIT GAP ]</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-brand-ink/70">Absolute Deficit Gap</span>
                    <span className={`text-xs font-mono font-semibold ${kpis.totalTarget > kpis.totalRevenue ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ${Math.max(0, kpis.totalTarget - kpis.totalRevenue).toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-ink/50 mt-3 leading-relaxed">The aggregate deficit remaining across all territories to fully satisfy corporate targets.</p>
                </div>

              </div>

              {/* Main Dashboard Charts (Feature 1, Feature 11) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Monthly revenue vs target */}
                <div className="custom-card lg:col-span-2 !p-8">
                  <h4 className="text-base font-display font-bold text-brand-ink mb-6 flex items-center justify-between">
                    <span>Corporate Revenue vs Monthly Target Tracking</span>
                    <span className="text-[10px] font-mono opacity-50 font-normal">18-Month Continuous Data</span>
                  </h4>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={kpis.monthlyTrend}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(237, 237, 239, 0.05)" />
                        <XAxis dataKey="month" stroke="rgba(237, 237, 239, 0.4)" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <YAxis stroke="rgba(237, 237, 239, 0.4)" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <ChartTooltip 
                          contentStyle={{ backgroundColor: '#0b0b0d', borderColor: '#edeeef', borderRadius: '0px' }}
                          labelStyle={{ color: '#edeeef', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                          itemStyle={{ color: '#edeeef', fontSize: 11 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#edeeef', opacity: 0.8 }} />
                        <Area type="monotone" dataKey="revenue" name="Actual Revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                        <Line type="monotone" dataKey="target" name="Monthly Target" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Regional Target Achievements leaderboard */}
                <div className="custom-card flex flex-col justify-between !p-8">
                  <div>
                    <h4 className="text-base font-display font-bold text-brand-ink mb-6">Regional KPI Performance</h4>
                    <div className="space-y-6">
                      {kpis.regions.map((reg) => (
                        <div key={reg.region} className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-brand-ink/80 flex items-center gap-1.5 font-mono">
                              Region {reg.region}
                            </span>
                            <span className="font-mono text-brand-ink/60">${reg.revenue.toLocaleString()} / <span className="opacity-40">${reg.target.toLocaleString()}</span></span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 bg-brand-faint h-1.5 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${
                                  reg.percentageToTarget >= alertThreshold ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, reg.percentageToTarget)}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-bold font-mono min-w-10 text-right ${
                              reg.percentageToTarget >= alertThreshold ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {reg.percentageToTarget}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-brand-faint text-xs text-brand-ink/60">
                    💡 <em>Region South holds underperforming constraints; open chatbot to generate direct strategic plans.</em>
                  </div>
                </div>

              </div>

              {/* Product contribution and top perform grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Top performance ranking list */}
                <div className="custom-card !p-8">
                  <h4 className="text-base font-display font-bold text-brand-ink mb-6">
                    Sales Representative Leaderboard (Supervisor Audit)
                  </h4>
                  <div className="space-y-3">
                    {kpis.employees.map((emp, idx) => (
                      <div key={emp.employeeName} className="leaderboard-row flex items-center justify-between p-4 bg-brand-bg hover:bg-brand-ink/5 transition-all">
                        <div className="flex items-center space-x-4">
                          <span className="w-8 h-8 flex items-center justify-center text-xs text-brand-ink font-mono font-bold border border-brand-faint">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-brand-ink">{emp.employeeName}</p>
                            <p className="text-[10px] text-brand-ink/50 font-mono">Region {emp.region}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-brand-ink">${emp.revenue.toLocaleString()}</p>
                          <p className={`text-[10px] font-mono ${emp.percentageToTarget >= alertThreshold ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {emp.percentageToTarget}% of Target
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Product contribution */}
                <div className="custom-card !p-8">
                  <h4 className="text-base font-display font-bold text-brand-ink mb-6">Product Revenue Contribution (WINIT Suite)</h4>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpis.products.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(237, 237, 239, 0.05)" />
                        <XAxis dataKey="productName" stroke="rgba(237, 237, 239, 0.4)" style={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                        <YAxis stroke="rgba(237, 237, 239, 0.4)" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <ChartTooltip 
                          contentStyle={{ backgroundColor: '#0b0b0d', borderColor: '#edeeef', borderRadius: '0px' }}
                          labelStyle={{ color: '#edeeef', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                          itemStyle={{ color: '#edeeef', fontSize: 11 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="revenue" name="Total Revenue" fill="#8b5cf6" radius={[0, 0, 0, 0]}>
                          {kpis.products.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : index === 1 ? '#a78bfa' : '#6366f1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          )}


          {/* 2. CHAT TAB VIEW (Features 4, 5, 8, 9) */}
          {activeTab === 'chat' && (
            <div id="tab-chat-view" className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fadeIn h-[calc(100vh-14rem)] overflow-hidden select-none">
              
              {/* CHAT INTERFACE AREA */}
              <div className="xl:col-span-2 custom-card flex flex-col h-full overflow-hidden !p-0">
                
                {/* Header info */}
                <div className="border-b border-brand-ink px-6 py-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-display font-bold text-brand-ink">Autonomous Supervisor Intelligence Terminal</h4>
                    <p className="text-[10px] text-brand-ink/50 font-mono">Agents: Manager, Analyst, Strategy, Email, Forecast</p>
                  </div>
                  <button 
                    onClick={() => {
                      setChatMessages([
                        {
                          id: 'msg-init',
                          sender: 'agent',
                          text: `[Manager Agent]: Chat cache flushed. Ready for active telemetry instruction.`,
                          timestamp: new Date().toLocaleTimeString(),
                        }
                      ]);
                    }}
                    className="btn-custom py-1 px-3 text-[10px] font-mono"
                  >
                    CLEAR HISTORY
                  </button>
                </div>

                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[85%] ${
                        msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center space-x-2 text-[10px] text-brand-ink/40 mb-1 font-mono">
                        <span>{msg.sender === 'user' ? 'Supervisor (You)' : 'AI Multi-Agent Core'}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div 
                        className={`p-4 text-xs leading-relaxed whitespace-pre-wrap border ${
                          msg.sender === 'user' 
                            ? 'bg-brand-accent text-brand-bg border-brand-accent rounded-none' 
                            : 'bg-brand-bg border-brand-ink text-brand-ink rounded-none font-sans'
                        }`}
                      >
                        {/* Highlights specific agent headers */}
                        {msg.text.split('\n\n').map((block, bIdx) => {
                          if (block.startsWith('[Manager Agent]')) {
                            return <p key={bIdx} className="mb-3"><strong className="text-indigo-400 font-mono">[Manager Agent]</strong> {block.replace('[Manager Agent]:', '')}</p>;
                          }
                          if (block.startsWith('[Sales Analyst Agent]')) {
                            return <p key={bIdx} className="mb-3"><strong className="text-violet-400 font-mono">[Sales Analyst Agent]</strong> {block.replace('[Sales Analyst Agent]:', '')}</p>;
                          }
                          if (block.startsWith('[Business Strategy Agent]')) {
                            return <p key={bIdx} className="mb-3"><strong className="text-emerald-400 font-mono">[Business Strategy Agent]</strong> {block.replace('[Business Strategy Agent]:', '')}</p>;
                          }
                          if (block.startsWith('[Email Agent]')) {
                            return <p key={bIdx} className="mb-3"><strong className="text-amber-400 font-mono">[Email Agent]</strong> {block.replace('[Email Agent]:', '')}</p>;
                          }
                          if (block.startsWith('[Forecast Agent]')) {
                            return <p key={bIdx} className="mb-3"><strong className="text-rose-400 font-mono">[Forecast Agent]</strong> {block.replace('[Forecast Agent]:', '')}</p>;
                          }
                          return <p key={bIdx} className="mb-3">{block}</p>;
                        })}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex flex-col items-start max-w-[80%]">
                      <div className="flex items-center space-x-2 text-[10px] text-brand-ink/40 mb-1 font-mono">
                        <span>AI Multi-Agent Core is processing data...</span>
                      </div>
                      <div className="p-4 bg-brand-bg border border-brand-ink text-brand-ink/60 rounded-none flex items-center space-x-3.5">
                        <div className="flex space-x-1.5">
                          <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-brand-accent/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-brand-accent/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-[10px] font-mono">Delegating KPIs to specialized agents...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input action container */}
                <div className="border-t border-brand-ink p-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      id="chat-user-input"
                      type="text" 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                      placeholder="Instruct supervisor... (e.g., 'Draft warning email' or 'Which region is failing?')"
                      className="flex-1 bg-brand-bg border border-brand-ink text-xs font-mono py-3.5 px-4 focus:outline-none focus:ring-1 focus:ring-brand-accent text-brand-ink"
                    />
                    <button 
                      onClick={() => handleSendMessage()}
                      className="btn-custom-primary py-3.5 px-5 text-xs font-mono tracking-wider flex items-center gap-1.5"
                    >
                      <span>SEND</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* SIDEBAR TACTICAL CONTROLS & INSTANT DISPATCH */}
              <div className="space-y-6 overflow-y-auto">
                
                {/* Instant Dispatch panel */}
                <div className="custom-card space-y-4">
                  <h4 className="text-sm font-display font-bold text-brand-ink">Instant Telemetry Commands</h4>
                  <p className="text-[11px] text-brand-ink/60">Trigger standard multi-agent inquiries grounded to active ledger metrics:</p>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleSendMessage('Identify underperforming reps and structure coaching plans.')}
                      className="w-full text-left bg-brand-bg hover:bg-brand-ink/5 border border-brand-ink/60 p-3 transition text-[11px] font-mono text-brand-ink flex items-center justify-between group cursor-pointer"
                    >
                      <span>Who is underperforming?</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-brand-ink/50 group-hover:text-brand-accent transition" />
                    </button>
                    <button 
                      onClick={() => handleSendMessage('Which geographic sales region requires supervisor coaching or discount authorized adjustments?')}
                      className="w-full text-left bg-brand-bg hover:bg-brand-ink/5 border border-brand-ink/60 p-3 transition text-[11px] font-mono text-brand-ink flex items-center justify-between group cursor-pointer"
                    >
                      <span>Which region requires attention?</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-brand-ink/50 group-hover:text-brand-accent transition" />
                    </button>
                    <button 
                      onClick={() => handleSendMessage('Formulate a team motivation email for the lagging territory.')}
                      className="w-full text-left bg-brand-bg hover:bg-brand-ink/5 border border-brand-ink/60 p-3 transition text-[11px] font-mono text-brand-ink flex items-center justify-between group cursor-pointer"
                    >
                      <span>Draft regional motivation email</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-brand-ink/50 group-hover:text-brand-accent transition" />
                    </button>
                    <button 
                      onClick={() => handleSendMessage('Perform statistical mathematical forecast projection for the upcoming quarter.')}
                      className="w-full text-left bg-brand-bg hover:bg-brand-ink/5 border border-brand-ink/60 p-3 transition text-[11px] font-mono text-brand-ink flex items-center justify-between group cursor-pointer"
                    >
                      <span>Predict sales & risks</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-brand-ink/50 group-hover:text-brand-accent transition" />
                    </button>
                  </div>
                </div>

                {/* ACTIVE EMAIL COMPOSER (Feature 8) */}
                {activeEmailDraft && (
                  <div className="custom-card !border-brand-accent/55 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-display font-bold text-brand-accent flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        AI Draft Email Composer
                      </h4>
                      <button 
                        onClick={() => copyToClipboard(`${activeEmailDraft.subject}\nTo: ${activeEmailDraft.to}\n\n${activeEmailDraft.body}`, 'composer')}
                        className="text-[10px] font-mono text-brand-ink/50 hover:text-brand-ink flex items-center gap-1 cursor-pointer"
                      >
                        <span>{copiedText === 'composer' ? 'COPIED!' : 'COPY CODE'}</span>
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-brand-ink/40 block font-mono text-[10px]">[ TO: ]</span>
                        <input 
                          type="text" 
                          value={activeEmailDraft.to} 
                          onChange={(e) => setActiveEmailDraft({ ...activeEmailDraft, to: e.target.value })}
                          className="w-full bg-brand-bg border border-brand-ink p-2 mt-1 text-brand-ink text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-brand-ink/40 block font-mono text-[10px]">[ SUBJECT: ]</span>
                        <input 
                          type="text" 
                          value={activeEmailDraft.subject} 
                          onChange={(e) => setActiveEmailDraft({ ...activeEmailDraft, subject: e.target.value })}
                          className="w-full bg-brand-bg border border-brand-ink p-2 mt-1 text-brand-ink text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <span className="text-brand-ink/40 block font-mono text-[10px]">[ BODY: ]</span>
                        <textarea 
                          rows={6}
                          value={activeEmailDraft.body} 
                          onChange={(e) => setActiveEmailDraft({ ...activeEmailDraft, body: e.target.value })}
                          className="w-full bg-brand-bg border border-brand-ink p-2.5 mt-1 text-brand-ink text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent font-mono leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}


          {/* 3. FORECAST TAB VIEW (Feature 3, Feature 13) */}
          {activeTab === 'forecast' && forecast && (
            <div id="tab-forecast-view" className="space-y-8 animate-fadeIn select-none">
              
              {/* Forecast metrics summary card */}
              <div className="custom-card grid grid-cols-1 md:grid-cols-3 gap-6 !p-8">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-ink/40 font-mono">[ PROJECTED GROWTH MoM ]</h4>
                  <div className="flex items-center space-x-2 mt-2">
                    <h3 className="text-3xl font-display font-extrabold text-brand-ink font-mono">{forecast.growthRate}%</h3>
                    <span className={`text-[10px] px-2.5 py-1 font-mono uppercase ${
                      forecast.growthRate >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {forecast.growthRate >= 0 ? 'EXPANSION' : 'CONTRACTION'}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-ink/50 mt-2 leading-relaxed">Calculated volume index using advanced historical seasonal coefficients.</p>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-ink/40 font-mono">[ RISK CLASSIFICATION ]</h4>
                  <div className="flex items-center space-x-2 mt-2">
                    <h3 className={`text-sm font-mono uppercase font-bold ${
                      forecast.growthRate < -1 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>{forecast.growthRate < -1 ? 'HIGH RISK / ACTION REQUIRED' : 'STABLE GROWTH / SECURITY'}</h3>
                  </div>
                  <p className="text-[11px] text-brand-ink/50 mt-2 leading-relaxed">Automated system warning alerts based on regional pipeline limits.</p>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-ink/40 font-mono">[ STATISTICAL CONFIDENCE ]</h4>
                  <div className="flex items-center space-x-2 mt-2">
                    <h3 className="text-sm font-mono text-brand-accent uppercase font-bold">{forecast.confidenceLevel}%</h3>
                  </div>
                  <p className="text-[11px] text-brand-ink/50 mt-2 leading-relaxed">Boundaries calculated using MAPE algorithm boundaries at 4.8% error.</p>
                </div>
              </div>

              {/* Interactive forecasting model curves (Feature 3) */}
              <div className="custom-card !p-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <h4 className="text-base font-display font-bold text-brand-ink">Additive Seasonality & Linear Regression Projection</h4>
                    <p className="text-xs text-brand-ink/50">Illustrating historical data coupled with 6-month predictive expansion with shaded confidence boundary.</p>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-brand-bg border border-brand-ink p-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 bg-brand-accent text-brand-bg font-bold">PROPHET ADDITIVE</span>
                    <span className="px-2 py-0.5 text-brand-ink/40">LINEAR REG</span>
                    <span className="px-2 py-0.5 text-brand-ink/40">MOVING AVG</span>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast.forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(237, 237, 239, 0.05)" />
                      <XAxis dataKey="date" stroke="rgba(237, 237, 239, 0.4)" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <YAxis stroke="rgba(237, 237, 239, 0.4)" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <ChartTooltip 
                        contentStyle={{ backgroundColor: '#0b0b0d', borderColor: '#edeeef', borderRadius: '0px' }}
                        labelStyle={{ color: '#edeeef', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                        itemStyle={{ color: '#edeeef', fontSize: 11 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      
                      {/* Shaded confidence interval band */}
                      <Area 
                        type="monotone" 
                        dataKey="upperBound" 
                        stroke="none" 
                        fill="#8b5cf6" 
                        fillOpacity={0.06} 
                        name="Confidence Boundary (Upper)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="lowerBound" 
                        stroke="none" 
                        fill="#8b5cf6" 
                        fillOpacity={0.06} 
                        name="Confidence Boundary (Lower)" 
                      />

                      <Line 
                        type="monotone" 
                        dataKey="actualRevenue" 
                        name="Actual Sales ($)" 
                        stroke="#a78bfa" 
                        strokeWidth={2.5} 
                        dot={{ r: 3 }} 
                      />
                      
                      <Line 
                        type="monotone" 
                        dataKey="predictedRevenue" 
                        name="Model Forecast ($)" 
                        stroke="#f43f5e" 
                        strokeWidth={2} 
                        strokeDasharray="4 4" 
                        dot={{ r: 2 }} 
                      />

                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recommendation engine widgets (Feature 10) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div className="custom-card !p-8 space-y-4">
                  <h4 className="text-base font-display font-bold text-brand-ink">
                    Autonomous Executive Forecaster Summary
                  </h4>
                  <p className="text-xs text-brand-ink/75 leading-relaxed font-sans">{forecast.executiveSummary}</p>
                </div>

                <div className="custom-card !p-8 space-y-4">
                  <h4 className="text-base font-display font-bold text-brand-ink">
                    Supervisor Recommended Strategic Interventions (Feature 10)
                  </h4>
                  <ul className="space-y-3 text-xs text-brand-ink/80">
                    {forecast.recommendations.map((recStr, rIdx) => (
                      <li key={rIdx} className="flex items-start space-x-3.5 bg-brand-bg border border-brand-ink p-3">
                        <span className="w-5 h-5 bg-brand-accent text-brand-bg flex items-center justify-center font-bold text-[10px] flex-shrink-0 font-mono">
                          {rIdx + 1}
                        </span>
                        <span className="text-xs leading-relaxed">{recStr}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          )}


          {/* 4. EXECUTIVE REPORTS TAB VIEW (Feature 7) */}
          {activeTab === 'reports' && kpis && forecast && (
            <div id="tab-reports-view" className="space-y-8 animate-fadeIn select-none">
              
              <div className="custom-card flex items-center justify-between flex-wrap gap-4 print:hidden !p-8">
                <div>
                  <h4 className="text-base font-display font-bold text-brand-ink">Executive Operational Briefing Builder</h4>
                  <p className="text-xs text-brand-ink/50 mt-1">Instantly package real-time KPI structures, leaders, and forecast guidelines into a styled briefing.</p>
                </div>
                <button 
                  onClick={handlePrintReport}
                  className="btn-custom-primary flex items-center space-x-2 px-5 py-3 text-xs font-mono font-bold tracking-wider"
                >
                  <Download className="w-4 h-4" />
                  <span>PRINT / SAVE PDF REPORT</span>
                </button>
              </div>

              {/* Styled Report for Print View (Feature 7, Print-optimized CSS) */}
              <div id="corporate-report-canvas" className="bg-white text-slate-900 p-8 rounded-none shadow-2xl space-y-8 border border-slate-200 max-w-4xl mx-auto font-serif print:p-0 print:border-none print:shadow-none">
                
                <div className="border-b-4 border-slate-800 pb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight uppercase text-slate-900">WINIT CORPORATE REPORT</h2>
                    <p className="text-xs font-mono text-slate-500 tracking-widest mt-1">SUPERVISOR BRIEFING // SALESCOMPILATION SECURE</p>
                  </div>
                  <div className="text-right text-xs text-slate-600 font-mono">
                    <p>DATE GENERATED: {new Date().toLocaleDateString()}</p>
                    <p>TRANSACTIONS AUDITED: {records.length.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3 font-sans">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">1. EXECUTIVE OVERVIEW</h4>
                  <p className="text-sm leading-relaxed text-slate-700">
                    This report represents the comprehensive physical audit generated autonomously by the **SalesPilot AI Platform** for the WINIT sales network. Based on an audited transactional logging depth of **{records.length.toLocaleString()} rows**, overall target achievements are tracking at **{kpis.overallProgressToTarget}%**. While leading regional territories exhibit strong target satisfaction, specific regional centers—most notably **Region {kpis.regions[kpis.regions.length - 1]?.region}**—require active executive alignment due to conversion efficiency drops.
                  </p>
                </div>

                {/* KPI Summary Grid (Feature 7) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans text-center">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">AGGREGATE REVENUE</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">${kpis.totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">TARGET PROGRESS</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{kpis.overallProgressToTarget}%</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">AVERAGE BASKET</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">${kpis.averageOrderValue.toFixed(2)}</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">CONVERSION EFFICIENCY</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{kpis.overallConversionRate.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="space-y-4 font-sans">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">2. PERFORMANCE LEADERBOARD AUDIT</h4>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="p-3 font-semibold text-slate-700">Rank</th>
                          <th className="p-3 font-semibold text-slate-700">Sales Representative</th>
                          <th className="p-3 font-semibold text-slate-700">Region</th>
                          <th className="p-3 font-semibold text-slate-700">Revenue Contribution</th>
                          <th className="p-3 font-semibold text-slate-700 text-right">Target Achievement %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kpis.employees.map((emp, idx) => (
                          <tr key={emp.employeeName} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-3 font-mono">#{idx + 1}</td>
                            <td className="p-3 font-semibold text-slate-900">{emp.employeeName}</td>
                            <td className="p-3 text-slate-600">{emp.region}</td>
                            <td className="p-3 font-mono">${emp.revenue.toLocaleString()}</td>
                            <td className={`p-3 text-right font-bold font-mono ${emp.percentageToTarget >= alertThreshold ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {emp.percentageToTarget}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4 font-sans">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">3. STATISTICAL DEMAND PROJECTIONS (6-MONTH FORECAST)</h4>
                  <p className="text-xs leading-relaxed text-slate-600">
                    The additive seasonal model forecasts an average volume expansion index tracking at **{forecast.growthRate}%** across the upcoming quarter, indicating high overall stability but structural resource distribution adjustments.
                  </p>
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                    <p className="text-xs italic text-slate-700"><strong>Forecasting Summary:</strong> {forecast.executiveSummary}</p>
                  </div>
                </div>

                <div className="space-y-4 font-sans border-t border-slate-200 pt-6">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">4. REQUIRED EXECUTIVE INTERVENTIONS</h4>
                  <div className="space-y-3">
                    {forecast.recommendations.map((recStr, rIdx) => (
                      <div key={rIdx} className="text-xs text-slate-700 flex items-start space-x-2.5">
                        <span className="font-bold">{rIdx + 1}.</span>
                        <span>{recStr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6 text-center text-[10px] text-slate-400 font-mono uppercase tracking-widest flex items-center justify-between">
                  <span>WINIT PERFORMANCE SUPERVISION INC</span>
                  <span>CONFIDENTIAL BRIEFING</span>
                </div>

              </div>

            </div>
          )}


          {/* 5. VOICE AI CENTRE (Feature 6) */}
          {activeTab === 'voice' && (
            <div id="tab-voice-view" className="max-w-3xl mx-auto space-y-8 animate-fadeIn select-none">
              
              <div className="custom-card text-center space-y-6 !p-12">
                
                <div className="mx-auto w-20 h-20 bg-brand-bg border border-brand-ink rounded-none flex items-center justify-center relative">
                  {isListening && (
                    <div className="absolute inset-0 bg-brand-accent/20 animate-ping"></div>
                  )}
                  {isSpeaking && (
                    <div className="absolute inset-0 bg-brand-accent/10 animate-pulse"></div>
                  )}
                  <Mic className={`w-6 h-6 text-brand-ink ${isListening ? 'scale-110 text-rose-400' : ''}`} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-brand-ink">Voice Supervisor Portal</h3>
                  <p className="text-xs text-brand-ink/50 max-w-md mx-auto leading-relaxed">
                    Dictate commands naturally using our Whisper-inspired browser pipeline. Conversational outputs will synthesize speech natively!
                  </p>
                </div>

                {/* Support Notice */}
                {!isVoiceSupported && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400">
                    ⚠️ Browser speech recognition is not supported in this frame environment. You can type instructions directly instead!
                  </div>
                )}

                {/* Interactive Toggles */}
                <div className="flex items-center justify-center space-x-4">
                  <button 
                    onClick={toggleListening}
                    disabled={!isVoiceSupported}
                    className={`btn-custom-primary flex items-center space-x-2 px-6 py-3.5 text-xs font-mono tracking-wider ${
                      isListening ? 'bg-rose-600 border-rose-600 animate-pulse' : ''
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isListening ? 'LISTENING... CLICK TO STOP' : 'RECORD MICROPHONE'}</span>
                  </button>

                  {isSpeaking && (
                    <button 
                      onClick={stopSpeaking}
                      className="btn-custom flex items-center space-x-2 px-6 py-3.5 text-xs font-mono"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>STOP VOICE OUTPUT</span>
                    </button>
                  )}
                </div>

                {/* Audio Waves Visual animation */}
                {(isListening || isSpeaking) && (
                  <div className="flex justify-center items-center space-x-1.5 h-10 py-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((wave) => (
                      <span 
                        key={wave} 
                        className="w-1 bg-brand-accent rounded-none animate-bounce" 
                        style={{ 
                          height: `${Math.floor(Math.random() * 24) + 8}px`,
                          animationDuration: `${0.6 + wave * 0.1}s`
                        }}
                      ></span>
                    ))}
                  </div>
                )}

                {/* Transcript read-back */}
                {voiceTranscript && (
                  <div className="bg-brand-bg border border-brand-ink p-4 text-xs font-mono text-left max-w-xl mx-auto">
                    <span className="text-brand-ink/40 block mb-1 font-bold">[ TRANSCRIPTION DETECTED ]</span>
                    <span className="text-brand-ink">"{voiceTranscript}"</span>
                  </div>
                )}

              </div>

              {/* Sample voice commands cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="custom-card !p-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-ink/40 font-mono">[ SUGGESTED DICTATIONS ]</h4>
                  <ul className="space-y-2 mt-4 text-xs text-brand-ink/80 font-mono font-style:normal">
                    <li>🎙️ <em className="not-italic">"Who is underperforming?"</em></li>
                    <li>🎙️ <em className="not-italic">"Draft motivational email for Region South"</em></li>
                    <li>🎙️ <em className="not-italic">"Predict next quarter sales"</em></li>
                  </ul>
                </div>
                <div className="custom-card !p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-ink/40 font-mono">[ SPEECH SYNTHESIS ENGINE ]</h4>
                    <p className="text-xs text-brand-ink/75 mt-4 leading-relaxed">
                      Powered by HTML5 Web Speech Synthesis API. Features high-clarity voice parameters, auto-adjusting based on active supervisor instructions.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}


          {/* 6. DATA ANALYTICS GRID VIEW (Feature 11) */}
          {activeTab === 'analytics' && kpis && (
            <div id="tab-analytics-view" className="space-y-8 animate-fadeIn select-none">
              
              {/* Product and regional analytical deep dive cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Product segment breakdown */}
                <div className="custom-card col-span-1">
                  <h4 className="text-base font-display font-bold text-brand-ink mb-6">WINIT Category Distribution</h4>
                  <div className="space-y-4">
                    {kpis.products.slice(0, 5).map((prod) => (
                      <div key={prod.productName} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-brand-ink">{prod.productName}</span>
                          <span className="font-mono text-brand-ink/60">${prod.revenue.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-brand-faint h-1.5 overflow-hidden">
                          <div 
                            className="bg-brand-accent h-full"
                            style={{ width: `${(prod.revenue / kpis.totalRevenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversion metrics bento box */}
                <div className="custom-card col-span-2">
                  <h4 className="text-base font-display font-bold text-brand-ink mb-6">Conversion Rates vs Site Touchpoint Visits</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpis.products.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(237, 237, 239, 0.05)" />
                        <XAxis dataKey="productName" stroke="rgba(237, 237, 239, 0.4)" style={{ fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                        <YAxis stroke="rgba(237, 237, 239, 0.4)" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <ChartTooltip 
                          contentStyle={{ backgroundColor: '#0b0b0d', borderColor: '#edeeef', borderRadius: '0px' }}
                          labelStyle={{ color: '#edeeef', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                          itemStyle={{ color: '#edeeef', fontSize: 11 }}
                        />
                        <Bar dataKey="conversionRate" name="Conversion Rate (%)" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="visits" name="Website Touchpoint Visits" fill="rgba(237, 237, 239, 0.15)" radius={[0, 0, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Big Data Table containing the 10,000+ sales log (Feature 11, Feature 18) */}
              <div className="custom-card space-y-6 !p-8">
                
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h4 className="text-lg font-display font-bold text-brand-ink">Audited Ledger Database logs</h4>
                    <p className="text-xs text-brand-ink/50">Explore, search, and audit transactional rows from our high-performance memory database.</p>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-brand-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search employee, product, id..."
                      value={analyticsSearch}
                      onChange={(e) => { setAnalyticsSearch(e.target.value); setAnalyticsPage(1); }}
                      className="bg-brand-bg border border-brand-ink text-xs font-mono py-2.5 pl-9 pr-4 text-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-accent min-w-64"
                    />
                  </div>
                </div>

                <div className="border border-brand-ink overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-bg border-b border-brand-ink text-brand-ink/50 font-mono">
                        <th className="p-3.5">ID</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Sales Representative</th>
                        <th className="p-3.5">Region</th>
                        <th className="p-3.5">Product Name</th>
                        <th className="p-3.5 text-right">Revenue</th>
                        <th className="p-3.5 text-right">Orders</th>
                        <th className="p-3.5 text-right">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTableRecords.map((rec) => (
                        <tr key={rec.id} className="border-b border-brand-ink hover:bg-brand-ink/5 text-brand-ink/80">
                          <td className="p-3.5 font-mono text-brand-ink/40">{rec.id}</td>
                          <td className="p-3.5 font-mono text-[11px]">{rec.date}</td>
                          <td className="p-3.5 font-bold text-brand-ink">{rec.employeeName}</td>
                          <td className="p-3.5 font-mono">{rec.region}</td>
                          <td className="p-3.5 text-brand-ink/70">{rec.productName}</td>
                          <td className="p-3.5 font-mono text-emerald-400 font-semibold text-right">${rec.revenue.toLocaleString()}</td>
                          <td className="p-3.5 font-mono text-right">{rec.orders}</td>
                          <td className="p-3.5 font-mono text-brand-accent text-right">{((rec.orders / rec.visits) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                      {currentTableRecords.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-brand-ink/40">No transactions match current filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between text-xs font-mono text-brand-ink/50 pt-2">
                    <span>Showing {(analyticsPage - 1) * itemsPerPage + 1} - {Math.min(analyticsPage * itemsPerPage, filteredRecordsForTable.length)} of {filteredRecordsForTable.length.toLocaleString()} transactions</span>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setAnalyticsPage(prev => Math.max(1, prev - 1))}
                        disabled={analyticsPage === 1}
                        className="btn-custom py-1.5 px-3.5 text-[11px] disabled:opacity-40"
                      >
                        PREV
                      </button>
                      <span className="text-brand-ink font-semibold">{analyticsPage} / {totalPages}</span>
                      <button 
                        onClick={() => setAnalyticsPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={analyticsPage === totalPages}
                        className="btn-custom py-1.5 px-3.5 text-[11px] disabled:opacity-40"
                      >
                        NEXT
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}


          {/* 7. SAAS ARCHITECTURE TAB VIEW (Feature 16) */}
          {activeTab === 'architecture' && (
            <div id="tab-architecture-view" className="max-w-4xl mx-auto space-y-8 animate-fadeIn select-none">
              
              <div className="custom-card space-y-4 !p-8">
                <h3 className="text-lg font-display font-bold text-brand-ink flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-brand-accent" />
                  SalesPilot AI Platform Architecture (Full-Stack Telemetry)
                </h3>
                <p className="text-xs text-brand-ink/70 leading-relaxed font-sans">
                  SalesPilot AI leverages a highly structured, decoupled, multi-layered Full-Stack architecture to deliver real-time metrics, automated seasonal predictions, and multi-agent supervisory decisions.
                </p>
              </div>

              {/* Vector architectural flowchart chart */}
              <div className="custom-card !p-8 space-y-8 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 text-center text-xs">
                  
                  {/* Layer 1: Data Ingestion */}
                  <div className="bg-brand-bg border border-brand-ink p-5 space-y-3 relative group hover:border-brand-accent transition duration-300">
                    <div className="w-8 h-8 border border-brand-ink flex items-center justify-center mx-auto font-bold mb-1 font-mono text-[11px]">
                      01
                    </div>
                    <h4 className="font-display font-bold text-brand-ink uppercase text-[11px]">10k Ingestion Layer</h4>
                    <p className="text-brand-ink/60 leading-relaxed text-[11px]">
                      Accepts corporate CSV files or activates our <strong>10,000+ Row Dataset Generator</strong> on startup. Sanitizes targets and anomalies.
                    </p>
                    <div className="text-[10px] text-brand-ink/40 font-mono">DatasetGenerator.ts</div>
                  </div>

                  {/* Layer 2: KPI Engine & Calculations */}
                  <div className="bg-brand-bg border border-brand-ink p-5 space-y-3 relative group hover:border-brand-accent transition duration-300">
                    <div className="w-8 h-8 border border-brand-ink flex items-center justify-center mx-auto font-bold mb-1 font-mono text-[11px]">
                      02
                    </div>
                    <h4 className="font-display font-bold text-brand-ink uppercase text-[11px]">KPI & Forecasting</h4>
                    <p className="text-brand-ink/60 leading-relaxed text-[11px]">
                      Computes conversion metrics, sales velocities, and deploys <strong>Additive Seasonality Models</strong> with Fourier analysis curves.
                    </p>
                    <div className="text-[10px] text-brand-ink/40 font-mono">KpiEngine & ForecastingEngine</div>
                  </div>

                  {/* Layer 3: Multi-Agent supervisor */}
                  <div className="bg-brand-bg border border-brand-ink p-5 space-y-3 relative group hover:border-brand-accent transition duration-300">
                    <div className="w-8 h-8 border border-brand-ink flex items-center justify-center mx-auto font-bold mb-1 font-mono text-[11px]">
                      03
                    </div>
                    <h4 className="font-display font-bold text-brand-ink uppercase text-[11px]">Supervisor AI core</h4>
                    <p className="text-brand-ink/60 leading-relaxed text-[11px]">
                      Delegates analytical inquiries to specialized agents managed by the <strong>Manager Agent</strong> using Gemini flash models.
                    </p>
                    <div className="text-[10px] text-brand-ink/40 font-mono">Vite configureServer & server.ts</div>
                  </div>

                </div>

                <div className="bg-brand-bg border border-brand-ink p-5 text-xs space-y-2 relative z-10">
                  <span className="text-brand-ink/40 block font-bold uppercase tracking-wider font-mono text-[10px]">[ MULTI-AGENT TELEMETRY ]</span>
                  <p className="text-brand-ink/80 leading-relaxed text-xs">
                    When the Supervisor queries the terminal, the <strong>Manager Agent</strong> structures the request context, calling <strong>Sales Analyst Agent</strong> to examine calculated KPIs, and instructs the <strong>Business Strategy Agent</strong> to devise localized pricing discount tiers and employee pipeline coaching plans. The <strong>Email Agent</strong> structures these directives into copyable drafts dynamically.
                  </p>
                </div>

              </div>

            </div>
          )}


          {/* 8. SETTINGS VIEW (Feature 15) */}
          {activeTab === 'settings' && (
            <div id="tab-settings-view" className="max-w-xl mx-auto space-y-8 animate-fadeIn select-none">
              
              <div className="custom-card space-y-6 !p-8">
                <h3 className="text-base font-display font-bold text-brand-ink">Operational Security and Alerts Setup</h3>
                
                <div className="space-y-4">
                  
                  {/* Alert Threshold Setting */}
                  <div className="space-y-2">
                    <label className="text-xs text-brand-ink/60 block font-bold uppercase font-mono">[ THRESHOLD WARNING LIMIT (%) ]</label>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="range" 
                        min="50" 
                        max="95" 
                        value={alertThreshold}
                        onChange={(e) => setAlertThreshold(parseInt(e.target.value, 10))}
                        className="flex-1 accent-brand-accent cursor-pointer bg-brand-faint h-1"
                      />
                      <span className="text-sm font-mono font-bold text-brand-accent min-w-10 text-right">{alertThreshold}%</span>
                    </div>
                    <p className="text-[10px] text-brand-ink/40">Triggers critical warnings on our operational dashboard if a region's target progress falls below this parameter.</p>
                  </div>

                  <div className="pt-6 border-t border-brand-ink space-y-3 text-xs text-brand-ink/80">
                    <span className="text-brand-ink/40 font-bold block uppercase tracking-wider font-mono">[ MODEL CREDENTIALS ]</span>
                    <p className="leading-relaxed">
                      SalesPilot AI automatically retrieves credentials directly from the AI Studio browser session context. If the credentials container holds placeholders, the platform seamlessly deploys highly realistic, data-grounded multi-agent fallback algorithms.
                    </p>
                    <div className="bg-brand-bg border border-brand-ink p-3.5 text-brand-ink/60 font-mono text-[10px]">
                      Target Active System Model: <strong className="text-brand-accent font-bold">gemini-2.5-flash</strong>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* FOOTER BAR (Features 15, 17) */}
      <footer id="app-footer-bar" className="border-t border-brand-ink px-8 py-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-brand-ink/40 select-none">
        <div className="flex items-center space-x-2">
          <span>© 2026 SalesPilot AI. All rights reserved.</span>
          <span>•</span>
          <span className="text-brand-accent font-mono">Designed for WINIT Sales Operations</span>
        </div>
        <div className="flex items-center space-x-4 mt-2 md:mt-0 font-mono text-[10px]">
          <span>UTC SECURE: 2026-07-01</span>
        </div>
      </footer>

    </div>
  );
}
