import { query } from '../db/aurora';
import { UserProfile } from '../../types/auth';

export class UserModel {
  // Create user profile in Aurora (called after Supabase auth)
  static async createProfile(
    supabaseUserId: string, 
    email: string, 
    fullName: string
  ): Promise<UserProfile> {
    const sql = `
      INSERT INTO profiles (supabase_user_id, email, full_name, plan_type)
      VALUES ($1, $2, $3, 'free')
      RETURNING *
    `;
    
    const result = await query(sql, [supabaseUserId, email, fullName]);
    return result.rows[0];
  }

  // Get user profile by Supabase ID
  static async getProfileBySupabaseId(supabaseUserId: string): Promise<UserProfile | null> {
    const sql = 'SELECT * FROM profiles WHERE supabase_user_id = $1';
    const result = await query(sql, [supabaseUserId]);
    return result.rows[0] || null;
  }

  // Update user profile
  static async updateProfile(
    supabaseUserId: string, 
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');
    
    const sql = `
      UPDATE profiles 
      SET ${setClause}, updated_at = NOW()
      WHERE supabase_user_id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [supabaseUserId, ...values]);
    return result.rows[0];
  }

  // Get user statistics
  static async getUserStats(supabaseUserId: string) {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM documents WHERE user_id = $1) as documents_count,
        (SELECT COUNT(*) FROM comparisons WHERE user_id = $1) as comparisons_count,
        (SELECT COUNT(*) FROM reports WHERE user_id = $1) as reports_count
    `;
    
    const result = await query(sql, [supabaseUserId]);
    return result.rows[0];
  }

  // Check if user exists
  static async userExists(supabaseUserId: string): Promise<boolean> {
    const sql = 'SELECT 1 FROM profiles WHERE supabase_user_id = $1';
    const result = await query(sql, [supabaseUserId]);
    return result.rows.length > 0;
  }

  // Delete user profile
  static async deleteProfile(supabaseUserId: string): Promise<void> {
    const sql = 'DELETE FROM profiles WHERE supabase_user_id = $1';
    await query(sql, [supabaseUserId]);
  }
} 