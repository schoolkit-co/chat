import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashBreadcrumb from '~/routes/Layouts/DashBreadcrumb';
import { useAuthContext } from '~/hooks';
import { cn } from '~/utils';
import { Users, UserPlus, FileSpreadsheet, Eye, EyeOff } from 'lucide-react';
import DashboardSidePanel, { MenuItem } from './DashboardSidePanel';
import AddAccountModal from './AddAccountModal';
import ImportXlsxModal from './ImportXlsxModal';

// Component สำหรับแสดงผู้ใช้ในโรงเรียนเดียวกัน
const SchoolUsers: React.FC = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showImportXlsxModal, setShowImportXlsxModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // ถ้าผู้ใช้มี schoolId จะดึงข้อมูลผู้ใช้ในโรงเรียนเดียวกัน
      if (user && user.school) {
        const response = await axios.get(`/api/user/admin/users/school/${user.school}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        setUsers(response.data || []);
      } else {
        setError('คุณไม่ได้ถูกกำหนดให้อยู่ในโรงเรียนใดๆ');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleRevoke = async (userId: string) => {
    try {
      if (!user?.school || !user?.schoolAdmin) {
        setError('คุณไม่มีสิทธิ์ในการเพิกถอนผู้ใช้');
        return;
      }

      const confirmed = window.confirm('คุณแน่ใจหรือไม่ที่จะถอดสิทธิ์ผู้ใช้นี้?');
      if (!confirmed) {
        return;
      }

      setProcessing(userId);
      setError(null);

      const response = await axios.post('/api/user/school-admin/revoke-user', {
        userId
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // อัปเดตรายการหลังจากเพิกถอนผู้ใช้
      setUsers(users.filter(u => u._id !== userId));

      // แสดงข้อความสำเร็จ
      const wasAdmin = response.data.user.wasSchoolAdmin;
      setError(`เพิกถอนผู้ใช้สำเร็จ${wasAdmin ? ' และถอดสิทธิ์ Admin แล้ว' : ''}`);
      
      // ล้างข้อความแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setError(null);
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิกถอนผู้ใช้');
      console.error('Error revoking user:', err);
    } finally {
      setProcessing(null);
    }
  };

  // ตรวจสอบว่าสามารถเพิกถอนผู้ใช้ได้หรือไม่ (ไม่ให้เพิกถอนตัวเอง)
  const canRevokeUser = (userId: string) => {
    return user?._id !== userId && user?.schoolAdmin === true;
  };

  // อัปเดตรายการผู้ใช้หลังจากเพิ่มบัญชีหรือนำเข้า XLSX
  const handleUserAdded = () => {
    fetchUsers();
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (newPassword.length < 8) {
      setResetPasswordError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetPasswordError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      setIsResettingPassword(true);
      setResetPasswordError(null);

      await axios.put(`/api/user/school-admin/users/${selectedUser._id}/reset-password`, {
        password: newPassword
      });

      setNewPassword('');
      setConfirmPassword('');
      setShowResetPasswordModal(false);
      setSelectedUser(null);

      alert('รีเซ็ตรหัสผ่านสำเร็จ');
    } catch (err: any) {
      setResetPasswordError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">School Users</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">All Users in Your School</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-800"
            >
              <UserPlus size={18} className="mr-1" />
              เพิ่มบัญชี
            </button>
            <button
              onClick={() => setShowImportXlsxModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-green-800"
            >
              <FileSpreadsheet size={18} className="mr-1" />
              นำเข้า XLSX
            </button>
          </div>
        </div>
        
        {error && (
          <div className={cn(
            "border px-4 py-3 rounded relative mb-4",
            error.startsWith('เพิกถอนผู้ใช้สำเร็จ') 
              ? "bg-green-100 border-green-400 text-green-700"
              : "bg-red-100 border-red-400 text-red-700"
          )} role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {users.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{userItem.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{userItem.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {userItem.schoolAdmin ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Admin
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(userItem);
                          setShowResetPasswordModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
                      >
                        รีเซ็ตรหัสผ่าน
                      </button>
                      {canRevokeUser(userItem._id) ? (
                        <button
                          onClick={() => handleRevoke(userItem._id)}
                          disabled={processing === userItem._id}
                          className={cn(
                            "text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400",
                            processing === userItem._id && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {processing === userItem._id ? 'Processing...' : 'Revoke'}
                        </button>
                      ) : (
                        userItem._id === user?._id ? (
                          <span className="text-gray-400 italic">You</span>
                        ) : (
                          <span className="text-gray-400 italic">No permission</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold">รีเซ็ตรหัสผ่าน</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                อีเมล: {selectedUser.email}
              </p>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  รหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={cn(
                      "w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white pr-10",
                      resetPasswordError && "border-red-500 dark:border-red-500"
                    )}
                    placeholder="กรอกรหัสผ่านใหม่"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white pr-10",
                      resetPasswordError && "border-red-500 dark:border-red-500"
                    )}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">รหัสผ่านไม่ตรงกัน</p>
                )}
              </div>

              {resetPasswordError && (
                <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                  {resetPasswordError}
                </div>
              )}

              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                <p className="font-medium mb-1">คำเตือน:</p>
                <ul className="list-disc list-inside">
                  <li>รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร</li>
                  <li>ควรใช้อักษรตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว</li>
                  <li>ควรใช้อักษรตัวพิมพ์เล็กอย่างน้อย 1 ตัว</li>
                  <li>ควรใช้ตัวเลขอย่างน้อย 1 ตัว</li>
                  <li>ควรใช้อักขระพิเศษอย่างน้อย 1 ตัว</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                  setResetPasswordError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleResetPassword}
                disabled={isResettingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-md",
                  (isResettingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8) 
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isResettingPassword ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal สำหรับเพิ่มบัญชี */}
      {showAddAccountModal && (
        <AddAccountModal 
          onClose={() => setShowAddAccountModal(false)} 
          onUserAdded={handleUserAdded}
        />
      )}
      
      {/* Modal สำหรับนำเข้า XLSX */}
      {showImportXlsxModal && (
        <ImportXlsxModal 
          onClose={() => setShowImportXlsxModal(false)} 
          onUsersImported={handleUserAdded}
        />
      )}
    </div>
  );
};

const SchoolDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<string>('school-users');

  useEffect(() => {
    // ถ้าผู้ใช้ไม่ใช่ schoolAdmin ให้เปลี่ยนเส้นทางไปที่หน้าแชท
    if (user?.schoolAdmin !== true) {
      navigate('/c/new');
    }
  }, [user, navigate]);

  // ถ้าผู้ใช้ไม่ใช่ schoolAdmin ไม่ต้องแสดงหน้า
  if (user?.schoolAdmin !== true) {
    return null;
  }

  const handleMenuSelect = useCallback((menuId: string) => {
    setActiveMenu(menuId);
  }, []);

  const menuItems: MenuItem[] = [
    {
      id: 'school-users',
      icon: Users,
      label: 'School Users',
      description: 'Manage users in your school',
    },
  ];

  // Render the appropriate component based on the active menu
  const renderContent = () => {
    switch (activeMenu) {
      case 'school-users':
        return <SchoolUsers />;
      default:
        return <SchoolUsers />;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-surface-primary p-0 lg:p-2">
      <DashBreadcrumb />
      <div className="flex w-full flex-grow flex-row divide-x overflow-hidden dark:divide-gray-600">
        <DashboardSidePanel 
          title="School Dashboard" 
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

export default SchoolDashboard; 