import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/PortalLayout';
import { ScanLine, History, ShieldAlert, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { VerificationLog } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function VerificationHistory() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      const { data } = await supabase
        .from('verification_logs')
        .select('*')
        .eq('verifier_id', user?.id)
        .order('created_at', { ascending: false });
      if (data) setLogs(data);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Verification History</h1>
        <p className="text-slate-500 mt-2">Log of credentials verified by you.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead>Subject DID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No verifications yet</TableCell></TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </TableCell>
                  <TableCell className="uppercase text-xs font-semibold tracking-wider text-slate-500">
                    {log.method}
                  </TableCell>
                  <TableCell>
                    {log.result === 'valid' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Valid</Badge>}
                    {log.result === 'revoked' && <Badge variant="destructive" className="border-0">Revoked</Badge>}
                    {log.result === 'unknown' && <Badge variant="secondary" className="border-0">Unknown</Badge>}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.issuer}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {log.subject_did.substring(0, 16)}...
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PortalLayout>
  );
}
