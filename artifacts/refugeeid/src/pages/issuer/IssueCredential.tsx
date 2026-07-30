import React, { useState } from 'react';
import { PortalLayout } from '@/components/PortalLayout';
import { FilePlus, List, Shield, CheckCircle2, Copy, Camera, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { FaceCapture } from '@/components/FaceCapture';
import { serializeEmbedding } from '@/lib/face-utils';

export default function IssueCredential() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    given_name: '',
    family_name: '',
    date_of_birth: '',
    nationality: '',
    gender: '',
    case_number: '',
    arrival_site: ''
  });

  const [issuedCode, setIssuedCode] = useState('');
  const [capturedFace, setCapturedFace] = useState<{ imageUrl: string; embedding: number[] } | null>(null);

  const generateClaimCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(array[i] % chars.length);
    }
    return code;
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleFaceCaptured = (data: { imageUrl: string; embedding: number[] }) => {
    setCapturedFace(data);
    setStep(4);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const claimCode = generateClaimCode();
      const cred: any = {
        ...formData,
        issuer_id: user?.id,
        issuer_did: 'did:web:unhcr.refugee-id.org',
        subject_did: 'did:key:pending-' + crypto.randomUUID().slice(0, 8),
        vc_id: 'vc:' + crypto.randomUUID(),
        status: 'active',
        claim_code: claimCode,
        claim_code_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      if (capturedFace) {
        cred.face_image_url = capturedFace.imageUrl;
        cred.face_embedding = serializeEmbedding(capturedFace.embedding);
        cred.face_verification_status = 'pending';
      }

      const { error } = await supabase.from('issued_credentials').insert(cred);
      if (error) throw error;

      setIssuedCode(claimCode);
      setStep(5);
      toast({ title: 'Credential Issued Successfully' });
    } catch (error: any) {
      toast({ title: 'Issue Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      given_name: '', family_name: '', date_of_birth: '', nationality: '', gender: '', case_number: '', arrival_site: ''
    });
    setIssuedCode('');
    setCapturedFace(null);
    setStep(1);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(issuedCode);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <PortalLayout 
      title="Issuer Portal" 
      accentColor="text-amber-500"
      navItems={[
        { label: 'Issue Credential', href: '/issuer', icon: FilePlus },
        { label: 'Credentials Issued', href: '/issuer/list', icon: List },
        { label: 'Trust Registry', href: '/issuer/trust', icon: Shield },
      ]}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Issue New Credential</h1>
          <p className="text-slate-500 mt-2">Create a secure digital identity for a beneficiary.</p>
        </div>

        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-500 -z-10 rounded transition-all duration-300" style={{ width: step === 1 ? '0%' : step === 2 ? '25%' : step === 3 ? '50%' : step === 4 ? '75%' : '100%' }}></div>
          
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${step >= i ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>
              {i}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Identity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="given_name">Given Name(s)</Label>
                  <Input id="given_name" value={formData.given_name} onChange={(e) => setFormData({...formData, given_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="family_name">Family Name</Label>
                  <Input id="family_name" value={formData.family_name} onChange={(e) => setFormData({...formData, family_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(val) => setFormData({...formData, gender: val})}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="undisclosed">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case_number">Case Number</Label>
                  <Input id="case_number" value={formData.case_number} onChange={(e) => setFormData({...formData, case_number: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="arrival_site">Arrival Site / Camp</Label>
                  <Input id="arrival_site" value={formData.arrival_site} onChange={(e) => setFormData({...formData, arrival_site: e.target.value})} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4 border-t border-slate-100">
              <Button 
                onClick={handleNext} 
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={!formData.given_name || !formData.family_name || !formData.case_number}
              >
                Review Details
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Review Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div><span className="text-sm text-slate-500 block mb-1">Given Name</span><span className="font-medium">{formData.given_name}</span></div>
                <div><span className="text-sm text-slate-500 block mb-1">Family Name</span><span className="font-medium">{formData.family_name}</span></div>
                <div><span className="text-sm text-slate-500 block mb-1">Date of Birth</span><span className="font-medium">{formData.date_of_birth}</span></div>
                <div><span className="text-sm text-slate-500 block mb-1">Gender</span><span className="font-medium">{formData.gender}</span></div>
                <div><span className="text-sm text-slate-500 block mb-1">Nationality</span><span className="font-medium">{formData.nationality}</span></div>
                <div><span className="text-sm text-slate-500 block mb-1">Case Number</span><span className="font-mono font-medium">{formData.case_number}</span></div>
                <div className="md:col-span-2"><span className="text-sm text-slate-500 block mb-1">Arrival Site</span><span className="font-medium">{formData.arrival_site}</span></div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={handleBack}>Back to Edit</Button>
              <Button onClick={() => setStep(3)} className="bg-amber-600 hover:bg-amber-700 text-white">
                Next: Capture Face
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                Capture Beneficiary Face
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Take a photo of the beneficiary. This face image will be linked to their credential and used for identity verification during claiming and verification.
              </p>
            </CardHeader>
            <CardContent>
              <FaceCapture
                onCaptured={handleFaceCaptured}
                onCancel={() => setStep(2)}
              />
            </CardContent>
          </Card>
        )}

        {step === 4 && capturedFace && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Confirm Face & Issue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={capturedFace.imageUrl}
                      alt="Captured face"
                      className="w-32 h-40 object-cover rounded-xl border-2 border-slate-200"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="font-semibold text-lg">{formData.given_name} {formData.family_name}</h3>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700">Face captured successfully. Embedding stored.</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      The face image and biometric embedding will be stored with this credential. When the beneficiary claims this credential, they will need to verify their face matches.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retake Photo
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? 'Issuing...' : 'Confirm & Issue Credential'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 5 && (
          <Card className="border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-amber-500">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Credential Issued</h2>
              <p className="text-slate-500 mb-8 max-w-md">
                The credential has been securely recorded. Provide this code to the beneficiary so they can claim it in their wallet.
              </p>
              
              {capturedFace && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3 max-w-sm">
                  <img src={capturedFace.imageUrl} alt="Beneficiary face" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-emerald-800">Face linked to credential</p>
                    <p className="text-xs text-emerald-600">Holder must verify face when claiming</p>
                  </div>
                </div>
              )}
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 w-full max-w-sm relative">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Claim Code</p>
                <div className="flex items-center justify-center gap-4">
                  <code className="text-4xl font-mono font-bold tracking-[0.2em] text-slate-900">{issuedCode}</code>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard} className="text-slate-400 hover:text-amber-600">
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="bg-white p-4 border border-slate-100 rounded-lg shadow-sm mb-8">
                <QRCodeSVG value={issuedCode} size={150} />
              </div>

              <Button onClick={resetForm} variant="outline" className="min-w-[200px]">Issue Another</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
