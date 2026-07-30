import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/PortalLayout';
import { Users, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { VerificationLog } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function AuditLog() {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await supabase
          .from('verification_logs')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setLogs(data);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <PortalLayout 
      title="Admin Panel" 
      accentColor="text-fuchsia-600"
      navItems={[
        { label: 'Users & Roles', href: '/admin', icon: Users },
        { label: 'Audit Log', href: '/admin/audit', icon: FileText },
      ]}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Audit Log</h1>
        <p className="text-slate-500 mt-2">Global immutable record of verification events.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Verifier ID</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Subject DID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{log.verifier_id.substring(0,8)}...</TableCell>
                  <TableCell className="uppercase text-xs font-semibold">{log.method}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      log.result === 'valid' ? 'bg-emerald-100 text-emerald-700' :
                      log.result === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.result}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{log.subject_did}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PortalLayout>
  );
}
