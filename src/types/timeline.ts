export type MilestoneType = 'radicacion' | 'comision_primera' | 'comision_segunda' | 'plenaria' | 'conciliacion' | 'sancion';

export interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  date: string;
  description?: string;
  author?: string;
  committee?: string;
  documentVersion?: string;
  isActive?: boolean;
}

export interface TimelineData {
  milestones: Milestone[];
  currentMilestoneId?: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  author: string;
  type: 'comision' | 'plenaria' | 'otro';
  description: string;
  changes: {
    additions: number;
    deletions: number;
    modifications: number;
  };
  documentVersionId: string;
} 