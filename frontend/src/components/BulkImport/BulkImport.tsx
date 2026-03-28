import React, { useState } from 'react';
import { importAPI } from '../../services/api';
import type { ImportResult } from '../../types';

interface BulkImportProps {
  labId?: number;
  importType: 'labs' | 'pcs' | 'lab-equipment';
  onSuccess?: (result: ImportResult) => void;
  onError?: (error: string) => void;
}

const BulkImport: React.FC<BulkImportProps> = ({ 
  labId, 
  importType, 
  onSuccess, 
  onError 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        onError?.('Please upload a CSV or Excel file');
        return;
      }
      
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      onError?.('Please select a file first');
      return;
    }

    setLoading(true);
    try {
      let importResult: ImportResult;
      
      switch (importType) {
        case 'labs':
          importResult = await importAPI.importLabs(file);
          break;
        case 'pcs':
          importResult = await importAPI.importPCs(file, labId);
          break;
        case 'lab-equipment':
          importResult = await importAPI.importLabEquipment(file, labId);
          break;
        default:
          throw new Error('Invalid import type');
      }

      setResult(importResult);
      onSuccess?.(importResult);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Import failed';
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getImportTitle = () => {
    switch (importType) {
      case 'labs':
        return 'Import Labs';
      case 'pcs':
        return 'Import PCs';
      case 'lab-equipment':
        return 'Import Lab Equipment';
      default:
        return 'Import Data';
    }
  };

  const getDownloadTemplate = () => {
    switch (importType) {
      case 'labs':
        return 'labs_template.csv';
      case 'pcs':
        return 'pcs_template.csv';
      case 'lab-equipment':
        return 'equipment_template.csv';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{getImportTitle()}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File (CSV or Excel)
          </label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {getDownloadTemplate() && (
          <div className="text-sm text-gray-600">
            <p>Need a template? 
              <a 
                href={`/templates/${getDownloadTemplate()}`}
                className="text-blue-600 hover:underline ml-1"
                download
              >
                Download template here
              </a>
            </p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Importing...' : 'Import Data'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Import Results:</h4>
            <div className="space-y-1 text-sm">
              <p className="text-green-600">✓ Created: {result.created}</p>
              <p className="text-yellow-600">⚠ Skipped: {result.skipped}</p>
              {result.lab && (
                <p className="text-blue-600">ℹ Lab: {result.lab}</p>
              )}
            </div>
            
            {result.errors.length > 0 && (
              <div className="mt-3">
                <h5 className="font-medium text-red-600 mb-1">Errors:</h5>
                <div className="max-h-32 overflow-y-auto bg-red-50 p-2 rounded text-xs">
                  {result.errors.map((error, index) => (
                    <p key={index} className="text-red-700">• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImport;
