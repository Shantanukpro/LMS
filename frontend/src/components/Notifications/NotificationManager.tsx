import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../../services/api';
import type { MaintenanceNotification } from '../../types';

interface NotificationManagerProps {
  onNotificationSent?: (success: boolean) => void;
}

interface NotificationFormData {
  id: string;
  lab: string;
  issue_description: string;
  created_at: string;
  technician_email: string;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  onNotificationSent 
}) => {
  const [formData, setFormData] = useState<NotificationFormData>({
    id: '',
    lab: '',
    issue_description: '',
    created_at: new Date().toISOString().slice(0, 10),
    technician_email: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const notificationData: MaintenanceNotification = {
        id: parseInt(formData.id) || 0,
        lab: formData.lab || '',
        issue_description: formData.issue_description || '',
        created_at: formData.created_at,
        technician_email: formData.technician_email || ''
      };

      const result = await notificationAPI.sendMaintenanceNotification(notificationData);
      
      if (result) {
        setSuccess(true);
        onNotificationSent?.(true);
        // Reset form
        setFormData({
          id: '',
          lab: '',
          issue_description: '',
          created_at: new Date().toISOString().slice(0, 10),
          technician_email: ''
        });
      } else {
        setError('Failed to send notification');
        onNotificationSent?.(false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to send notification';
      setError(errorMessage);
      onNotificationSent?.(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Send Maintenance Notification</h3>
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">✓ Notification sent successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">✗ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request ID *
            </label>
            <input
              type="number"
              required
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab Name *
            </label>
            <input
              type="text"
              required
              value={formData.lab}
              onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Computer Lab 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.created_at}
              onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technician Email *
            </label>
            <input
              type="email"
              required
              value={formData.technician_email}
              onChange={(e) => setFormData({ ...formData, technician_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="technician@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Issue Description *
          </label>
          <textarea
            required
            value={formData.issue_description}
            onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the maintenance issue..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="font-medium text-gray-900 mb-2">📧 Email Preview:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Subject:</strong> Maintenance Request #${formData.id || 'ID'} - ${formData.lab || 'Lab Name'}</p>
          <p><strong>To:</strong> {formData.technician_email || 'technician@example.com'}</p>
          <p><strong>Body:</strong></p>
          <div className="bg-white p-2 rounded border border-gray-200">
            <pre className="text-xs whitespace-pre-wrap">
{`New Maintenance Request Logged:
Request ID: ${formData.id || 'ID'}
Lab: ${formData.lab || 'Lab Name'}
Issue: ${formData.issue_description || 'Issue description'}
Created At: ${formData.created_at || 'Date'}

Please attend to this request as soon as possible.`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
