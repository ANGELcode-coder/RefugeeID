import React from 'react';
import { PortalLayout } from '@/components/PortalLayout';
import { ScanLine, History, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrustAnchors() {
  const anchors = [
    { name: 'UNHCR', did: 'did:web:unhcr.refugee-id.org', keys: 'Ed25519', status: 'Active', synced: '2 hours ago' },
    { name: 'World Food Programme', did: 'did:web:wfp.refugee-id.org', keys: 'Ed25519', status: 'Active', synced: '5 hours ago' },
  ];

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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Trust Anchors</h1>
        <p className="text-slate-500 mt-2">Trusted issuers configured for your verification node.</p>
      </div>

      <div className="grid gap-6">
        {anchors.map(anchor => (
          <Card key={anchor.did} className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-500" />
                {anchor.name}
              </CardTitle>
              <div className="flex items-center text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {anchor.status}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block text-slate-500 mb-1">DID</span>
                  <code className="text-slate-900 bg-slate-50 px-2 py-1 rounded">{anchor.did}</code>
                </div>
                <div>
                  <span className="block text-slate-500 mb-1">Supported Keys</span>
                  <span className="font-medium text-slate-900">{anchor.keys}</span>
                </div>
                <div>
                  <span className="block text-slate-500 mb-1">Last Synced</span>
                  <span className="text-slate-900">{anchor.synced}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
