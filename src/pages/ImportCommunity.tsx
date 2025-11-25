import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Users, Info } from 'lucide-react';
import { communityCsvService } from '../services/communityCsvService';
import { communityService } from '../services/communityService';
import { Community, CommunityImportResult } from '../types';

const ImportCommunity: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CommunityImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importSummary, setImportSummary] = useState<{ imported: number; updated: number; errors: number } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [firstRowIsHeader, setFirstRowIsHeader] = useState<boolean | undefined>(undefined);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setParseError('Please select a CSV file.');
        setFile(null);
        setParseResult(null);
        return;
      }

      setFile(selectedFile);
      setImportStatus('idle');
      setImportSummary(null);
      setParseError(null);
      setIsProcessing(true);

      try {
        const result = await communityCsvService.parseCsv(selectedFile, {
          firstRowIsHeader
        });
        setParseResult(result);
        
        if (result.validEntries === 0 && result.errors.length > 0) {
          setParseError('No valid community entries found in the file.');
        }
      } catch (err) {
        console.error('CSV parsing error:', err);
        setParseError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
        setParseResult(null);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleHeaderToggle = () => {
    const newValue = firstRowIsHeader === undefined ? true : 
                     firstRowIsHeader === true ? false : undefined;
    setFirstRowIsHeader(newValue);
    
    // Re-parse if file is selected
    if (file) {
      reParseFile(newValue);
    }
  };

  const reParseFile = async (headerOption: boolean | undefined) => {
    if (!file) return;
    
    setIsProcessing(true);
    setParseError(null);
    
    try {
      const result = await communityCsvService.parseCsv(file, {
        firstRowIsHeader: headerOption
      });
      setParseResult(result);
      
      if (result.validEntries === 0 && result.errors.length > 0) {
        setParseError('No valid community entries found in the file.');
      }
    } catch (err) {
      console.error('CSV re-parsing error:', err);
      setParseError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
      setParseResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.imported.length === 0) return;

    setIsImporting(true);
    try {
      const result = await communityService.bulkImportCommunities(parseResult.imported);
      
      setImportSummary({
        imported: result.imported,
        updated: result.updated,
        errors: result.errors.length
      });
      setImportStatus('success');
      setFile(null);
      setParseResult(null);
    } catch (err) {
      console.error('Import error:', err);
      setImportStatus('error');
    } finally {
      setIsImporting(false);
    }
  };

  const getHeaderToggleLabel = () => {
    if (firstRowIsHeader === undefined) return 'Auto-detect';
    return firstRowIsHeader ? 'Yes' : 'No';
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50 dark:bg-dark text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Import Community / Partner List
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload a CSV file containing community or partner identifiers. The system supports flexible column detection.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Instructions Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2">
                <Info size={18} /> CSV Format
              </h3>
              <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                <li>• Single column with community names/codes</li>
                <li>• Optional header row (auto-detected)</li>
                <li>• Multi-column files supported (extra columns saved as metadata)</li>
                <li>• Duplicates are automatically handled (upsert)</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-dark-panel p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800">
              <label className="block text-sm font-medium mb-2">Select CSV File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">CSV files only</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              
              {file && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center gap-2 text-sm">
                  <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="truncate">{file.name}</span>
                </div>
              )}

              {/* Header Row Toggle */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">First row is header:</span>
                  <button
                    onClick={handleHeaderToggle}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {getHeaderToggleLabel()}
                  </button>
                </div>
              </div>
            </div>

            {/* Parse Error */}
            {parseError && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                  <AlertCircle size={18} /> Error
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300">{parseError}</p>
              </div>
            )}

            {/* Parse Warnings */}
            {parseResult && parseResult.errors.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-2">
                  <AlertCircle size={18} /> {parseResult.errors.length} Row(s) Skipped
                </h3>
                <ul className="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-300 max-h-32 overflow-y-auto">
                  {parseResult.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>Row {e.row}: {e.reason}</li>
                  ))}
                  {parseResult.errors.length > 10 && (
                    <li>...and {parseResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Import Success */}
            {importStatus === 'success' && importSummary && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                  <CheckCircle size={18} /> Import Complete
                </h3>
                <div className="text-sm text-green-600 dark:text-green-300 space-y-1">
                  <p>New communities: {importSummary.imported}</p>
                  <p>Updated: {importSummary.updated}</p>
                  {importSummary.errors > 0 && <p>Errors: {importSummary.errors}</p>}
                </div>
              </div>
            )}

            {/* Import Error */}
            {importStatus === 'error' && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                  <AlertCircle size={18} /> Import Failed
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300">
                  An error occurred while importing. Please try again.
                </p>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-panel p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Preview</h2>
                {parseResult && (
                  <div className="flex gap-2">
                    <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                      {parseResult.validEntries} Valid
                    </span>
                    {parseResult.skippedRows > 0 && (
                      <span className="text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full">
                        {parseResult.skippedRows} Skipped
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 min-h-[300px]">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="animate-spin text-primary" size={32} />
                  </div>
                ) : parseResult && parseResult.imported.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Display Name
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Slug
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Metadata
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {parseResult.imported.slice(0, 100).map((community, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-medium">
                            {community.displayName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                            {community.slug}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">
                            {community.metadata
                              ? Object.entries(community.metadata)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ')
                              : '-'}
                          </td>
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

              {parseResult && parseResult.imported.length > 100 && (
                <p className="mt-2 text-sm text-gray-500">
                  Showing first 100 of {parseResult.imported.length} entries
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={!parseResult || parseResult.imported.length === 0 || isImporting}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isImporting ? (
                    <Loader className="animate-spin" size={20} />
                  ) : (
                    <Upload size={20} />
                  )}
                  {isImporting ? 'Importing...' : 'Import Communities'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCommunity;
