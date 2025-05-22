import { ComparisonResult, Difference } from '@/types/comparison';
import { ReportOptions } from '@/components/common/ReportGenerator';
import { jsPDF } from 'jspdf';

// Function to generate a PDF report
export const generatePDFReport = async (
  comparisonResult: ComparisonResult,
  doc1Name: string,
  doc2Name: string,
  options: ReportOptions
): Promise<void> => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Set font styles
  doc.setFont('helvetica');
  
  // Add title
  doc.setFontSize(18);
  doc.text('Reporte de Comparación de Documentos Legislativos', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Documento 1: ${doc1Name}`, 20, 30);
  doc.text(`Documento 2: ${doc2Name}`, 20, 40);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 50);
  
  let yPos = 60;
  
  // Add summary if requested
  if (options.includeSummary && comparisonResult.summary) {
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Resumen', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    
    // Handle multi-line text with text wrapping
    const splitSummary = doc.splitTextToSize(comparisonResult.summary, 170);
    doc.text(splitSummary, 20, yPos);
    
    yPos += splitSummary.length * 5 + 10;
  }
  
  // Add impact analysis if requested
  if (options.includeImpactAnalysis && comparisonResult.impactAnalysis) {
    doc.setFontSize(14);
    doc.text('Análisis de Impacto', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    
    // Handle multi-line text with text wrapping
    const splitAnalysis = doc.splitTextToSize(comparisonResult.impactAnalysis, 170);
    doc.text(splitAnalysis, 20, yPos);
    
    yPos += splitAnalysis.length * 5 + 10;
  }
  
  // Add page for differences
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  // Group differences by article
  const differencesByArticle: { [articleId: string]: Difference[] } = {};
  
  comparisonResult.differences.forEach(diff => {
    // Extract article ID from location (e.g., "Article 1, paragraph 2" -> "1")
    const articleMatch = diff.location.match(/Art(?:ículo|icle)\s+(\d+)/i);
    const articleId = articleMatch ? articleMatch[1] : 'other';
    
    if (!differencesByArticle[articleId]) {
      differencesByArticle[articleId] = [];
    }
    
    // Only add differences of selected types
    if (options.selectedDiffTypes.includes(diff.type)) {
      differencesByArticle[articleId].push(diff);
    }
  });
  
  // Filter by selected articles if not including all
  let articlesToShow = Object.keys(differencesByArticle);
  if (!options.includeAll) {
    articlesToShow = articlesToShow.filter(id => options.selectedArticleIds.includes(id));
  }
  
  // Sort articles numerically
  articlesToShow.sort((a, b) => {
    if (a === 'other') return 1;
    if (b === 'other') return -1;
    return parseInt(a) - parseInt(b);
  });
  
  // Add differences by article
  doc.setFontSize(14);
  doc.text('Cambios por Artículo', 20, yPos);
  yPos += 10;
  
  for (const articleId of articlesToShow) {
    const differences = differencesByArticle[articleId];
    
    // Skip if no differences of selected types
    if (differences.length === 0) continue;
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Article header
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(articleId === 'other' ? 'Otros Cambios' : `Artículo ${articleId}`, 20, yPos);
    yPos += 8;
    
    // Differences for this article
    doc.setFontSize(10);
    
    for (const diff of differences) {
      // Check if we need a new page
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      // Difference type with color
      if (diff.type === 'addition') {
        doc.setTextColor(0, 128, 0); // Green
        doc.text('Adición:', 25, yPos);
      } else if (diff.type === 'deletion') {
        doc.setTextColor(220, 0, 0); // Red
        doc.text('Eliminación:', 25, yPos);
      } else {
        doc.setTextColor(184, 134, 11); // Golden/Yellow
        doc.text('Modificación:', 25, yPos);
      }
      
      yPos += 6;
      
      // Content
      doc.setTextColor(0, 0, 0);
      const content = `"${diff.content.length > 100 ? diff.content.substring(0, 100) + '...' : diff.content}"`;
      const splitContent = doc.splitTextToSize(content, 160);
      doc.text(splitContent, 30, yPos);
      
      yPos += splitContent.length * 5 + 2;
      
      // Significance
      if (diff.significance) {
        doc.setTextColor(100, 100, 100);
        const splitSignificance = doc.splitTextToSize(`Importancia: ${diff.significance}`, 160);
        doc.text(splitSignificance, 30, yPos);
        yPos += splitSignificance.length * 5 + 8;
      } else {
        yPos += 8;
      }
    }
  }
  
  // Save the PDF
  doc.save(`comparacion_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Main export function that determines the format and calls the appropriate generator
export const generateReport = async (
  comparisonResult: ComparisonResult,
  doc1Name: string,
  doc2Name: string,
  options: ReportOptions
): Promise<void> => {
  try {
    if (options.format === 'pdf') {
      return generatePDFReport(comparisonResult, doc1Name, doc2Name, options);
    } else {
      console.warn(`Unsupported report format: ${options.format}`);
      throw new Error(`Unsupported report format: ${options.format}`);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate report');
  }
}; 