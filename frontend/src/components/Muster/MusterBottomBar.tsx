import React from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Eye, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import { cn } from '../../lib/utils';

interface MusterBottomBarProps {
  onBack: () => void;
  onReset: () => void;
  onPreview: () => void;
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isValid: boolean;
}

const MusterBottomBar: React.FC<MusterBottomBarProps> = ({
  onBack,
  onReset,
  onPreview,
  onSave,
  isSaving,
  hasUnsavedChanges,
  isValid
}) => {
  return (
    <div className="fixed bottom-0 left-16 right-0 z-40 bg-white/80 dark:bg-[#0d1117]/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
        
        {/* Left Side: Navigation & Connection Info */}
        <div className="flex items-center gap-8">
          <Button
            onClick={onBack}
            startIcon={<ArrowLeft size={16} />}
            sx={backBtnStyles}
          >
            Back to List
          </Button>

          <div className="flex items-center gap-3 border-l border-gray-100 dark:border-white/5 pl-8">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              hasUnsavedChanges ? "bg-amber-500" : "bg-emerald-500"
            )} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {hasUnsavedChanges ? 'Unsaved Changes' : 'All Changes Synced'}
            </span>
          </div>
        </div>

        {/* Right Side: Primary Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="outlined"
            onClick={onReset}
            startIcon={<RotateCcw size={16} />}
            sx={secondaryBtnStyles}
          >
            Reset Form
          </Button>

          <Button
            variant="outlined"
            onClick={onPreview}
            startIcon={<Eye size={16} />}
            sx={secondaryBtnStyles}
            disabled={!isValid}
          >
            Full Preview
          </Button>

          <Button
            variant="contained"
            onClick={onSave}
            disabled={isSaving || !isValid}
            sx={{
              ...saveBtnStyles,
              opacity: (isSaving || !isValid) ? 0.6 : 1,
              background: isValid 
                ? 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)' 
                : 'var(--border-color)',
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Saving Register...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Commit Register
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const backBtnStyles = {
  color: 'text.secondary',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  px: 2,
  '&:hover': {
    color: 'primary.main',
    bgcolor: 'transparent',
  }
};

const secondaryBtnStyles = {
  borderColor: 'var(--border-color)',
  color: 'text.secondary',
  textTransform: 'none',
  fontWeight: 700,
  px: 3,
  py: 1.25,
  borderRadius: '0.75rem',
  '&:hover': {
    borderColor: 'primary.main',
    bgcolor: 'rgba(59,130,246,0.05)',
    color: 'primary.main',
  },
  '&.Mui-disabled': {
    opacity: 0.3,
  }
};

const saveBtnStyles = {
  color: 'white',
  textTransform: 'none',
  fontWeight: 800,
  px: 5,
  py: 1.25,
  borderRadius: '0.75rem',
  boxShadow: '0 10px 15px -3px rgba(20, 184, 166, 0.25)',
  '&:hover': {
    boxShadow: '0 15px 25px -5px rgba(20, 184, 166, 0.35)',
    transform: 'translateY(-2px)',
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

export default MusterBottomBar;
