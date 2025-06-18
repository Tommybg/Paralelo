import { supabase } from '../supabase/client';
import { User, UserProfile } from '../../types/auth';

export class AuthService {
  
  // Sign up new user (only Supabase for now)
  async signUp(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(`Sign up failed: ${error}`);
    }
  }

  // Sign in user
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(`Sign in failed: ${error}`);
    }
  }

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error(`Sign out failed: ${error}`);
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get user session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  // Simplified profile (from Supabase metadata for now)
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      // Create a simplified profile from Supabase user data
      return {
        id: user.id,
        supabase_user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email || '',
        plan_type: 'free',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  // Simplified update (only Supabase metadata for now)
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
        }
      });

      if (error) throw error;

      // Return updated profile
      const profile = await this.getUserProfile(userId);
      if (!profile) throw new Error('Failed to get updated profile');
      
      return profile;
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(`Failed to update profile: ${error}`);
    }
  }

  // Mock stats for now (will connect to Aurora later)
  async getUserStats(userId: string) {
    return {
      documents_count: 0,
      comparisons_count: 0,
      reports_count: 0
    };
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw new Error(`Failed to reset password: ${error}`);
    }
  }

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService(); 