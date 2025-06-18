-- Aurora PostgreSQL Schema for Document Comparison App
-- This connects to Supabase Auth but stores data in Aurora

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (connects to Supabase auth via supabase_user_id)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supabase_user_id UUID NOT NULL UNIQUE, -- Reference to Supabase auth user
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(supabase_user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  size BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comparisons table
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(supabase_user_id) ON DELETE CASCADE,
  doc1_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  doc2_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  summary TEXT,
  impact_analysis TEXT,
  result_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create differences table
CREATE TABLE IF NOT EXISTS differences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('addition', 'deletion', 'modification')),
  content TEXT NOT NULL,
  location VARCHAR(255),
  significance VARCHAR(255),
  article_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(supabase_user_id) ON DELETE CASCADE,
  comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
  report_options JSONB NOT NULL DEFAULT '{}',
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timelines table
CREATE TABLE IF NOT EXISTS timelines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(supabase_user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  current_stage VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  author VARCHAR(255),
  committee VARCHAR(255),
  document_version_id UUID REFERENCES documents(id),
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_reviews table for rating system
CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES profiles(supabase_user_id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES profiles(supabase_user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_supabase_user_id ON profiles(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_user_id ON comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_docs ON comparisons(doc1_id, doc2_id);
CREATE INDEX IF NOT EXISTS idx_differences_comparison_id ON differences(comparison_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_timelines_user_id ON timelines(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_timeline_id ON milestones(timeline_id);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_comparisons_updated_at
  BEFORE UPDATE ON comparisons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_timelines_updated_at
  BEFORE UPDATE ON timelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert sample data for testing (optional)
-- Uncomment these lines after setting up real users

/*
-- Sample profile (replace with real Supabase user ID)
INSERT INTO profiles (supabase_user_id, email, full_name, plan_type) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Usuario de Prueba', 'free')
ON CONFLICT (supabase_user_id) DO NOTHING;
*/ 