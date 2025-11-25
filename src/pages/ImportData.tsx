import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Shield, AlertTriangle } from 'lucide-react';
import { csvService } from '../services/csvService';
import { subscriptionService } from '../services/subscriptionService';
import { batchService } from '../services/batchService';
import { fraudDetectionService } from '../services/fraudDetectionService';
import { DeveloperRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { CsvUploaderErrorBoundary } from '../components/ErrorBoundary';

const ImportDataContent: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Omit<DeveloperRecord, 'id'>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importSummary, setImportSummary] = useState<{ processed: number, failed: number, flagged: number, batchId: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImportStatus('idle');
      setImportSummary(null);

      try {
        const result = await csvService.parseCsv(selectedFile);
        
        // Run fraud detection on parsed records
        const enrichedRecords = fraudDetectionService.enrichRecordsWithFraudDetection(result.validRecords);
        
        setPreviewData(enrichedRecords);
        setErrors(result.errors);
      } catch (err) {
        setErrors(['Failed to parse CSV file.']);
      }
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0 || !user) return;

    setIsUploading(true);
    try {
      // Create batch record first
      const batch = await batchService.createBatch(
        file?.name || 'unknown.csv',
        previewData.length,
        user.uid
      );

      // Add batch ID to all records
      const recordsWithBatch = previewData.map(record => ({
        ...record,
        ingestionBatchId: batch.id,
      }));

      const results = await subscriptionService.bulkAddSubscriptions(recordsWithBatch);
      const failed = results.filter((r: any) => r.status === 'failed').length;
      const processed = results.length - failed;
      const flagged = previewData.filter(r => r.isSuspicious).length;

      setImportSummary({ processed, failed, flagged, batchId: batch.id });
      setImportStatus('success');
      setFile(null);
      setPreviewData([]);
      setErrors([]);
    } catch (err) {
      console.error(err);
      setImportStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const flaggedCount = previewData.filter(r => r.isSuspicious).length;

  return (
    <div className="p-8 min-h-screen bg-slate-50 dark:bg-dark text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Upload className="h-8 w-8 text-primary" aria-hidden="true" />
            Import Data
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Bulk upload participant data using CSV. Records are automatically scanned for fraud.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-dark-panel p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800">
              <label className="block text-sm font-medium mb-2" id="csv-upload-label">Select CSV File</label>
              <div className="flex items-center justify-center w-full">
                <label 
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-labelledby="csv-upload-label"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-10 h-10 mb-3 text-gray-400" aria-hidden="true" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">CSV files only</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleFileChange}
                    aria-describedby="csv-upload-label"
                  />
                </label>
              </div>
              {file && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center gap-2 text-sm">
                   <FileText size={16} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
                   <span className="truncate">{file.name}</span>
                </div>
              )}
            </div>

            {/* Fraud Detection Summary */}
            {previewData.length > 0 && (
              <div className={`p-4 rounded-lg border ${
                flaggedCount > 0 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }`}>
                <h3 className={`font-bold flex items-center gap-2 mb-2 ${
                  flaggedCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'
                }`}>
                  <Shield size={18} aria-hidden="true" /> Fraud Detection
                </h3>
                <div className="text-sm space-y-1">
                  <p className={flaggedCount > 0 ? 'text-amber-600 dark:text-amber-300' : 'text-green-600 dark:text-green-300'}>
                    {flaggedCount > 0 
                      ? `${flaggedCount} records flagged for review`
                      : 'No suspicious records detected'
                    }
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    Checks: Speed runs, bot activity, disposable emails, Sybil attacks
                  </p>
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                    <AlertCircle size={18} aria-hidden="true" /> Errors Found
                </h3>
                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300 max-h-40 overflow-y-auto">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {importStatus === 'success' && importSummary && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                        <CheckCircle size={18} aria-hidden="true" /> Import Complete
                    </h3>
                    <div className="text-sm text-green-600 dark:text-green-300 space-y-1">
                        <p>Successfully processed {importSummary.processed} records.</p>
                        {importSummary.failed > 0 && <p className="text-red-600">Failed: {importSummary.failed}</p>}
                        {importSummary.flagged > 0 && <p className="text-amber-600">Flagged: {importSummary.flagged}</p>}
                        <p className="text-xs text-gray-500">Batch ID: {importSummary.batchId}</p>
                    </div>
                </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
             <div className="bg-white dark:bg-dark-panel p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 h-full flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-bold">Data Preview</h2>
                     <div className="flex items-center gap-2">
                       {flaggedCount > 0 && (
                         <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full flex items-center gap-1">
                           <AlertTriangle size={12} aria-hidden="true" /> {flaggedCount} Flagged
                         </span>
                       )}
                       {previewData.length > 0 && (
                           <span className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                               {previewData.length} Records
                           </span>
                       )}
                     </div>
                 </div>

                 <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 min-h-[300px]">
                     {previewData.length > 0 ? (
                         <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                             <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                                 <tr>
                                     <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                         Status
                                     </th>
                                     {['email', 'firstName', 'partnerCode', 'percentageCompleted'].map(key => (
                                         <th key={key} className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                             {key}
                                         </th>
                                     ))}
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                 {previewData.slice(0, 100).map((row, idx) => (
                                     <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${row.isSuspicious ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                                         <td className="px-4 py-2 whitespace-nowrap">
                                           {row.isSuspicious ? (
                                             <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs" title={row.suspicionReason}>
                                               <AlertTriangle size={12} aria-hidden="true" /> Flagged
                                             </span>
                                           ) : (
                                             <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                                               <CheckCircle size={12} aria-hidden="true" /> OK
                                             </span>
                                           )}
                                         </td>
                                         <td className="px-4 py-2 whitespace-nowrap">{row.email}</td>
                                         <td className="px-4 py-2 whitespace-nowrap">{row.firstName}</td>
                                         <td className="px-4 py-2 whitespace-nowrap">{row.partnerCode}</td>
                                         <td className="px-4 py-2 whitespace-nowrap">{row.percentageCompleted}%</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : (
                         <div className="flex items-center justify-center h-full text-gray-400">
                             No data to preview
                         </div>
                     )}
                 </div>

                 <div className="mt-4 flex justify-end">
                     <button
                         onClick={handleImport}
                         disabled={previewData.length === 0 || isUploading}
                         className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                         aria-label={isUploading ? 'Importing data...' : 'Import data to database'}
                     >
                         {isUploading ? <Loader className="animate-spin" size={20} aria-hidden="true" /> : <Upload size={20} aria-hidden="true" />}
                         {isUploading ? 'Importing...' : 'Import Data'}
                     </button>
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImportData: React.FC = () => (
  <CsvUploaderErrorBoundary>
    <ImportDataContent />
  </CsvUploaderErrorBoundary>
);

export default ImportData;
