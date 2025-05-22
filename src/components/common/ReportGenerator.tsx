import React, { useState } from 'react';
import { FileDown, BookOpen, FileText, Check } from 'lucide-react';
import { Button } from './Button';
import { ComparisonResult, Difference } from '@/types/comparison';

interface ReportGeneratorProps {
  comparisonResult: ComparisonResult;
  doc1Name: string;
  doc2Name: string;
  onGenerateReport: (options: ReportOptions) => Promise<void>;
}

export interface ReportOptions {
  format: 'pdf' | 'docx';
  includeAll: boolean;
  selectedDiffTypes: ('addition' | 'deletion' | 'modification')[];
  selectedArticleIds: string[];
  includeSummary: boolean;
  includeAnalysis: boolean;
}

export function ReportGenerator({ 
  comparisonResult,
  doc1Name,
  doc2Name,
  onGenerateReport 
}: ReportGeneratorProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [includeAll, setIncludeAll] = useState(true);
  const [selectedDiffTypes, setSelectedDiffTypes] = useState<('addition' | 'deletion' | 'modification')[]>([
    'addition', 'deletion', 'modification'
  ]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Group differences by article
  const differencesByArticle: { [articleId: string]: Difference[] } = {};
  
  comparisonResult.differences.forEach(diff => {
    // Extract article ID from location (e.g., "Article 1, paragraph 2" -> "1")
    const articleMatch = diff.location.match(/Art(?:ículo|icle)\s+(\d+)/i);
    const articleId = articleMatch ? articleMatch[1] : 'other';
    
    if (!differencesByArticle[articleId]) {
      differencesByArticle[articleId] = [];
    }
    
    differencesByArticle[articleId].push(diff);
  });

  const articleIds = Object.keys(differencesByArticle).sort((a, b) => {
    // Sort numerically, with 'other' at the end
    if (a === 'other') return 1;
    if (b === 'other') return -1;
    return parseInt(a) - parseInt(b);
  });

  const toggleDiffType = (type: 'addition' | 'deletion' | 'modification') => {
    setSelectedDiffTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const toggleArticleId = (id: string) => {
    setSelectedArticleIds(prev => 
      prev.includes(id) 
        ? prev.filter(aid => aid !== id) 
        : [...prev, id]
    );
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      await onGenerateReport({
        format,
        includeAll,
        selectedDiffTypes,
        selectedArticleIds,
        includeSummary,
        includeAnalysis
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-800">Generar Informe</h3>
          <Button
            variant="outline"
            className="text-xs px-2 py-1 h-auto"
            onClick={() => setShowOptions(!showOptions)}
          >
            {showOptions ? 'Ocultar opciones' : 'Mostrar opciones'}
          </Button>
        </div>

        {showOptions && (
          <div className="mt-4 space-y-4">
            {/* Format selector */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Formato</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex items-center px-3 py-1.5 text-xs rounded-md ${
                    format === 'pdf'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => setFormat('docx')}
                  className={`flex items-center px-3 py-1.5 text-xs rounded-md ${
                    format === 'docx'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Word
                </button>
              </div>
            </div>

            {/* Content options */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Contenido</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={includeSummary}
                    onChange={() => setIncludeSummary(!includeSummary)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Incluir resumen
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={includeAnalysis}
                    onChange={() => setIncludeAnalysis(!includeAnalysis)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Incluir análisis de impacto
                </label>
              </div>
            </div>

            {/* Article selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium text-gray-600">Artículos</h4>
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={includeAll}
                    onChange={() => {
                      setIncludeAll(!includeAll);
                      if (!includeAll) {
                        setSelectedArticleIds([]);
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3"
                  />
                  Seleccionar todos
                </label>
              </div>
              
              {!includeAll && (
                <div className="max-h-32 overflow-y-auto p-2 bg-gray-50 rounded border border-gray-200 space-y-1">
                  {articleIds.map(id => (
                    <label key={id} className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedArticleIds.includes(id)}
                        onChange={() => toggleArticleId(id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      {id === 'other' ? 'Otros cambios' : `Artículo ${id}`}
                      <span className="text-gray-500">
                        ({differencesByArticle[id].length})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Diff types */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Tipos de cambios</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleDiffType('addition')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    selectedDiffTypes.includes('addition')
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  Adiciones
                </button>
                <button
                  onClick={() => toggleDiffType('deletion')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    selectedDiffTypes.includes('deletion')
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  Eliminaciones
                </button>
                <button
                  onClick={() => toggleDiffType('modification')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    selectedDiffTypes.includes('modification')
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  Modificaciones
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || (!includeAll && selectedArticleIds.length === 0) || selectedDiffTypes.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Generando...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Descargar {format === 'pdf' ? 'PDF' : 'Word'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 