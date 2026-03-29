import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { ticketsAPI, labsAPI, pcsAPI } from '../../services/api';
import type { Lab, PC } from '../../types';

interface TicketFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [selectedLab, setSelectedLab] = useState<number | ''>('');
  const [selectedPc, setSelectedPc] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchLabs();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (selectedLab !== '') {
      fetchPcs(selectedLab as number);
      setSelectedPc('');
    } else {
      setPcs([]);
    }
  }, [selectedLab]);

  const resetForm = () => {
    setSelectedLab('');
    setSelectedPc('');
    setDescription('');
    setError('');
  };

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const data = await labsAPI.getAll();
      setLabs(data);
    } catch (err) {
      console.error('Failed to load labs', err);
      setError('Failed to load labs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPcs = async (labId: number) => {
    try {
      setLoading(true);
      const data = await pcsAPI.getByLab(labId);
      setPcs(data);
    } catch (err) {
      console.error('Failed to load PCs', err);
      setError('Failed to load PCs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPc === '' || !description.trim()) {
      setError('Please select a PC and provide an issue description.');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      await ticketsAPI.create({
        student: user!.id,
        pc: selectedPc as number,
        issue_description: description.trim()
      });
      onSuccess();
    } catch (err: any) {
      console.error('Failed to submit ticket', err);
      setError(err?.response?.data?.detail || 'Failed to submit ticket.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Report an Issue (Ticket)</DialogTitle>
        <DialogContent dividers>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <Stack spacing={3}>
            {user?.role === 'student' && (
              <TextField
                label="Student"
                value={user.username || user.email || ''}
                disabled
                fullWidth
                helperText="Submitting as your current account"
              />
            )}
            
            <TextField
              select
              label="Select Lab"
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value as unknown as number)}
              required
              fullWidth
              disabled={loading}
            >
              <MenuItem value="" disabled>Select a lab</MenuItem>
              {labs.map(lab => (
                <MenuItem key={lab.id} value={lab.id}>{lab.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Select PC"
              value={selectedPc}
              onChange={(e) => setSelectedPc(e.target.value as unknown as number)}
              required
              fullWidth
              disabled={loading || selectedLab === '' || pcs.length === 0}
            >
              {pcs.length === 0 && selectedLab !== '' ? (
                <MenuItem value="" disabled>No PCs available in this lab</MenuItem>
              ) : (
                <MenuItem value="" disabled>Select a PC</MenuItem>
              )}
              {pcs.map(pc => (
                <MenuItem key={pc.id} value={pc.id}>{pc.device_name}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Issue Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={4}
              fullWidth
              placeholder="Please describe the issue in detail..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={saving || loading}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Submit Ticket'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TicketForm;
