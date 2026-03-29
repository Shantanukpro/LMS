import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { labsAPI, musterAPI } from '../services/api';
import type { Lab } from '../types';
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Delete, Save, ArrowBack } from '@mui/icons-material';

interface SimplifiedPC {
  id: number;
  device_name: string;
}

const MusterRegister: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<SimplifiedPC[]>([]);
  const [selectedLab, setSelectedLab] = useState<number | ''>('');
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0] as string,
    time: '',
    class_name: '',
    batch: '',
  });
  const [entries, setEntries] = useState<Array<{ sr_no: number; roll_no: string; pc: number | '' }>>([{
    sr_no: 1,
    roll_no: '',
    pc: '',
  }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch labs on mount
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const data = await labsAPI.getAll();
        setLabs(data);
      } catch (err: any) {
        setError('Failed to load labs');
        console.error(err);
      }
    };
    fetchLabs();
  }, []);

  // Fetch PCs when lab changes
  useEffect(() => {
    if (selectedLab) {
      const fetchPCs = async () => {
        try {
          const data = await musterAPI.getPCsForLab(selectedLab as number);
          setPcs(data);
        } catch (err: any) {
          setError('Failed to load PCs for the selected lab');
          console.error(err);
        }
      };
      fetchPCs();
    } else {
      setPcs([]);
    }
  }, [selectedLab]);

  // Load session data if editing
  useEffect(() => {
    if (sessionId) {
      const fetchSession = async () => {
        try {
          setLoading(true);
          const data = await musterAPI.getSession(parseInt(sessionId));
          setForm({
            date: data.date,
            time: data.time?.substring(0, 5) || '',
            class_name: data.class_name,
            batch: data.batch,
          });
          setSelectedLab(data.lab);
          setEntries(
            data.entries.map((entry: any) => ({
              sr_no: entry.sr_no,
              roll_no: entry.roll_no,
              pc: entry.pc || '',
            }))
          );
          setIsEditMode(true);
        } catch (err: any) {
          setError('Failed to load session');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchSession();
    }
  }, [sessionId]);

  // Handle time rounding to nearest 30 minutes
  const handleTimeChange = (time: string) => {
    if (time) {
      const parts = time.split(':').map(Number);
      const hours = parts[0] ?? 0;
      const minutes = parts[1] ?? 0;
      let roundedMinutes = 0;
      let roundedHours = hours;
      if (minutes < 15) {
        roundedMinutes = 0;
      } else if (minutes < 45) {
        roundedMinutes = 30;
      } else {
        roundedMinutes = 0;
        roundedHours = (hours + 1) % 24;
      }
      const roundedTime = `${String(roundedHours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
      setForm(prev => ({ ...prev, time: roundedTime }));
    } else {
      setForm(prev => ({ ...prev, time: '' }));
    }
  };

  const handleLabChange = (value: string) => {
    const labId = value ? Number(value) : '';
    setSelectedLab(labId);
    setEntries([{ sr_no: 1, roll_no: '', pc: '' }]);
  };

  // Entry management
  const handleAddRow = () => {
    setEntries(prev => [
      ...prev,
      { sr_no: prev.length + 1, roll_no: '', pc: '' },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (entries.length <= 1) {
      setError('At least one row is required');
      return;
    }
    setEntries(prev =>
      prev
        .filter((_, i) => i !== index)
        .map((e, i) => ({ ...e, sr_no: i + 1 }))
    );
  };

  const handleRollNoChange = (index: number, value: string) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, roll_no: value } : e));
  };

  const handlePcChange = (index: number, value: string) => {
    const pcId = value ? Number(value) : '';
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, pc: pcId as number | '' } : e));
  };

  // Save
  const handleSave = async () => {
    if (!form.date || !form.time || !form.class_name || !form.batch || !selectedLab) {
      setError('Please fill in all session details (Date, Time, Lab, Class, Batch)');
      return;
    }

    const invalidEntries = entries.some(e => !e.roll_no || !e.pc);
    if (invalidEntries) {
      setError('Please fill in Roll No and PC for every entry row');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const timeForApi = form.time.length === 5 ? `${form.time}:00` : form.time;
      const mappedEntries = entries.map(e => ({
        sr_no: e.sr_no,
        roll_no: e.roll_no,
        pc: e.pc as number,
      }));

      if (isEditMode && sessionId) {
        await musterAPI.updateSession(parseInt(sessionId), {
          date: form.date,
          time: timeForApi,
          lab: selectedLab as number,
          class_name: form.class_name,
          batch: form.batch,
          entries: mappedEntries,
        });
        setSuccess('Muster register updated successfully');
      } else {
        const sessionData = await musterAPI.createSession({
          date: form.date,
          time: timeForApi,
          lab: selectedLab as number,
          class_name: form.class_name,
          batch: form.batch,
        });
        await musterAPI.saveEntries(sessionData.id, mappedEntries);
        setSuccess('Muster register created successfully');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save muster register');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Tooltip title="Back to list">
          <IconButton onClick={() => navigate('/muster/list')}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.3px' }}>
            {isEditMode ? 'Edit Muster Register' : 'New Muster Register'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {isEditMode ? 'Modify the attendance register session' : 'Create a new attendance register session'}
          </Typography>
        </Box>
      </Stack>

      {/* Session Details Form */}
      <div className="rounded-xl border p-6 mb-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Session Details</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TextField
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
          <TextField
            label="Time (HH:MM)"
            type="time"
            value={form.time}
            onChange={(e) => handleTimeChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            helperText="Rounded to nearest 30 min"
          />
          <TextField
            select
            label="Lab"
            value={selectedLab}
            onChange={(e) => handleLabChange(e.target.value)}
            fullWidth
            required
          >
            <MenuItem value="">Select Lab</MenuItem>
            {labs.map(lab => (
              <MenuItem key={lab.id} value={lab.id}>{lab.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Class"
            value={form.class_name}
            onChange={(e) => setForm(prev => ({ ...prev, class_name: e.target.value }))}
            placeholder="e.g., SE Computer"
            fullWidth
            required
          />
          <TextField
            label="Batch"
            value={form.batch}
            onChange={(e) => setForm(prev => ({ ...prev, batch: e.target.value }))}
            placeholder="e.g., Batch A"
            fullWidth
            required
          />
        </div>
      </div>

      {/* Entries */}
      <div className="rounded-xl border overflow-hidden mb-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Student Entries</Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={handleAddRow} size="small">
            Add Row
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap w-20">Sr. No</th>
                <th className="px-6 py-4 whitespace-nowrap">Roll No</th>
                <th className="px-6 py-4 whitespace-nowrap">PC</th>
                <th className="px-6 py-4 whitespace-nowrap text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {entries.map((entry, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-main)] transition-colors">
                  <td className="px-6 py-3 text-sm text-[var(--text-primary)] font-medium">{entry.sr_no}</td>
                  <td className="px-6 py-3">
                    <TextField
                      value={entry.roll_no}
                      onChange={(e) => handleRollNoChange(idx, e.target.value)}
                      placeholder="Enter roll number"
                      size="small"
                      fullWidth
                    />
                  </td>
                  <td className="px-6 py-3">
                    <TextField
                      select
                      value={entry.pc}
                      onChange={(e) => handlePcChange(idx, e.target.value)}
                      size="small"
                      fullWidth
                      disabled={!selectedLab}
                    >
                      <MenuItem value="">Select PC</MenuItem>
                      {pcs.map(pc => (
                        <MenuItem key={pc.id} value={pc.id}>{pc.device_name}</MenuItem>
                      ))}
                    </TextField>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Tooltip title="Remove row">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={entries.length <= 1}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save / Reset */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={() => {
            if (isEditMode && sessionId) {
              navigate('/muster/list');
            } else {
              setForm({ date: new Date().toISOString().split('T')[0] as string, time: '', class_name: '', batch: '' });
              setSelectedLab('');
              setEntries([{ sr_no: 1, roll_no: '', pc: '' }]);
              setIsEditMode(false);
              setSuccess('');
              setError('');
            }
          }}
        >
          {isEditMode ? 'Cancel' : 'Reset'}
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          onClick={handleSave}
          disabled={saving}
        >
          {isEditMode ? 'Update Register' : 'Save Register'}
        </Button>
      </Stack>

      {/* Alerts */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} variant="filled">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default MusterRegister;