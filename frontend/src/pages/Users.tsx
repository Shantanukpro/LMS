import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, Typography, Card, CardContent, Stack, TextField, MenuItem, 
  CircularProgress, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Avatar, Snackbar, Alert, Dialog, 
  DialogTitle, DialogContent, DialogContentText, DialogActions, Chip 
} from '@mui/material';
import { Search, WarningRounded } from '@mui/icons-material';
import { usersAPI } from '../services/api';
import type { User } from '../types';

const Users: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [q, setQ] = useState('');
  const [fRole, setFRole] = useState<string | ''>('');

  // Dialog state
  const [promoteId, setPromoteId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (e: any) {
      console.error('Failed to load users:', e);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchRole = fRole ? u.role === fRole : true;
      const text = `${u.username || ''} ${u.email || ''}`.toLowerCase();
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      return matchRole && matchQ;
    });
  }, [users, fRole, q]);

  const totals = useMemo(() => {
    return users.reduce((acc, u) => {
      acc.total += 1;
      if (u.role === 'admin') acc.admins += 1;
      return acc;
    }, { total: 0, admins: 0, students: 0 });
  }, [users]);
  totals.students = totals.total - totals.admins;

  const handlePromote = async () => {
    if (!promoteId) return;
    setActionLoading(true);
    try {
      await usersAPI.promote(promoteId);
      setSuccess('User promoted to Admin successfully');
      setPromoteId(null);
      load();
    } catch (err) {
      setError('Failed to promote user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await usersAPI.delete(deleteId);
      setSuccess('User account deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">Access Denied: Admins Only</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.5px' }}>
          User Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Manage roles, accounts, and system access
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Users', value: totals.total, color: 'text.primary' },
          { label: 'Total Admins', value: totals.admins, color: 'indigo.500', isTailwind: true },
          { label: 'Total Students', value: totals.students, color: 'text.secondary' }
        ].map((stat, idx) => (
          <Card key={idx} className="glass-panel" sx={{ flex: 1, borderRadius: '16px', bgcolor: 'background.paper', backgroundImage: 'none' }}>
            <CardContent sx={{ py: 3, px: 4 }}>
              <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.secondary', tracking: 'widest' }}>
                {stat.label}
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700, 
                mt: 1,
                color: stat.isTailwind ? 'var(--color-brand-500, #6366f1)' : stat.color
              }}>
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Filters */}
      <Card className="glass-panel" sx={{ mb: 4, borderRadius: '16px', bgcolor: 'background.paper', backgroundImage: 'none' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Search Users"
              placeholder="Search by name or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{ endAdornment: <Search fontSize="small" sx={{ color: 'text.secondary' }} /> }}
              sx={{ flex: 1 }}
              size="medium"
            />
            <TextField 
              select 
              label="Role Filter" 
              value={fRole} 
              onChange={(e) => setFRole(e.target.value)} 
              sx={{ minWidth: 200 }}
              size="medium"
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="student">Student</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Users Table */}
      <TableContainer component={Paper} className="glass-panel" sx={{ borderRadius: '16px', boxShadow: 'none', bgcolor: 'background.paper', backgroundImage: 'none' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No users found matching the current filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map((u) => (
                <TableRow key={u.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'all 0.2s ease-in-out' }}>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: u.role === 'admin' ? '#6366f1' : 'action.selected', color: u.role === 'admin' ? '#fff' : 'text.primary', fontWeight: 600 }}>
                        {u.username?.charAt(0).toUpperCase() || '?'}
                      </Avatar>
                      <Typography sx={{ fontWeight: 500, color: 'text.primary' }}>{u.username}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={u.role.toUpperCase()} 
                      size="small" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        bgcolor: u.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(113, 113, 122, 0.1)',
                        color: u.role === 'admin' ? '#6366f1' : 'text.secondary',
                        border: '1px solid',
                        borderColor: u.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(113, 113, 122, 0.2)',
                        borderRadius: '9999px'
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {u.role !== 'admin' && (
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => setPromoteId(u.id)}
                          sx={{ 
                            borderRadius: '20px', 
                            textTransform: 'none', 
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                            color: '#6366f1',
                            '&:hover': {
                              borderColor: '#6366f1',
                              bgcolor: 'rgba(99, 102, 241, 0.04)'
                            }
                          }}
                        >
                          Promote
                        </Button>
                      )}
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="error"
                        onClick={() => setDeleteId(u.id)}
                        sx={{ borderRadius: '20px', textTransform: 'none' }}
                        disabled={u.id === user?.id} // cannot delete self
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Promote Dialog */}
      <Dialog 
        open={!!promoteId} 
        onClose={() => setPromoteId(null)}
        PaperProps={{ sx: { borderRadius: '16px', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Promote User to Admin</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to promote this user to an Administrator? This will grant them full access to the system.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPromoteId(null)} color="inherit" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handlePromote} variant="contained" disabled={actionLoading} sx={{ borderRadius: '8px', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
            {actionLoading ? 'Promoting...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog 
        open={!!deleteId} 
        onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { borderRadius: '16px', backgroundImage: 'none', maxWidth: '400px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 700 }}>
          <WarningRounded />
          Delete Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action is permanent and cannot be undone. Are you sure you want to permanently delete this user account?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteId(null)} color="inherit" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={actionLoading} sx={{ borderRadius: '8px' }}>
            {actionLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} variant="filled">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} variant="filled">{success}</Alert>
      </Snackbar>

    </Box>
  );
};

export default Users;
