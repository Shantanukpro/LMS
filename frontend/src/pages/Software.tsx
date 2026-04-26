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
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Refresh, Edit, Delete, Search } from '@mui/icons-material';
import { softwareAPI, labsAPI, pcsAPI } from '../services/api';
import type { Software as SoftwareType, Lab, PC } from '../types';
import LicenseDashboard from '../components/Software/LicenseDashboard';
import ModernTable from '../components/Common/ModernTable';
import ModernTableRow from '../components/Common/ModernTableRow';
import EquipmentCard from '../components/Labs/EquipmentCard';
import BooleanBadge from '../components/Labs/BooleanBadge';
import { Layers, Key, Calendar, Monitor, X } from 'lucide-react';

type SoftwareForm = {
  pc: number | '';
  name: string;
  version: string;
  license_key: string;
  expiry_date: string; // YYYY-MM-DD
};

const emptyForm: SoftwareForm = {
  pc: '',
  name: '',
  version: '',
  license_key: '',
  expiry_date: '',
};

const Software: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<SoftwareType[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // filters
  const [q, setQ] = useState('');
  const [fLab, setFLab] = useState<number | ''>('');
  const [fPc, setFPc] = useState<number | ''>('');
  const [tabValue, setTabValue] = useState(0);

  // form
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SoftwareForm>(emptyForm);

  // delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [labsData, softwareData] = await Promise.all([
        labsAPI.getAll(),
        softwareAPI.getAll(),
      ]);
      // Extract results from paginated responses (or plain arrays)
      const toArray = (data: any) => Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const labsArray = toArray(labsData);
      const softwareArray = toArray(softwareData);
      setLabs(labsArray);

      // Load PCs for all labs so we can map pc -> lab
      const pcsAll: PC[] = [];
      for (const lab of labsArray) {
        try {
          const labPcs = await pcsAPI.getByLab(lab.id);
          // Extract results from paginated response if needed
          const pcsArray = Array.isArray((labPcs as any)?.results) ? (labPcs as any).results : (Array.isArray(labPcs) ? labPcs : []);
          pcsAll.push(...pcsArray);
        } catch (err: any) {
          console.warn(`Failed to load PCs for lab ${lab.id}:`, err);
        }
      }
      setPcs(pcsAll);
      setItems(softwareArray);
    } catch (e: any) {
      console.error('Failed to load software:', e);
      setError(e?.response?.data?.detail || 'Failed to load software. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const pcToLab = (pcId: number) => pcs.find((p) => p.id === pcId)?.lab;
  const pcsForLab = (labId: number | '') => (labId ? pcs.filter((p) => p.lab === labId) : pcs);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchLab = fLab ? pcToLab(it.pc) === fLab : true;
      const matchPc = fPc ? it.pc === fPc : true;
      const text = `${it.name} ${it.version ?? ''} ${it.license_key ?? ''}`.toLowerCase();
      const matchQ = q ? text.includes(q.toLowerCase()) : true;
      return matchLab && matchPc && matchQ;
    });
  }, [items, fLab, fPc, q, pcs]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (row: SoftwareType) => {
    setEditingId(row.id);
    setFormData({
      pc: row.pc,
      name: row.name,
      version: row.version || '',
      license_key: row.license_key || '',
      expiry_date: row.expiry_date ? row.expiry_date.slice(0,10) : '',
    });
    setOpenForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pc || !formData.name.trim()) {
      setError('PC and name are required');
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        pc: formData.pc,
        name: formData.name.trim(),
        version: formData.version.trim() || undefined,
        license_key: formData.license_key.trim() || undefined,
        expiry_date: formData.expiry_date || undefined,
      };
      if (editingId) {
        const updated = await softwareAPI.update(editingId, payload);
        setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        setSuccess('Software updated');
      } else {
        const created = await softwareAPI.create(formData.pc as number, payload);
        setItems((prev) => [created, ...prev]);
        setSuccess('Software created');
      }
      setOpenForm(false);
    } catch (err: any) {
      console.error('Failed to save software:', err);
      const data = err?.response?.data;
      if (data) {
        const msgs: string[] = [];
        Object.entries(data).forEach(([k, v]) => {
          if (Array.isArray(v)) msgs.push(`${k}: ${v.join(' ')}`);
          else if (typeof v === 'string') msgs.push(`${k}: ${v}`);
        });
        setError(msgs.join('\n') || 'Save failed');
      } else {
        setError('Failed to save software. Please check your data and try again.');
      }
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
      await softwareAPI.delete(deleteId);
      setItems((prev) => prev.filter((x) => x.id !== deleteId));
      setSuccess('Software deleted');
    } catch (e) {
      setError('Delete failed');
    } finally {
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Software & Licenses
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'var(--border-color)', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} variant="fullWidth">
          <Tab label="Software Inventory" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }} />
          <Tab label="License Dashboard" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box className="animate-fade-in">
          {/* Tailwind CSS Filter Bar */}
          <div className="mb-6 flex flex-col gap-4">
            {/* Top row: Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white/50 dark:bg-slate-900/40 p-3 rounded-[1.25rem] border border-slate-200 dark:border-slate-800/60 shadow-sm backdrop-blur-xl transition-all duration-300">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search fontSize="small" className="text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  placeholder="Name, version or license..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-full text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 shadow-sm transition-all duration-300"
                />
              </div>

              <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
                <select
                  value={fLab}
                  onChange={(e) => { setFLab(e.target.value === '' ? '' : Number(e.target.value)); setFPc(''); }}
                  className="appearance-none cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all duration-300 dark:backdrop-blur-md"
                >
                  <option value="" className="dark:bg-slate-800">All Labs</option>
                  {labs.map((l) => (
                    <option key={l.id} value={l.id} className="dark:bg-slate-800">{l.name}</option>
                  ))}
                </select>

                <select
                  value={fPc}
                  onChange={(e) => setFPc(e.target.value === '' ? '' : Number(e.target.value))}
                  className="appearance-none cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all duration-300 dark:backdrop-blur-md"
                >
                  <option value="" className="dark:bg-slate-800">All PCs</option>
                  {pcsForLab(fLab).map((p) => (
                    <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.device_name}</option>
                  ))}
                </select>

                <Tooltip title="Refresh">
                  <button
                    onClick={loadAll}
                    disabled={loading}
                    className="p-2.5 rounded-full border border-transparent text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? <CircularProgress size={18} color="inherit" /> : <Refresh fontSize="small" />}
                  </button>
                </Tooltip>

                {isAdmin && (
                  <button
                    onClick={openCreate}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ml-1"
                  >
                    <Add fontSize="small" />
                    <span>Add Software</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Chips */}
            {(q || fLab || fPc) && (
              <div className="flex flex-wrap gap-2 items-center px-2 animate-fade-in">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1 uppercase tracking-wider">Active Filters:</span>
                
                {q && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                    <span className="text-slate-400">Search:</span> {q}
                    <button onClick={() => setQ('')} className="text-slate-400 hover:text-rose-500 ml-0.5 focus:outline-none transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                )}
                
                {fLab && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                    <span className="text-slate-400">Lab:</span> {labs.find(l => l.id === fLab)?.name}
                    <button onClick={() => setFLab('')} className="text-slate-400 hover:text-rose-500 ml-0.5 focus:outline-none transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                )}

                {fPc && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300">
                    <span className="text-slate-400">PC:</span> {pcs.find(p => p.id === fPc)?.device_name}
                    <button onClick={() => setFPc('')} className="text-slate-400 hover:text-rose-500 ml-0.5 focus:outline-none transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                )}

                <button
                  onClick={() => { setQ(''); setFLab(''); setFPc(''); }}
                  className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-semibold px-2 py-1 ml-1 cursor-pointer transition-colors duration-300 opacity-80 hover:opacity-100"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

      {/* Table Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ModernTable
        columns={[
          { header: 'Software Name' },
          { header: 'Lab / PC' },
          { header: 'Version' },
          { header: 'Status' },
          { header: 'Actions', align: 'right' }
        ]}
        isEmpty={filtered.length === 0}
        emptyMessage={items.length > 0 ? "No software matches filters" : "No software found"}
      >
        {filtered.map((row) => (
          <ModernTableRow
            key={row.id}
            colSpan={5}
            mainRow={
              <>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white tracking-tight">
                    {row.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-600 dark:text-gray-300">
                      {pcs.find((p) => p.id === row.pc)?.device_name || 'Generic PC'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                      {labs.find((l) => l.id === pcToLab(row.pc))?.name || 'Unknown Lab'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/10">
                    {row.version || 'v1.0'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {row.expiry_date && new Date(row.expiry_date) < new Date() ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right pr-6">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {isAdmin && (
                      <>
                        <Tooltip title="Edit Software">
                          <IconButton 
                            size="small" 
                            onClick={() => openEdit(row)}
                            sx={{ color: 'rgba(100,116,139,0.5)', '&:hover': { color: '#3b82f6', background: 'rgba(59,130,246,0.1)' } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Software">
                          <IconButton 
                            size="small" 
                            onClick={() => confirmDelete(row.id)}
                            sx={{ color: 'rgba(100,116,139,0.5)', '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.1)' } }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </td>
              </>
            }
            expandedContent={
              <div className="p-6 bg-slate-50/50 dark:bg-[#0d1117] border-t border-slate-200 dark:border-white/5 animate-fade-in shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Basic Info */}
                  <EquipmentCard 
                    title="Software Identity"
                    icon={Layers}
                    accentColor="blue"
                    fields={[
                      { label: 'Name', value: row.name },
                      { label: 'Version', value: row.version || '—' },
                      { label: 'DB ID', value: row.id }
                    ]}
                  />

                  {/* License Info */}
                  <EquipmentCard 
                    title="License Details"
                    icon={Key}
                    accentColor="purple"
                    fields={[
                      { 
                        label: 'License Key', 
                        value: row.license_key ? (
                          <span className="font-mono text-xs bg-white dark:bg-white/5 px-2 py-1 rounded border border-slate-200 dark:border-white/10 block mt-1">
                            {row.license_key}
                          </span>
                        ) : 'Not Provided'
                      }
                    ]}
                  />

                  {/* PC Hosting */}
                  <EquipmentCard 
                    title="Installation Target"
                    icon={Monitor}
                    accentColor="teal"
                    fields={[
                      { label: 'PC Name', value: pcs.find((p) => p.id === row.pc)?.device_name || '—' },
                      { label: 'Lab Name', value: labs.find((l) => l.id === pcToLab(row.pc))?.name || '—' }
                    ]}
                  />

                  {/* Expiry */}
                  <EquipmentCard 
                    title="Validity"
                    icon={Calendar}
                    accentColor="emerald"
                    fields={[
                      { label: 'Expiry Date', value: row.expiry_date ? row.expiry_date.slice(0, 10) : 'Lifetime / Permanent' }
                    ]}
                  />
                </div>
              </div>
            }
          />
        ))}
      </ModernTable>
      )}

      {/* Create/Edit Dialog */}
      {isAdmin && (
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Edit Software' : 'Add Software'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label="Lab" value={fLab} onChange={(e) => { const labVal = e.target.value === '' ? '' : Number(e.target.value); setFLab(labVal); setFormData({ ...formData, pc: '' }); }} fullWidth>
                  <MenuItem value="">Select Lab (optional)</MenuItem>
                  {labs.map((l) => (
                    <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="PC" value={formData.pc} onChange={(e) => setFormData({ ...formData, pc: e.target.value === '' ? '' : Number(e.target.value) })} required fullWidth>
                  {pcsForLab(fLab).map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.device_name}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required fullWidth />
                <TextField label="Version" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} fullWidth />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="License Key" value={formData.license_key} onChange={(e) => setFormData({ ...formData, license_key: e.target.value })} fullWidth />
                <TextField label="Expiry Date" type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
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
        <DialogTitle>Delete Software?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this software? This action cannot be undone.</Typography>
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
      )}

      {tabValue === 1 && (
        <Box className="animate-fade-in mt-4">
          <LicenseDashboard softwareList={items} pcs={pcs} labs={labs} />
        </Box>
      )}
    </Box>
  );
};

export default Software;
