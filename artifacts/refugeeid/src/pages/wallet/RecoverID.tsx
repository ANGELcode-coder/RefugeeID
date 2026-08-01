import React, { useState } from 'react';
import { WalletLayout } from '@/components/WalletLayout';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound, RefreshCw, ShieldCheck, Info } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'https://workspaceapi-server-production-314d.up.railway.app';

export default function RecoverID() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [claimCode, setClaimCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'options' | 'code' | 'done'>('options');

  const { session } = useAuth();

  const handleRecoverByCode = async () => {
    if (claimCode.length !== 8) return;
    setLoading(true);
    try {
      const token = session?.access_token;

      const res = await fetch(`${API_URL}/api/credentials/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          claim_code: claimCode.toUpperCase(),
          user_id: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim credential');

      setStep('done');
      toast({ title: 'Credential Recovered', description: 'Your credential has been restored to your wallet.' });
    } catch (err: any) {
      toast({ title: 'Recovery Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <WalletLayout>
      <header className="bg-white dark:bg-slate-900 px-4 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <Link href="/wallet">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold text-slate-900 dark:text-slate-100">Recover Your ID</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6 pb-24 space-y-4">

        {step === 'options' && (
          <>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-2xl p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your credentials are securely stored on the server — they are never lost. Sign in with the same account to restore them automatically, or use your claim code to re-link a credential.
              </p>
            </div>

            {/* Option 1: Auto-restore */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Automatic Recovery</h3>
                  <p className="text-xs text-slate-500">Already works if you're signed in</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                If you logged out and back in, your credentials are already restored. Go back to your wallet to check.
              </p>
              <Link href="/wallet">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Go to My Wallet
                </Button>
              </Link>
            </div>

            {/* Option 2: Claim code */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Recover with Claim Code</h3>
                  <p className="text-xs text-slate-500">Use a code from your issuer</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                If your issuer gave you a claim code, enter it here to link the credential to your account. Codes are valid for 30 minutes from creation.
              </p>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setStep('code')}
              >
                Enter Claim Code
              </Button>
            </div>

            {/* Option 3: Contact issuer */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-2">Contact Your Issuer</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                If you don't have a claim code, contact the UNHCR office or NGO that registered you. They can generate a new claim code for you.
              </p>
            </div>
          </>
        )}

        {step === 'code' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Enter Your Claim Code</h2>
              <p className="text-sm text-slate-500 mt-1">The 8-character code provided by your issuer</p>
            </div>
            <Input
              placeholder="A1B2C3D4"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleRecoverByCode()}
              className="font-mono text-center text-2xl tracking-[0.3em] uppercase border-slate-300 focus-visible:ring-blue-500 py-6"
              maxLength={8}
            />
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleRecoverByCode}
              disabled={loading || claimCode.length !== 8}
            >
              {loading ? 'Recovering...' : 'Recover Credential'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep('options')}>
              Back
            </Button>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xl">Credential Recovered!</h2>
            <p className="text-sm text-slate-500">Your credential has been restored to your wallet.</p>
            <Link href="/wallet">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white min-w-[180px]">
                Go to My Wallet
              </Button>
            </Link>
          </div>
        )}
      </div>
    </WalletLayout>
  );
}
