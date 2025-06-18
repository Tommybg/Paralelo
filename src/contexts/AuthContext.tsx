'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { User, UserProfile, AuthContextType } from '../types/auth';
import { authService } from '../lib/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthState = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        await loadUserProfile(currentUser);
      }
    } catch (error) {
      console.error('Auth state check error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const profile = await authService.getUserProfile(supabaseUser.id);
      
      if (profile) {
        setUser({
          id: profile.supabase_user_id,
          email: profile.email,
          name: profile.full_name,
          planType: profile.plan_type,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    // Check initial auth state
    checkAuthState();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAuthState]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user: supabaseUser } = await authService.signIn(email, password);
      if (supabaseUser) {
        await loadUserProfile(supabaseUser);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await authService.signUp(email, password, name);
      // Note: User will be automatically signed in after email verification
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const updatedProfile = await authService.updateUserProfile(user.id, updates);
      setUser({
        id: updatedProfile.supabase_user_id,
        email: updatedProfile.email,
        name: updatedProfile.full_name,
        planType: updatedProfile.plan_type,
        createdAt: updatedProfile.created_at,
        updatedAt: updatedProfile.updated_at,
      });
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 