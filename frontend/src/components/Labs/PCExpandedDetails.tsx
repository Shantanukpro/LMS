import React from 'react';
import { Cpu, Keyboard, MousePointer2, Activity, Zap, Layers } from 'lucide-react';
import { Stack } from '@mui/material';
import type { PC } from '../../types';
import EquipmentCard from './EquipmentCard';
import BooleanBadge from './BooleanBadge';

interface PCExpandedDetailsProps {
  pc: PC;
}

const PCExpandedDetails: React.FC<PCExpandedDetailsProps> = ({ pc }) => {
  const keyboard = pc.peripherals_list?.find(p => p.type.toLowerCase() === 'keyboard')
                   || pc.peripheral_devices?.find(p => p.peripheral_type?.toLowerCase() === 'keyboard');
  const mouse = pc.peripherals_list?.find(p => p.type.toLowerCase() === 'mouse')
                || pc.peripheral_devices?.find(p => p.peripheral_type?.toLowerCase() === 'mouse');

  return (
    <div className="p-6 bg-slate-100/30 dark:bg-[#0d1117] border-t border-slate-200 dark:border-white/5 animate-fade-in shadow-inner">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Details */}
        <EquipmentCard 
          title="CPU / Processor"
          icon={Cpu}
          accentColor="teal"
          fields={[
            { label: 'Model', value: pc.cpu?.model || pc.processor || '—' },
            { label: 'Clock Speed', value: pc.cpu?.clock_speed || '—', icon: Zap },
            { label: 'Core Count', value: pc.cpu?.core_count || '—', icon: Layers },
            { label: 'Integrated Graphics', value: <BooleanBadge value={pc.cpu?.integrated_graphics} /> }
          ]}
        />

        {/* General Hardware */}
        <EquipmentCard 
          title="General Specs"
          icon={Activity}
          accentColor="emerald"
          fields={[
            { label: 'RAM', value: pc.ram || '—' },
            { label: 'Storage', value: pc.storage || '—' },
            { label: 'GPU (Dedicated)', value: pc.gpu ? <Stack direction="row" spacing={1} alignItems="center"><BooleanBadge value={true} /> <span className="text-xs text-slate-500">{pc.graphics_card}</span></Stack> : <BooleanBadge value={false} /> },
            { label: 'Serial No.', value: pc.serial_number || '—' }
          ]}
        />

        {/* Keyboard Details */}
        <EquipmentCard 
          title="Keyboard"
          icon={Keyboard}
          accentColor="purple"
          fields={[
            { label: 'Type/Name', value: keyboard?.type || 'Standard Keyboard' },
            { label: 'Status', value: <BooleanBadge value={keyboard?.status === 'working'} trueLabel="Working" falseLabel="Broken" /> }
          ]}
        />

        {/* Mouse Details */}
        <EquipmentCard 
          title="Mouse"
          icon={MousePointer2}
          accentColor="blue"
          fields={[
            { label: 'Type/Name', value: mouse?.type || 'Optical Mouse' },
            { label: 'Status', value: <BooleanBadge value={mouse?.status === 'working'} trueLabel="Working" falseLabel="Broken" /> }
          ]}
        />
      </div>
    </div>
  );
};

export default PCExpandedDetails;
