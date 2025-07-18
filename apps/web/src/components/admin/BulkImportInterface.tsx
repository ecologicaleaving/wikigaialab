'use client';

import { useState } from 'react';
import { 
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ImportResult {
  import_id: string;
  total_records: number;
  successful_imports: number;
  failed_imports: number;
  error_log: Array<{
    index: number;
    title: string;
    error: string;
  }>;
  success_log: Array<{
    index: number;
    title: string;
    problem_id: string;
  }>;
}

interface ImportHistory {
  id: string;
  import_type: 'csv' | 'json';
  file_name: string;
  file_size: number;
  total_records: number;
  successful_imports: number;
  failed_imports: number;
  status: 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  imported_by: {
    id: string;
    name: string;
  };
}

export function BulkImportInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect file type
      if (file.name.endsWith('.json')) {
        setImportType('json');
      } else if (file.name.endsWith('.csv')) {
        setImportType('csv');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', importType);

      const response = await fetch('/api/admin/content/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImportResult(result.data);
        await fetchImportHistory(); // Refresh history
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const response = await fetch('/api/admin/content/import');
      const result = await response.json();

      if (result.success) {
        setImportHistory(result.data);
      }
    } catch (error) {
      console.error('Error fetching import history:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import Problems</h3>
        
        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Click to upload or drag and drop
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                CSV or JSON files up to 10MB
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv,.json"
                className="sr-only"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <DocumentIcon className="h-8 w-8 text-gray-400" />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              
              <div className="ml-4">
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as 'csv' | 'json')}
                  className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Import Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleImport}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Import Problems
              </>
            )}
          </button>
        </div>

        {/* Format Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">File Format Requirements</h4>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2"><strong>CSV Format:</strong> title, description, category, is_featured, tags</p>
                <p className="mb-2"><strong>JSON Format:</strong> Array of objects with title, description, category_name, is_featured, tags fields</p>
                <p className="text-xs">Required fields: title, description. Optional: category, is_featured, tags</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Successful</p>
                  <p className="text-lg font-bold text-green-900">{importResult.successful_imports}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <XCircleIcon className="h-6 w-6 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Failed</p>
                  <p className="text-lg font-bold text-red-900">{importResult.failed_imports}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DocumentIcon className="h-6 w-6 text-gray-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">{importResult.total_records}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Details */}
          {importResult.error_log.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Import Errors</h4>
              <div className="max-h-40 overflow-y-auto border border-red-200 rounded-md">
                {importResult.error_log.map((error, index) => (
                  <div key={index} className="p-3 border-b border-red-100 last:border-b-0">
                    <p className="text-sm font-medium text-red-900">Row {error.index}: {error.title}</p>
                    <p className="text-sm text-red-700">{error.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Details */}
          {importResult.success_log.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-800 mb-2">Successfully Imported</h4>
              <div className="max-h-40 overflow-y-auto border border-green-200 rounded-md">
                {importResult.success_log.slice(0, 10).map((success, index) => (
                  <div key={index} className="p-3 border-b border-green-100 last:border-b-0">
                    <p className="text-sm text-green-900">{success.title}</p>
                  </div>
                ))}
                {importResult.success_log.length > 10 && (
                  <div className="p-3 text-sm text-green-700 text-center">
                    ... and {importResult.success_log.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory && importHistory.length === 0) {
                fetchImportHistory();
              }
            }}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">Import History</h3>
            <span className="text-sm text-gray-500">
              {showHistory ? 'Hide' : 'Show'} History
            </span>
          </button>
        </div>

        {showHistory && (
          <div className="p-6">
            {importHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No import history found</p>
            ) : (
              <div className="space-y-4">
                {importHistory.map((importItem) => (
                  <div key={importItem.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{importItem.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {importItem.import_type.toUpperCase()} • {formatFileSize(importItem.file_size)} • 
                          by {importItem.imported_by.name}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          importItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                          importItem.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {importItem.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(importItem.started_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total: </span>
                        <span className="font-medium">{importItem.total_records}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Success: </span>
                        <span className="font-medium text-green-600">{importItem.successful_imports}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Failed: </span>
                        <span className="font-medium text-red-600">{importItem.failed_imports}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}