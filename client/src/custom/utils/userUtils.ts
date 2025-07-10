import axios from 'axios';

/**
 * Updates the super credit status for a given user.
 * @param userId The ID of the user to update.
 * @param superCredit The new super credit status (true or false).
 * @returns The updated super credit status.
 * @throws Will throw an error if the API call fails.
 */
export const updateSuperCreditStatus = async (userId: string, superCredit: boolean): Promise<boolean> => {
  try {
    await axios.put(`/api/user/admin/users/super-credit`, {
      userId,
      superCredit,
    }, { withCredentials: true });
    return superCredit; // Return the new status on success
  } catch (err: any) {
    console.error('Error updating super credit via util:', err);
    // Rethrow a more specific error or the original one
    throw new Error(err.response?.data?.message || 'ไม่สามารถอัปเดตสถานะ Super Credit ได้');
  }
}; 