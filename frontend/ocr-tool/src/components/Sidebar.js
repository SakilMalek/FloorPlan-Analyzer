// frontend/src/components/Sidebar.js

import React, { useState } from 'react';
import { Settings, ChevronLeft, ChevronRight, FileText, Download, AlertCircle } from 'lucide-react';

const Sidebar = ({ settings, setSettings }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`bg-gray-800 text-white shadow-lg transition-all duration-300 ease-in-out ${isOpen ? 'w-80' : 'w-20'}`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          {isOpen && <h2 className="text-xl font-bold">Settings</h2>}
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-gray-700">
            {isOpen ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
          </button>
        </div>

        {isOpen ? (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-1">Gemini API Key</label>
              <input
                type="password"
                placeholder="Enter Gemini API Key"
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-1">Roboflow API Key</label>
              <input
                type="password"
                placeholder="Enter Roboflow API Key"
                value={settings.roboflowApiKey}
                onChange={(e) => setSettings({ ...settings, roboflowApiKey: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-1">Floorplan Scale</label>
              <input
                type="text"
                placeholder="e.g., 1/4&quot; = 1'"
                value={settings.scale}
                onChange={(e) => setSettings({ ...settings, scale: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
             <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-1">Image DPI</label>
              <input
                type="number"
                placeholder="e.g., 300"
                value={settings.dpi}
                onChange={(e) => setSettings({ ...settings, dpi: parseInt(e.target.value) || 0 })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="mt-auto text-xs text-gray-500">
                <p>Settings are stored in the app's state and are not saved permanently.</p>
            </div>
          </>
        ) : (
            <div className="flex flex-col items-center space-y-6 mt-6">
                 <div className="p-2 rounded-md bg-gray-700" title="Settings"><Settings className="h-6 w-6 text-gray-300" /></div>
                 <div className="p-2 rounded-md bg-gray-700" title="Export PDF"><FileText className="h-6 w-6 text-blue-400" /></div>
                 <div className="p-2 rounded-md bg-gray-700" title="Export CSV"><Download className="h-6 w-6 text-green-400" /></div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
