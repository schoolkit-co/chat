import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, Trash, Plus, X, Edit } from 'lucide-react';
import { cn } from '~/utils';

interface Coupon {
  _id: string;
  couponCode: string;
  credit: number;
  expiredDate: string;
}

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    couponCode: '',
    credit: 0,
    expiredDate: ''
  });
  const [sortField, setSortField] = useState<keyof Coupon>('couponCode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ดึงข้อมูลคูปองทั้งหมด
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/coupon');
      setCoupons(data);
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลคูปอง:', err);
      setError('ไม่สามารถดึงข้อมูลคูปองได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // จัดการการเรียงข้อมูล
  const handleSort = (field: keyof Coupon) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // คำนวณข้อมูลที่เรียงแล้ว
  const sortedCoupons = [...coupons].sort((a, b) => {
    if (sortField === 'couponCode') {
      return sortDirection === 'asc' 
        ? a.couponCode.localeCompare(b.couponCode)
        : b.couponCode.localeCompare(a.couponCode);
    } else if (sortField === 'credit') {
      return sortDirection === 'asc' ? a.credit - b.credit : b.credit - a.credit;
    } else if (sortField === 'expiredDate') {
      return sortDirection === 'asc'
        ? new Date(a.expiredDate).getTime() - new Date(b.expiredDate).getTime()
        : new Date(b.expiredDate).getTime() - new Date(a.expiredDate).getTime();
    }
    return 0;
  });

  // แปลง Date เป็นรูปแบบไทย
  const formatThaiDate = (dateString: string) => {
    const date = new Date(dateString);
    const thaiOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    // แปลง year พ.ศ.
    const thaiDateString = date.toLocaleDateString('th-TH', thaiOptions);
    
    return thaiDateString;
  };

  // ตรวจสอบว่าคูปองหมดอายุหรือไม่
  const isExpired = (dateString: string) => {
    const expireDate = new Date(dateString);
    const today = new Date();
    return expireDate < today;
  };

  // คืนค่า ISO String จาก Date
  const toISODateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // เตรียมวันที่สำหรับฟอร์ม
  const prepareDate = (dateString: string) => {
    const date = new Date(dateString);
    return toISODateString(date);
  };

  // เปิดโมดัลเพิ่มคูปองใหม่
  const openAddModal = () => {
    setEditingCoupon(null);
    // ตั้งค่าวันหมดอายุเป็นวันพรุ่งนี้
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      couponCode: '',
      credit: 0,
      expiredDate: toISODateString(tomorrow)
    });
    setShowModal(true);
  };

  // เปิดโมดัลแก้ไขคูปอง
  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      couponCode: coupon.couponCode,
      credit: coupon.credit,
      expiredDate: prepareDate(coupon.expiredDate)
    });
    setShowModal(true);
  };

  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'credit' 
        ? (value === '' ? 0 : parseInt(value) || 0) 
        : value
    });
  };

  // บันทึกคูปอง (เพิ่ม/แก้ไข)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCoupon) {
        // กรณีแก้ไข - ส่งเฉพาะ credit และ expiredDate
        await axios.put(`/api/coupon/${editingCoupon.couponCode}`, {
          credit: formData.credit,
          expiredDate: formData.expiredDate
        });
      } else {
        // กรณีเพิ่มใหม่ - ส่งข้อมูลทั้งหมด
        await axios.post('/api/coupon', formData);
      }
      
      setShowModal(false);
      fetchCoupons(); // ดึงข้อมูลใหม่
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการบันทึกคูปอง:', err);
      setError('ไม่สามารถบันทึกคูปองได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // ลบคูปอง
  const handleDelete = async (couponCode: string) => {
    if (window.confirm('การลบคูปอง จะลบประวัติการใช้งานด้วย คุณต้องการลบคูปองนี้ใช่หรือไม่?')) {
      try {
        await axios.delete(`/api/coupon/${couponCode}`);
        fetchCoupons(); // ดึงข้อมูลใหม่
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการลบคูปอง:', err);
        setError('ไม่สามารถลบคูปองได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // แสดงไอคอนการเรียงข้อมูล
  const getSortIcon = (field: keyof Coupon) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">จัดการคูปอง</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">เติมเฉพาะเครดิตบุคคลและวันใช้งานเท่านั้น</p>
        </div>
        <button
          className="bg-primary text-white px-4 py-2 rounded-md flex items-center"
          onClick={openAddModal}
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มคูปอง
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('couponCode')}
                >
                  รหัสคูปอง {getSortIcon('couponCode')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('credit')}
                >
                  เครดิต {getSortIcon('credit')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('expiredDate')}
                >
                  วันหมดอายุ {getSortIcon('expiredDate')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedCoupons.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    ไม่พบข้อมูลคูปอง
                  </td>
                </tr>
              ) : (
                sortedCoupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {coupon.couponCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {coupon.credit.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isExpired(coupon.expiredDate) 
                        ? 'text-red-500 dark:text-red-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatThaiDate(coupon.expiredDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                        onClick={() => openEditModal(coupon)}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDelete(coupon.couponCode)}
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* โมดัลเพิ่ม/แก้ไขคูปอง */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingCoupon ? 'แก้ไขคูปอง' : 'เพิ่มคูปองใหม่'}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  รหัสคูปอง
                </label>
                <input
                  type="text"
                  name="couponCode"
                  value={formData.couponCode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  เครดิต
                </label>
                <input
                  type="number"
                  name="credit"
                  value={formData.credit === 0 && formData.couponCode !== '' ? '' : formData.credit}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  วันหมดอายุ
                </label>
                <input
                  type="date"
                  name="expiredDate"
                  value={formData.expiredDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formData.expiredDate ? formatThaiDate(formData.expiredDate) : ''}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 mr-2 px-4 py-2 rounded-md hover:bg-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {editingCoupon ? 'บันทึกการแก้ไข' : 'เพิ่มคูปอง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement; 