import React, { useState, useCallback } from 'react';
import { PortalLayout } from '@/components/PortalLayout';
import { ScanLine, History, ShieldAlert, CheckCircle2, XCircle, QrCode, KeyRound, RadioReceiver, ScanFace, Camera } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaceVerify } from '@/components/FaceVerify';
import { QRScanner } from '@/components/QRScanner';
import { deserializeEmbedding } from '@/lib/face-utils';
import { IssuedCredential } from '@/lib/types';

export default function VerifyCredential() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: 'valid' | 'revoked' | 'unknown', data?: IssuedCredential } | null>(null);
  const [faceVerifyOpen, setFaceVerifyOpen] = useState(false);
  const [faceVerified, setFaceVerified] = useState<boolean | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const logVerification = async (res: 'valid' | 'revoked' | 'unknown', data?: IssuedCredential, faceMatch?: boolean) => {
    try {
      const notes = faceMatch !== undefined
        ? faceMatch ? 'Face verification passed' : 'Face verification failed'
        : 'No face data available';

      await supabase.from('verification_logs').insert({
        verifier_id: user?.id,
        method: 'code',
        result: res,
        holder_alias: data ? `anon-${data.id.substring(0,6)}` : `unknown-${Math.random().toString(36).substring(2,8)}`,
        issuer: data ? 'UNHCR' : 'Unknown',
        credential_type: 'BasicIdentityCredential',
        notes,
        subject_did: data ? data.subject_did : 'unknown'
      });
    } catch (e) {
      console.error('Failed to log', e);
    }
  };

  const lookupCredential = async (identifier: string, type: 'code' | 'qr') => {
    setLoading(true);
    setResult(null);
    setFaceVerified(null);

    try {
      let query = supabase.from('issued_credentials').select('*');

      if (type === 'qr') {
        const vcId = identifier.replace('verify:', '');
        query = query.eq('vc_id', vcId);
      } else {
        query = query.eq('claim_code', identifier.toUpperCase());
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        setResult({ status: 'unknown' });
        await logVerification('unknown');
      } else if (data.status === 'revoked') {
        setResult({ status: 'revoked', data });
        await logVerification('revoked', data);
      } else {
        setResult({ status: 'valid', data });
        if (data.face_embedding) {
          setFaceVerifyOpen(true);
        } else {
          await logVerification('valid', data);
        }
      }
    } catch (e) {
      setResult({ status: 'unknown' });
    } finally {
      setLoading(false);
      setScannerOpen(false);
    }
  };

  const handleQRScan = useCallback((decodedText: string) => {
    lookupCredential(decodedText, 'qr');
  }, [user]);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 8) return;
    await lookupCredential(code, 'code');
  };

  const handleFaceVerifyResult = async (match: boolean, distance: number) => {
    setFaceVerifyOpen(false);
    setFaceVerified(match);

    if (result?.data) {
      await logVerification(match ? 'valid' : 'revoked', result.data, match);
    }
  };

  const handleSimulate = async (type: 'valid' | 'revoked') => {
    setLoading(true);
    setResult(null);
    setFaceVerified(null);
    setTimeout(async () => {
      const mockData = { id: 'mock123', subject_did: 'did:key:mock', given_name: 'John', family_name: 'Doe', case_number: '123-456' } as any;
      setResult({ status: type, data: mockData });
      await logVerification(type, mockData);
      setLoading(false);
    }, 1000);
  };

  const resetVerification = () => {
    setResult(null);
    setFaceVerified(null);
    setFaceVerifyOpen(false);
    setCode('');
    setScannerOpen(false);
  };

  return (
    <PortalLayout 
      title="Verifier Console" 
      accentColor="text-emerald-500"
      navItems={[
        { label: 'Verify', href: '/verifier', icon: ScanLine },
        { label: 'History', href: '/verifier/history', icon: History },
        { label: 'Trust Anchors', href: '/verifier/trust', icon: ShieldAlert },
      ]}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Verify Identity</h1>
        <p className="text-slate-500 mt-2">Check the validity of a presented credential.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="qr" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><QrCode className="w-4 h-4 mr-2" /> QR Scan</TabsTrigger>
              <TabsTrigger value="code" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><KeyRound className="w-4 h-4 mr-2" /> Enter Code</TabsTrigger>
              <TabsTrigger value="nfc" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><RadioReceiver className="w-4 h-4 mr-2" /> NFC Scan</TabsTrigger>
            </TabsList>
            
            <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 min-h-[400px] flex flex-col items-center justify-center relative shadow-sm">
              <TabsContent value="qr" className="w-full h-full flex flex-col items-center justify-center m-0">
                {scannerOpen ? (
                  <QRScanner onScan={handleQRScan} onClose={() => setScannerOpen(false)} />
                ) : (
                  <>
                    <div className="relative w-64 h-64 border-2 border-emerald-500 border-dashed rounded-3xl flex items-center justify-center bg-slate-50 mb-8 overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 shadow-[0_0_20px_10px_rgba(16,185,129,0.3)] animate-[scan_2s_ease-in-out_infinite]"></div>
                      <ScanLine className="w-12 h-12 text-emerald-200" />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={() => setScannerOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Camera className="w-4 h-4 mr-2" /> Open Camera
                      </Button>
                      <Button variant="outline" onClick={() => handleSimulate('valid')} disabled={loading}>Simulate Valid</Button>
                      <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleSimulate('revoked')} disabled={loading}>Simulate Revoked</Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="code" className="w-full max-w-sm flex flex-col items-center justify-center m-0 space-y-6">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-1">Enter Claim Code</h3>
                  <p className="text-sm text-slate-500">Provide the 8-character code to verify.</p>
                </div>
                <Input 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="text-center text-2xl tracking-[0.3em] font-mono h-14 uppercase"
                  placeholder="A1B2C3D4"
                  maxLength={8}
                />
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
                  onClick={handleVerifyCode}
                  disabled={code.length !== 8 || loading}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </TabsContent>

              <TabsContent value="nfc" className="w-full flex flex-col items-center justify-center m-0">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <RadioReceiver className="w-12 h-12 text-slate-400" />
                </div>
                <p className="text-slate-500">Ready to scan. Hold device near NFC tag.</p>
              </TabsContent>

              {/* Result Overlay */}
              {result && !faceVerifyOpen && (
                <div className="absolute inset-0 z-10 flex flex-col bg-white rounded-2xl p-8">
                  <div className="flex justify-end">
                    <Button variant="ghost" onClick={resetVerification}>Reset</Button>
                  </div>
                  
                  {result.status === 'valid' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                        {result.data?.face_image_url ? (
                          <img src={result.data.face_image_url} alt="" className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                        )}
                      </div>
                      <h2 className="text-3xl font-bold text-emerald-700 mb-2">Valid Credential</h2>
                      <p className="text-slate-500 mb-4">Issued by UNHCR • Active</p>
                      
                      {faceVerified === true && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
                          <ScanFace className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-emerald-700 font-medium">Face verified - identity confirmed</span>
                        </div>
                      )}
                      {faceVerified === false && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700 font-medium">Face verification failed - possible impersonation</span>
                        </div>
                      )}
                      
                      <Card className="w-full max-w-md bg-slate-50 border-emerald-100 mt-4">
                        <CardContent className="p-6 text-left space-y-4">
                          <div><span className="text-xs text-slate-500 uppercase">Subject</span><p className="font-semibold text-lg">{result.data?.given_name} {result.data?.family_name}</p></div>
                          <div><span className="text-xs text-slate-500 uppercase">Case Number</span><p className="font-mono text-slate-700">{result.data?.case_number}</p></div>
                          <div><span className="text-xs text-slate-500 uppercase">Subject DID</span><p className="font-mono text-slate-700 text-xs break-all">{result.data?.subject_did}</p></div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : result.status === 'revoked' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="w-12 h-12 text-red-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-red-700 mb-2">Revoked Credential</h2>
                      <p className="text-slate-600 max-w-md">This credential has been explicitly revoked by the issuer and is no longer valid.</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                        <ShieldAlert className="w-12 h-12 text-amber-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-amber-700 mb-2">Invalid or Unknown</h2>
                      <p className="text-slate-600 max-w-md">This credential could not be found or verified against the trust registry.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Face Verify Overlay */}
              {faceVerifyOpen && result?.data?.face_embedding && (
                <div className="absolute inset-0 z-20 flex flex-col bg-white rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <ScanFace className="w-5 h-5 text-emerald-600" />
                      Face Verification Required
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setFaceVerifyOpen(false);
                      setFaceVerified(null);
                      logVerification('valid', result!.data, undefined);
                    }}>
                      Skip
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">
                    This credential has a face photo on file. Please ask the holder to scan their face to confirm identity.
                  </p>
                  {result.data.face_image_url && (
                    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 mb-4">
                      <img src={result.data.face_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{result.data.given_name} {result.data.family_name}</p>
                        <p className="text-xs text-slate-500">Reference photo from credential</p>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 flex items-center justify-center">
                    <FaceVerify
                      storedEmbedding={deserializeEmbedding(result.data.face_embedding)}
                      onResult={handleFaceVerifyResult}
                      onCancel={() => {
                        setFaceVerifyOpen(false);
                        logVerification('valid', result!.data, undefined);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </div>

        <div>
          <Card className="border-slate-200 shadow-sm sticky top-24">
            <CardContent className="p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-600" /> Trust Anchors
              </h3>
              <p className="text-sm text-slate-500 mb-6">The system currently accepts credentials signed by the following verified issuers:</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-900">UNHCR</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-900">World Food Programme</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
