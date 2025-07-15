import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, UserCog } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { schoolMapAtom } from '~/custom/store/school';
import { updateSuperCreditStatus } from '~/custom/utils/userUtils';
import { cn } from '~/utils';
import { useImpersonation } from '~/hooks/useImpersonation';
import { useAuthContext } from '~/hooks/AuthContext';

// User search result interface
interface UserSearchResult {
  _id: string;
  name?: string;
  email: string;
  firstname?: string;
  lastname?: string;
  isSchoolAdmin?: boolean;
  schoolAdmin?: boolean;
  school?: number;
  createdAt?: string;
  role?: string;
  superCredit?: boolean;
}

// Balance interface
interface UserBalance {
  user: string;
  tokenCredits: number;
  autoRefillEnabled: boolean;
  refillIntervalValue: number;
  refillIntervalUnit: string;
  lastRefill: string;
  refillAmount: number;
  expiredDate?: string;
}

// Component for user search modal
const UserSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onToggleSuperCredit?: (userId: string, currentStatus: boolean) => Promise<void>;
  processingSuperCredit?: string | null;
}> = ({ isOpen, onClose, onToggleSuperCredit, processingSuperCredit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggleSuperCreditLoading, setToggleSuperCreditLoading] = useState(false);
  const { startImpersonation, isImpersonating } = useImpersonation();
  const { user } = useAuthContext();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get school map from Recoil
  const schoolMap = useRecoilValue(schoolMapAtom);

  // Function to search users
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Implement a search endpoint in the backend that can search by firstname, lastname, email
      const response = await axios.get(`/api/user/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('ไม่สามารถค้นหาผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to get user balance
  const getUserBalance = async (userId: string) => {
    setLoadingBalance(true);
    try {
      const response = await axios.get(`/api/user/${userId}/balance`);
      setUserBalance(response.data);
    } catch (err) {
      console.error('Error fetching user balance:', err);
      setUserBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    getUserBalance(user._id);
  };

  // Handle toggle super credit
  const handleToggleSuperCredit = async () => {
    if (!selectedUser) return;
    
    if (onToggleSuperCredit) {
      try {
        // ใช้ฟังก์ชันที่ส่งมาจาก parent component
        await onToggleSuperCredit(selectedUser._id, !!selectedUser.superCredit);
        
        // อัปเดตข้อมูลในส่วน UI โดยตรง
        setSelectedUser({
          ...selectedUser,
          superCredit: !selectedUser.superCredit
        });
        
        // อัปเดต searchResults
        setSearchResults(prevResults => prevResults.map(user => 
          user._id === selectedUser._id 
            ? { ...user, superCredit: !selectedUser.superCredit } 
            : user
        ));
        
        // ดึงข้อมูลผู้ใช้อีกครั้ง
        if (selectedUser._id) {
          await getUserBalance(selectedUser._id);
        }
      } catch (err) {
        console.error('Error toggling super credit status:', err);
        setError('ไม่สามารถอัปเดตสถานะ Super Credit ได้');
      }
    } else {
      // ใช้ฟังก์ชันในตัว component เอง
      setToggleSuperCreditLoading(true);
      try {
        const newStatus = !selectedUser.superCredit;
        await updateSuperCreditStatus(selectedUser._id, newStatus);
        
        // อัปเดตข้อมูลในส่วน UI โดยตรง
        setSelectedUser({
          ...selectedUser,
          superCredit: newStatus
        });
        
        // อัปเดต searchResults
        setSearchResults(prevResults => prevResults.map(user => 
          user._id === selectedUser._id 
            ? { ...user, superCredit: newStatus } 
            : user
        ));
        
        // ดึงข้อมูลผู้ใช้อีกครั้ง
        if (selectedUser._id) {
          await getUserBalance(selectedUser._id);
        }
      } catch (err) {
        console.error('Error toggling super credit status:', err);
        setError('ไม่สามารถอัปเดตสถานะ Super Credit ได้');
      } finally {
        setToggleSuperCreditLoading(false);
      }
    }
  };

  // Handle impersonate user
  const handleImpersonateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setError(null);
      // Call the admin impersonation API
      const response = await axios.post('/api/admin/impersonate', { 
        email: selectedUser.email 
      });
      
      // If successful, redirect to the chat page
      if (response.data.impersonated) {
        // Store the impersonation state in recoil atom
        startImpersonation(
          response.data.impersonatedBy || 'admin',
          response.data.user.email || selectedUser.email
        );
        
        // Reload the page to apply the new authentication
        window.location.href = '/c/new';
      }
    } catch (err: any) {
      console.error('Error impersonating user:', err);
      setError(err.response?.data?.message || 'ไม่สามารถเข้าสู่ระบบแทนผู้ใช้นี้ได้');
    }
  };

  // Auto search with debounce (1 second delay)
  useEffect(() => {
    // Clear previous timeout if exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout for searching
    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers();
      }, 1000);
    } else if (searchQuery.trim() === '') {
      setSearchResults([]);
    }
    
    // Cleanup on component unmount or when searchQuery changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setUserBalance(null);
      setError(null);
      
      // Clear any pending search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [isOpen]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">ค้นหาผู้ใช้</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>

        <div className="p-4 border-b dark:border-gray-700">
          <span className="text-red-500 text-xs">แสดงผลค้นหาสูงสุด 10 ชื่อ</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="ค้นหาด้วยชื่อ นามสกุล หรืออีเมล (พิมพ์อย่างน้อย 2 ตัวอักษร)"
              className="flex-grow px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <button
              onClick={searchUsers}
              disabled={isSearching || searchQuery.trim().length < 2}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Search className="h-4 w-4" />
              ค้นหา
            </button>
          </div>
          {searchQuery.trim().length === 1 && (
            <p className="text-yellow-500 mt-2 text-sm">กรุณาพิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา</p>
          )}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        <div className="flex-grow overflow-hidden flex">
          {/* Search results */}
          <div className={`w-1/2 border-r dark:border-gray-700 overflow-y-auto ${selectedUser ? '' : 'w-full'}`}>
            {isSearching ? (
              <div className="p-4 text-center">กำลังค้นหา...</div>
            ) : searchResults.length > 0 ? (
              <ul className="divide-y dark:divide-gray-700">
                {searchResults.map((user) => (
                  <li 
                    key={user._id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      selectedUser?._id === user._id ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="font-medium">{user.name || `${user.firstname || ''} ${user.lastname || ''}`}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </li>
                ))}
              </ul>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="p-4 text-center">ไม่พบผู้ใช้ที่ตรงกับคำค้นหา</div>
            ) : (
              <div className="p-4 text-center">กรุณาใส่คำค้นหาอย่างน้อย 2 ตัวอักษร</div>
            )}
          </div>

          {/* User details */}
          {selectedUser && (
            <div className="w-1/2 p-4 overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">ข้อมูลผู้ใช้</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ชื่อ</p>
                  <p>{selectedUser.name || `${selectedUser.firstname || ''} ${selectedUser.lastname || ''}`}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">อีเมล</p>
                  <p>{selectedUser.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">สถานะ</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100">
                      {selectedUser.role}
                    </span>
                    {selectedUser.superCredit && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100">
                        Super Credit
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <button
                      onClick={handleToggleSuperCredit}
                      disabled={toggleSuperCreditLoading || (processingSuperCredit === selectedUser?._id)}
                      className={`px-4 py-2 rounded-md text-white ${
                        selectedUser.superCredit
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-yellow-500 hover:bg-yellow-600'
                      } disabled:opacity-50`}
                    >
                      {toggleSuperCreditLoading || (processingSuperCredit === selectedUser?._id)
                        ? 'กำลังดำเนินการ...'
                        : selectedUser.superCredit
                          ? 'ยกเลิก Super Credit'
                          : 'เพิ่ม Super Credit'
                      }
                    </button>
                  </div>
                  {!isImpersonating && selectedUser.email !== user?.email && (
                    <div className="mt-2">
                      <button
                        onClick={handleImpersonateUser}
                        className="px-4 py-2 rounded-md text-white bg-purple-500 hover:bg-purple-600 flex items-center gap-1"
                      >
                        <UserCog className="h-4 w-4" />
                        เข้าสู่ระบบแทน
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">โรงเรียน</p>
                  <p>
                    {selectedUser.school ? (
                      schoolMap?.[selectedUser.school] ? (
                        <div className="flex items-center flex-wrap">
                          <span>{schoolMap[selectedUser.school]}</span>
                          {(selectedUser.schoolAdmin || selectedUser.isSchoolAdmin) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100">
                              แอดมิน
                            </span>
                          )}
                        </div>
                      ) : (
                        `ไม่มีชื่อ (ID: ${selectedUser.school})`
                      )
                    ) : (
                      'ไม่มีข้อมูล'
                    )}
                  </p>
                </div>

                {selectedUser.createdAt && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">วันที่สร้าง</p>
                    <p>{new Date(selectedUser.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ข้อมูลแบลนซ์</p>
                  {loadingBalance ? (
                    <p>กำลังโหลด...</p>
                  ) : userBalance ? (
                    <div className="pl-4 border-l-2 border-blue-500 mt-2">
                      <p>เครดิต: {userBalance.tokenCredits.toLocaleString('th-TH')}</p>
                      <p>เติมอัตโนมัติ: {userBalance.autoRefillEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</p>
                      {userBalance.autoRefillEnabled && (
                        <>
                          <p>จำนวนเติม: {userBalance.refillAmount.toLocaleString('th-TH')}</p>
                          <p>ช่วงเวลาเติม: ทุก {userBalance.refillIntervalValue} {userBalance.refillIntervalUnit}</p>
                          <p>เติมล่าสุด: {new Date(userBalance.lastRefill).toLocaleString('th-TH')}</p>
                        </>
                      )}
                      {userBalance.expiredDate && (
                        <p>วันหมดอายุ: {new Date(userBalance.expiredDate).toLocaleString('th-TH')}</p>
                      )}
                    </div>
                  ) : (
                    <p>ไม่มีข้อมูลแบลนซ์</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal; 