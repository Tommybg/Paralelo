import React, { useState } from 'react';
import { X, History, FileDown, GitBranch } from 'lucide-react';
import { Button } from './Button';
import { TimelineConfigurator } from './TimelineConfigurator';
import { Milestone } from '@/types/timeline';
import { HistoryView } from './HistoryView';
import { HistoryEntry } from '@/types/timeline';
import { ReportGenerator, ReportOptions } from './ReportGenerator';
import { ComparisonResult } from '@/types/comparison';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  milestones?: Milestone[];
  onSaveMilestones?: (milestones: Milestone[]) => void;
  historyEntries?: HistoryEntry[];
  onSelectHistoryEntry?: (entry: HistoryEntry) => void;
  selectedHistoryEntryId?: string;
  comparisonResult?: ComparisonResult;
  doc1Name?: string;
  doc2Name?: string;
  onGenerateReport?: (options: ReportOptions) => Promise<void>;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

type TabType = 'timeline' | 'history' | 'reports';

export function Sidebar({
  isOpen,
  onClose,
  milestones = [],
  onSaveMilestones = () => {},
  historyEntries = [],
  onSelectHistoryEntry = () => {},
  selectedHistoryEntryId,
  comparisonResult,
  doc1Name = 'Documento 1',
  doc2Name = 'Documento 2',
  onGenerateReport = async () => {},
  activeTab: externalActiveTab,
  onTabChange,
}: SidebarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('timeline');
  
  // Use external tab if provided, otherwise use internal state
  const activeTab = externalActiveTab || internalActiveTab;
  
  // Handle tab change with both internal state and external callback
  const handleTabChange = (tab: TabType) => {
    setInternalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full w-96 bg-gray-100 shadow-xl transform transition-transform duration-300 ease-in-out z-[100] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">LegisCheck</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-gray-700">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-gray-200">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex justify-center items-center ${
              activeTab === 'timeline' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => handleTabChange('timeline')}
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Línea de Tiempo
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex justify-center items-center ${
              activeTab === 'history' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => handleTabChange('history')}
          >
            <History className="w-4 h-4 mr-2" />
            Historial
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex justify-center items-center ${
              activeTab === 'reports' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => handleTabChange('reports')}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Informes
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === 'timeline' && (
            <TimelineConfigurator 
              milestones={milestones}
              onSave={onSaveMilestones}
            />
          )}
          
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-800">Historial de Cambios</h3>
              {historyEntries.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-4">
                  No hay entradas de historial disponibles.
                </div>
              ) : (
                <HistoryView 
                  history={historyEntries}
                  onSelectEntry={onSelectHistoryEntry}
                  selectedEntryId={selectedHistoryEntryId}
                />
              )}
            </div>
          )}
          
          {activeTab === 'reports' && comparisonResult && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-800">Generar Informes</h3>
              <ReportGenerator 
                comparisonResult={comparisonResult}
                doc1Name={doc1Name}
                doc2Name={doc2Name}
                onGenerateReport={onGenerateReport}
              />
            </div>
          )}
          
          {activeTab === 'reports' && !comparisonResult && (
            <div className="text-center text-gray-500 text-sm py-4">
              Realiza una comparación primero para generar informes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}