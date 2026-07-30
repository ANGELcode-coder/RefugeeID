import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth";
import { WalletPrefsProvider } from "@/lib/wallet-prefs";
import { RoleGate } from "@/components/RoleGate";

import PortalSelector from "@/pages/PortalSelector";
import AuthPage from "@/pages/AuthPage";

import WalletHome from "@/pages/wallet/WalletHome";
import CredentialDetail from "@/pages/wallet/CredentialDetail";
import WalletSettings from "@/pages/wallet/WalletSettings";
import RecoverID from "@/pages/wallet/RecoverID";

import IssueCredential from "@/pages/issuer/IssueCredential";
import CredentialsIssued from "@/pages/issuer/CredentialsIssued";
import TrustRegistry from "@/pages/issuer/TrustRegistry";

import VerifyCredential from "@/pages/verifier/VerifyCredential";
import VerificationHistory from "@/pages/verifier/VerificationHistory";
import TrustAnchors from "@/pages/verifier/TrustAnchors";

import UsersRoles from "@/pages/admin/UsersRoles";
import AuditLog from "@/pages/admin/AuditLog";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={PortalSelector} />
      <Route path="/auth" component={AuthPage} />

      {/* Wallet Portal */}
      <Route path="/wallet">
        <RoleGate role="holder"><WalletHome /></RoleGate>
      </Route>
      <Route path="/wallet/credential/:id">
        <RoleGate role="holder"><CredentialDetail /></RoleGate>
      </Route>
      <Route path="/wallet/settings">
        <RoleGate role="holder"><WalletSettings /></RoleGate>
      </Route>
      <Route path="/wallet/recover">
        <RoleGate role="holder"><RecoverID /></RoleGate>
      </Route>

      {/* Issuer Portal */}
      <Route path="/issuer">
        <RoleGate role="issuer"><IssueCredential /></RoleGate>
      </Route>
      <Route path="/issuer/list">
        <RoleGate role="issuer"><CredentialsIssued /></RoleGate>
      </Route>
      <Route path="/issuer/trust">
        <RoleGate role="issuer"><TrustRegistry /></RoleGate>
      </Route>

      {/* Verifier Portal */}
      <Route path="/verifier">
        <RoleGate role="verifier"><VerifyCredential /></RoleGate>
      </Route>
      <Route path="/verifier/history">
        <RoleGate role="verifier"><VerificationHistory /></RoleGate>
      </Route>
      <Route path="/verifier/trust">
        <RoleGate role="verifier"><TrustAnchors /></RoleGate>
      </Route>

      {/* Admin Portal */}
      <Route path="/admin">
        <RoleGate role="admin"><UsersRoles /></RoleGate>
      </Route>
      <Route path="/admin/audit">
        <RoleGate role="admin"><AuditLog /></RoleGate>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WalletPrefsProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </WalletPrefsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
