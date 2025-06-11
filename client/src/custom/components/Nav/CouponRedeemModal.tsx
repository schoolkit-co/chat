import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

interface CouponRedeemModalProps {
  onClose: () => void;
  onSuccess?: (credit: number) => void;
}

const CouponRedeemModal: React.FC<CouponRedeemModalProps> = ({ onClose, onSuccess }) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<{
    message: string;
    type: 'success' | 'error' | '';
  }>({ message: '', type: '' });
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim() || redeeming) return;
    
    setRedeeming(true);
    setCouponStatus({ message: '', type: '' });
    
    try {
      const { data } = await axios.post('/api/coupon/redeem', { couponCode: couponCode.trim() });
      setCouponStatus({ 
        message: data.message || 'แลกคูปองสำเร็จแล้ว', 
        type: 'success' 
      });
      setCouponCode('');
      
      // เรียกใช้ callback เมื่อสำเร็จ
      if (onSuccess && data.credit) {
        onSuccess(data.credit);
      }
    } catch (error: any) {
      console.error('Failed to redeem coupon:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการแลกคูปอง กรุณาลองอีกครั้ง';
      setCouponStatus({ message: errorMessage, type: 'error' });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 max-w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">แลกคูปอง</h3>
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            รหัสคูปอง
          </label>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="กรอกรหัสคูปอง"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            เติมเฉพาะเครดิตบุคคลและวันใช้งานเท่านั้น
          </p>
        </div>
        
        {couponStatus.message && (
          <div className={`mb-4 p-2 rounded ${couponStatus.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            {couponStatus.message}
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={handleRedeemCoupon}
            disabled={!couponCode.trim() || redeeming}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {redeeming ? 'กำลังดำเนินการ...' : 'แลกคูปอง'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponRedeemModal; 