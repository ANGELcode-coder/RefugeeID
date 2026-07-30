import React, { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { IssuedCredential } from '@/lib/types';
import { WalletLayout } from '@/components/WalletLayout';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, QrCode, ScanFace, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

export default function CredentialDetail() {
  const [, params] = useRoute('/wallet/credential/:id');
  const id = params?.id;
  const { user } = useAuth();
  
  const [cred, setCred] = useState<IssuedCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchCredential();
    }
  }, [id, user]);

  const fetchCredential = async () => {
    try {
      const { data, error } = await supabase
        .from('issued_credentials')
        .select('*')
        .eq('id', id)
        .eq('subject_user_id', user?.id)
        .single();
        
      if (error) throw error;
      setCred(data);
    } catch (error) {
      console.error('Error fetching credential', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <WalletLayout>
        <div className="p-6 flex justify-center items-center h-full">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </WalletLayout>
    );
  }

  if (!cred) {
    return (
      <WalletLayout>
        <div className="p-6 text-center">
          <p>Credential not found.</p>
          <Link href="/wallet">
            <Button variant="link" className="mt-4">Return</Button>
          </Link>
        </div>
      </WalletLayout>
    );
  }

  const maskString = (str: string, visibleChars = 2) => {
    if (!str) return '';
    return str.substring(0, visibleChars) + '•'.repeat(str.length - visibleChars);
  };

  return (
    <WalletLayout>
      <div className="bg-slate-50 min-h-full pb-8">
        <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
          <Link href="/wallet">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-full" data-testid="btn-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-slate-900">Credential Details</h1>
          <div className="w-10"></div>
        </header>

        <div className="p-6">
          <div className={`bg-gradient-to-br p-6 rounded-2xl shadow-sm text-white mb-6 relative overflow-hidden ${cred.status === 'active' ? 'from-blue-700 to-indigo-900' : 'from-slate-700 to-slate-900'}`}>
            {cred.status !== 'active' && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px] z-10">
                <div className="bg-red-500 text-white px-4 py-1 rounded-full font-bold uppercase tracking-widest text-sm shadow-lg border border-red-400 transform rotate-12">
                  Revoked
                </div>
              </div>
            )}
            
            <ShieldCheck className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10" />
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">Issuer</p>
                <p className="font-semibold">UNHCR</p>
              </div>
              <QrCode className="h-8 w-8 opacity-80" />
            </div>
            
            <div className="flex items-center gap-4">
              {cred.face_image_url ? (
                <img
                  src={cred.face_image_url}
                  alt={`${cred.given_name} ${cred.family_name}`}
                  className="w-16 h-20 rounded-xl object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-16 h-20 rounded-xl bg-white/10 flex items-center justify-center">
                  <UserCircle2 className="h-10 w-10 text-white/30" />
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{cred.given_name} {cred.family_name}</h2>
                <p className="text-blue-200 font-mono text-sm">{cred.nationality} • {cred.gender}</p>
              </div>
            </div>
          </div>

          {/* Face Photo Section */}
          {cred.face_image_url && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="flex items-center gap-2 p-4 border-b border-slate-100 bg-slate-50/50">
                <ScanFace className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-slate-900">Identity Photo</h3>
                {cred.face_verification_status === 'verified' && (
                  <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Verified</span>
                )}
                {cred.face_verification_status === 'failed' && (
                  <span className="ml-auto text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Failed</span>
                )}
                {cred.face_verification_status === 'pending' && (
                  <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                )}
              </div>
              <div className="p-4 flex items-center gap-4">
                <img
                  src={cred.face_image_url}
                  alt="Identity photo"
                  className="w-20 h-24 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <p className="text-sm text-slate-700">Photo linked at issuance</p>
                  <p className="text-xs text-slate-500 mt-1">Used for face verification during claiming and credential checks</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-medium text-slate-900">Private Data</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSensitive(!showSensitive)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3 rounded-full text-xs font-medium"
                data-testid="btn-toggle-sensitive"
              >
                {showSensitive ? <><EyeOff className="h-3.5 w-3.5 mr-1.5" /> Hide</> : <><Eye className="h-3.5 w-3.5 mr-1.5" /> Reveal</>}
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Date of Birth</p>
                <p className="font-mono text-slate-900">{showSensitive ? cred.date_of_birth : maskString(cred.date_of_birth, 4)}</p>
              </div>
              <div className="h-px w-full bg-slate-100"></div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Case Number</p>
                <p className="font-mono text-slate-900">{showSensitive ? cred.case_number : maskString(cred.case_number, 3)}</p>
              </div>
              <div className="h-px w-full bg-slate-100"></div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Arrival Site</p>
                <p className="text-slate-900">{showSensitive ? cred.arrival_site : maskString(cred.arrival_site, 3)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 flex flex-col items-center">
            <p className="text-sm font-medium text-slate-900 mb-4">Verification QR</p>
            <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-xl">
              <QRCodeSVG value={`verify:${cred.vc_id}`} size={160} />
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">Scan this code to verify this specific credential.</p>
          </div>
        </div>
      </div>
    </WalletLayout>
  );
}
