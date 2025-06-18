export interface User {
  id: string;
  email: string;
  name: string;
  planType: 'free' | 'premium';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  supabase_user_id: string; // Reference to Supabase auth user
  email: string;
  full_name: string;
  plan_type: 'free' | 'premium';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  uploadedAt: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface UserComparison {
  id: string;
  user_id: string;
  doc1_id: string;
  doc2_id: string;
  name: string;
  summary?: string;
  impact_analysis?: string;
  result_data: Record<string, any>;
  created_at: string;
}

export interface UserReport {
  id: string;
  user_id: string;
  comparison_id: string;
  report_options: Record<string, any>;
  file_url: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export interface Comparison {
  id: string;
  document1Id: string;
  document2Id: string;
  result: Record<string, unknown>;
  createdAt: string;
  userId: string;
} 