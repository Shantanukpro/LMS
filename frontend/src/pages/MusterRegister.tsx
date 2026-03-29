import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { labsAPI, musterAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Lab, User } from '../types';
import { 
  Box, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

// Sub-components
import SessionDetailsCard from '../components/Muster/SessionDetailsCard';
import QuickStatsBar from '../components/Muster/QuickStatsBar';
import StudentEntriesTable from '../components/Muster/StudentEntriesTable';
import MusterBottomBar from '../components/Muster/MusterBottomBar';
import BulkActionsBar from '../components/Muster/BulkActionsBar';
import MusterPreviewModal from '../components/Muster/MusterPreviewModal';

interface Entry {
  sr_no: number;
  roll_no: string;
  student_name: string;
  pc: number | '';
  attendance: 'P' | 'A';
}

const MusterRegister: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user: currentUser } = useAuth();

  // Data State
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [sessionFormData, setSessionFormData] = useState({
    date: (new Date().toISOString().split('T')[0]) as string,
    time: '' as string,
    lab: '' as number | '',
    className: '' as string,
    batch: '' as string,
    sessionType: 'Practical' as string,
    duration: '120' as string,
    subject: '' as string,
  });

  const [entries, setEntries] = useState<Entry[]>([
    { sr_no: 1, roll_no: '', student_name: '', pc: '', attendance: 'P' }
  ]);

  // UI State
  const [editingIndices, setEditingIndices] = useState<Set<number>>(new Set([0]));
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = entries.length;
    const present = entries.filter(e => e.attendance === 'P').length;
    return { total, present, absent: total - present };
  }, [entries]);

  // Initial Fetch
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setLoading(true);
        const labsData = await labsAPI.getAll();
        setLabs(labsData);

        if (sessionId) {
          const session = await musterAPI.getSession(parseInt(sessionId));
          setSessionFormData({
            date: session.date,
            time: session.time?.substring(0, 5) || '',
            lab: session.lab,
            className: session.class_name,
            batch: session.batch,
            sessionType: (session as any).session_type || 'Practical',
            duration: (session as any).duration_mins?.toString() || '120',
            subject: (session as any).subject || '',
          });
          
          const mappedEntries = session.entries.map(e => ({
            sr_no: e.sr_no,
            roll_no: e.roll_no,
            student_name: (e as any).student_name || '',
            pc: e.pc,
            attendance: (e as any).attendance || 'P'
          }));
          setEntries(mappedEntries);
          setEditingIndices(new Set()); // Start with all collapsed if loaded
        }
      } catch (err) {
        setError('Critical: Could not synchronize with backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchBaseData();
  }, [sessionId]);

  // Fetch PCs when lab changes
  useEffect(() => {
    if (sessionFormData.lab) {
      const fetchPCs = async () => {
        try {
          const data = await musterAPI.getPCsForLab(sessionFormData.lab as number);
          setPcs(data);
        } catch (err) {
          setError('Warning: PC synchronization failed for this lab.');
        }
      };
      fetchPCs();
    } else {
      setPcs([]);
    }
  }, [sessionFormData.lab]);

  // Handlers
  const handleSessionFieldChange = (field: string, value: any) => {
    setSessionFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleTimeChange = (time: string) => {
    if (!time) {
      setSessionFormData(prev => ({ ...prev, time: '' }));
      return;
    }
    const parts = time.split(':');
    const h = parts[0] ? Number(parts[0]) : 0;
    const m = parts[1] ? Number(parts[1]) : 0;
    const roundedM = m < 15 ? 0 : m < 45 ? 30 : 0;
    const roundedH = m >= 45 ? (h + 1) % 24 : h;
    const roundedTime = `${String(roundedH).padStart(2, '0')}:${String(roundedM).padStart(2, '0')}`;
    setSessionFormData(prev => ({ ...prev, time: roundedTime }));
    setHasUnsavedChanges(true);
  };

  const handleEntryChange = (index: number, updates: Partial<Entry>) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, ...updates } : e));
    setHasUnsavedChanges(true);
    
    // Auto-disable PC if absent
    if (updates.attendance === 'A') {
      setEntries(prev => prev.map((e, i) => i === index ? { ...e, pc: '', attendance: 'A' } : e));
    }
  };

  const handleAddRow = () => {
    const newIdx = entries.length;
    setEntries(prev => [...prev, {
      sr_no: prev.length + 1,
      roll_no: '',
      student_name: '',
      pc: '',
      attendance: 'P'
    }]);
    setEditingIndices(prev => new Set(prev).add(newIdx));
    setHasUnsavedChanges(true);
  };

  const handleRemoveRow = (index: number) => {
    if (entries.length <= 1) {
      setError('A valid register requires at least one student entry.');
      return;
    }
    setEntries(prev => prev.filter((_, i) => i !== index).map((e, i) => ({ ...e, sr_no: i + 1 })));
    setEditingIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleToggleEdit = (index: number, isSavingRow: boolean) => {
    setEditingIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleToggleSelect = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAll = (all: boolean) => {
    if (all) setSelectedIndices(new Set(entries.keys()));
    else setSelectedIndices(new Set());
  };

  // Bulk Handlers
  const handleBulkMarkAttendance = (status: 'P' | 'A') => {
    setEntries(prev => prev.map((e, i) => 
      selectedIndices.has(i) 
        ? { ...e, attendance: status, pc: status === 'A' ? '' : e.pc } 
        : e
    ));
    setHasUnsavedChanges(true);
  };

  const handleBulkDelete = () => {
    setEntries(prev => 
      prev
        .filter((_, i) => !selectedIndices.has(i))
        .map((e, i) => ({ ...e, sr_no: i + 1 }))
    );
    setSelectedIndices(new Set());
    setHasUnsavedChanges(true);
  };

  const handleReset = () => {
    if (!hasUnsavedChanges) {
      resetForm();
      return;
    }
    setShowResetConfirm(true);
  };

  const resetForm = () => {
    setSessionFormData({
      date: new Date().toISOString().split('T')[0] ?? '',
      time: '',
      lab: '',
      className: '',
      batch: '',
      sessionType: 'Practical',
      duration: '120',
      subject: '',
    });
    setEntries([{ sr_no: 1, roll_no: '', student_name: '', pc: '', attendance: 'P' }]);
    setEditingIndices(new Set([0]));
    setSelectedIndices(new Set());
    setHasUnsavedChanges(false);
    setShowResetConfirm(false);
  };

  const handleSave = async () => {
    // 1. Validation
    if (!sessionFormData.lab || !sessionFormData.className || !sessionFormData.batch || !sessionFormData.time) {
      setError('Information Missing: Please complete all session detail fields.');
      return;
    }

    const invalidEntries = entries.some(e => e.attendance === 'P' && (!e.roll_no || e.pc === ''));
    if (invalidEntries) {
      setError('Incomplete Entries: Roll number and PC assignment required for present students.');
      return;
    }

    // Check duplicates
    const rolls = entries.map(e => e.roll_no).filter(Boolean);
    if (new Set(rolls).size !== rolls.length) {
      setError('Duplicate Conflict: Multiple entries found for the same roll number.');
      return;
    }

    setSaving(true);
    try {
      const payload: { date: string; time: string; lab: number; class_name: string; batch: string } = {
        date: sessionFormData.date as string,
        time: `${sessionFormData.time}:00`,
        lab: sessionFormData.lab as number,
        class_name: sessionFormData.className,
        batch: sessionFormData.batch,
      };

      const mappedEntries = entries.map(e => ({
        sr_no: e.sr_no,
        roll_no: e.roll_no,
        pc: e.pc as number,
      }));

      if (sessionId) {
        await musterAPI.updateSession(parseInt(sessionId), { 
          ...payload, 
          entries: mappedEntries 
        });
      } else {
        const session = await musterAPI.createSession(payload);
        await musterAPI.saveEntries(session.id, mappedEntries);
      }

      setSuccess('Register Committed: Attendance record successfully synchronized.');
      setHasUnsavedChanges(false);
      setTimeout(() => navigate('/muster/list'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Handshake Error: Failed to commit register to server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'column', alignItems: 'center', justifyContent: 'center', py: 20, gap: 2 }}>
        <CircularProgress size={40} thickness={4} sx={{ color: 'teal.500' }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, animate: 'pulse' }}>
          Initializing Neural Interface...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 20 }}>
      {/* 1. Header & Quick View */}
      <div className="mb-0 flex items-center justify-between">
        <div>
          <Typography variant="h4" fontWeight={900} letterSpacing="-1.5px" color="text.primary" sx={{ mb: 1 }}>
            {sessionId ? 'Edit Muster Register' : 'New Muster Register'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7, maxWidth: '600px', lineHeight: 1.6 }}>
            Accurately track student attendance and workstation utilization for this session.
          </Typography>
        </div>
      </div>

      {/* 2. Stats & Details Card */}
      <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <SessionDetailsCard 
          formData={sessionFormData}
          labs={labs}
          currentUser={currentUser}
          onFieldChange={handleSessionFieldChange}
          onTimeChange={handleTimeChange}
        />
        
        <QuickStatsBar 
          date={sessionFormData.date}
          labName={labs.find(l => l.id === sessionFormData.lab)?.name || ''}
          total={stats.total}
          present={stats.present}
          absent={stats.absent}
        />
      </div>

      {/* 3. Main Data Entry Core */}
      <StudentEntriesTable 
        entries={entries}
        pcs={pcs}
        editingIndices={editingIndices}
        selectedIndices={selectedIndices}
        onAddRow={handleAddRow}
        onRemoveRow={handleRemoveRow}
        onToggleEdit={handleToggleEdit}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onEntryChange={handleEntryChange}
        onImportClick={() => setError('Module Interface Down: CSV Import coming soon.')}
      />

      {/* 4. Overlays & Sticky Modules */}
      <BulkActionsBar 
        selectedCount={selectedIndices.size}
        onClear={() => setSelectedIndices(new Set())}
        onMarkPresent={() => handleBulkMarkAttendance('P')}
        onMarkAbsent={() => handleBulkMarkAttendance('A')}
        onDelete={handleBulkDelete}
      />

      <MusterBottomBar 
        onBack={() => navigate('/muster/list')}
        onReset={handleReset}
        onPreview={() => setIsPreviewOpen(true)}
        onSave={handleSave}
        isSaving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
        isValid={sessionFormData.lab !== '' && entries.length > 0}
      />

      {/* 5. Modals */}
      <MusterPreviewModal 
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sessionData={{
          date: sessionFormData.date,
          time: sessionFormData.time,
          labName: labs.find(l => l.id === sessionFormData.lab)?.name || 'Not Selected',
          className: sessionFormData.className,
          batch: sessionFormData.batch,
          sessionType: sessionFormData.sessionType,
          duration: sessionFormData.duration,
          subject: sessionFormData.subject,
        }}
        entries={entries.map(e => ({
          ...e,
          pc_name: pcs.find(p => p.id === e.pc)?.device_name || 'None'
        }))}
      />

      {/* Reset Confirmation */}
      <Dialog 
        open={showResetConfirm} 
        onClose={() => setShowResetConfirm(false)}
        PaperProps={{ sx: { borderRadius: '1rem', bgcolor: 'var(--card-bg)', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3 }}>
          <AlertTriangle className="text-amber-500" />
          <Typography variant="h6" fontWeight={700}>System Purge Requested</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You are about to reset all form fields and clear student entries. This operation is irreversible. Proceed with clearing current state?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setShowResetConfirm(false)} variant="outlined" sx={{ borderRadius: '0.5rem' }}>Cancel</Button>
          <Button onClick={resetForm} variant="contained" color="error" sx={{ borderRadius: '0.5rem' }}>Purge State</Button>
        </DialogActions>
      </Dialog>

      {/* Toast Feedback */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" variant="filled" onClose={() => setError(null)} sx={{ borderRadius: '0.75rem' }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" variant="filled" icon={<CheckCircle2 size={18} />} onClose={() => setSuccess(null)} sx={{ borderRadius: '0.75rem' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MusterRegister;