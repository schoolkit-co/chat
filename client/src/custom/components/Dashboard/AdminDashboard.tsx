import axios from 'axios';
import { useForm } from 'react-hook-form';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegisterUserMutation } from 'librechat-data-provider/react-query';
import type { TRegisterUser, TError } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { useLocalize, TranslationKeys, useAuthContext } from '~/hooks';
import { handleRegistration, RenderInput, SchoolInput, TRegisterUserForm } from '~/custom/components/Auth/RegistrationUtil';
import DashBreadcrumb from '~/routes/Layouts/DashBreadcrumb';
import { cn } from '~/utils';
import { Users, BarChart, Settings, School, UserCog, Shield, UserPlus, FileSpreadsheet, Gift } from 'lucide-react';
import DashboardSidePanel, { MenuItem } from './DashboardSidePanel';
import ImportXlsxModal from './ImportXlsxModal';
import CouponManagement from './CouponManagement';
import UserSearchModal from './UserSearchModal'; // เพิ่ม import UserSearchModal
import { useRecoilState, useRecoilValue } from 'recoil'; // Import Recoil hook
import { schoolMapAtom, SchoolMap } from '~/custom/store/school'; // Update import path to custom/store
import { updateSuperCreditStatus } from '~/custom/utils/userUtils';

interface UserCountBySchool {
  _id: number | null;
  count: number;
}

interface SchoolMonthlyCredits {
  [schoolId: number]: number;
}

interface SchoolsWithoutAdmin {
  schoolsWithoutAdmin: number[];
}

interface User {
  _id: string;
  name?: string;
  email: string;
  username?: string;
  provider: string;
  role?: string;
  schoolAdmin?: boolean;
  school?: number;
  createdAt?: string;
  superCredit?: boolean;
}

interface SchoolPremium {
  _id?: string;
  school: number;
  expiredDate: string;
  maxUsers?: number;
  monthlyCredits?: number;
}

let codekitBackend = 'https://codekit.co';
if (window.location.hostname === 'localhost') {
  // codekitBackend = 'http://localhost';
  codekitBackend = 'https://dev.codekit.co';
}

// Overview คือหน้าที่แสดงจำนวนผู้ใช้ของแต่ละโรงเรียน
const Overview: React.FC = () => {
  const [userCountBySchool, setUserCountBySchool] = useState<UserCountBySchool[]>([]);
  const [schoolMonthlyCredits, setSchoolMonthlyCredits] = useState<SchoolMonthlyCredits>({});
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalSchools, setTotalSchools] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [loadingNewUsers, setLoadingNewUsers] = useState<boolean>(true);
  const [schoolPremiums, setSchoolPremiums] = useState<{ [key: number]: SchoolPremium }>({});
  
  // states สำหรับ modal จัดการ Premium
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [selectedSchoolName, setSelectedSchoolName] = useState<string>('');
  const [expiredDate, setExpiredDate] = useState<string>('');
  const [maxUsers, setMaxUsers] = useState<number | string>('');
  const [monthlyCredits, setMonthlyCredits] = useState<number | string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // State สำหรับ UserSearchModal
  const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);

  // Recoil state for school map
  const [schoolMap, setSchoolMap] = useRecoilState(schoolMapAtom);

  const fetchData = async () => {
    try {
      setLoading(true);
      // ดึงข้อมูลจำนวนผู้ใช้ตามโรงเรียน
      const { data } = await axios.get('/api/user/admin/count-by-school');
      
      // รับข้อมูลจาก API ในรูปแบบใหม่
      const { userCountBySchool: userCountData, schoolMonthlyCredits: schoolMonthlyCreditsData, totalUsers, totalSchools } = data;

      // ดึงข้อมูลชื่อโรงเรียน (เฉพาะเมื่อยังไม่มีใน Recoil)
      if (!schoolMap) {
        console.log('Fetching school data for Recoil...');
        const { data: schoolData } = await axios.get<{ id: number; name: string }[]>(`${codekitBackend}/api/school?id=1`);
        const newSchoolMap: SchoolMap = {};
        schoolData.forEach((school) => {
          newSchoolMap[school.id] = school.name;
        });
        setSchoolMap(newSchoolMap);
      } else {
        console.log('Using cached school data from Recoil.');
      }

      // ดึงข้อมูล Premium ของโรงเรียน
      const { data: premiumData } = await axios.get('/api/school/premium/all');
      const premiumMap: { [key: number]: SchoolPremium } = {};
      premiumData.forEach((premium: SchoolPremium) => {
        premiumMap[premium.school] = premium;
      });

      setUserCountBySchool(userCountData);
      setSchoolMonthlyCredits(schoolMonthlyCreditsData || {});
      setTotalUsers(totalUsers);
      setTotalSchools(totalSchools);
      setSchoolPremiums(premiumMap);
    } catch (err) {
      console.error('Error fetching overview data:', err);
      setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    // ดึงข้อมูลผู้ใช้ที่ลงทะเบียนวันนี้
    const fetchNewUsers = async () => {
      try {
        setLoadingNewUsers(true);
        
        // API สมมติสำหรับดึงข้อมูลผู้ใช้ที่ลงทะเบียนวันนี้
        // โปรดเปลี่ยน URL ให้ตรงกับ API ที่มีอยู่จริง
        const { data } = await axios.get('/api/user/admin/users-registered-today');
        setNewUsers(data);
      } catch (err) {
        console.error('Error fetching new registered users:', err);
        // ไม่แสดง error เพื่อไม่ให้กระทบกับการแสดงผลหลัก
      } finally {
        setLoadingNewUsers(false);
      }
    };

    fetchData();
    fetchNewUsers();
  }, [schoolMap]);

  const getSchoolName = (schoolId: number | null) => {
    if (schoolId === null) return 'ไม่มีโรงเรียน';
    // ใช้ข้อมูลจาก Recoil ถ้ามี, หรือแสดง ID ถ้าไม่มี
    return schoolMap?.[schoolId] || `โรงเรียน ID: ${schoolId}`;
  };

  // ฟังก์ชันสำหรับจัดรูปแบบวันที่
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ฟังก์ชันตรวจสอบว่าวันหมดอายุใกล้มาถึงหรือเลยมาแล้ว
  const getExpirationStatus = (expiredDate: string) => {
    const now = new Date();
    const expiryDate = new Date(expiredDate);
    
    // คำนวณวันที่เตือนล่วงหน้า (3 เดือนก่อนหมดอายุ)
    const warningDate = new Date(expiredDate);
    warningDate.setMonth(warningDate.getMonth() - 3);
    
    if (now > expiryDate) {
      return 'expired'; // หมดอายุแล้ว
    } else if (now > warningDate) {
      return 'warning'; // ใกล้หมดอายุ
    }
    return 'normal'; // ปกติ
  };

  // ฟังก์ชันตรวจสอบสถานะจำนวนผู้ใช้เทียบกับจำนวนสูงสุด
  const getUserCountStatus = (count: number, maxUsers: number) => {
    if (count > maxUsers) {
      return 'exceeded'; // เกินกำหนด
    } else if (count === maxUsers) {
      return 'reached'; // เต็มแล้ว
    }
    return 'normal'; // ปกติ
  };

  // เปิด Modal สำหรับจัดการ Premium
  const openPremiumModal = (schoolId: number | null) => {
    if (schoolId === null) return; // ไม่ทำอะไรถ้าเป็น "ไม่มีโรงเรียน"
    
    setSelectedSchool(schoolId);
    setSelectedSchoolName(getSchoolName(schoolId));
    
    // ถ้ามีข้อมูล Premium อยู่แล้ว ให้เติมข้อมูลลงในฟอร์ม
    if (schoolPremiums[schoolId]) {
      const premium = schoolPremiums[schoolId];
      // แปลงวันที่เป็นรูปแบบ YYYY-MM-DD สำหรับ input
      setExpiredDate(premium.expiredDate.split('T')[0]); // เอาเฉพาะส่วนวันที่ YYYY-MM-DD
      setMaxUsers(premium.maxUsers || '');
      setMonthlyCredits(premium.monthlyCredits || '');
    } else {
      // ถ้าไม่มีข้อมูล Premium ให้เป็นค่าเริ่มต้น
      // วันหมดอายุเป็นวันปัจจุบัน + 1 ปี
      const defaultExpiredDate = new Date();
      defaultExpiredDate.setFullYear(defaultExpiredDate.getFullYear() + 1);
      setExpiredDate(defaultExpiredDate.toISOString().split('T')[0]);
      setMaxUsers(''); // ไม่มีค่าเริ่มต้น
      setMonthlyCredits(''); // ไม่มีค่าเริ่มต้น
    }
    
    setShowPremiumModal(true);
  };

  // ฟังก์ชันสำหรับแปลงวันที่ให้อยู่ในรูปแบบที่มนุษย์อ่านได้
  const formatThaiDate = (dateString: string) => {
    const date = new Date(dateString);
    const thaiOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    // แปลง year พ.ศ.
    const thaiDateString = date.toLocaleDateString('th-TH', thaiOptions);
    const yearOffset = 543; // ผลต่างระหว่าง พ.ศ. กับ ค.ศ.
    const buddhistYear = date.getFullYear() + yearOffset;
    
    // แทนที่ปี ค.ศ. ด้วย พ.ศ.
    return thaiDateString.replace(/\d{4}/, buddhistYear.toString());
  };

  // ฟังก์ชันสำหรับเพิ่มวันที่
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  // บันทึกข้อมูล Premium
  const savePremium = async () => {
    if (!selectedSchool) return;
    
    try {
      setIsUpdating(true);
      
      // ตรวจสอบและแปลงค่า expiredDate ให้อยู่ในรูปแบบที่ถูกต้อง
      // แปลงจาก YYYY-MM-DD เป็น ISO string
      const formattedExpiredDate = new Date(expiredDate);
      // ตรวจสอบความถูกต้องของวันที่
      if (isNaN(formattedExpiredDate.getTime())) {
        throw new Error('วันหมดอายุไม่ถูกต้อง');
      }
      
      // สร้าง object สำหรับส่งข้อมูลไปยัง API
      const data: any = {
        school: selectedSchool,
        expiredDate: formattedExpiredDate.toISOString(), // ใช้ ISO string เต็มรูปแบบ
      };
      
      // จัดการ maxUsers - ถ้าเป็นค่าว่างให้ส่ง null เพื่อลบ property
      if (maxUsers !== '' && maxUsers !== null && maxUsers !== undefined) {
        const parsedMaxUsers = parseInt(String(maxUsers));
        if (!isNaN(parsedMaxUsers) && parsedMaxUsers > 0) {
          data.maxUsers = parsedMaxUsers;
        } else {
          data.maxUsers = null; // ส่ง null เพื่อลบ property
        }
      } else {
        // ส่ง null เพื่อลบ property
        data.maxUsers = null;
      }
      
      // จัดการ monthlyCredits - ถ้าเป็นค่าว่างให้ส่ง null เพื่อลบ property
      if (monthlyCredits !== '' && monthlyCredits !== null && monthlyCredits !== undefined) {
        const parsedMonthlyCredits = parseInt(String(monthlyCredits));
        if (!isNaN(parsedMonthlyCredits) && parsedMonthlyCredits >= 0) {
          data.monthlyCredits = parsedMonthlyCredits;
        } else {
          data.monthlyCredits = null; // ส่ง null เพื่อลบ property
        }
      } else {
        // ส่ง null เพื่อลบ property
        data.monthlyCredits = null;
      }
      
      // ถ้ามีข้อมูล Premium อยู่แล้ว ให้ส่ง id ไปด้วยเพื่อระบุว่าเป็นการอัปเดต
      if (schoolPremiums[selectedSchool]) {
        data.id = schoolPremiums[selectedSchool]._id;
      }
      
      console.log('Sending data to API:', data); // Debug log
      
      // ส่งข้อมูลไปยัง API
      const response = await axios.post('/api/school/premium/update', data);
      
      // อัปเดต state
      const newSchoolPremiums = { ...schoolPremiums };
      newSchoolPremiums[selectedSchool] = response.data;
      setSchoolPremiums(newSchoolPremiums);
      
      // รีเฟรชข้อมูลหลังจากอัปเดต
      await fetchData();
      
      // ปิด Modal
      setShowPremiumModal(false);
    } catch (err) {
      console.error('Error updating premium:', err);
      alert('ไม่สามารถอัปเดตข้อมูล Premium ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUpdating(false);
    }
  };

  // เปิด Modal สำหรับค้นหาผู้ใช้
  const openUserSearchModal = () => {
    setIsUserSearchModalOpen(true);
  };

  // ปิด Modal สำหรับค้นหาผู้ใช้
  const closeUserSearchModal = () => {
    setIsUserSearchModalOpen(false);
  };

  if (loading) return <div className="text-center py-4">กำลังโหลด...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ภาพรวมผู้ใช้งานตามโรงเรียน</h1>
      
      {/* สรุปตัวชี้วัด */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Users Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-semibold">{loading ? '...' : totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          {/* เพิ่มปุ่ม UserSearchModal */}
          <button 
            onClick={openUserSearchModal} 
            className="mt-4 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-1 w-full justify-center"
          >
            <UserCog className="h-4 w-4" /> Search Users
          </button>
        </div>
        {/* Total Schools Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <School className="mr-2 h-5 w-5 text-green-500" />
            จำนวนโรงเรียนทั้งหมด
          </h2>
          <p className="text-3xl font-bold">{totalSchools}</p>
        </div>
      </div>
      
      {/* ตารางผู้ใช้ที่ลงทะเบียนวันนี้ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">ผู้ใช้ลงทะเบียนใหม่วันนี้</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3">
                  ชื่อ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">
                  อีเมล
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">
                  โรงเรียน
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                  วันที่ลงทะเบียน
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {loadingNewUsers ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white"></div>
                      <span className="ml-2">กำลังโหลด...</span>
                    </div>
                  </td>
                </tr>
              ) : newUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    ไม่มีผู้ใช้ลงทะเบียนใหม่วันนี้
                  </td>
                </tr>
              ) : (
                newUsers.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.name || user.username || 'ไม่ระบุชื่อ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {user.school ? (
                        <div className="flex items-center flex-wrap">
                          <span className="mr-1">{getSchoolName(user.school)}</span>
                          {user.schoolAdmin && (
                            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100">
                              แอดมิน
                            </span>
                          )}
                        </div>
                      ) : (
                        'ไม่มีโรงเรียน'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ตารางจำนวนผู้ใช้ตามโรงเรียน */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">จำนวนผู้ใช้ในแต่ละโรงเรียน</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  โรงเรียน
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  จำนวนผู้ใช้งาน
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  เครดิตโรงเรียน
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  วันหมดอายุ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {userCountBySchool.map((item, index) => {
                // ตรวจสอบสถานะ Premium (ถ้ามี)
                const hasPremium = item._id !== null && schoolPremiums[item._id];
                let userCountStatus = 'normal';
                let expirationStatus = 'normal';
                
                if (hasPremium && item._id !== null) {
                  const premium = schoolPremiums[item._id];
                  if (premium.maxUsers !== undefined) {
                    userCountStatus = getUserCountStatus(item.count, premium.maxUsers);
                  }
                  expirationStatus = getExpirationStatus(premium.expiredDate);
                }
                
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {getSchoolName(item._id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {hasPremium ? (
                        <span className={cn(
                          userCountStatus === 'normal' ? 'text-gray-500 dark:text-gray-300' : '',
                          userCountStatus === 'reached' ? 'text-yellow-500 dark:text-yellow-400 font-medium' : '',
                          userCountStatus === 'exceeded' ? 'text-red-500 dark:text-red-400 font-medium' : ''
                        )}>
                          {item.count}
                          {item._id !== null && schoolPremiums[item._id]?.maxUsers && `/${schoolPremiums[item._id].maxUsers}`}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-300">{item.count}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {item._id !== null ? (
                        schoolMonthlyCredits[item._id] || schoolMonthlyCredits[item._id] == 0
                          ? schoolMonthlyCredits[item._id].toLocaleString() 
                          : '-'
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item._id === null ? (
                        // ถ้าเป็นแถว "ไม่มีโรงเรียน" ไม่แสดงอะไร
                        ""
                      ) : hasPremium ? (
                        // ถ้ามีข้อมูล Premium แสดงวันหมดอายุและปุ่มอัปเดต
                        <div className="flex items-center">
                          <span className={cn(
                            "mr-2",
                            expirationStatus === 'normal' ? 'text-gray-500 dark:text-gray-300' : '',
                            expirationStatus === 'warning' ? 'text-yellow-500 dark:text-yellow-400 font-medium' : '',
                            expirationStatus === 'expired' ? 'text-red-500 dark:text-red-400 font-medium' : ''
                          )}>
                            {formatThaiDate(schoolPremiums[item._id].expiredDate)}
                          </span>
                          <button
                            onClick={() => openPremiumModal(item._id)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                          >
                            อัปเดต Premium
                          </button>
                        </div>
                      ) : (
                        // ถ้ายังไม่มีข้อมูล Premium
                        <div className="flex items-center">
                          <span className="mr-2 text-gray-400">ยังไม่ได้เปิดใช้ Premium</span>
                          <button
                            onClick={() => openPremiumModal(item._id)}
                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                          >
                            เพิ่ม Premium
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {userCountBySchool.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal สำหรับจัดการ Premium */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">จัดการ Premium</h3>
              <button
                onClick={() => setShowPremiumModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  โรงเรียน
                </label>
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  {selectedSchoolName}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  วันหมดอายุ
                </label>
                <div className="flex flex-col space-y-2">
                  <input
                    type="date"
                    value={expiredDate}
                    onChange={(e) => setExpiredDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                  {expiredDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      วันหมดอายุ: {formatThaiDate(expiredDate)}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const date = new Date();
                        date.setMonth(date.getMonth() + 3);
                        setExpiredDate(date.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      +3 เดือน
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const date = new Date();
                        date.setMonth(date.getMonth() + 6);
                        setExpiredDate(date.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      +6 เดือน
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const date = new Date();
                        date.setFullYear(date.getFullYear() + 1);
                        setExpiredDate(date.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      +1 ปี
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const date = new Date();
                        date.setFullYear(date.getFullYear() + 2);
                        setExpiredDate(date.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      +2 ปี
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  จำนวนผู้ใช้สูงสุด
                </label>
                <input
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  min="1"
                  placeholder="ไม่จำกัด"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">หากไม่ระบุจะไม่จำกัดจำนวนผู้ใช้</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  เครดิตรายเดือน
                </label>
                <input
                  type="number"
                  value={monthlyCredits}
                  onChange={(e) => setMonthlyCredits(e.target.value)}
                  min="0"
                  placeholder="เครดิตรวมทั้งโรงเรียน"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">หากไม่ระบุจะใช้เครดิตรายบุคคล</p>
              </div>
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={savePremium}
                disabled={isUpdating}
                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUpdating ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* เพิ่ม UserSearchModal */}
      <UserSearchModal 
        isOpen={isUserSearchModalOpen} 
        onClose={closeUserSearchModal} 
      />
    </div>
  );
};

// SchoolAdmin Management คือหน้าที่แสดงรายชื่อโรงเรียนที่ไม่มี schoolAdmin
const SchoolAdminManagement: React.FC = () => {
  const [schoolsWithoutAdmin, setSchoolsWithoutAdmin] = useState<number[]>([]);
  const [schoolsWithAdmin, setSchoolsWithAdmin] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // state สำหรับ modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [schoolUsers, setSchoolUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [processingSuperCredit, setProcessingSuperCredit] = useState<string | null>(null); // เพิ่ม state สำหรับติดตามสถานะประมวลผล Super Credit

  // Get school map from Recoil
  const schoolMap = useRecoilValue(schoolMapAtom);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ดึงข้อมูลโรงเรียนที่ไม่มี admin
        const { data: noAdminData } = await axios.get<SchoolsWithoutAdmin>('/api/user/admin/schools-without-admin');
        
        // ดึงข้อมูลโรงเรียนที่มี admin
        const { data: withAdminData } = await axios.get('/api/user/admin/schools-with-admin');

        setSchoolsWithoutAdmin(noAdminData.schoolsWithoutAdmin);
        setSchoolsWithAdmin(withAdminData.schoolsWithAdmin || []);
      } catch (err) {
        console.error('Error fetching schools data:', err);
        setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSchoolName = (schoolId: number) => {
    // ใช้ข้อมูลจาก Recoil ถ้ามี, หรือแสดง ID ถ้าไม่มี
    return schoolMap?.[schoolId] || `โรงเรียน ID: ${schoolId}`;
  };
  
  const fetchSchoolUsers = async (schoolId: number) => {
    try {
      setLoadingUsers(true);
      const { data } = await axios.get<User[]>(`/api/user/admin/users/school/${schoolId}`);
      setSchoolUsers(data);
      setSelectedSchool(schoolId);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching school users:', err);
      alert('ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const assignSchoolAdmin = async (userId: string) => {
    try {
      setProcessingUser(userId);
      await axios.put(`/api/user/admin/users/${userId}/school-admin`, { schoolAdmin: true });
      
      // รีเฟรชข้อมูล
      window.location.reload();
    } catch (err) {
      console.error('Error assigning school admin:', err);
      alert('ไม่สามารถกำหนดสิทธิ์ผู้ดูแลโรงเรียนได้ กรุณาลองใหม่อีกครั้ง');
      setProcessingUser(null);
    }
  };
  
  const revokeSchoolAdmin = async (userId: string) => {
    if (!confirm('คุณต้องการถอดถอนสิทธิ์ผู้ดูแลโรงเรียนจากผู้ใช้นี้ใช่หรือไม่?')) return;
    
    try {
      setProcessingUser(userId);
      await axios.put(`/api/user/admin/users/${userId}/school-admin`, { schoolAdmin: false });
      
      // รีเฟรชข้อมูล
      window.location.reload();
    } catch (err) {
      console.error('Error revoking school admin:', err);
      alert('ไม่สามารถยกเลิกสิทธิ์ผู้ดูแลโรงเรียนได้ กรุณาลองใหม่อีกครั้ง');
      setProcessingUser(null);
    }
  };

  // ฟังก์ชันสำหรับเปลี่ยนสถานะ Super Credit
  const handleToggleSuperCredit = async (userId: string, currentStatus: boolean) => {
    try {
      setProcessingSuperCredit(userId);
      await updateSuperCreditStatus(userId, !currentStatus);
      
      // อัปเดตข้อมูลผู้ใช้ในหน้าจอโดยไม่ต้อง reload หน้า
      const updatedUsers = schoolUsers.map(user => {
        if (user._id === userId) {
          return { ...user, superCredit: !currentStatus };
        }
        return user;
      });
      
      setSchoolUsers(updatedUsers);
    } catch (err) {
      console.error('Error toggling super credit status:', err);
      alert('ไม่สามารถเปลี่ยนสถานะ Super Credit ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setProcessingSuperCredit(null);
    }
  };

  if (loading) return <div className="text-center py-4">กำลังโหลด...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div>
      {/* โรงเรียนที่ไม่มีผู้ดูแล */}
      <h1 className="text-2xl font-bold mb-4">โรงเรียนที่ไม่มีผู้ดูแล</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ชื่อโรงเรียน
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {schoolsWithoutAdmin.map((schoolId, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {schoolId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {getSchoolName(schoolId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => fetchSchoolUsers(schoolId)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-xs"
                    >
                      ดูรายชื่อผู้ใช้
                    </button>
                  </td>
                </tr>
              ))}
              
              {schoolsWithoutAdmin.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    ไม่มีโรงเรียนที่ไม่มีผู้ดูแล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* โรงเรียนที่มีผู้ดูแลแล้ว */}
      <h1 className="text-2xl font-bold mb-4">โรงเรียนที่มีผู้ดูแลแล้ว</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ชื่อโรงเรียน
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ผู้ดูแลโรงเรียน
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {schoolsWithAdmin.map((school, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {school._id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {getSchoolName(school._id)}
                    <button
                      onClick={() => fetchSchoolUsers(school._id)}
                      className="ml-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-xs"
                    >
                      ดูรายชื่อผู้ใช้
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {school.adminUsers.map((admin: any, adminIndex: number) => (
                      <div key={adminIndex} className="mb-1">
                        <span className="font-medium">{admin.name || 'ไม่ระบุชื่อ'}</span>
                        <br />
                        <span className="text-gray-500 dark:text-gray-400">{admin.email}</span>
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {school.adminUsers.map((admin: any, adminIndex: number) => (
                      <div key={adminIndex} className="my-4">
                        <button
                          onClick={() => revokeSchoolAdmin(admin._id)}
                          disabled={processingUser === admin._id}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-xs disabled:opacity-50"
                        >
                          {processingUser === admin._id ? 'กำลังดำเนินการ...' : 'ยกเลิกสิทธิ์ผู้ดูแลโรงเรียน'}
                        </button>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
              
              {schoolsWithAdmin.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    ไม่มีโรงเรียนที่มีผู้ดูแล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal แสดงรายชื่อผู้ใช้ในโรงเรียน */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                ผู้ใช้ในโรงเรียน: {selectedSchool ? getSchoolName(selectedSchool) : ''}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {loadingUsers ? (
                <div className="text-center py-4">กำลังโหลด...</div>
              ) : schoolUsers.length === 0 ? (
                <div className="text-center py-4 text-gray-500">ไม่พบผู้ใช้ในโรงเรียนนี้</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ชื่อ
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        อีเมล
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        สิทธิ์
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {schoolUsers.map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          {user.name || user.username || 'ไม่ระบุชื่อ'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex flex-wrap gap-1">
                            {user.schoolAdmin && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100">
                                School Admin
                              </span>
                            )}
                            {user.superCredit && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100">
                                Super Credit
                              </span>
                            )}
                            {user.role === 'ADMIN' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100">
                                ADMIN
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-2">
                            {!user.schoolAdmin ? (
                              <button
                                onClick={() => assignSchoolAdmin(user._id)}
                                disabled={processingUser === user._id}
                                className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-xs disabled:opacity-50"
                              >
                                {processingUser === user._id ? 'กำลังดำเนินการ...' : 'ตั้งเป็นผู้ดูแลโรงเรียน'}
                              </button>
                            ) : (
                              <button
                                onClick={() => revokeSchoolAdmin(user._id)}
                                disabled={processingUser === user._id}
                                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-xs disabled:opacity-50"
                              >
                                {processingUser === user._id ? 'กำลังดำเนินการ...' : 'ยกเลิกสิทธิ์ผู้ดูแลโรงเรียน'}
                              </button>
                            )}
                            
                            {/* ปุ่มเพิ่ม/ยกเลิก Super Credit */}
                            <button
                              onClick={() => handleToggleSuperCredit(user._id, user.superCredit || false)}
                              disabled={processingSuperCredit === user._id}
                              className={`text-white py-1 px-3 rounded text-xs disabled:opacity-50 ${
                                user.superCredit 
                                  ? 'bg-red-400 hover:bg-red-500' 
                                  : 'bg-yellow-500 hover:bg-yellow-600'
                              }`}
                            >
                              {processingSuperCredit === user._id 
                                ? 'กำลังดำเนินการ...' 
                                : user.superCredit 
                                  ? 'ยกเลิก Super Credit' 
                                  : 'เพิ่ม Super Credit'
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded text-sm"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// User Management คือหน้าที่แสดงรายชื่อผู้ใช้ที่ไม่มีโรงเรียน
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolList, setSchoolList] = useState<{ id: number; name: string }[]>([{ id: 0, name: 'กรุณาเลือกโรงเรียน' }]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  // เพิ่ม state สำหรับการแสดง modal ยืนยันการตั้งเป็น ADMIN
  const [showMakeAdminModal, setShowMakeAdminModal] = useState<boolean>(false);
  const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<User | null>(null);
  const [isMakingAdmin, setIsMakingAdmin] = useState<boolean>(false); // เพิ่ม state สำหรับ loading
  const [makeAdminError, setMakeAdminError] = useState<string | null>(null); // เพิ่ม state สำหรับ error

  // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ที่ไม่มีโรงเรียน
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // ดึงข้อมูลผู้ใช้ทั้งหมด (ที่ไม่มีโรงเรียน)
      const { data } = await axios.get<User[]>('/api/user/admin/users-without-school');
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Error fetching users without school:', err);
      setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับเปลี่ยนสถานะ Super Credit
  const handleToggleSuperCredit = async (userId: string, currentStatus: boolean) => {
    try {
      await updateSuperCreditStatus(userId, !currentStatus);
      // อัปเดตข้อมูลผู้ใช้หลังจากเปลี่ยนสถานะ
      await fetchUsers();
    } catch (err) {
      console.error('Error toggling super credit status:', err);
      alert('ไม่สามารถเปลี่ยนสถานะ Super Credit ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // ดึงข้อมูลตอนโหลดคอมโพเนนต์
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchUsers();
        
        // ดึงข้อมูลชื่อโรงเรียน
        const { data: schoolData } = await axios.get(`${codekitBackend}/api/school?id=1`);
        setSchoolList([{ id: 0, name: 'กรุณาเลือกโรงเรียน' }, ...schoolData]);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // เลือกหรือยกเลิกการเลือกผู้ใช้
  const toggleSelectUser = (userId: string, isAdmin: boolean) => {
    // ถ้าเป็น ADMIN ไม่อนุญาตให้เลือก
    if (isAdmin) return;
    
    const newSelectedUsers = new Set(selectedUsers);
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    setSelectedUsers(newSelectedUsers);
  };
  
  // เลือกหรือยกเลิกการเลือกผู้ใช้ทั้งหมด (ยกเว้น ADMIN)
  const toggleSelectAll = () => {
    // กรองเฉพาะผู้ใช้ที่ไม่ใช่ ADMIN
    const nonAdminUsers = filteredUsers.filter(user => user.role !== 'ADMIN');
    const nonAdminUserIds = nonAdminUsers.map(user => user._id);
    
    if (selectedUsers.size === nonAdminUsers.length) {
      // ถ้าเลือกทั้งหมดแล้ว (ที่ไม่ใช่ ADMIN) ให้ยกเลิกการเลือกทั้งหมด
      setSelectedUsers(new Set());
    } else {
      // ถ้ายังไม่ได้เลือกทั้งหมด ให้เลือกทั้งหมด (ยกเว้น ADMIN)
      setSelectedUsers(new Set(nonAdminUserIds));
    }
  };
  
  // เปิดกล่องโต้ตอบกำหนดโรงเรียน
  const openAssignSchoolModal = () => {
    if (selectedUsers.size === 0) {
      alert('กรุณาเลือกผู้ใช้อย่างน้อย 1 คน');
      return;
    }
    setSelectedSchool('');
    setShowAssignModal(true);
  };
  
  // จัดการการเปลี่ยนแปลงค่าในช่องเลือกโรงเรียน
  const handleSchoolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSchool(e.target.value);
  };
  
  // กำหนดโรงเรียนให้กับผู้ใช้ที่เลือก
  const assignSchoolToUsers = async () => {
    if (!selectedSchool.trim()) {
      alert('กรุณาเลือกโรงเรียน');
      return;
    }
    
    try {
      setIsAssigning(true);
      const userIds = Array.from(selectedUsers);
      
      // สร้างหรือค้นหาโรงเรียน
      const schoolResponse = await axios.post(`${codekitBackend}/api/school`, { 
        schoolName: selectedSchool.trim(), 
        secretKey: 'dVLXHnRrjyMz5a'
      });

      if (!schoolResponse.data || !schoolResponse.data.id) {
        throw new Error('ไม่สามารถสร้างหรือค้นหาโรงเรียนได้');
      }

      const schoolId = schoolResponse.data.id;
      
      // เรียก API เพื่ออัปเดตโรงเรียนให้กับผู้ใช้
      await axios.post('/api/user/admin/users/update-school', {
        userIds,
        schoolId
      });
      
      // รีเซ็ตการเลือก
      setSelectedUsers(new Set());
      setShowAssignModal(false);
      
      // ดึงข้อมูลผู้ใช้ใหม่หลังจากอัปเดต
      await fetchUsers();
    } catch (err) {
      console.error('Error assigning school to users:', err);
      alert('ไม่สามารถกำหนดโรงเรียนให้ผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAssigning(false);
    }
  };

  // เปิด Modal ยืนยันการเปลี่ยนสิทธิ์เป็น ADMIN
  const openMakeAdminModal = (user: User) => {
    setSelectedUserForAdmin(user);
    setMakeAdminError(null); // เคลียร์ error เก่าเมื่อเปิด modal
    setShowMakeAdminModal(true);
  };

  // ทำการอัพเกรดผู้ใช้เป็น ADMIN
  const makeUserAdmin = async () => {
    if (!selectedUserForAdmin) return;

    setIsMakingAdmin(true);
    setMakeAdminError(null);

    try {
      const response = await axios.put('/api/user/admin/users/make-admin', {
        userId: selectedUserForAdmin._id,
      });

      console.log('Make user admin response:', response.data);
      // TODO: แสดงข้อความสำเร็จให้ผู้ใช้ทราบ (อาจใช้ toast notification)
      // อาจจะต้อง fetch ข้อมูลผู้ใช้ใหม่เพื่อให้ตารางอัปเดต
      fetchUsers(); 
    } catch (err) {
      console.error('Error making user admin:', err);
      const errorMessage = (err as any)?.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนบทบาทผู้ใช้';
      setMakeAdminError(errorMessage);
      // TODO: แสดงข้อความผิดพลาดให้ผู้ใช้ทราบ
    } finally {
      setIsMakingAdmin(false);
      setShowMakeAdminModal(false);
      // ไม่จำเป็นต้อง reset selectedUserForAdmin ที่นี่ เพราะ modal จะปิดไปแล้ว
      // setSelectedUserForAdmin(null); // เอาออกก็ได้
    }
  };

  if (loading) return <div className="text-center py-4">กำลังโหลด...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  // กรองเฉพาะผู้ใช้ที่ไม่ใช่ ADMIN เพื่อตรวจสอบว่าเลือกทั้งหมดหรือไม่
  const nonAdminUsers = filteredUsers.filter(user => user.role !== 'ADMIN');
  const isAllNonAdminSelected = selectedUsers.size === nonAdminUsers.length && nonAdminUsers.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">จัดการผู้ใช้งานที่ไม่มีโรงเรียน</h1>
      
      {/* ปุ่มกำหนดโรงเรียน */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
        <button
          onClick={openAssignSchoolModal}
          disabled={selectedUsers.size === 0}
          className="rounded-md bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          กำหนดโรงเรียน ({selectedUsers.size})
        </button>
      </div>
      
      {/* ตารางแสดงผู้ใช้ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-3 py-3">
                  <input 
                    type="checkbox" 
                    checked={isAllNonAdminSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600 dark:focus:ring-green-700"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ชื่อ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  อีเมล
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  สิทธิ์
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {filteredUsers.map((user, index) => {
                const isAdmin = user.role === 'ADMIN';
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.has(user._id)}
                        onChange={() => toggleSelectUser(user._id, isAdmin)}
                        disabled={isAdmin}
                        className={`h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600 dark:focus:ring-green-700 ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {user.name || user.username || 'ไม่ระบุชื่อ'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {isAdmin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100">
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100">
                          {user.role || 'USER'}
                        </span>
                      )}
                      {user.superCredit && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100">
                          Super Credit
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {!isAdmin && (
                        <button
                          onClick={() => openMakeAdminModal(user)}
                          className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded text-xs"
                        >
                          ตั้งเป็นแอดมิน
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleSuperCredit(user._id, user.superCredit || false)}
                        className={`ml-2 text-white py-1 px-3 rounded text-xs ${
                          user.superCredit 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-yellow-500 hover:bg-yellow-600'
                        }`}
                      >
                        {user.superCredit ? 'ยกเลิก Super Credit' : 'เพิ่ม Super Credit'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    ไม่พบผู้ใช้ที่ไม่มีโรงเรียน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal กำหนดโรงเรียน */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">กำหนดโรงเรียน</h2>
            <p className="mb-4">กำหนดโรงเรียนให้ผู้ใช้ที่เลือกจำนวน {selectedUsers.size} คน</p>
            
            <div className="mb-4">
              <div className="relative">
                <input
                  id="school"
                  type="text"
                  autoComplete="off"
                  value={selectedSchool}
                  onChange={handleSchoolChange}
                  className="webkit-dark-styles transition-color peer w-full rounded-md border border-border-light
                    bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
                  placeholder=" "
                  list="school-options"
                />
                <datalist id="school-options">
                  {schoolList.map(({ id, name }) => (
                    <option key={id} value={name} data-id={id} />
                  ))}
                </datalist>
                <label
                  htmlFor="school"
                  className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200
                    peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100
                    peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500
                    rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
                >
                  โรงเรียน
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                ยกเลิก
              </button>
              <button
                onClick={assignSchoolToUsers}
                disabled={isAssigning || !selectedSchool.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isAssigning ? 'กำลังดำเนินการ...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการเปลี่ยนเป็น Admin */} 
      {showMakeAdminModal && selectedUserForAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold">ยืนยันการเปลี่ยนบทบาท</h2>
            <p className="mb-4">
              คุณต้องการเปลี่ยนผู้ใช้ "{selectedUserForAdmin.name || selectedUserForAdmin.email}" ให้เป็น ADMIN หรือไม่?
            </p>
            {makeAdminError && (
              <p className="mb-4 text-red-500">{makeAdminError}</p>
            )} 
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowMakeAdminModal(false)}
                disabled={isMakingAdmin} // ปิดปุ่มขณะ loading
                className="btn btn-neutral"
              >
                ยกเลิก
              </button>
              <button
                onClick={makeUserAdmin}
                disabled={isMakingAdmin} // ปิดปุ่มขณะ loading
                className="btn btn-primary"
              >
                {isMakingAdmin ? 'กำลังดำเนินการ...' : 'ยืนยัน'} 
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// CreateUser component
const CreateUser: React.FC = () => {
  const localize = useLocalize();
  const [showImportXlsxModal, setShowImportXlsxModal] = useState(false);

  const {
    watch,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TRegisterUserForm>({ 
    mode: 'onChange',
    criteriaMode: 'all',
    reValidateMode: 'onChange'
  });
  const password = watch('password');

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const registerUser = useRegisterUserMutation({
    onMutate: () => {
      setIsSubmitting(true);
      setErrorMessage('');
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setValue('name', '');
      setValue('username', '');
      setValue('email', '');
      setValue('password', '');
      setValue('confirm_password', '');
      setValue('school', '');

      alert('สร้างผู้ใช้สำเร็จ');
    },
    onError: (error: unknown) => {
      setIsSubmitting(false);
      if ((error as TError).response?.data?.message) {
        setErrorMessage((error as TError).response?.data?.message ?? '');
      }
    },
  });

  const renderInput = (id: string, label: TranslationKeys, type: string, validation: object) => (
    <RenderInput id={id} label={label} validation={validation} util={{ watch, register, errors, password }}>
    <div className="mb-4">
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={id}
          aria-label={localize(label)}
          {...register(
            id as 'name' | 'email' | 'username' | 'password' | 'confirm_password',
            validation,
          )}
          aria-invalid={!!errors[id]}
          className="
            webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light
            bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none
          "
          placeholder=" "
          data-testid={id}
        />
        <label
          htmlFor={id}
          className="
            absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100
            peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500
            rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4
          "
        >
          {localize(label)}
        </label>
      </div>
      {errors[id] && (
        <span role="alert" className="mt-1 text-sm text-red-500">
          {String(errors[id]?.message) ?? ''}
        </span>
      )}
    </div>
    </RenderInput>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">สร้างผู้ใช้ใหม่</h1>
        <div>
          <button
            onClick={() => setShowImportXlsxModal(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-green-800"
          >
            <FileSpreadsheet size={18} className="mr-1" />
            นำเข้า XLSX
          </button>
          <p className="text-xs text-gray-500 mt-1">จำเป็นต้องเพิ่มโรงเรียนภายหลัง</p>
        </div>
      </div>

      {errorMessage && (
        <ErrorMessage children={`${localize('com_auth_error_create')} ${errorMessage}`} />
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <form 
          method="POST"
          onSubmit={handleSubmit((data: TRegisterUserForm) => 
            handleRegistration({
              data,
              token,
              registerUser,
              setErrorMessage
            })
          )}
        >
          {renderInput('name', 'com_auth_full_name', 'text', {
            required: localize('com_auth_name_required'),
            minLength: {
              value: 3,
              message: localize('com_auth_name_min_length'),
            },
            maxLength: {
              value: 80,
              message: localize('com_auth_name_max_length'),
            },
          })}
          {renderInput('username', 'com_auth_username', 'text', {
            minLength: {
              value: 2,
              message: localize('com_auth_username_min_length'),
            },
            maxLength: {
              value: 80,
              message: localize('com_auth_username_max_length'),
            },
          })}
          {renderInput('email', 'com_auth_email', 'email', {
            required: localize('com_auth_email_required'),
            minLength: {
              value: 1,
              message: localize('com_auth_email_min_length'),
            },
            maxLength: {
              value: 120,
              message: localize('com_auth_email_max_length'),
            },
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: localize('com_auth_email_pattern'),
            },
          })}
          {renderInput('password', 'com_auth_password', 'password', {
            required: localize('com_auth_password_required'),
            minLength: {
              value: 8,
              message: localize('com_auth_password_min_length'),
            },
            maxLength: {
              value: 128,
              message: localize('com_auth_password_max_length'),
            },
          })}
          {renderInput('confirm_password', 'com_auth_password_confirm', 'password', {
            validate: (value: string) =>
              value === password || localize('com_auth_password_not_match'),
          })}
          <SchoolInput register={register} errors={errors} watch={watch} setValue={setValue} />
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
            </button>
          </div>
        </form>
      </div>

      {showImportXlsxModal && (
        <ImportXlsxModal
          onClose={() => setShowImportXlsxModal(false)}
          onUsersImported={() => {}}
        />
      )}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const initRef = useRef(false);
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<string>('overview');

  useEffect(() => {
    // ถ้าผู้ใช้ไม่ใช่ ADMIN ให้เปลี่ยนเส้นทางไปที่หน้าแชท
    if (user?.role !== 'ADMIN') {
      navigate('/c/new');
    }
  }, [user, navigate]);

  // ถ้าผู้ใช้ไม่ใช่ ADMIN ไม่ต้องแสดงหน้า
  if (user?.role !== 'ADMIN') {
    return null;
  }

  const handleMenuSelect = useCallback((menuId: string) => {
    setActiveMenu(menuId);
  }, []);

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      icon: BarChart,
      label: 'ภาพรวม',
      description: 'แสดงจำนวนผู้ใช้งานและจัดการ Premium แต่ละโรงเรียน',
    },
    {
      id: 'school-admin-management',
      icon: School,
      label: 'จัดการผู้ดูแลโรงเรียน',
      description: 'แสดงรายชื่อโรงเรียนที่ไม่มีผู้ดูแล',
    },
    {
      id: 'user-management',
      icon: Users,
      label: 'จัดการผู้ใช้งานที่ไม่มีโรงเรียน',
      description: 'แสดงรายชื่อผู้ใช้งานที่ไม่มีโรงเรียน',
    },
    {
      id: 'create-user',
      icon: UserPlus,
      label: 'สร้างผู้ใช้',
      description: 'สร้างผู้ใช้ใหม่หรือนำเข้าจากไฟล์ XLSX',
    },
    {
      id: 'coupon-management',
      icon: Gift,
      label: 'จัดการคูปอง',
      description: 'เพิ่ม แก้ไข ลบคูปอง',
    },
  ];

  // Render the appropriate component based on the active menu
  const renderContent = () => {
    switch (activeMenu) {
      case 'overview':
        return <Overview />;
      case 'school-admin-management':
        return <SchoolAdminManagement />;
      case 'user-management':
        return <UserManagement />;
      case 'create-user':
        return <CreateUser />;
      case 'coupon-management':
        return <CouponManagement />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-surface-primary p-0 lg:p-2">
      <DashBreadcrumb />
      <div className="flex w-full flex-grow flex-row divide-x overflow-hidden dark:divide-gray-600">
        <DashboardSidePanel 
          title="แดชบอร์ดผู้ดูแลระบบ" 
          menuItems={menuItems} 
          activeMenu={activeMenu}
          onMenuSelect={handleMenuSelect}
        />
        <div className="scrollbar-gutter-stable w-full overflow-y-auto lg:w-3/4 xl:w-3/4">
          <div className="p-4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 