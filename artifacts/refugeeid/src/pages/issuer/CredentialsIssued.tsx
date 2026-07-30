import React, { useEffect, useState, useRef } from 'react';
import { PortalLayout } from '@/components/PortalLayout';
import { FilePlus, List, Shield, Search, Loader2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { IssuedCredential } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function CredentialsIssued() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<IssuedCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCredentials('');
  }, [user]);

  const fetchCredentials = async (q: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('issued_credentials')
        .select('*')
        .eq('issuer_id', user?.id)
        .order('created_at', { ascending: false });

      if (q.trim()) {
        query = query.or(
          `given_name.ilike.%${q}%,family_name.ilike.%${q}%,case_number.ilike.%${q}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching', error);
    } finally {
      setLoading(false);
    }
  };

  const runSearch = () => {
    setActiveSearch(inputValue);
    fetchCredentials(inputValue);
  };

  const clearSearch = () => {
    setInputValue('');
    setActiveSearch('');
    fetchCredentials('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runSearch();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('issued_credentials')
        .update({ status: 'revoked' })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Credential Revoked', variant: 'destructive' });
      fetchCredentials(activeSearch);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const isExpired = (cred: IssuedCredential) =>
    !cred.claimed_at && cred.claim_code_expires_at && new Date(cred.claim_code_expires_at) < new Date();

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
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Credentials Issued</h1>
          <p className="text-slate-500 mt-2">Manage identity credentials issued by you.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder="Search by name or case #"
              className="pl-9 pr-8 bg-white border-slate-200"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {inputValue && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            onClick={runSearch}
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            Search
          </Button>
        </div>
      </div>

      {activeSearch && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-slate-500">
            Results for <strong>"{activeSearch}"</strong> — {credentials.length} found
          </span>
          <button onClick={clearSearch} className="text-xs text-amber-600 hover:underline">
            Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Case Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Claim Code</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span className="text-slate-500">Loading records...</span>
                  </TableCell>
                </TableRow>
              ) : credentials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <List className="h-8 w-8 mb-2 opacity-50" />
                      <p>{activeSearch ? 'No matching credentials' : 'No credentials issued yet'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                credentials.map(cred => (
                  <TableRow key={cred.id}>
                    <TableCell className="font-medium text-slate-900">
                      {cred.given_name} {cred.family_name}
                      <div className="text-xs text-slate-500 font-normal">{cred.nationality}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{cred.case_number}</TableCell>
                    <TableCell>
                      {cred.status === 'active' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Active</Badge>
                      ) : (
                        <Badge variant="destructive" className="border-0">Revoked</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {cred.claimed_at ? (
                        <span className="text-xs text-slate-500">Claimed</span>
                      ) : isExpired(cred) ? (
                        <span className="text-xs text-red-500 font-medium">Expired</span>
                      ) : (
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-700">{cred.claim_code}</code>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(cred.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      {cred.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                          onClick={() => handleRevoke(cred.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PortalLayout>
  );
}
