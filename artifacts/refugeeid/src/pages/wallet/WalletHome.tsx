import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { IssuedCredential } from '@/lib/types';
import { WalletLayout } from '@/components/WalletLayout';
import { motion } from 'framer-motion';
import { QrCode, PlusCircle, ShieldCheck, CheckCircle2, ChevronRight, X, FileCheck, Share2, ScanFace } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FaceVerify } from '@/components/FaceVerify';
import { deserializeEmbedding } from '@/lib/face-utils';

const API_URL = import.meta.env.VITE_API_URL || 'https://workspaceapi-server-production-314d.up.railway.app';

export default function WalletHome() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<IssuedCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimCode, setClaimCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);

  const [claimPhase, setClaimPhase] = useState<'code' | 'face' | 'complete'>('code');
  const [pendingCred, setPendingCred] = useState<IssuedCredential | null>(null);
  const [pendingFaceEmbedding, setPendingFaceEmbedding] = useState<number[] | null>(null);
  const [isFaceVerifyOpen, setIsFaceVerifyOpen] = useState(false);

  useEffect(() => {
    if (user) fetchCredentials();
  }, [user]);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('issued_credentials')
        .select('*')
        .eq('subject_user_id', user?.id)
        .order('claimed_at', { ascending: false });
      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching credentials', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCode = async () => {
    if (!claimCode || claimCode.length !== 8) {
      toast({ title: 'Invalid code', description: 'Claim code must be 8 characters', variant: 'destructive' });
      return;
    }

    setClaiming(true);
    try {
      const token = session?.access_token;
      const verifyRes = await fetch(`${API_URL}/api/credentials/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ claim_code: claimCode.toUpperCase() }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || verifyData.status === 'unknown') {
        throw new Error(verifyData.error || 'Code is invalid, already claimed, or has expired.');
      }

      if (verifyData.status === 'revoked') {
        throw new Error('This credential has been revoked and cannot be claimed.');
      }

      setPendingCred(verifyData.credential);

      if (verifyData.has_face_embedding) {
        setClaimPhase('face');
        setIsFaceVerifyOpen(true);
      } else {
        await completeClaim(claimCode.toUpperCase(), null);
      }
    } catch (err: any) {
      toast({ title: 'Failed to find credential', description: err.message, variant: 'destructive' });
    } finally {
      setClaiming(false);
    }
  };

  const completeClaim = async (code: string, faceEmbedding: number[] | null) => {
    setClaiming(true);
    try {
      const token = session?.access_token;
      const body: any = { claim_code: code, user_id: user?.id };
      if (faceEmbedding) body.face_embedding = faceEmbedding;

      const res = await fetch(`${API_URL}/api/credentials/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim credential');

      toast({ title: 'Success', description: 'Credential added to your wallet' });
      setIsClaimOpen(false);
      setClaimCode('');
      setClaimPhase('code');
      setPendingCred(null);
      setPendingFaceEmbedding(null);
      fetchCredentials();
    } catch (err: any) {
      toast({ title: 'Failed to claim', description: err.message, variant: 'destructive' });
    } finally {
      setClaiming(false);
    }
  };

  const handleFaceVerifyResult = async (match: boolean, _distance: number, liveEmbedding: number[]) => {
    setIsFaceVerifyOpen(false);

    if (match && pendingCred) {
      await completeClaim(claimCode.toUpperCase(), liveEmbedding);
    } else {
      toast({
        title: 'Face verification failed',
        description: 'The face does not match the credential. Please visit your issuer for assistance.',
        variant: 'destructive',
      });
      setClaimPhase('code');
      setPendingCred(null);
    }
  };

  const handleClaimDialogClose = (open: boolean) => {
    setIsClaimOpen(open);
    if (!open) {
      setClaimPhase('code');
      setPendingCred(null);
      setPendingFaceEmbedding(null);
      setClaimCode('');
    }
  };

  const primaryCred = credentials[0];
  const holderName = primaryCred
    ? `${primaryCred.given_name} ${primaryCred.family_name}`
    : (user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Holder');
  const holderDid = primaryCred?.subject_did || `did:key:z6M${user?.id.replace(/-/g, '').substring(0, 16)}`;
  const displayDid = `${holderDid.substring(0, 18)}...${holderDid.substring(holderDid.length - 6)}`;

  const handleShare = async () => {
    const shareData = {
      title: 'RefugeeID — Identity',
      text: `Verify identity for ${holderName}\nDID: ${holderDid}`,
      url: window.location.origin + '/verify?did=' + encodeURIComponent(holderDid),
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast({ title: 'Link copied', description: 'Share link copied to clipboard' });
    }
  };

  return (
    <WalletLayout>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white p-6 pb-8 rounded-b-[2rem] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-0 left-0 -ml-16 mt-16 w-48 h-48 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-sm font-medium text-blue-200">RefugeeID Wallet</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Verified Identity</span>
              </div>
            </div>
            <ShieldCheck className="h-8 w-8 text-blue-300 opacity-80" />
          </div>

          <h2 className="text-3xl font-semibold mb-1">{holderName}</h2>
          <p className="text-blue-200 font-mono text-xs opacity-80 mb-6" title={holderDid}>{displayDid}</p>

          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-white text-blue-900 hover:bg-blue-50 border-0">
                  <QrCode className="w-4 h-4 mr-2" /> Share ID
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm text-center border-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-center text-slate-900">Share Identity</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <QRCodeSVG value={holderDid} size={180} />
                  </div>
                  <p className="font-mono text-xs text-slate-500 break-all px-2">{holderDid}</p>
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="text-sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(holderDid);
                        toast({ title: 'DID copied to clipboard' });
                      }}
                    >
                      Copy DID
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      onClick={handleShare}
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />
                      Share via Wallet
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isClaimOpen} onOpenChange={handleClaimDialogClose}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-blue-800 text-white hover:bg-blue-700 border-0 shadow-inner">
                  <PlusCircle className="w-4 h-4 mr-2" /> Claim
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-slate-900">Claim Credential</DialogTitle>
                </DialogHeader>

                {claimPhase === 'code' && (
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-slate-500">Enter the 8-character claim code provided by your issuer. Codes are valid for 30 minutes.</p>
                    <Input
                      placeholder="e.g. A1B2C3D4"
                      value={claimCode}
                      onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleClaimCode()}
                      className="font-mono text-center text-xl tracking-widest uppercase border-slate-300 focus-visible:ring-blue-500"
                      maxLength={8}
                    />
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleClaimCode}
                      disabled={claiming || claimCode.length !== 8}
                    >
                      {claiming ? 'Verifying...' : 'Verify Code'}
                    </Button>
                  </div>
                )}

                {claimPhase === 'face' && (
                  <div className="py-4 space-y-4">
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <ScanFace className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-700">
                        Face verification required. This credential has a face photo on file. Please scan your face to confirm identity.
                      </p>
                    </div>
                    {isFaceVerifyOpen && pendingCred?.face_embedding && (
                      <FaceVerify
                        storedEmbedding={deserializeEmbedding(pendingCred.face_embedding)}
                        onResult={handleFaceVerifyResult}
                        onCancel={() => {
                          setIsFaceVerifyOpen(false);
                          setClaimPhase('code');
                          setPendingCred(null);
                        }}
                      />
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Credentials list */}
      <div className="flex-1 p-6 -mt-4 bg-slate-50 dark:bg-slate-900 relative rounded-t-[2rem]">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My Credentials</h3>
          <span className="text-sm text-slate-500 font-medium">{credentials.length} items</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : credentials.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileCheck className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500">No credentials yet.</p>
            <p className="text-sm text-slate-400 mt-1">Claim one using the button above.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {credentials.map((cred) => (
              <Link key={cred.id} href={`/wallet/credential/${cred.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 mr-4 shrink-0 overflow-hidden">
                    {cred.face_image_url ? (
                      <img src={cred.face_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ShieldCheck className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">{cred.given_name} {cred.family_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">UNHCR • Case {cred.case_number}</p>
                  </div>
                  {cred.status === 'active' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-2" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 ml-2" />
                  )}
                  <ChevronRight className="h-5 w-5 text-slate-300 ml-1" />
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </WalletLayout>
  );
}
