import React from 'react';
import { Cpu, Keyboard, MousePointer2, Activity, Zap, Layers, IndianRupee } from 'lucide-react';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

        {/* Cost Breakdown */}
        <EquipmentCard 
          title="Cost Breakdown"
          icon={IndianRupee}
          accentColor="emerald"
          fields={[
            { label: 'Base Unit', value: pc.base_price != null ? `₹ ${Number(pc.base_price).toLocaleString('en-IN')}` : '—' },
            { label: 'Processor', value: pc.cpu?.price != null ? `₹ ${Number(pc.cpu?.price).toLocaleString('en-IN')}` : '—' },
            { label: 'OS License', value: pc.os?.license_cost != null ? `₹ ${Number(pc.os?.license_cost).toLocaleString('en-IN')}` : '—' },
            { label: 'Keyboard', value: keyboard?.price != null ? `₹ ${Number(keyboard?.price).toLocaleString('en-IN')}` : '—' },
            { label: 'Mouse', value: mouse?.price != null ? `₹ ${Number(mouse?.price).toLocaleString('en-IN')}` : '—' },
          ]}
        />
      </div>
    </div>
  );
};

export default PCExpandedDetails;
