import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Eye, EyeOff } from 'lucide-react';
import { cn } from '~/utils';

interface AddAccountModalProps {
  onClose: () => void;
  onUserAdded: () => void;
}

type StepType = 'email-check' | 'registration' | 'success';

const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose, onUserAdded }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<StepType>('email-check');
  const [successMessage, setSuccessMessage] = useState('');
  const [canAssign, setCanAssign] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ตรวจสอบรหัสผ่านในขณะพิมพ์
  useEffect(() => {
    // เคลียร์ error ถ้ามีการเปลี่ยนแปลงใน input
    setError(null);
    
    // ตรวจสอบรหัสผ่านเมื่อมีการกรอกทั้งสองช่อง
    if (password && confirmPassword) {
      if (password !== confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'รหัสผ่านไม่ตรงกัน' }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
    
    // ตรวจสอบความยาวของรหัสผ่าน
    if (password && password.length < 8) {
      setFieldErrors(prev => ({ ...prev, password: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' }));
    } else if (password) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  }, [password, confirmPassword]);

  // ตรวจสอบว่าอีเมลมีอยู่แล้วหรือไม่
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('กรุณาระบุอีเมลที่ถูกต้อง');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/user/school-admin/check-email', {
        email
      });
      
      const { exists, canAssign: canAssignToSchool } = response.data;
      setEmailExists(exists);
      setCanAssign(canAssignToSchool);
      
      if (exists && !canAssignToSchool) {
        setError('บัญชีนี้มีอยู่แล้วและไม่สามารถกำหนดโรงเรียนให้ได้');
        return;
      }
      
      if (exists && canAssignToSchool) {
        // ถ้ามีบัญชีอยู่แล้วและสามารถกำหนดโรงเรียนได้ ไปยังขั้นตอนสำเร็จเลย
        handleAssignExistingUser();
      } else {
        // ถ้าไม่มีบัญชี ไปยังขั้นตอนลงทะเบียน
        setStep('registration');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล');
      console.error('Error checking email:', err);
    } finally {
      setLoading(false);
    }
  };

  // กำหนดโรงเรียนให้กับผู้ใช้ที่มีอยู่แล้ว
  const handleAssignExistingUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/user/school-admin/create-user', {
        email
      });
      
      setSuccessMessage('อัปเดตข้อมูลผู้ใช้สำเร็จ');
      setStep('success');
      onUserAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
      console.error('Error assigning user to school:', err);
    } finally {
      setLoading(false);
    }
  };

  // สร้างบัญชีผู้ใช้ใหม่
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !password || !confirmPassword) {
      setError('กรุณากรอกชื่อและรหัสผ่านให้ครบถ้วน');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }
    
    if (Object.keys(fieldErrors).length > 0) {
      setError('กรุณาแก้ไขข้อผิดพลาดก่อนดำเนินการต่อ');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // สร้างข้อมูลสำหรับส่งไปยัง API
      const userData: any = {
        email,
        name,
        password
      };
      
      // เพิ่ม username เฉพาะเมื่อผู้ใช้กรอกข้อมูล
      if (username.trim()) {
        userData.username = username;
      }
      
      const response = await axios.post('/api/user/school-admin/create-user', userData);
      
      setSuccessMessage('สร้างบัญชีผู้ใช้สำเร็จ');
      setStep('success');
      onUserAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // ปิด Modal และรีเซ็ตข้อมูล
  const handleClose = () => {
    onClose();
  };

  // แสดงผล error message
  const renderErrorMessage = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  };

  // แสดงผลขั้นตอนตรวจสอบอีเมล
  const renderEmailCheckStep = () => {
    return (
      <form onSubmit={handleCheckEmail}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">อีเมล</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="name@example.com"
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? 'กำลังตรวจสอบ...' : 'ถัดไป'}
          </button>
        </div>
      </form>
    );
  };

  // แสดงผลขั้นตอนลงทะเบียน
  const renderRegistrationStep = () => {
    return (
      <form onSubmit={handleCreateUser}>
        <div className="grid gap-4 mb-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
            />
          </div>
          <div className="hidden">
            <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              ชื่อผู้ใช้ <span className="text-xs text-gray-500">(ไม่บังคับ)</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">รหัสผ่าน <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
                  fieldErrors.password && "border-red-500 dark:border-red-500"
                )}
                required
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
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.password}</p>
            )}
          </div>
          <div>
            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
                  fieldErrors.confirmPassword && "border-red-500 dark:border-red-500"
                )}
                required
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
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep('email-check')}
            className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
          >
            ย้อนกลับ
          </button>
          <button
            type="submit"
            disabled={loading || Object.keys(fieldErrors).length > 0}
            className={cn(
              "text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
              (loading || Object.keys(fieldErrors).length > 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
          </button>
        </div>
      </form>
    );
  };

  // แสดงผลขั้นตอนสำเร็จ
  const renderSuccessStep = () => {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{successMessage}</h3>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleClose}
            className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            ปิด
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative p-4 w-full max-w-md">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {step === 'email-check' && 'เพิ่มบัญชี'}
              {step === 'registration' && 'ลงทะเบียนบัญชีใหม่'}
              {step === 'success' && 'ดำเนินการสำเร็จ'}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            {renderErrorMessage()}
            {step === 'email-check' && renderEmailCheckStep()}
            {step === 'registration' && renderRegistrationStep()}
            {step === 'success' && renderSuccessStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAccountModal;