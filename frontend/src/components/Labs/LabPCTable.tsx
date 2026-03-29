import React, { useState } from 'react';
import type { PC } from '../../types';
import PCTableRow from './PCTableRow';

interface LabPCTableProps {
  pcs: PC[];
  onEdit: (pc: PC) => void;
  onDelete: (id: number) => void;
  showLab?: boolean;
}

const LabPCTable: React.FC<LabPCTableProps> = ({ pcs, onEdit, onDelete, showLab = false }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (pcs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-white/5 mx-6">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl opacity-50">🖥️</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No PCs found</h3>
        <p className="text-slate-500 dark:text-gray-500 text-sm max-w-xs mx-auto">
          This lab hasn't been populated with any computers yet. Click "Add PC" to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-10 overflow-hidden rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111827] shadow-sm dark:shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8fafc] dark:bg-[#161b22] border-b border-gray-200 dark:border-white/5">
            <tr>
              <th className="w-10"></th>
              {showLab && (
                <th className="px-6 py-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">
                    Lab
                  </span>
                </th>
              )}
              <th className="px-6 py-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">
                  PC Name (COMP ID)
                </span>
              </th>
              <th className="px-6 py-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">
                  Brand
                </span>
              </th>
              <th className="px-6 py-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">
                  Connectivity
                </span>
              </th>
              <th className="px-6 py-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">
                  Status
                </span>
              </th>
              <th className="px-6 py-4 text-right pr-12">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {pcs.map((pc) => (
              <PCTableRow 
                key={pc.id}
                pc={pc}
                isExpanded={expandedId === pc.id}
                onToggleExpand={() => toggleExpand(pc.id)}
                onEdit={onEdit}
                onDelete={onDelete}
                showLab={showLab}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabPCTable;
