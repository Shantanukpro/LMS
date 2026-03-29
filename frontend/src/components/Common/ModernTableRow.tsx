import React, { useState, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ModernTableRowProps {
  mainRow: ReactNode;
  expandedContent: ReactNode;
  colSpan: number;
}

const ModernTableRow: React.FC<ModernTableRowProps> = ({ 
  mainRow, 
  expandedContent, 
  colSpan 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <>
      <tr 
        className={`group transition-all duration-200 border-b border-gray-100 dark:border-white/5 
          ${isExpanded ? 'bg-slate-50 dark:bg-white/5 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'}`}
      >
        <td className="pl-4 py-4 w-10">
          <button 
            onClick={toggleExpand}
            className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 transition-all duration-300
              ${isExpanded ? 'rotate-90 text-teal-600 dark:text-teal-400' : ''}`}
          >
            <ChevronRight size={18} />
          </button>
        </td>

        {mainRow}
      </tr>

      <tr className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'active' : 'hidden'}`}>
        <td colSpan={colSpan + 1} className="p-0 border-none bg-transparent">
          <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[800px] opacity-100 py-0 text-left' : 'max-h-0 opacity-0'}`}>
            {expandedContent}
          </div>
        </td>
      </tr>
    </>
  );
};

export default ModernTableRow;
