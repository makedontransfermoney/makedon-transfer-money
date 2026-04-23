import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import SendMoney from './pages/SendMoney'
import History from './pages/History'
import Recipients from './pages/Recipients'
import Profile from './pages/Profile'
import Agents from './pages/Agents'
import Security from './pages/Security'
import Commission from './pages/Commission'
import Crypto from './pages/Crypto'
import FraudDetection from './pages/FraudDetection'
import TaxCenter from './pages/TaxCenter'
import Analytics from './pages/Analytics'
import MoneyJourney from './pages/MoneyJourney'
import AiOracle from './pages/AiOracle'
import GoldenBook from './pages/GoldenBook'
import FamilyPoolPage from './pages/FamilyPool'
import VideoMessagePage from './pages/VideoMessage'
import EmergencyCash from './pages/EmergencyCash'
import AiNegotiator from './pages/AiNegotiator'
import TransactionFlow from './pages/TransactionFlow'
import SimpleTransaction from './pages/SimpleTransaction'
import SuperTools from './pages/SuperTools'
import SanctionedAssets from './pages/SanctionedAssets'
import PepNetwork from './pages/PepNetwork'
import PartnerIncome from './pages/PartnerIncome'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/send" element={<SendMoney />} />
      <Route path="/history" element={<History />} />
      <Route path="/recipients" element={<Recipients />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/security" element={<Security />} />
      <Route path="/commission" element={<Commission />} />
      <Route path="/crypto" element={<Crypto />} />
      <Route path="/fraud" element={<FraudDetection />} />
      <Route path="/tax" element={<TaxCenter />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/journey" element={<MoneyJourney />} />
      <Route path="/oracle" element={<AiOracle />} />
      <Route path="/golden" element={<GoldenBook />} />
      <Route path="/family" element={<FamilyPoolPage />} />
      <Route path="/video" element={<VideoMessagePage />} />
      <Route path="/emergency" element={<EmergencyCash />} />
      <Route path="/negotiator" element={<AiNegotiator />} />
      <Route path="/flow" element={<TransactionFlow />} />
      <Route path="/100eur" element={<SimpleTransaction />} />
      <Route path="/supertools" element={<SuperTools />} />
      <Route path="/sanctions" element={<SanctionedAssets />} />
      <Route path="/pep" element={<PepNetwork />} />
      <Route path="/partner-income" element={<PartnerIncome />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
