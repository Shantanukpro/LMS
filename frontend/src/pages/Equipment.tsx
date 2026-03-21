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
  InputAdornment,
  Chip,
  Divider,
  CardActions,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add, Refresh, Edit, Delete, Search } from '@mui/icons-material';
import { labEquipmentAPI, labsAPI } from '../services/api';
import type { LabEquipment, Lab } from '../types';
 

const EQUIPMENT_TYPES = [
  'SERVER', 'ROUTER', 'SWITCH', 'HUB', 'PROJECTOR', 'E_BOARD', 'AC', 'FAN', 'LIGHT', 'UPS', 'OTHER',
] as const;
const STATUS = ['working', 'not_working', 'under_repair'] as const;

type EquipmentForm = {
  lab: number | '';
  name: string;
  equipment_code: string;
  equipment_type: (typeof EQUIPMENT_TYPES)[number] | '';
  brand: string;
  model_name: string;
  location_in_lab: string;
  status: (typeof STATUS)[number] | '';
};

const emptyForm: EquipmentForm = {
  lab: '',
  name: '',
  equipment_code: '',
  equipment_type: '',
  brand: '',
  model_name: '',
  location_in_lab: '',
  status: 'working',
};

const Equipment: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<LabEquipment[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // filters
  const [q, setQ] = useState('');
  const [fLab, setFLab] = useState<number | ''>('');
  const [fType, setFType] = useState<(typeof EQUIPMENT_TYPES)[number] | ''>('');
  const [fStatus, setFStatus] = useState<(typeof STATUS)[number] | ''>('');

  // form
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EquipmentForm>(emptyForm);

  // delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [eqps, labsData] = await Promise.all([
        labEquipmentAPI.getAll(),
        labsAPI.getAll(),
      ]);
      // Extract results from paginated responses (or plain arrays)
      const toArray = (data: any) => Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const equipmentArray = toArray(eqps);
      const labsArray = toArray(labsData);
      setItems(equipmentArray);
      setLabs(labsArray);
    } catch (e: any) {
      console.error('Failed to load equipment:', e);
      setError(e?.response?.data?.detail || 'Failed to load equipment. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchLab = fLab ? it.lab === fLab : true;
      const matchType = fType ? it.equipment_type === fType : true;
      const matchStatus = fStatus ? it.status === fStatus : true;
      const text = `${it.brand ?? ''} ${it.model_name ?? ''}`.toLowerCase();
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      return matchLab && matchType && matchStatus && matchQ;
    });
  }, [items, fLab, fType, fStatus, q]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (row: LabEquipment) => {
    setEditingId(row.id);
    setFormData({
      lab: row.lab,
      name: row.name || '',
      equipment_code: row.equipment_code,
      equipment_type: row.equipment_type,
      brand: row.brand || '',
      model_name: row.model_name || '',
      location_in_lab: row.location_in_lab || '',
      status: row.status,
    });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lab || !formData.equipment_type || !formData.name.trim() || !formData.equipment_code.trim()) {
      setError('Lab, equipment type, name, and equipment code are required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        lab: formData.lab,
        name: formData.name.trim(),
        equipment_code: formData.equipment_code.trim(),
        equipment_type: formData.equipment_type,
        brand: formData.brand || undefined,
        model_name: formData.model_name || undefined,
        location_in_lab: formData.location_in_lab || undefined,
        status: formData.status || 'working',
      };
      if (editingId) {
        const updated = await labEquipmentAPI.update(editingId, payload);
        setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        setSuccess('Equipment updated');
      } else {
        const created = await labEquipmentAPI.create(payload as any);
        setItems((prev) => [created, ...prev]);
        setSuccess('Equipment created');
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
      await labEquipmentAPI.delete(deleteId);
      setItems((prev) => prev.filter((x) => x.id !== deleteId));
      setSuccess('Equipment deleted');
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
        Equipment
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              label="Search"
              placeholder="Brand or model..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Search fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Lab"
              value={fLab}
              onChange={(e) => setFLab(e.target.value === '' ? '' : Number(e.target.value))}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All</MenuItem>
              {labs.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Type" value={fType} onChange={(e) => setFType(e.target.value as any)} sx={{ minWidth: 160 }}>
              <MenuItem value="">All</MenuItem>
              {EQUIPMENT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Status" value={fStatus} onChange={(e) => setFStatus(e.target.value as any)} sx={{ minWidth: 180 }}>
              <MenuItem value="">All</MenuItem>
              {STATUS.map((s) => (
                <MenuItem key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
              ))}
            </TextField>
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={loadAll} disabled={loading}>
                  {loading ? <CircularProgress size={22} /> : <Refresh />}
                </IconButton>
              </span>
            </Tooltip>
            {isAdmin && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Equipment</Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', color: 'text.secondary', py: 8 }}>
            <Typography variant="h6">
              {items.length > 0 ? 'No equipment matches your search' : 'No equipment found'}
            </Typography>
            <Typography>
              {items.length > 0 ? 'Try different filters.' : 'Click "Add Equipment" to create some.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((item) => (
            <Grid item xs={12} sm={6} md={4} size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {item.brand || 'Generic'} {item.model_name}
                    </Typography>
                    <Chip
                      label={item.status.replace('_', ' ')}
                      color={item.status === 'working' ? 'success' : item.status === 'not_working' ? 'error' : 'warning'}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Stack>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {item.equipment_type}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2">
                    <strong>Lab:</strong> {labs.find(l => l.id === item.lab)?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Location:</strong> {item.location_in_lab || '-'}
                  </Typography>
                </CardContent>
                {isAdmin && (
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <Tooltip title="Edit">
                      <IconButton color="info" size="small" onClick={() => openEdit(item)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" size="small" onClick={() => confirmDelete(item.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      {isAdmin && (
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField select label="Lab" value={formData.lab} onChange={(e) => setFormData({ ...formData, lab: e.target.value === '' ? '' : Number(e.target.value) })} required fullWidth>
                  {labs.map((l) => (
                    <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Type" value={formData.equipment_type} onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value as any })} required fullWidth>
                  {EQUIPMENT_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField label="Equipment Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required fullWidth />
                <TextField label="Equipment Code" value={formData.equipment_code} onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })} required fullWidth />
              </Stack>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField label="Brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} fullWidth />
                <TextField label="Model" value={formData.model_name} onChange={(e) => setFormData({ ...formData, model_name: e.target.value })} fullWidth />
              </Stack>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField label="Location" value={formData.location_in_lab} onChange={(e) => setFormData({ ...formData, location_in_lab: e.target.value })} fullWidth />
                <TextField select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} fullWidth>
                  {STATUS.map((s) => (
                    <MenuItem key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
      )}

      {/* Delete confirm */}
      {isAdmin && (
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Equipment?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this item? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      )}

      {/* Alerts */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} sx={{ whiteSpace: 'pre-line' }} variant="filled">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Equipment;
