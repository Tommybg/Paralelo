import React from 'react';
import { HistoryEntry } from '@/types/timeline';

interface HistoryViewProps {
  history: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  selectedEntryId?: string;
}

export function HistoryView({ history, onSelectEntry, selectedEntryId }: HistoryViewProps) {
  // Sort history by date (newest first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      {sortedHistory.map(entry => (
        <div 
          key={entry.id}
          onClick={() => onSelectEntry(entry)}
          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
            selectedEntryId === entry.id 
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-medium text-gray-800">{new Date(entry.date).toLocaleDateString()}</div>
              <div className="text-sm text-gray-600">{entry.author}</div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              entry.type === 'comision' 
                ? 'bg-blue-100 text-blue-800' 
                : entry.type === 'plenaria'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
            }`}>
              {entry.type === 'comision' 
                ? 'Comisión' 
                : entry.type === 'plenaria'
                  ? 'Plenaria'
                  : 'Otro'
              }
            </div>
          </div>
          
          <p className="text-sm text-gray-700 mb-2">{entry.description}</p>
          
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-gray-600">{entry.changes.additions} adiciones</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600">{entry.changes.deletions} eliminaciones</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-gray-600">{entry.changes.modifications} modificaciones</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 