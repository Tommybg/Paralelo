export interface Difference {
  type: 'addition' | 'deletion' | 'modification';
  content: string;
  startIndex?: number;
  endIndex?: number;
  location: string;
  significance: string;
  referenceContent?: string;
  articleId?: string;
  articleTitle?: string;
  author?: string;
  changeDate?: string;
}


  
export interface ComparisonResult {
  differences: Difference[];
  summary: string;
  impactAnalysis: string;
  metadata?: {
    version1: {
      id: string;
      name: string;
      date: string;
      milestone?: string;
    };
    version2: {
      id: string;
      name: string;
      date: string;
      milestone?: string;
    };
  };
}
  
export interface ComparisonError {
  error: string;
  details?: string;
}

export interface DocumentVersion {
  id: string;
  name: string;
  text: string;
  date: string;
  author?: string;
  milestone?: string;
  description?: string;
}