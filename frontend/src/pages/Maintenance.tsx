import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Refresh, Edit, Delete, Search } from '@mui/icons-material';
// Using native date inputs to avoid extra dependencies
import { maintenanceAPI, labsAPI, equipmentAPI } from '../services/api';
import type { MaintenanceLog, Lab, Equipment } from '../types';

const STATUS = ['pending', 'fixed'] as const;
const EQUIPMENT_STATUS = ['working', 'not_working', 'under_repair'] as const;

// UI row shape (normalized)
type MaintRow = {
  id: number;
  equipment: number;
  equipment_name?: string;
  lab: number | null;
  title: string;
  description?: string;
  status: 'pending' | 'fixed';
  status_before: string;
  status_after?: string;
  reported_on: string;
  fixed_on?: string | null;
};

type MaintForm = {
  equipment: number | '';
  title: string;
  description: string;
  status: (typeof STATUS)[number];
  status_before: (typeof EQUIPMENT_STATUS)[number];
  status_after: (typeof EQUIPMENT_STATUS)[number] | '';
  reported_on: string; // ISO
  fixed_on?: string | null; // ISO
};

const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<MaintRow[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // filters
  const [q, setQ] = useState('');
  const [fLab, setFLab] = useState<number | ''>('');
  const [fEquipment, setFEquipment] = useState<number | ''>('');
  const [fStatus, setFStatus] = useState<(typeof STATUS)[number] | ''>('');
  const [from, setFrom] = useState<string>(''); // YYYY-MM-DD
  const [to, setTo] = useState<string>('');

  // form
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MaintForm>({
    equipment: '',
    title: '',
    description: '',
    status: 'pending',
    status_before: 'working',
    status_after: '',
    reported_on: new Date().toISOString(),
    fixed_on: null,
  });

  // delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [logs, labsData, equipmentData] = await Promise.all([
        maintenanceAPI.getAll(),
        labsAPI.getAll(),
        equipmentAPI.getAll(),
      ]);

      // Extract results from paginated responses (or plain arrays)
      const toArray = (data: any) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
      const logsArray = toArray(logs);
      const labsArray = toArray(labsData);
      const equipmentArray = toArray(equipmentData);

      // Map backend MaintenanceLog to UI MaintRow
      const mapped: MaintRow[] = logsArray.map((m: MaintenanceLog) => {
        const equip = equipmentArray.find((e: any) => e.id === m.equipment);
        return {
          id: m.id,
          equipment: m.equipment,
          equipment_name: equip ? `${equip.equipment_type} - ${equip.brand || 'Unknown'}` : `Equipment #${m.equipment}`,
          lab: (m as any).lab ?? equip?.lab ?? null,
          title: (m as any).issue_description || '',
          description: (m as any).remarks ?? '',
          status: m.status as 'pending' | 'fixed',
          status_before: (m as any).status_before || 'working',
          status_after: (m as any).status_after,
          reported_on: (m as any).reported_on,
          fixed_on: (m as any).fixed_on ?? null,
        };
      });

      setItems(mapped);
      setLabs(labsArray);
      setEquipment(equipmentArray);
    } catch (error: any) {
      console.error('Failed to load maintenance logs:', error);
      setError(error?.response?.data?.detail || 'Failed to load maintenance logs. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchLab = fLab ? it.lab === fLab : true;
      const matchEquipment = fEquipment ? it.equipment === fEquipment : true;
      const matchStatus = fStatus ? it.status === fStatus : true;
      const text = `${it.title} ${it.description ?? ''} ${it.equipment_name ?? ''}`.toLowerCase();
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      const itDate = it.reported_on?.slice(0,10);
      const matchFrom = from ? itDate >= from : true;
      const matchTo = to ? itDate <= to : true;
      return matchLab && matchEquipment && matchStatus && matchQ && matchFrom && matchTo;
    });
  }, [items, fLab, fEquipment, fStatus, q, from, to]);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      equipment: '',
      title: '',
      description: '',
      status: 'pending',
      status_before: 'working',
      status_after: '',
      reported_on: new Date().toISOString(),
      fixed_on: null,
    });
    setOpenForm(true);
  };

  const openEdit = (row: MaintRow) => {
    setEditingId(row.id);
    setFormData({
      equipment: row.equipment,
      title: row.title,
      description: row.description || '',
      status: row.status as any,
      status_before: row.status_before as any,
      status_after: row.status_after as any || '',
      reported_on: row.reported_on,
      fixed_on: row.fixed_on || null,
    });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipment || !formData.title.trim()) {
      setError('Equipment and title are required');
      return;
    }
    try {
      setSaving(true);

      const payload: any = {
        equipment: formData.equipment,
        issue_description: formData.title.trim(),
        remarks: formData.description || undefined,
        status_before: formData.status_before,
        status_after: formData.status === 'fixed' ? formData.status_after || formData.status_before : undefined,
        status: formData.status,
        fixed_on: formData.status === 'fixed' ? formData.fixed_on || new Date().toISOString() : null,
      };
      if (editingId) {
        const updated = await maintenanceAPI.update(editingId, payload);
        const equip = equipment.find(e => e.id === updated.equipment);
        const mapped: MaintRow = {
          id: updated.id,
          equipment: updated.equipment,
          equipment_name: equip ? `${equip.equipment_type} - ${equip.brand || 'Unknown'}` : `Equipment #${updated.equipment}`,
          lab: equip?.lab || null,
          title: updated.issue_description || formData.title,
          description: updated.remarks ?? formData.description,
          status: updated.status,
          status_before: updated.status_before || formData.status_before,
          status_after: updated.status_after,
          reported_on: updated.reported_on,
          fixed_on: updated.fixed_on ?? null,
        };
        setItems((prev) => prev.map((x) => (x.id === editingId ? mapped : x)));
        setSuccess('Maintenance updated');
      } else {
        const created = await maintenanceAPI.create(payload);
        const equip = equipment.find(e => e.id === created.equipment);
        const mapped: MaintRow = {
          id: created.id,
          equipment: created.equipment,
          equipment_name: equip ? `${equip.equipment_type} - ${equip.brand || 'Unknown'}` : `Equipment #${created.equipment}`,
          lab: equip?.lab || null,
          title: created.issue_description || formData.title,
          description: created.remarks ?? formData.description,
          status: created.status,
          status_before: created.status_before || formData.status_before,
          status_after: created.status_after,
          reported_on: created.reported_on,
          fixed_on: created.fixed_on ?? null,
        };
        setItems((prev) => [mapped, ...prev]);
        setSuccess('Maintenance created');
      }
      setOpenForm(false);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) {
        const msgs: string[] = [];
        Object.entries(data).forEach(([k, v]) => {
          if (Array.isArray(v)) msgs.push(`${k}: ${v.join(' ')}`);
          else if (typeof v === 'string') msgs.push(`${k}: ${v}`);
        });
        setError(msgs.join('\n') || 'Save failed');
      } else setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await maintenanceAPI.delete(deleteId);
      setItems((prev) => prev.filter((x) => x.id !== deleteId));
      setSuccess('Maintenance deleted');
    } catch (e) {
      setError('Delete failed');
    } finally {
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Maintenance Logs
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              label="Search"
              placeholder="Title or description..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{ endAdornment: <Search fontSize="small" /> }}
              sx={{ flex: 1 }}
            />
            <TextField select label="Lab" value={fLab} onChange={(e) => setFLab(e.target.value === '' ? '' : Number(e.target.value))} sx={{ minWidth: 180 }}>
              <MenuItem value="">All</MenuItem>
              {labs.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Equipment" value={fEquipment} onChange={(e) => setFEquipment(e.target.value === '' ? '' : Number(e.target.value))} sx={{ minWidth: 200 }}>
              <MenuItem value="">All</MenuItem>
              {equipment.map((e) => (
                <MenuItem key={e.id} value={e.id}>{e.equipment_type} - {e.brand || 'Unknown'}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Status" value={fStatus} onChange={(e) => setFStatus(e.target.value as any)} sx={{ minWidth: 160 }}>
              <MenuItem value="">All</MenuItem>
              {STATUS.map((s) => (
                <MenuItem key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={loadAll} disabled={loading}>
                  {loading ? <CircularProgress size={22} /> : <Refresh />}
                </IconButton>
              </span>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              {isAdmin ? 'Add Log' : 'Report Issue'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 6 }}>
              <Typography>No maintenance logs found. Try changing filters or add a new log.</Typography>
            </Box>
          ) : (
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <Box component="thead" sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey.100' : 'grey.200' }}>
                <Box component="tr">
                  <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Equipment</Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Lab</Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Issue</Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Status</Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Status Before</Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Reported</Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Fixed</Box>
                  <Box component="th" sx={{ textAlign: 'right', p: 1.5, color: 'text.primary', fontWeight: 600 }}>Actions</Box>
                </Box>
              </Box>
              <Box component="tbody">
                {filtered.map((row) => (
                  <Box key={row.id} component="tr" sx={{ '&:nth-of-type(even)': { backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.100' } }}>
                    <Box component="td" sx={{ p: 1.5, color: 'text.primary' }}>{row.equipment_name || `Equipment #${row.equipment}`}</Box>
                    <Box component="td" sx={{ p: 1.5, color: 'text.primary' }}>{labs.find((l) => l.id === row.lab)?.name || (row.lab ?? '-')}</Box>
                    <Box component="td" sx={{ p: 1.5, color: 'text.primary' }}>{row.title}</Box>
                    <Box component="td" sx={{ p: 1.5, textTransform: 'capitalize', color: 'text.primary' }}>{row.status}</Box>
                    <Box component="td" sx={{ p: 1.5, textTransform: 'capitalize', color: 'text.secondary' }}>{row.status_before.replace('_', ' ')}</Box>
                    <Box component="td" sx={{ p: 1.5, color: 'text.secondary' }}>{row.reported_on?.slice(0,10)}</Box>
                    <Box component="td" sx={{ p: 1.5, color: 'text.secondary' }}>{row.fixed_on ? row.fixed_on.slice(0,10) : '-'}</Box>
                    <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>
                      {isAdmin && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton color="info" onClick={() => openEdit(row)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton color="error" onClick={() => confirmDelete(row.id)}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Edit Maintenance' : (isAdmin ? 'Add Maintenance' : 'Report Issue')}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Equipment" value={formData.equipment} onChange={(e) => {
                  const equipId = Number(e.target.value);
                  const selectedEquip = equipment.find(eq => eq.id === equipId);
                  setFormData({ ...formData, equipment: equipId, status_before: selectedEquip?.status || 'working' });
                }} required fullWidth>
                  {equipment.map((e) => (
                    <MenuItem key={e.id} value={e.id}>{e.equipment_type} - {e.brand || 'Unknown'} (Lab: {labs.find(l => l.id === e.lab)?.name || e.lab})</MenuItem>
                  ))}
                </TextField>
                <TextField label="Issue Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required fullWidth />
              </Stack>
              <TextField label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} multiline minRows={3} fullWidth />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Status Before" value={formData.status_before} onChange={(e) => setFormData({ ...formData, status_before: e.target.value as any })} fullWidth>
                  {EQUIPMENT_STATUS.map((s) => (
                    <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Current Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} fullWidth disabled={!isAdmin}>
                  {STATUS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
                {formData.status === 'fixed' && (
                  <TextField select label="Status After Fix" value={formData.status_after} onChange={(e) => setFormData({ ...formData, status_after: e.target.value as any })} fullWidth disabled={!isAdmin}>
                    {EQUIPMENT_STATUS.map((s) => (
                      <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                    ))}
                  </TextField>
                )}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Reported On" type="date" value={formData.reported_on.slice(0,10)} onChange={(e) => setFormData({ ...formData, reported_on: new Date(e.target.value).toISOString() })} InputLabelProps={{ shrink: true }} disabled={!isAdmin} />
                <TextField label="Fixed On" type="date" value={formData.fixed_on ? formData.fixed_on.slice(0,10) : ''} onChange={(e) => setFormData({ ...formData, fixed_on: e.target.value ? new Date(e.target.value).toISOString() : null })} InputLabelProps={{ shrink: true }} disabled={!isAdmin || formData.status !== 'fixed'} />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirm */}
      {isAdmin && (
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Maintenance?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this log? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      )}

      {/* Alerts */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} sx={{ whiteSpace: 'pre-line' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Maintenance;
