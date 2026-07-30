import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/PortalLayout';
import { Users, FileText, UserPlus, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminUserListResult, AppRole } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

export default function UsersRoles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUserListResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({ email: '', display_name: '', role: 'issuer' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_users');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error(error);
      toast({ title: "Error fetching users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock account creation & role grant
      const password = Math.random().toString(36).slice(-8) + "A!1";
      const { data, error } = await supabase.auth.signUp({
        email: createData.email,
        password,
        options: { data: { display_name: createData.display_name } }
      });
      if (error) throw error;
      
      if (data.user && createData.role !== 'holder') {
        await supabase.rpc('admin_grant_role', { _target_user: data.user.id, _role: createData.role });
      }

      toast({ title: "User created", description: `Temporary password: ${password}` });
      setIsCreateOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Creation failed", description: error.message, variant: "destructive" });
    }
  };

  const grantRole = async (targetId: string, role: AppRole) => {
    try {
      await supabase.rpc('admin_grant_role', { _target_user: targetId, _role: role });
      fetchUsers();
    } catch (e) {
      toast({ title: "Failed to grant role", variant: "destructive" });
    }
  };

  const revokeRole = async (targetId: string, role: AppRole) => {
    if (targetId === user?.id && role === 'admin') {
      toast({ title: "Cannot revoke own admin role", variant: "destructive" });
      return;
    }
    try {
      await supabase.rpc('admin_revoke_role', { _target_user: targetId, _role: role });
      fetchUsers();
    } catch (e) {
      toast({ title: "Failed to revoke role", variant: "destructive" });
    }
  };

  const getRoleColor = (role: AppRole) => {
    switch(role) {
      case 'admin': return 'bg-fuchsia-100 text-fuchsia-700';
      case 'issuer': return 'bg-amber-100 text-amber-700';
      case 'verifier': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const filtered = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PortalLayout 
      title="Admin Panel" 
      accentColor="text-fuchsia-600"
      navItems={[
        { label: 'Users & Roles', href: '/admin', icon: Users },
        { label: 'Audit Log', href: '/admin/audit', icon: FileText },
      ]}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Users & Roles</h1>
          <p className="text-slate-500 mt-2">Manage access controls for the platform.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 bg-white"
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fuchsia-600 hover:bg-fuchsia-700 shrink-0">
                <UserPlus className="w-4 h-4 mr-2" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Provision New User</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={createData.email} onChange={e => setCreateData({...createData, email: e.target.value})} required type="email" />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input value={createData.display_name} onChange={e => setCreateData({...createData, display_name: e.target.value})} required />
                </div>
                <div>
                  <Label>Role to Grant</Label>
                  <Select value={createData.role} onValueChange={v => setCreateData({...createData, role: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issuer">Issuer (UNHCR Staff)</SelectItem>
                      <SelectItem value="verifier">Verifier (Bank/Border)</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">Create & Grant</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-500">Loading...</TableCell></TableRow>
            ) : filtered.map(u => (
              <TableRow key={u.user_id}>
                <TableCell>
                  <div className="font-medium text-slate-900">{u.display_name || 'No name'}</div>
                  <div className="text-sm text-slate-500">{u.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    {u.roles.map(r => (
                      <Badge key={r} variant="secondary" className={`${getRoleColor(r)} border-0 font-semibold uppercase tracking-wider text-[10px]`}>
                        {r}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Select onValueChange={(r) => grantRole(u.user_id, r as AppRole)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Add Role"/></SelectTrigger>
                      <SelectContent>
                        {['issuer', 'verifier', 'admin'].filter(r => !u.roles.includes(r as any)).map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {u.roles.filter(r => r !== 'holder').length > 0 && (
                      <Select onValueChange={(r) => revokeRole(u.user_id, r as AppRole)}>
                        <SelectTrigger className="w-[120px] h-8 text-xs text-red-600 border-red-200"><SelectValue placeholder="Revoke Role"/></SelectTrigger>
                        <SelectContent>
                          {u.roles.filter(r => r !== 'holder').map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PortalLayout>
  );
}
