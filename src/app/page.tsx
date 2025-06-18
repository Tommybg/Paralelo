'use client';

import React, { useState, useEffect, JSX } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Upload, Loader2, Flag, LayoutDashboard } from 'lucide-react';
import { compareDocuments } from '@/lib/services/comparisonService';
import type { ComparisonResult } from '@/types/comparison';
import { extractTextFromFile } from '@/lib/utils/Processor';
import { Sidebar } from '@/components/common/sidebar';
import { TimelineCompact } from '@/components/common/Timeline';
import { SearchFilters, FilterOptions } from '@/components/common/SearchFilters';
import { Milestone, MilestoneType } from '@/types/timeline';
import { HistoryEntry } from '@/types/timeline';
import { generateReport } from '@/lib/services/reportService';
import { ReportOptions } from '@/components/common/ReportGenerator';
import Image from 'next/image';

interface FileInfo {
  text: string;
  name: string;
  type: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [doc1, setDoc1] = useState<FileInfo | null>(null);
  const [doc2, setDoc2] = useState<FileInfo | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // New state for timeline, history, and search
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [currentMilestoneId, setCurrentMilestoneId] = useState<string | undefined>();
  const [currentStage, setCurrentStage] = useState<MilestoneType | undefined>();
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [selectedHistoryEntryId, setSelectedHistoryEntryId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    diffTypes: ['addition', 'deletion', 'modification'],
    articleIds: [],
    authors: [],
  });
  const [filteredDifferences, setFilteredDifferences] = useState<ComparisonResult['differences']>([]);
  
  // Estado para controlar el sidebar
  const [activeTab, setActiveTab] = useState<'timeline' | 'history' | 'reports'>('timeline');

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user) {
    return null;
  }

  useEffect(() => {
    setMounted(true);
    
    // Initialize with some example history entries
    setHistoryEntries([
      {
        id: 'history-1',
        date: '2023-08-01',
        author: 'Juan Pérez',
        type: 'comision',
        description: 'Revisión inicial en comisión',
        changes: {
          additions: 5,
          deletions: 2,
          modifications: 3,
        },
        documentVersionId: 'version-1',
      },
      {
        id: 'history-2',
        date: '2023-09-15',
        author: 'María López',
        type: 'plenaria',
        description: 'Modificaciones aprobadas en plenaria',
        changes: {
          additions: 2,
          deletions: 1,
          modifications: 7,
        },
        documentVersionId: 'version-2',
      },
    ]);

    // Handle URL parameters from dashboard navigation
    const sidebarParam = searchParams.get('sidebar');
    const focusParam = searchParams.get('focus');
    
    if (sidebarParam === 'history') {
      setActiveTab('history');
      setIsSidebarOpen(true);
    }
    
    if (sidebarParam === 'reports') {
      setActiveTab('reports');
      setIsSidebarOpen(true);
    }
    
    if (focusParam === 'upload') {
      // Auto-trigger file upload dialog for document 1
      setTimeout(() => {
        const uploadInput = document.getElementById('doc1-upload');
        if (uploadInput) {
          uploadInput.click();
        }
      }, 400); // Small delay to ensure DOM is ready
    }
  }, [searchParams]);

  // Filter differences when search query or filter options change
  useEffect(() => {
    if (!comparison) return;
    
    let filtered = [...comparison.differences];
    
    // Filter by difference types
    if (filterOptions.diffTypes.length > 0) {
      filtered = filtered.filter(diff => filterOptions.diffTypes.includes(diff.type));
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(diff => 
        diff.content.toLowerCase().includes(query) || 
        diff.location.toLowerCase().includes(query) ||
        diff.significance.toLowerCase().includes(query)
      );
    }
    
    // Filter by article IDs if any are selected
    if (filterOptions.articleIds.length > 0) {
      filtered = filtered.filter(diff => {
        const articleMatch = diff.location.match(/Art(?:ículo|icle)\s+(\d+)/i);
        const articleId = articleMatch ? articleMatch[1] : 'other';
        return filterOptions.articleIds.includes(articleId);
      });
    }
    
    setFilteredDifferences(filtered);
  }, [comparison, searchQuery, filterOptions]);

  const truncateFileName = (name: string, maxLength: number = 30): string => {
    if (name.length <= maxLength) {
      return name;
    }
    return name.substring(0, maxLength - 3) + "...";
  };

  const handleFileUpload = async (docNumber: 1 | 2, file: File) => {
    try {
      setError(null);
      
      if (!file.type.match(/(text\/plain|application\/pdf)/)) {
        throw new Error('Por favor, sube un archivo de Texto o PDF');
      }

      const text = await extractTextFromFile(file);
      
      const fileInfo: FileInfo = {
        text,
        name: file.name,
        type: file.type
      };

      if (docNumber === 1) {
        setDoc1(fileInfo);
        setComparison(null);
      } else {
        setDoc2(fileInfo);
        setComparison(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading file');
      console.error('File upload error:', err);
    }
  };

  const handleComparison = async () => {
    if (!doc1?.text || !doc2?.text) {
      setError('Por favor, sube ambos documentos');
      return;
    }

    setLoadingComparison(true);
    setError(null);

    try {
      const result = await compareDocuments(doc1.text, doc2.text);

      // Augment each diff with start/end in the correct document 
      const enriched = result.differences.map(diff => { 
        let start = -1; 
        let end = -1; 
      
        // deletions live in doc1, additions & modifications in doc2 
        const targetText = diff.type === 'deletion' 
          ? doc1.text 
          : doc2.text; 
      
        start = targetText.indexOf(diff.content); 
        if (start !== -1) { 
          end = start + diff.content.length; 
        } 
      
        return { 
          ...diff, 
          startIndex: start, 
          endIndex: end 
        }; 
      }); 
      
      setComparison({ 
        ...result, 
        differences: enriched 
      });
      
      // Set filtered differences initially to all differences
      setFilteredDifferences(enriched);
      
      // Add this comparison to history
      const newHistoryEntry: HistoryEntry = {
        id: `history-${Date.now()}`,
        date: new Date().toISOString(),
        author: 'Usuario Actual',
        type: 'otro',
        description: `Comparación entre ${doc1.name} y ${doc2.name}`,
        changes: {
          additions: enriched.filter(d => d.type === 'addition').length,
          deletions: enriched.filter(d => d.type === 'deletion').length,
          modifications: enriched.filter(d => d.type === 'modification').length,
        },
        documentVersionId: `version-${Date.now()}`,
      };
      
      setHistoryEntries(prev => [newHistoryEntry, ...prev]);
      
      // Abrir el sidebar en la pestaña de timeline
      setActiveTab('timeline');
      setIsSidebarOpen(true);
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Error comparing documents'); 
      console.error('Comparison error:', err);
    } finally { 
      setLoadingComparison(false); 
    } 
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filters: FilterOptions) => {
    setFilterOptions(filters);
  };

  const handleGenerateReport = async (options: ReportOptions): Promise<void> => {
    if (!comparison || !doc1 || !doc2) {
      setError('No comparison data available for report generation');
      return;
    }
    
    try {
      await generateReport(comparison, doc1.name, doc2.name, options);
    } catch (error) {
      console.error('Report generation error:', error);
      setError('Error generating report');
    }
  };

  const handleMilestoneSave = (updatedMilestones: Milestone[]) => {
    // Verificar tipos duplicados y mantener solo el más reciente
    const seenTypes = new Set<MilestoneType>();
    const uniqueMilestones: Milestone[] = [];
    
    // Ordenar por fecha para procesar primero los más recientes
    const sortedByDate = [...updatedMilestones].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Mantener solo un hito por tipo (el más reciente)
    sortedByDate.forEach(milestone => {
      if (!seenTypes.has(milestone.type)) {
        seenTypes.add(milestone.type);
        uniqueMilestones.push(milestone);
      }
    });
    
    // Ordenar los hitos según el orden natural del proceso legislativo
    const milestoneOrder: MilestoneType[] = [
      'radicacion',
      'comision_primera',
      'comision_segunda',
      'plenaria',
      'conciliacion',
      'sancion'
    ];
    
    const finalMilestones = [...uniqueMilestones].sort((a, b) => {
      const aIndex = milestoneOrder.indexOf(a.type);
      const bIndex = milestoneOrder.indexOf(b.type);
      return aIndex - bIndex;
    });
    
    setMilestones(finalMilestones);
    
    // Actualizar la etapa actual basada en el hito más avanzado
    // (esto asegura que la barra de progreso se muestre correctamente)
    let furthestStage: MilestoneType | undefined;
    let furthestIndex = -1;
    
    finalMilestones.forEach(milestone => {
      const index = milestoneOrder.indexOf(milestone.type);
      if (index > furthestIndex) {
        furthestIndex = index;
        furthestStage = milestone.type;
      }
    });
    
    // Si hay hitos, actualizar la etapa actual con el más avanzado
    if (furthestStage) {
      setCurrentStage(furthestStage);
      // Seleccionar el hito correspondiente al stage más avanzado
      const furthestMilestone = finalMilestones.find(m => m.type === furthestStage);
      if (furthestMilestone) {
        setCurrentMilestoneId(furthestMilestone.id);
      }
    }
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    setCurrentMilestoneId(milestone.id);
    setCurrentStage(milestone.type);
    
    // Si tiene un documentVersion asociado, cargarlo
    if (milestone.documentVersion) {
      // En una aplicación real, aquí cargarías el documento guardado
      // asociado con este hito desde la base de datos
      console.log(`Cargando documento versión: ${milestone.documentVersion}`);
      
      // Buscar en el historial la entrada relacionada con este hito
      const historyEntry = historyEntries.find(entry => 
        entry.documentVersionId === milestone.documentVersion ||
        entry.description.includes(milestone.type)
      );
      
      if (historyEntry) {
        // Seleccionar esta entrada en el historial
        setSelectedHistoryEntryId(historyEntry.id);
        
        // En una app real, cargarías los documentos relacionados
        // y mostrarías la comparación guardada
        console.log(`Mostrando comparación guardada del hito: ${milestone.title}`);
        
        // Podríamos incluso abrir el sidebar en la pestaña de historial
        setActiveTab('history');
        setIsSidebarOpen(true);
      }
    }
  };

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    setSelectedHistoryEntryId(entry.id);
    // In a real app, you'd load the document versions associated with this history entry
    console.log(`Loading document versions for history entry: ${entry.id}`);
  };

  const renderDocument = (doc: FileInfo | null, isOriginal = true) => {
    if (!doc) {
      return (
        <div className="flex items-center justify-center h-full text-gray-600">
          Ningún documento subido
        </div>
      );
    }

    if (!comparison) {
      return (
        <div className="overflow-auto h-full w-full">
          <pre className="whitespace-pre-wrap font-mono text-sm break-all text-gray-500 w-full">
            {doc.text}
          </pre>
        </div>
      );
    }

    // Use filtered differences if available, otherwise use all differences
    const differencesToUse = filteredDifferences.length > 0 
      ? filteredDifferences 
      : comparison.differences;

    // Filter for the relevant differences for this panel
    const relevant = differencesToUse.filter(d => {
      if (isOriginal) {
        return d.type === 'deletion'; // Only show deletions in document 1
      } else {
        return d.type === 'addition' || d.type === 'modification'; // Show additions and modifications in document 2
      }
    });

    // Sorting logic for accurate rendering
    const sorted = [...relevant].sort((a, b) => {
      const aPos = typeof a.startIndex === 'number' ? a.startIndex : doc.text.indexOf(isOriginal && a.referenceContent ? a.referenceContent : a.content);
      const bPos = typeof b.startIndex === 'number' ? b.startIndex : doc.text.indexOf(isOriginal && b.referenceContent ? b.referenceContent : b.content);
      
      if (aPos === -1 && bPos === -1) return 0;
      if (aPos === -1) return 1;
      if (bPos === -1) return -1;
      
      return aPos - bPos;
    });

    const spans: JSX.Element[] = [];
    let cursor = 0;

    for (const diff of sorted) {
      const contentToFind = isOriginal && diff.type === 'modification' && diff.referenceContent
        ? diff.referenceContent
        : diff.content;
      
      const start = typeof diff.startIndex === 'number' && diff.startIndex >= 0
        ? diff.startIndex
        : doc.text.indexOf(contentToFind, cursor);
        
      if (start < 0) {
        continue;
      }
      
      const end = typeof diff.endIndex === 'number' && diff.endIndex > start
        ? diff.endIndex
        : start + contentToFind.length;

      if (start > cursor) {
        spans.push(
          <span key={`plain-${cursor}-${start}`} className="text-gray-500">
            {doc.text.slice(cursor, start)}
          </span>
        );
      }

      let highlightClass = '';
      if (diff.type === 'deletion') {
        highlightClass = 'bg-red-100 text-red-800';
      } else if (diff.type === 'addition') {
        highlightClass = 'bg-green-100 text-green-800';
      } else if (diff.type === 'modification') {
        highlightClass = isOriginal
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800';
      }

      spans.push(
        <span
          key={`diff-${start}-${end}`}
          className={`${highlightClass} px-1 rounded relative group`}
          title={diff.type.charAt(0).toUpperCase() + diff.type.slice(1)}
        >
          {doc.text.slice(start, end)}
          <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 w-64 bg-gray-900 text-white text-xs rounded p-2 mb-2 z-10">
            <strong>{diff.type.charAt(0).toUpperCase() + diff.type.slice(1)}:</strong> {diff.significance}
          </span>
        </span>
      );

      cursor = end;
    }

    if (cursor < doc.text.length) {
      spans.push(
        <span key={`plain-tail-${cursor}`} className="text-gray-500">
          {doc.text.slice(cursor)}
        </span>
      );
    }

    return (
      <div className="overflow-auto h-full w-full">
        <pre className="whitespace-pre-wrap font-mono text-sm break-words w-full">
          {spans}
        </pre>
      </div>
    );
  };

  if (!mounted) {
    return null;
  }

  // Get all unique article IDs from the comparison for filtering
  const getArticleIds = () => {
    if (!comparison) return [];
    
    const articleIds = new Set<string>();
    comparison.differences.forEach(diff => {
      const articleMatch = diff.location.match(/Art(?:ículo|icle)\s+(\d+)/i);
      const articleId = articleMatch ? articleMatch[1] : 'other';
      articleIds.add(articleId);
    });
    
    return Array.from(articleIds);
  };

  return (
    <div className="min-h-screen w-full bg-white p-6">
      
      <div className="absolute top-0 right-3 z-50 flex gap-1 items-center mt-0">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="mr-4 flex items-center bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 text-gray-700"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
        <Image 
          src="/logo_nobg.png" 
          alt="LegisCheck Logo" 
          width={110} 
          height={35}
          priority
        />
        <Image
          src="/logo_govlab.png"
          alt="Second Logo"
          width={110}
          height={30}
          priority
        />
      </div>
          
      <button
        className="fixed top-2 left-4 backdrop-blur-sm hover:bg-black/20 z-50 w-12 h-12 rounded-xl flex items-center justify-center"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Image 
          src="/menu.svg" 
          alt="Menu" 
          width={24} 
          height={24}
        />
      </button>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        milestones={milestones}
        onSaveMilestones={handleMilestoneSave}
        historyEntries={historyEntries}
        onSelectHistoryEntry={handleSelectHistoryEntry}
        selectedHistoryEntryId={selectedHistoryEntryId}
        comparisonResult={comparison || undefined}
        doc1Name={doc1?.name}
        doc2Name={doc2?.name}
        onGenerateReport={handleGenerateReport}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      <main className="flex flex-col h-[calc(100vh-6rem)] mx-auto max-w-[1400px] gap-6 overflow-hidden bg-blue-600/20 backdrop-blur-md rounded-xl border-2 border-blue-400/30 shadow-xl p-6 relative before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-blue-400/20 before:animate-pulse flex-grow w-full">
        {/* Timeline Section */}
        <div className="w-full pb-4 pt-2">
          <TimelineCompact 
            milestones={milestones}
            onMilestoneClick={handleMilestoneClick}
            currentMilestoneId={currentMilestoneId}
            currentStage={currentStage}
          />
        </div>
        
        {/* Search and Filter Section */}
        {comparison && (
          <div className="w-full flex justify-between items-center">
            <div className="flex-1">
              <SearchFilters 
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                articleCount={getArticleIds().length}
              />
            </div>
            
            <div className="ml-2 -translate-y-2">
              <Button
                onClick={() => {
                  setActiveTab('timeline');
                  setIsSidebarOpen(true);
                }}
                variant="outline"
                className="flex items-center bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <Flag className="w-4 h-4 mr-2" />
                Asignar a Hito
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row h-full gap-6 overflow-hidden">
          {/* Left Document Panel */}
          <div className="flex-[1.2] flex flex-col gap-4 min-h-0 w-full min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                onClick={() => document.getElementById('doc1-upload')?.click()}
                variant="outline"
                className="w-full bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200"
              >
                <Upload className="mr-2 h-4 w-4" />
                Subir Documento 1
              </Button>
              {doc1 && (
                <div className="relative group">
                  <span className="text-sm text-white truncate max-w-[200px] bg-blue-600 px-2 py-1 rounded-md">
                    {truncateFileName(doc1.name)}
                  </span>
                  <button
                    onClick={() => {
                      setDoc1(null);
                      setComparison(null);
                    }}
                    className="hidden group-hover:flex absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-5 h-5 items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    title="Eliminar documento"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <input
              id="doc1-upload"
              type="file"
              accept=".txt,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(1, e.target.files[0])}
              className="hidden"
            />
            <Card className="flex-1 min-h-0 max-h-[calc(100vh-12rem)] bg-gray-50/90 backdrop-blur-sm w-full border border-gray-200">
              <CardContent className="h-full overflow-auto text-gray-600 w-full">
                {renderDocument(doc1, true)}
              </CardContent>
            </Card>
          </div>

          {/* Right Document Panel */}
          <div className="flex-[1.2] flex flex-col gap-4 min-h-0 w-full min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                onClick={() => document.getElementById('doc2-upload')?.click()}
                variant="outline"
                className="w-full bg-white/80 backdrop-blur-sm hover:bg-white"
              >
                <Upload className="mr-2 h-4 w-4" />
                Subir Documento 2
              </Button>
              {doc2 && (
                <div className="relative group">
                  <span className="text-sm text-white truncate max-w-[200px] bg-blue-600 px-2 py-1 rounded-md">
                    {truncateFileName(doc2.name)}
                  </span>
                  <button
                    onClick={() => {
                      setDoc2(null);
                      setComparison(null);
                    }}
                    className="hidden group-hover:flex absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-5 h-5 items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    title="Eliminar documento"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <input
              id="doc2-upload"
              type="file"
              accept=".txt,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(2, e.target.files[0])}
              className="hidden"
            />
            <Card className="flex-1 min-h-0 max-h-[calc(100vh-12rem)] bg-gray-50/90 backdrop-blur-sm w-full border border-gray-200">
              <CardContent className="h-full overflow-auto text-gray-600 w-full">
                {renderDocument(doc2, false)}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Panel */}
          <div className="flex-[1] flex flex-col gap-4 min-h-0 max-w-md w-full min-w-0">
            <Button 
              onClick={handleComparison} 
              disabled={!doc1 || !doc2 || loadingComparison}
              variant="default"
              className="w-full shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              {loadingComparison && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {['Comparando', 'Pensando', 'Analizando'][Math.floor(Math.random() * 3)]}...
                </>
              )}
              {!loadingComparison && 'Comparar Documentos'}
            </Button>

            <Card className="flex-1 min-h-0 max-h-[calc(100vh-12rem)] bg-gray-50/90 backdrop-blur-sm border border-gray-200">
              <CardContent className="h-full overflow-auto">
                <div className="space-y-4">
                  {(comparison || error) && (
                    <h3 className="font-semibold text-gray-800">Análisis</h3>
                  )}
                  {error && (
                    <div className="text-red-500 bg-red-50 p-3 rounded-lg">
                      {error}
                    </div>
                  )}
                  {comparison && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 text-gray-800">Resumen</h4>
                        <p className="text-gray-800 text-sm">
                          {typeof comparison.summary === 'string' 
                            ? comparison.summary 
                            : typeof comparison.summary === 'object' && comparison.summary !== null 
                              ? Object.values(comparison.summary).filter(v => typeof v === 'string').join(' ')
                              : 'Resumen no disponible'}
                        </p>
                      </div>

                      {comparison.impactAnalysis && (
                        <div>
                          <h4 className="font-medium mb-2 text-gray-800">Análisis de Impacto</h4>
                          <p className="text-gray-800 text-sm text-justify">{comparison.impactAnalysis}</p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2 text-gray-800">Diferencias Detalladas</h4>
                        <div className="space-y-3">
                          {(filteredDifferences.length > 0 ? filteredDifferences : comparison.differences).map((diff, index) => (
                            <div 
                              key={index} 
                              className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                            >
                              <div className={`text-sm font-medium mb-1 ${
                                diff.type === 'addition' ? 'text-green-600' :
                                diff.type === 'deletion' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {diff.type === 'addition' ? 'Adición' :
                                 diff.type === 'deletion' ? 'Eliminación' :
                                 'Modificación'}
                              </div>
                              <div className="text-sm mb-1 text-gray-800">
                                <span className="font-medium">Contenido:</span> &quot;{diff.content}&quot;
                              </div>
                              <div className="text-sm mb-1 text-gray-800">
                                <span className="font-medium">Ubicación:</span> {diff.location}
                              </div>
                              <div className="text-sm text-gray-800">
                                <span className="font-medium">Importancia:</span> {diff.significance}
                              </div>
                            </div>
                          ))}
                          
                          {filteredDifferences.length === 0 && comparison.differences.length > 0 && searchQuery && (
                            <div className="text-center text-gray-500 py-3">
                              No se encontraron diferencias que coincidan con la búsqueda.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}