import React, { useState, useEffect } from 'react';
import { labEquipmentAPI } from '../../services/api';
import type { LabEquipment } from '../../types';

interface LabEquipmentListProps {
  labId?: number;
  onEdit?: (equipment: LabEquipment) => void;
  onDelete?: (id: number) => void;
}

const LabEquipmentList: React.FC<LabEquipmentListProps> = ({ 
  labId, 
  onEdit, 
  onDelete 
}) => {
  const [equipment, setEquipment] = useState<LabEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: 'all',
    status: 'all',
    type: 'all'
  });

  useEffect(() => {
    fetchEquipment();
  }, [labId]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const data = labId 
        ? await labEquipmentAPI.getByLab(labId)
        : await labEquipmentAPI.getAll();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item => {
    if (filter.category !== 'all' && item.category !== filter.category) return false;
    if (filter.status !== 'all' && item.status !== filter.status) return false;
    if (filter.type !== 'all' && item.equipment_type !== filter.type) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'not_working': return 'bg-red-100 text-red-800';
      case 'under_repair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'INFRASTRUCTURE': return 'bg-blue-100 text-blue-800';
      case 'APPLIANCE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEquipmentTypeIcon = (type: string) => {
    switch (type) {
      case 'SERVER': return '🖥️';
      case 'ROUTER': return '🌐';
      case 'SWITCH': return '🔀';
      case 'PROJECTOR': return '📽️';
      case 'AC': return '❄️';
      case 'FAN': return '💨';
      case 'LIGHT': return '💡';
      case 'UPS': return '🔋';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
              <option value="APPLIANCE">Appliance</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="working">Working</option>
              <option value="not_working">Not Working</option>
              <option value="under_repair">Under Repair</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment Type
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="SERVER">Server</option>
              <option value="ROUTER">Router</option>
              <option value="SWITCH">Switch</option>
              <option value="HUB">Hub</option>
              <option value="PROJECTOR">Projector</option>
              <option value="E_BOARD">E-Board</option>
              <option value="AC">Air Conditioner</option>
              <option value="FAN">Fan</option>
              <option value="LIGHT">Light</option>
              <option value="UPS">UPS</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getEquipmentTypeIcon(item.equipment_type)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.equipment_code}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onEdit?.(item)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete?.(item.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Type:</strong> {item.equipment_type}</p>
                  {item.brand && <p><strong>Brand:</strong> {item.brand}</p>}
                  {item.model_name && <p><strong>Model:</strong> {item.model_name}</p>}
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  {item.location_in_lab && <p><strong>Location:</strong> {item.location_in_lab}</p>}
                </div>
                
                {item.is_networked && (
                  <div className="flex items-center text-sm text-blue-600">
                    🌐 Networked
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No equipment found matching the current filters.</p>
        </div>
      )}
    </div>
  );
};

export default LabEquipmentList;
