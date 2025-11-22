
import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, AlertTriangle, History, Trash2, Database } from 'lucide-react';
import { DeveloperRecord, DatasetVersion } from '../types';
import { processIngestedData } from '../services/dataProcessing';

interface CsvUploaderProps {
  onDataLoaded: (data: DeveloperRecord[], fileName: string) => void;
  versions?: DatasetVersion[];
  activeVersionId?: string;
  onVersionSelect?: (id: string) => void;
  onDeleteVersion?: (id: string) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ 
    onDataLoaded, 
    versions = [], 
    activeVersionId, 
    onVersionSelect, 
    onDeleteVersion 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Robust Stateful CSV Parser
  // Handles quotes, delimiters inside quotes, and different delimiters (comma/semicolon)
  const parseCSV = (text: string, onProgress: (percentage: number) => void): Promise<DeveloperRecord[]> => {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              try {
                  // 1. Handle BOM (Byte Order Mark) which often breaks 'Email' detection at start of file
                  let content = text;
                  if (content.charCodeAt(0) === 0xFEFF) {
                      content = content.slice(1);
                  }

                  const lines = content.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
                  if (lines.length < 2) throw new Error("File is empty or missing data rows.");

                  // 2. Detect Delimiter
                  const firstLine = lines[0];
                  const commaCount = (firstLine.match(/,/g) || []).length;
                  const semiCount = (firstLine.match(/;/g) || []).length;
                  const delimiter = semiCount > commaCount ? ';' : ',';

                  console.log(`Detected delimiter: '${delimiter}'`);

                  // 3. Split Function
                  const splitLine = (line: string): string[] => {
                      const result: string[] = [];
                      let current = '';
                      let inQuotes = false;
                      
                      for (let i = 0; i < line.length; i++) {
                          const char = line[i];
                          // Handle escaped quotes ""
                          if (char === '"' && line[i+1] === '"') {
                              current += '"';
                              i++;
                              continue;
                          }
                          
                          if (char === '"') {
                              inQuotes = !inQuotes;
                          } else if (char === delimiter && !inQuotes) {
                              result.push(current.trim());
                              current = '';
                          } else {
                              current += char;
                          }
                      }
                      result.push(current.trim());
                      
                      // Clean surrounding quotes
                      return result.map(val => {
                          if (val.startsWith('"') && val.endsWith('"')) {
                              return val.slice(1, -1);
                          }
                          return val;
                      });
                  };

                  // 4. Parse Headers
                  const headers = splitLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ' ').trim());
                  console.log("Parsed Headers:", headers);

                  // 5. Map Columns
                  // EXACT mapping based on User's list
                  const findIndex = (candidates: string[]) => {
                      const normalizedCandidates = candidates.map(c => c.toLowerCase());
                      // Try exact match first, then partial
                      let idx = headers.findIndex(h => normalizedCandidates.includes(h));
                      if (idx === -1) {
                          idx = headers.findIndex(h => normalizedCandidates.some(c => h.includes(c)));
                      }
                      return idx;
                  };

                  const map = {
                      email: findIndex(['email']),
                      firstName: findIndex(['first name', 'firstname']),
                      lastName: findIndex(['last name', 'lastname']),
                      phone: findIndex(['phone number', 'phone']),
                      country: findIndex(['country']),
                      membership: findIndex(['accepted membership', 'membership']),
                      marketing: findIndex(['accepted marketing', 'marketing']),
                      wallet: findIndex(['wallet address', 'wallet']),
                      // "Code" is the primary key for PartnerCode
                      partnerCode: findIndex(['code', 'partner code', 'partnercode']), 
                      partnerName: findIndex(['partner']),
                      percentage: findIndex(['percentage completed', 'percentage']),
                      createdAt: findIndex(['created at', 'start date']),
                      completedAt: findIndex(['completed at', 'completion date']),
                      finalScore: findIndex(['final score']),
                      finalGrade: findIndex(['final grade', 'grade']),
                      caStatus: findIndex(['ca status', 'status'])
                  };

                  if (map.partnerCode === -1 && map.partnerName !== -1) {
                      // Fallback: use partner column if code is missing
                      map.partnerCode = map.partnerName;
                  }

                  if (map.email === -1) {
                      throw new Error(`Column 'Email' not found. Please check your CSV headers. Found: ${headers.join(', ')}`);
                  }

                  // 6. Process Rows
                  const parsedData: DeveloperRecord[] = [];
                  const totalRows = lines.length - 1;
                  const CHUNK_SIZE = 5000; // Batch size

                  let currentIndex = 1;

                  const processBatch = () => {
                      const end = Math.min(currentIndex + CHUNK_SIZE, lines.length);
                      
                      for (let i = currentIndex; i < end; i++) {
                          const cols = splitLine(lines[i]);
                          // Skip if row is totally empty or mismatched heavily
                          if (cols.length < 2) continue; 

                          const getVal = (idx: number) => (idx !== -1 && cols[idx] !== undefined ? cols[idx] : '');

                          // Helpers
                          const parseDate = (str: string) => {
                              if (!str) return '';
                              // Handle Excel formats like 12/31/2023 or 31/12/2023
                              if (str.includes('/')) {
                                  const parts = str.split(/[\/\s]/);
                                  // Attempt detection of DD/MM vs MM/DD
                                  // If first part > 12, it must be DD
                                  const p0 = parseInt(parts[0]);
                                  const p1 = parseInt(parts[1]);
                                  if (!isNaN(p0) && p0 > 12) {
                                      // assume DD/MM/YYYY
                                      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
                                  }
                              }
                              const d = new Date(str);
                              return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
                          };
                          
                          const parseBool = (str: string) => ['true', 'yes', '1', 'y'].includes(str.toLowerCase());
                          
                          const parseIntSafe = (str: string) => {
                              if (!str) return 0;
                              const clean = str.replace(/[^0-9.-]/g, '');
                              const v = parseFloat(clean);
                              return isNaN(v) ? 0 : Math.round(v);
                          };

                          const parseGrade = (str: string): 'Pass' | 'Fail' | 'Pending' => {
                              if (!str) return 'Pending';
                              const s = str.trim().toLowerCase();
                              if (s === 'pass' || s === 'passed' || s.includes('pass')) return 'Pass';
                              if (s === 'fail' || s === 'failed') return 'Fail';
                              return 'Pending';
                          };

                          parsedData.push({
                              id: `row_${i}_${Date.now()}`, // Ensure unique IDs across versions
                              email: getVal(map.email) || `unknown_${i}@noemail.com`,
                              firstName: getVal(map.firstName),
                              lastName: getVal(map.lastName),
                              phone: getVal(map.phone),
                              country: getVal(map.country) || 'Unknown',
                              acceptedMembership: parseBool(getVal(map.membership)),
                              acceptedMarketing: parseBool(getVal(map.marketing)),
                              walletAddress: getVal(map.wallet),
                              partnerCode: getVal(map.partnerCode) || 'UNKNOWN',
                              percentageCompleted: parseIntSafe(getVal(map.percentage)),
                              createdAt: parseDate(getVal(map.createdAt)),
                              completedAt: getVal(map.completedAt) ? parseDate(getVal(map.completedAt)) : null,
                              finalScore: parseIntSafe(getVal(map.finalScore)),
                              finalGrade: parseGrade(getVal(map.finalGrade)),
                              caStatus: getVal(map.caStatus)
                          });
                      }

                      currentIndex = end;
                      onProgress(Math.round(((currentIndex - 1) / totalRows) * 100));

                      if (currentIndex < lines.length) {
                          // Next tick
                          setTimeout(processBatch, 0);
                      } else {
                          resolve(parsedData);
                      }
                  };

                  processBatch();

              } catch (err: any) {
                  reject(err);
              }
          }, 100);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fName = file.name;
    setFileName(fName);
    setIsProcessing(true);
    setProgress(0);
    setLoadedCount(0);
    setErrorMsg(null);
    setStatusMessage('Reading file...');

    const reader = new FileReader();
    
    reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (!text) {
            setErrorMsg("Failed to read file content.");
            setIsProcessing(false);
            return;
        }

        setStatusMessage('Parsing CSV structure...');
        
        try {
            const rawData = await parseCSV(text, (pct) => setProgress(pct));
            
            setStatusMessage('Running Logic (Fraud Detection & Time Fixes)...');
            
            // Small delay to allow UI update
            setTimeout(() => {
                const processed = processIngestedData(rawData);
                setLoadedCount(processed.length);
                onDataLoaded(processed, fName); // Pass filename
                setIsProcessing(false);
                setStatusMessage('Complete');
            }, 50);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Unknown parsing error");
            setIsProcessing(false);
        }
    };

    reader.onerror = () => {
        setErrorMsg('Error reading file from disk.');
        setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const triggerUpload = () => {
      fileInputRef.current?.value ? (fileInputRef.current.value = '') : null;
      fileInputRef.current?.click();
  }

  return (
    <div className="space-y-6">
        <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            
            <div className={`p-4 rounded-full transition-colors ${isProcessing ? 'bg-blue-50 text-blue-600' : errorMsg ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
            {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : errorMsg ? <AlertTriangle className="w-8 h-8" /> : <FileSpreadsheet className="w-8 h-8" />}
            </div>

            <div>
            <h3 className="text-lg font-bold text-slate-900">
                {isProcessing ? 'Processing Dataset...' : 'Ingest Developer Data'}
            </h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                {errorMsg ? (
                    <span className="text-red-600 font-medium block mt-1">{errorMsg}</span>
                ) : isProcessing ? (
                    statusMessage
                ) : (
                    "Upload the Master CSV. The system auto-detects 'Email' and 'Code' columns, fixes timestamps, and flags fraud."
                )}
            </p>
            </div>

            {isProcessing && (
                <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-200 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}
            
            {!isProcessing && (
            <div className="flex gap-4">
                <button 
                    onClick={triggerUpload}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                >
                    <Upload className="w-4 h-4" />
                    {fileName ? 'Upload Different File' : 'Select CSV File'}
                </button>
            </div>
            )}

            {fileName && !isProcessing && !errorMsg && (
                <div className="mt-2 flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg text-sm font-medium border border-green-100">
                    <CheckCircle className="w-4 h-4" />
                    {loadedCount.toLocaleString()} records loaded.
                </div>
            )}
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv,.txt" 
            onChange={handleFileChange}
        />
        </div>

        {/* VERSION HISTORY */}
        {versions.length > 0 && (
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
                     <History className="w-4 h-4 text-slate-500" />
                     <h3 className="font-bold text-slate-800">Dataset Version History</h3>
                 </div>
                 <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500 font-medium">
                         <tr>
                             <th className="px-6 py-3">File Name</th>
                             <th className="px-6 py-3">Upload Date</th>
                             <th className="px-6 py-3">Records</th>
                             <th className="px-6 py-3 text-right">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {versions.map(v => (
                             <tr key={v.id} className={v.id === activeVersionId ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                                 <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                     {v.id === activeVersionId && <CheckCircle className="w-4 h-4 text-blue-600" />}
                                     {v.fileName}
                                 </td>
                                 <td className="px-6 py-4 text-slate-500">{new Date(v.uploadDate).toLocaleString()}</td>
                                 <td className="px-6 py-4 font-mono text-slate-600">{v.recordCount.toLocaleString()}</td>
                                 <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                     {v.id !== activeVersionId && onVersionSelect && (
                                         <button 
                                            onClick={() => onVersionSelect(v.id)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1 bg-white border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                         >
                                             <Database className="w-3 h-3" /> Switch
                                         </button>
                                     )}
                                     {onDeleteVersion && (
                                         <button 
                                            onClick={() => onDeleteVersion(v.id)}
                                            className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                         >
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                     )}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        )}
    </div>
  );
};