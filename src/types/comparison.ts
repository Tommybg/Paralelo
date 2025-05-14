export interface Difference {
  type: 'addition' | 'deletion' | 'modification';
  content: string;
  startIndex?: number;
  endIndex?: number;
  location: string;
  significance: string;
  referenceContent?: string;
}


  
  export interface ComparisonResult {
    differences: Difference[];
    summary: string;
    impactAnalysis: string;
  }
  
  export interface ComparisonError {
    error: string;
    details?: string;
  }