import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Stack,
  Box,
  Paper
} from '@mui/material';
import { Send, CheckCircle, X } from 'lucide-react';
import { notificationAPI } from '../../services/api';

interface SMSEscalationModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    id: number;
    labName: string;
    issue: string;
    createdAt: string;
  };
}

const SMSEscalationModal: React.FC<SMSEscalationModalProps> = ({
  open,
  onClose,
  data,
}) => {
  const [adminPhone, setAdminPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhone.trim()) {
      setError('Admin phone number is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await notificationAPI.sendSms({
        id: data.id,
        lab: data.labName,
        issue_description: data.issue,
        created_at: data.createdAt,
        admin_phone: adminPhone.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setAdminPhone('');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to send SMS', err);
      setError(err?.formattedMessage || 'Failed to send SMS. Check your connection or API keys.');
    } finally {
      setLoading(false);
    }
  };

  const isInvalid = adminPhone.trim().length < 10;

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: { 
          backgroundColor: '#0d1117', 
          border: '1px solid rgba(48,54,61,1)', 
          backgroundImage: 'none',
          borderRadius: '16px'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 700, p: 3, pb: 1 }}>
          Escalate Issue via SMS
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {success ? (
            <Box sx={{ 
              p: 2, 
              borderRadius: '8px', 
              backgroundColor: 'rgba(16,185,129,0.1)', 
              border: '1px solid rgba(16,185,129,0.2)', 
              display: 'flex', gap: 1.5, alignItems: 'center'
            }}>
              <CheckCircle size={18} color="#10b981" />
              <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>SMS sent successfully!</Typography>
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Trigger an urgent SMS alert to the administrator phone number for this critical issue:
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(245,158,11,1)', fontWeight: 700, mb: 1, display: 'block' }}>LOG TRACE #{data.id}</Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>{data.labName}</Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>{data.issue}</Typography>
              </Paper>

              {error && (
                <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Typography variant="caption" sx={{ color: '#ef4444' }}>{error}</Typography>
                </Box>
              )}

              <TextField
                label="Admin Phone Number"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                fullWidth
                required
                disabled={loading}
                slotProps={{ 
                  input: { sx: { borderRadius: '8px' } },
                  inputLabel: { sx: { color: 'var(--text-secondary)' } }
                }}
                helperText="Include country code (e.g., +91)"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          {!success && (
            <>
              <Button onClick={onClose} sx={{ color: 'var(--text-secondary)', textTransform: 'none', fontWeight: 600 }} disabled={loading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disableElevation
                disabled={loading || isInvalid}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
                sx={{ 
                  backgroundColor: '#ef4444', 
                  borderRadius: '8px',
                  textTransform: 'none',
                  px: 3,
                  fontWeight: 700,
                  '&:hover': { backgroundColor: '#dc2626' }
                }}
              >
                {loading ? 'Sending...' : 'Send SMS Alert'}
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SMSEscalationModal;
