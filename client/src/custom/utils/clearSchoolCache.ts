import axios from 'axios';

/**
 * ฟังก์ชันสำหรับเรียก API clear school bill token cache
 * @returns Promise<boolean> - true หากสำเร็จ, false หากไม่สำเร็จ
 */
export const clearSchoolBillTokenCache = async (): Promise<boolean> => {
  try {
    const response = await axios.post('/api/custom-balance/clear-school-cache');
    return response.data?.success || false;
  } catch (error) {
    console.error('[clearSchoolBillTokenCache] Error:', error);
    return false;
  }
}; 