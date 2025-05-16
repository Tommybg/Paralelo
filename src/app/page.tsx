'use client';

import React, { useState, useEffect, JSX } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Upload, Loader2 } from 'lucide-react';
import { compareDocuments } from '@/lib/services/comparisonService';
import type { ComparisonResult } from '@/types/comparison';
import { extractTextFromFile } from '@/lib/utils/Processor';
import { Sidebar } from '@/components/common/sidebar';
import Image from 'next/image';

interface FileInfo {
  text: string;
  name: string;
  type: string;
}

export default function Home() {
  const [doc1, setDoc1] = useState<FileInfo | null>(null);
  const [doc2, setDoc2] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  // const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState(0.3);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    setLoading(true);
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
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Error comparing documents'); 
      console.error('Comparison error:', err);
    } finally { 
      setLoading(false); 
    } 
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

    // Improved filter to pick only the diffs relevant for this panel
    const relevant = comparison.differences.filter(d => {
      if (isOriginal) {
        return d.type === 'deletion'; // Only show deletions in document 1
      } else {
        return d.type === 'addition' || d.type === 'modification'; // Show additions and modifications in document 2
      }
    });

    // Improved sorting logic for more accurate rendering
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
          <span key={`plain-${cursor}-${start}`} className="text-gray-500 break-words">
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
          className={`${highlightClass} px-1 rounded relative group break-words`}
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
        <span key={`plain-tail-${cursor}`} className="text-gray-500 break-words">
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-6">
      {/* Logo in the top right corner */}
      <div className="fixed top-1 right-2 z-50">
        <Image 
          src="/logo_nobg.png" 
          alt="LegisCheck Logo" 
          width={110} 
          height={30}
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
        apiKey={apiKey}
        setApiKey={setApiKey}
        temperature={temperature}
        setTemperature={setTemperature}
      />

      <main className="flex flex-col md:flex-row h-[calc(100vh-6rem)] mx-auto max-w-[1400px] gap-6 overflow-hidden bg-white/10 backdrop-blur-md rounded-xl border-2 border-blue-400/50 border-white/10 shadow-xl p-6 relative before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-blue-400/20 before:animate-pulse">
        {/* Left Document Panel */}
        <div className="flex-[1.2] flex flex-col gap-4 min-h-0 w-full min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              onClick={() => document.getElementById('doc1-upload')?.click()}
              variant="outline"
              className="w-full bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir Documento 1
            </Button>
            {doc1 && (
              <div className="relative group">
                <span className="text-sm text-white truncate max-w-[200px] bg-black/20 px-2 py-1 rounded-md">
                  {doc1.name}
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
          <Card className="flex-1 min-h-0 max-h-[calc(100vh-12rem)] bg-white/80 backdrop-blur-sm w-full">
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
                <span className="text-sm text-white truncate max-w-[200px] bg-black/20 px-2 py-1 rounded-md">
                  {doc2.name}
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
          <Card className="flex-1 min-h-0 max-h-[calc(100vh-12rem)] bg-white/80 backdrop-blur-sm w-full">
            <CardContent className="h-full overflow-auto text-gray-600 w-full">
              {renderDocument(doc2, false)}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Panel */}
        <div className="flex-[1] flex flex-col gap-4 min-h-0 max-w-md w-full min-w-0">
          <Button 
            onClick={handleComparison} 
            disabled={!doc1 || !doc2 || loading}
            variant="default"
            className="w-full shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            {loading && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {['Comparando', 'Pensando', 'Analizando'][Math.floor(Math.random() * 3)]}...
              </>
            )}
            {!loading && 'Comparar Documentos'}
          </Button>

          <Card className="flex-1 min-h-0 max-h-[calc(100vh-12rem)] bg-white/80 backdrop-blur-sm">
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
                      <p className="text-gray-800 text-sm">{comparison.summary}</p>
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
                        {comparison.differences.map((diff, index) => (
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
);
}