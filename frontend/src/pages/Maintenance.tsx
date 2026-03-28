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
import { RefreshCw } from 'lucide-react';
import { maintenanceAPI, labsAPI, labEquipmentAPI, pcsAPI } from '../services/api';
import type { MaintenanceLog, Lab, LabEquipment, PC } from '../types';

const STATUS = ['pending', 'fixed'] as const;
const EQUIPMENT_STATUS = ['working', 'not_working', 'under_repair'] as const;

// UI row shape (normalized)
type MaintRow = {
  id: number;
  equipment: string;
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
  equipment: string;
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
  const [equipment, setEquipment] = useState<LabEquipment[]>([]);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // filters
  const [q, setQ] = useState('');
  const [fLab, setFLab] = useState<number | ''>('');
  const [fEquipment, setFEquipment] = useState<string>('');
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

      const [logs, labsData, equipmentData, pcsData] = await Promise.all([
        maintenanceAPI.getAll(),
        labsAPI.getAll(),
        labEquipmentAPI.getAll(),
        pcsAPI.getAll(),
      ]);

      // Extract results from paginated responses (or plain arrays)
      const toArray = (data: any) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
      const logsArray = toArray(logs);
      const labsArray = toArray(labsData);
      const equipmentArray = toArray(equipmentData);
      const pcsArray = toArray(pcsData);

      // Map backend MaintenanceLog to UI MaintRow
      const mapped: MaintRow[] = logsArray.map((m: MaintenanceLog) => {
        let equipment_name = 'Unknown';
        let equipment_val = '';
        let lab = (m as any).lab ?? null;

        if (m.pc) {
          const pc = pcsArray.find((p: any) => p.id === m.pc);
          equipment_val = `pc-${m.pc}`;
          equipment_name = pc ? `PC: ${pc.device_name}` : `PC #${m.pc}`;
          if (!lab && pc) lab = pc.lab;
        } else if (m.lab_equipment) {
          const equip = equipmentArray.find((e: any) => e.id === m.lab_equipment);
          equipment_val = `eq-${m.lab_equipment}`;
          equipment_name = equip ? `${equip.equipment_type} (${equip.brand || 'Unknown'})` : `Equipment #${m.lab_equipment}`;
          if (!lab && equip) lab = equip.lab;
        }

        return {
          id: m.id,
          equipment: equipment_val,
          equipment_name,
          lab,
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
      setPcs(pcsArray);
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
    const isPc = formData.equipment.startsWith('pc-');
    const eqIdStr = formData.equipment.split('-')[1];
    const eqId = parseInt(eqIdStr || '0', 10);
    try {
      setSaving(true);

      const payload: any = {
        pc: isPc ? eqId : undefined,
        lab_equipment: !isPc ? eqId : undefined,
        issue_description: formData.title.trim(),
        remarks: formData.description || undefined,
        status_before: formData.status_before,
        status_after: formData.status === 'fixed' ? formData.status_after || formData.status_before : undefined,
        status: formData.status,
        fixed_on: formData.status === 'fixed' ? formData.fixed_on || new Date().toISOString() : null,
      };
      if (editingId) {
        const updated = await maintenanceAPI.update(editingId, payload);
        const getMappedName = (isPcEdit: boolean, mId: number) => {
          if (isPcEdit) {
            const pc = pcs.find(p => p.id === mId);
            return pc ? `PC: ${pc.device_name}` : `PC #${mId}`;
          } else {
            const eq = equipment.find(e => e.id === mId);
            return eq ? `${eq.equipment_type} (${eq.brand || 'Unknown'})` : `Equipment #${mId}`;
          }
        };
        const getLab = (isPcEdit: boolean, mId: number) => isPcEdit ? pcs.find(p => p.id === mId)?.lab : equipment.find(e => e.id === mId)?.lab;
        
        const mapped: MaintRow = {
          id: updated.id,
          equipment: formData.equipment,
          equipment_name: getMappedName(isPc, eqId),
          lab: getLab(isPc, eqId) || null,
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
        const getMappedName = (isPcEdit: boolean, mId: number) => {
          if (isPcEdit) {
            const pc = pcs.find(p => p.id === mId);
            return pc ? `PC: ${pc.device_name}` : `PC #${mId}`;
          } else {
            const eq = equipment.find(e => e.id === mId);
            return eq ? `${eq.equipment_type} (${eq.brand || 'Unknown'})` : `Equipment #${mId}`;
          }
        };
        const getLab = (isPcEdit: boolean, mId: number) => isPcEdit ? pcs.find(p => p.id === mId)?.lab : equipment.find(e => e.id === mId)?.lab;
        
        const mapped: MaintRow = {
          id: created.id,
          equipment: formData.equipment,
          equipment_name: getMappedName(isPc, eqId),
          lab: getLab(isPc, eqId) || null,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Maintenance Logs</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Track and manage equipment maintenance records</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{ 
                backgroundColor: 'var(--bg-main)', 
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          </div>
          
          <select
            value={fLab}
            onChange={(e) => setFLab(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ 
              backgroundColor: 'var(--bg-main)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Labs</option>
            {labs.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <select
            value={fEquipment}
            onChange={(e) => setFEquipment(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ 
              backgroundColor: 'var(--bg-main)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Items</option>
            <optgroup label="PCs">
              {pcs.map((p) => (
                <option key={`pc-${p.id}`} value={`pc-${p.id}`}>PC: {p.device_name}</option>
              ))}
            </optgroup>
            <optgroup label="Lab Equipment">
              {equipment.map((e) => (
                <option key={`eq-${e.id}`} value={`eq-${e.id}`}>{e.equipment_type} - {e.brand || 'Unknown'}</option>
              ))}
            </optgroup>
          </select>

          <select
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value as any)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ 
              backgroundColor: 'var(--bg-main)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Status</option>
            {STATUS.map((s) => (
              <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ 
              backgroundColor: 'var(--bg-main)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          />

          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ 
              backgroundColor: 'var(--bg-main)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          />

          <div className="flex gap-2">
            <button
              onClick={loadAll}
              disabled={loading}
              className="p-2 rounded-lg border transition-colors"
              style={{ 
                backgroundColor: 'var(--hover-bg)', 
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              title="Refresh"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Add className="h-4 w-4" />
              {isAdmin ? 'Add Log' : 'Report Issue'}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden mb-6 filter drop-shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--border-color)] border-t-[var(--primary-color)]"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              <p className="text-sm">
                No maintenance logs found. Try changing filters or add a new log.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase font-semibold sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Equipment</th>
                  <th className="px-6 py-4 whitespace-nowrap">Lab</th>
                  <th className="px-6 py-4 whitespace-nowrap">Issue</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status Before</th>
                  <th className="px-6 py-4 whitespace-nowrap">Reported</th>
                  <th className="px-6 py-4 whitespace-nowrap">Fixed</th>
                  {isAdmin && <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filtered.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-[var(--bg-main)] transition-colors odd:bg-transparent even:bg-[var(--bg-main)]/30 backdrop-blur-sm group"
                  >
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-[var(--text-primary)] font-medium">
                      {row.equipment_name || `Equipment #${row.equipment}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {labs.find((l) => l.id === row.lab)?.name || (row.lab ?? '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                      {row.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        row.status === 'fixed' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                      }`}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)] capitalize">
                      {row.status_before.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                      {row.reported_on?.slice(0,10)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                      {row.fixed_on ? row.fixed_on.slice(0,10) : '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <button
                              onClick={() => openEdit(row)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <Edit fontSize="small" />
                            </button>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <button
                              onClick={() => confirmDelete(row.id)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <Delete fontSize="small" />
                            </button>
                          </Tooltip>
                        </Stack>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="rounded-xl p-4 border" style={{ 
          backgroundColor: '#FEE2E2', 
          borderColor: '#FCA5A5'
        }}>
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl p-4 border" style={{ 
          backgroundColor: '#D1FAE5', 
          borderColor: '#6EE7B7'
        }}>
          <p className="text-sm" style={{ color: '#065F46' }}>{success}</p>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth PaperProps={{ style: { backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', backgroundImage: 'none' } }}>
        <form onSubmit={handleSave}>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>{editingId ? 'Edit Maintenance Log' : 'Report Issue'}</DialogTitle>
          <DialogContent dividers style={{ borderColor: 'var(--border-color)' }}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                select
                label="Target Equipment"
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                required
                fullWidth
                slotProps={{
                  inputLabel: { style: { color: 'var(--text-secondary)' } },
                  input: { style: { color: 'var(--text-primary)' } }
                }}
              >
                <MenuItem value="" disabled>Select target</MenuItem>
                <optgroup label="PCs">
                  {pcs.map((p) => (
                    <MenuItem key={`pc-${p.id}`} value={`pc-${p.id}`}>PC: {p.device_name} (Lab {p.lab})</MenuItem>
                  ))}
                </optgroup>
                <optgroup label="Lab Equipment">
                  {equipment.map((e) => (
                    <MenuItem key={`eq-${e.id}`} value={`eq-${e.id}`}>{e.equipment_type} - {e.brand || 'Unknown'} (Lab {e.lab})</MenuItem>
                  ))}
                </optgroup>
              </TextField>

              <TextField
                label="Issue Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
                slotProps={{
                  inputLabel: { style: { color: 'var(--text-secondary)' } },
                  input: { style: { color: 'var(--text-primary)' } }
                }}
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
                slotProps={{
                  inputLabel: { style: { color: 'var(--text-secondary)' } },
                  input: { style: { color: 'var(--text-primary)' } }
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  fullWidth
                  slotProps={{
                    inputLabel: { style: { color: 'var(--text-secondary)' } },
                    input: { style: { color: 'var(--text-primary)' } }
                  }}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="fixed">Fixed</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Status Before"
                  value={formData.status_before}
                  onChange={(e) => setFormData({ ...formData, status_before: e.target.value as any })}
                  fullWidth
                  slotProps={{
                    inputLabel: { style: { color: 'var(--text-secondary)' } },
                    input: { style: { color: 'var(--text-primary)' } }
                  }}
                >
                  <MenuItem value="working">Working</MenuItem>
                  <MenuItem value="not_working">Not Working</MenuItem>
                  <MenuItem value="under_repair">Under Repair</MenuItem>
                </TextField>
              </div>

              {formData.status === 'fixed' && (
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    type="datetime-local"
                    label="Fixed On"
                    value={formData.fixed_on ? formData.fixed_on.slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, fixed_on: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    fullWidth
                    InputLabelProps={{ shrink: true, style: { color: 'var(--text-secondary)' } }}
                    slotProps={{ input: { style: { color: 'var(--text-primary)' } } }}
                  />
                  <TextField
                    select
                    label="Status After"
                    value={formData.status_after}
                    onChange={(e) => setFormData({ ...formData, status_after: e.target.value as any })}
                    fullWidth
                    slotProps={{
                      inputLabel: { style: { color: 'var(--text-secondary)' } },
                      input: { style: { color: 'var(--text-primary)' } }
                    }}
                  >
                    <MenuItem value="">Not Specified</MenuItem>
                    <MenuItem value="working">Working</MenuItem>
                    <MenuItem value="not_working">Not Working</MenuItem>
                    <MenuItem value="under_repair">Under Repair</MenuItem>
                  </TextField>
                </div>
              )}
            </Stack>
          </DialogContent>
          <DialogActions style={{ padding: '16px', borderColor: 'var(--border-color)' }}>
            <Button onClick={() => setOpenForm(false)} style={{ color: 'var(--text-secondary)' }}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={saving}
              style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Log'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default Maintenance;
