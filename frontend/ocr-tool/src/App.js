// frontend/src/App.js

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FileUploader from './components/FileUploader';
import FloorplanViewer from './components/FloorplanViewer';
import DataTable from './components/DataTable';
import { analyzeFloorplanApi } from './services/api';
import { generatePDF, generateCSV } from './services/exporter';
import { FileText, Download } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState({ geminiApiKey: '', roboflowApiKey: '', scale: '1/4" = 1\'', dpi: 300 });
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlightedRow, setHighlightedRow] = useState(null);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setImageUrl(URL.createObjectURL(selectedFile));
    setAnalysisResult([]);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file) { setError('Please upload a file first.'); return; }
    if (!settings.geminiApiKey) { setError('Please enter your Gemini API key.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const data = await analyzeFloorplanApi(file, settings);
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar settings={settings} setSettings={setSettings} />
      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Floorplan Analysis Dashboard</h1>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <FileUploader onFileSelect={handleFileSelect} file={file} />
            <div className="flex gap-4">
              <button onClick={handleAnalyze} disabled={isLoading} className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                {isLoading ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
              <button onClick={() => generatePDF(analysisResult, file?.name, document.querySelector('canvas'))} className="inline-flex items-center justify-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50">
                <FileText className="h-5 w-5 mr-2" /> PDF
              </button>
              <button onClick={() => generateCSV(analysisResult)} className="inline-flex items-center justify-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50">
                <Download className="h-5 w-5 mr-2" /> CSV
              </button>
            </div>
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"><p className="font-bold">Error</p><p>{error}</p></div>}
            {analysisResult.length > 0 && !isLoading && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md"><p className="font-bold">Analysis Complete</p></div>}
          </div>

          {/* Right Column - UPDATED LAYOUT */}
          <div className="flex flex-col gap-6 min-h-0">
            {/* Each child now has a specific height percentage */}
            <div className="h-1/2 min-h-0">
                <FloorplanViewer imageUrl={imageUrl} analysisResult={analysisResult} highlightedRow={highlightedRow} setHighlightedRow={setHighlightedRow} />
            </div>
            <div className="h-1/2 min-h-0">
                <DataTable data={analysisResult} setData={setAnalysisResult} highlightedRow={highlightedRow} setHighlightedRow={setHighlightedRow} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}