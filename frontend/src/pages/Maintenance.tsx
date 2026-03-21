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
import { maintenanceAPI, labsAPI, labEquipmentAPI } from '../services/api';
import type { MaintenanceLog, Lab, LabEquipment } from '../types';

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
  const [equipment, setEquipment] = useState<LabEquipment[]>([]);
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
        labEquipmentAPI.getAll(),
      ]);

      // Extract results from paginated responses (or plain arrays)
      const toArray = (data: any) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
      const logsArray = toArray(logs);
      const labsArray = toArray(labsData);
      const equipmentArray = toArray(equipmentData);

      // Map backend MaintenanceLog to UI MaintRow
      const mapped: MaintRow[] = logsArray.map((m: MaintenanceLog) => {
        const equip = equipmentArray.find((e: any) => e.id === m.lab_equipment);
        return {
          id: m.id,
          equipment: m.lab_equipment!,
          equipment_name: equip ? `${equip.equipment_type} - ${equip.brand || 'Unknown'}` : `Equipment #${m.lab_equipment}`,
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
        lab_equipment: formData.equipment,
        issue_description: formData.title.trim(),
        remarks: formData.description || undefined,
        status_before: formData.status_before,
        status_after: formData.status === 'fixed' ? formData.status_after || formData.status_before : undefined,
        status: formData.status,
        fixed_on: formData.status === 'fixed' ? formData.fixed_on || new Date().toISOString() : null,
      };
      if (editingId) {
        const updated = await maintenanceAPI.update(editingId, payload);
        const equip = equipment.find(e => e.id === updated.lab_equipment);
        const mapped: MaintRow = {
          id: updated.id,
          equipment: updated.lab_equipment!,
          equipment_name: equip ? `${equip.equipment_type} - ${equip.brand || 'Unknown'}` : `Equipment #${updated.lab_equipment}`,
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
        const equip = equipment.find(e => e.id === created.lab_equipment);
        const mapped: MaintRow = {
          id: created.id,
          equipment: created.lab_equipment!,
          equipment_name: equip ? `${equip.equipment_type} - ${equip.brand || 'Unknown'}` : `Equipment #${created.lab_equipment}`,
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
            onChange={(e) => setFEquipment(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ 
              backgroundColor: 'var(--bg-main)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Equipment</option>
            {equipment.map((e) => (
              <option key={e.id} value={e.id}>{e.equipment_type} - {e.brand || 'Unknown'}</option>
            ))}
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
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No maintenance logs found. Try changing filters or add a new log.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--accent-bg)' }}>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Equipment</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Lab</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Issue</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Status Before</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Reported</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Fixed</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr 
                    key={row.id} 
                    className="border-t transition-colors hover:bg-opacity-50"
                    style={{ 
                      borderColor: 'var(--border-color)',
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--hover-bg)'
                    }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {row.equipment_name || `Equipment #${row.equipment}`}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {labs.find((l) => l.id === row.lab)?.name || (row.lab ?? '-')}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {row.title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        row.status === 'fixed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {row.status_before.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {row.reported_on?.slice(0,10)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {row.fixed_on ? row.fixed_on.slice(0,10) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(row)}
                            className="p-1 rounded hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => confirmDelete(row.id)}
                            className="p-1 rounded hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Delete className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </td>
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
    </div>
  );
};

export default Maintenance;
