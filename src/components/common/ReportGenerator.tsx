import React from 'react';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { Download } from 'lucide-react';
import { ComparisonResult } from '@/types/comparison';

export interface ReportOptions {
  includeSummary: boolean;
  includeImpactAnalysis: boolean;
  includeDetailedDiffs: boolean;
  format: 'pdf';
  includeAll: boolean;
  selectedDiffTypes: ('addition' | 'deletion' | 'modification')[];
  selectedArticleIds: string[];
}

interface ReportGeneratorProps {
  comparisonResult: ComparisonResult;
  doc1Name: string;
  doc2Name: string;
  onGenerateReport: (options: ReportOptions) => Promise<void>;
  isGenerating?: boolean;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  onGenerateReport,
  isGenerating = false,
}) => {
  const [options, setOptions] = React.useState<ReportOptions>({
    includeSummary: true,
    includeImpactAnalysis: true,
    includeDetailedDiffs: true,
    format: 'pdf',
    includeAll: true,
    selectedDiffTypes: ['addition', 'deletion', 'modification'],
    selectedArticleIds: [],
  } as const);

  const handleGenerate = async () => {
    await onGenerateReport(options);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-black mb-4">Generar Reporte</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeAll"
              checked={options.includeAll}
              onChange={(e) => setOptions(prev => ({ ...prev, includeAll: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="includeAll" className="text-sm text-black">Incluir Todos los Cambios</label>
          </div>

          {!options.includeAll && (
            <div className="space-y-2 pl-4">
              <div className="text-sm font-medium text-black">Tipos de Cambios</div>
              {(['addition', 'deletion', 'modification'] as const).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`diff-type-${type}`}
                    checked={options.selectedDiffTypes.includes(type)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...options.selectedDiffTypes, type]
                        : options.selectedDiffTypes.filter(t => t !== type);
                      setOptions(prev => ({ ...prev, selectedDiffTypes: newTypes }));
                    }}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`diff-type-${type}`} className={`text-sm ${
                    type === 'addition' ? 'text-green-500' :
                    type === 'deletion' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}>
                    {type === 'addition' ? 'Adiciones' :
                     type === 'deletion' ? 'Eliminaciones' :
                     'Modificaciones'}
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeSummary"
              checked={options.includeSummary}
              onChange={(e) => setOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="includeSummary" className="text-sm text-black">Incluir Resumen</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeImpactAnalysis"
              checked={options.includeImpactAnalysis}
              onChange={(e) => setOptions(prev => ({ ...prev, includeImpactAnalysis: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="includeImpactAnalysis" className="text-sm text-black">Incluir Análisis de Impacto</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeDetailedDiffs"
              checked={options.includeDetailedDiffs}
              onChange={(e) => setOptions(prev => ({ ...prev, includeDetailedDiffs: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="includeDetailedDiffs" className="text-sm text-black">Incluir Diferencias Detalladas</label>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (!options.includeAll && options.selectedDiffTypes.length === 0)}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando...
              </span>
            ) : (
              <span className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Descargar Reporte
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 