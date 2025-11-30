import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import AdminPage from "@/pages/AdminPage";
import DeliverPage from "@/pages/DeliverPage";
import DonatePage from "@/pages/DonatePage";
import TrackPage from "@/pages/TrackPage";
import AuditPage from "@/pages/AuditPage";
import OrganizationsPage from "@/pages/OrganizationsPage";
import OrganizationDetailPage from "@/pages/OrganizationDetailPage";
import RegisterOrganizationPage from "@/pages/RegisterOrganizationPage";
import ExpenseVerificationPage from "@/pages/ExpenseVerificationPage";
import UserGuidePage from "@/pages/UserGuidePage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/track" replace />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/deliver" element={<DeliverPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="/register-organization" element={<RegisterOrganizationPage />} />
            <Route path="/verify-expenses" element={<ExpenseVerificationPage />} />
            <Route path="/guide" element={<UserGuidePage />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
