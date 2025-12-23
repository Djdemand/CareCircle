import { supabase } from './supabase';

/**
 * TeamService - Logic for managing the 5-caregiver limit and team discovery.
 */
export const TeamService = {
  /**
   * Invites a new member to the care team.
   */
  inviteMember: async (email: string, patientId: string) => {
    // 1. Check current team count
    const { count } = await supabase
      .from('caregivers')
      .select('*', { count: 'exact', head: true });

    if (count && count >= 5) {
      throw new Error("Care team limit reached (max 5 caregivers).");
    }

    // 2. Logic to send invite (In real production, this would trigger an Edge Function)
    console.log(`Sending invite to ${email} for patient circle ${patientId}`);
    
    // For demo: Just insert a placeholder record
    return await supabase
      .from('caregivers')
      .insert([{ email, name: 'Pending Invite' }]);
  }
};
