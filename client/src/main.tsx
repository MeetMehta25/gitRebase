import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { AiAgentsPage } from './pages/AiAgentsPage'
import { StrategyResultsPage } from './pages/StrategyResultsPage'
import { StrategyBuilderPage } from './pages/StrategyBuilderPage'
import { NewsPage } from './pages/NewsPage'
import { StockScreenerPage } from './pages/StockScreenerPage'
import { PaperTradingPage } from './pages/PaperTradingPage'
import {  BacktestRunPage2 } from './pages/BacktestRunPage2'
import { QuantCoachPage } from './pages/QuantCoachPage'
import "./i18n/config";
import App from './App'
import { PlaygroundPage } from './pages/PlaygroundPage'
import StrategyNotebookSandbox from './pages/StrategyNotebookSandbox'
import { BacktestRunPage1 } from './pages/BacktestRunPage1'
import { ConnectBrokerPage } from './pages/ConnectBrokerPage'
import { DocumentationPage } from './pages/DocumentationPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<App />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<AiAgentsPage />} />
          <Route path="/strategy-results" element={<StrategyResultsPage />} />
          <Route path="/strategy-builder" element={<StrategyBuilderPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/screener" element={<StockScreenerPage />} />
          <Route path="/trading" element={<PaperTradingPage />} />
          <Route path="/backtest-run-1" element={<BacktestRunPage1 />} />
          <Route path="/backtest-run-2" element={<BacktestRunPage2 />} />
          <Route path="/quant-coach" element={<QuantCoachPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/sandbox" element={<StrategyNotebookSandbox />} />
          <Route path="/connect-broker" element={<ConnectBrokerPage />} />
          <Route path="/docs" element={<DocumentationPage />} />
          {/* <Route path="/mcp" element={<MCPPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
