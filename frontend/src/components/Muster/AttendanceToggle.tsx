import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AttendanceToggleProps {
  status: 'P' | 'A';
  onChange: (status: 'P' | 'A') => void;
  disabled?: boolean;
}

const AttendanceToggle: React.FC<AttendanceToggleProps> = ({ 
  status, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div className={cn(
      "flex p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg w-24 h-9 overflow-hidden transition-all duration-200",
      disabled && "opacity-50 grayscale pointer-events-none"
    )}>
      <button
        type="button"
        onClick={() => onChange('P')}
        className={cn(
          "flex-1 flex items-center justify-center rounded-md text-[11px] font-bold transition-all duration-300",
          status === 'P' 
            ? "bg-emerald-500 text-white shadow-sm scale-105" 
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        )}
      >
        <Check size={14} className={cn("mr-1 transition-transform", status === 'P' ? "scale-100" : "scale-0 w-0")} />
        P
      </button>
      <button
        type="button"
        onClick={() => onChange('A')}
        className={cn(
          "flex-1 flex items-center justify-center rounded-md text-[11px] font-bold transition-all duration-300",
          status === 'A' 
            ? "bg-rose-500 text-white shadow-sm scale-105" 
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        )}
      >
        <X size={14} className={cn("mr-1 transition-transform", status === 'A' ? "scale-100" : "scale-0 w-0")} />
        A
      </button>
    </div>
  );
};

export default AttendanceToggle;
