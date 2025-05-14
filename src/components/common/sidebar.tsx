import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  temperature,
  setTemperature,
}: SidebarProps) {
  return (
    <div
      className={`fixed left-0 top-0 h-full w-96 bg-purple-900/80 backdrop-blur-md shadow-xl transform transition-transform duration-300 ease-in-out z-[100] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Configuración</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-purple-800/50">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              API Key de OpenAI
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-purple-400/30 bg-purple-800/30 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Temperatura
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-white">{temperature}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}