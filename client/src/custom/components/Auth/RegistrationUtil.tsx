import React, { useEffect, useRef, useState } from 'react';
import { useLocalize } from '~/hooks';
import PasswordInput from '~/custom/components/Auth/PasswordInput';
import { TRegisterUser } from 'librechat-data-provider';
import axios from 'axios';
import { useMediaQuery } from '~/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '~/components/ui';

let codekitBackend = 'https://codekit.co';
if (window.location.hostname === 'localhost') {
  // codekitBackend = 'http://localhost';
  codekitBackend = 'https://dev.codekit.co';
}

export interface TRegisterUserForm extends Omit<TRegisterUser, 'school'> {
  school: string | number;
}

export const handleRegistration = async ({
  data,
  token,
  registerUser,
  setErrorMessage
}: {
  data: TRegisterUserForm;
  token: string | null;
  registerUser: {
    mutate: (data: TRegisterUser) => void;
  };
  setErrorMessage: (message: string) => void;
}) => {
  try {
    // แปลงชื่อโรงเรียนเป็น ID โดยส่งไปยัง API
    const schoolResponse = await axios.post(`${codekitBackend}/api/school`, { 
      schoolName: typeof data.school === 'string' ? data.school.trim() : String(data.school), 
      secretKey: 'dVLXHnRrjyMz5a'
    });

    // ถ้า API ส่งค่า ID กลับมา ให้ใช้ค่านั้น
    if (!schoolResponse.data || !schoolResponse.data.id) {
      throw new Error(`ไม่ได้รับข้อมูลจาก API: ${schoolResponse.data}`);
    }
    registerUser.mutate({ 
      ...data, 
      school: schoolResponse.data.id as number,
      token: token ?? undefined 
    } as TRegisterUser);
  } catch (error) {
    console.error('Error during registration:', error);
    setErrorMessage(error instanceof Error 
      ? error.message 
      : 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
    );
  }
};

export const RenderInput = (props) => {
  const { id, label, validation, util, children } = props;
  const { watch, register, errors, password } = util;
  const localize = useLocalize();

  if (id === 'password' || id === 'confirm_password') {
    const confirm_password = watch('confirm_password');

    return (
      <div className="mb-4">
        <PasswordInput
          id={id}
          label={localize(label)}
          register={register}
          errors={errors}
          autoComplete="new-password"
          validation={id === 'confirm_password' 
            ? {
                validate: (value: string) => value === password || true
              }
            : validation
          }
        />
        {id === 'confirm_password' && password && confirm_password && password !== confirm_password && (
          <span className="mt-1 text-sm text-red-500" role="alert">
            {localize('com_auth_password_not_match')}
          </span>
        )}
      </div>
    );
  }

  if (id === 'username') {
    return (
      <div className="hidden">
        {children}
      </div>
    );
  }
  
  return children;
};

// คอมโพเนนต์ Modal สำหรับกรอกโรงเรียน
export const SchoolInputModal = ({ 
  isOpen, 
  onClose, 
  schoolValue, 
  onSchoolChange, 
  register,
  errors
}) => {
  const localize = useLocalize();
  const [schoolList, setSchoolList] = useState<{ id: number; name: string }[]>([{ id: 0, name: 'Loading...' }]);
  const [inputValue, setInputValue] = useState(schoolValue || '');
  const [filteredSchools, setFilteredSchools] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios.get(`${codekitBackend}/api/school?id=1`).then(({ data }) => {
      setSchoolList(data);
      setFilteredSchools(data);
      setIsLoading(false);
    }).catch(error => {
      console.error('ไม่สามารถโหลดรายชื่อโรงเรียนได้:', error);
      setIsLoading(false);
    });
  }, []);

  // ซิงค์ค่า input กับ state ภายนอก
  useEffect(() => {
    setInputValue(schoolValue || '');
  }, [schoolValue]);

  // กรองรายการโรงเรียนตามข้อความที่ผู้ใช้พิมพ์
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredSchools(schoolList);
    } else {
      const filtered = schoolList.filter(school => 
        school.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSchools(filtered);
    }
  }, [inputValue, schoolList]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSchoolSelect = (schoolName) => {
    setInputValue(schoolName);
    onSchoolChange(schoolName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-full max-h-full md:h-auto md:max-h-[80vh] md:w-[90vw] md:max-w-[90vw] md:rounded-lg p-0 m-0" showCloseButton={false}>
        <div className="flex flex-col h-full max-h-[80vh]">
          <div className="flex items-center justify-between p-4 border-b border-border-light">
            <DialogTitle className="text-xl font-semibold">{localize('com_auth_school')}</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              aria-label="ปิด"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-4 border-b border-border-light">
            <div className="relative">
              <div className="flex items-center border border-border-light rounded-lg px-3 py-2 bg-surface-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  autoComplete="off"
                  value={inputValue}
                  onChange={handleInputChange}
                  className="
                    flex-grow bg-transparent focus:outline-none
                    text-text-primary placeholder:text-gray-400
                  "
                  placeholder="ค้นหาโรงเรียน..."
                />
                {inputValue && (
                  <button 
                    type="button" 
                    onClick={() => setInputValue('')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-hidden" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : filteredSchools.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 h-full overflow-y-auto pr-1">
                {filteredSchools.map((school) => (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => handleSchoolSelect(school.name)}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                  >
                    {school.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>ไม่พบโรงเรียนที่ตรงกับการค้นหา</p>
                <p className="mt-2">กรุณาลองค้นหาด้วยคำอื่น หรือติดต่อผู้ดูแลระบบ</p>
              </div>
            )}
          </div>
          
          <div className="border-t border-border-light p-4">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {localize('com_ui_cancel')}
              </button>
              {inputValue.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => {
                    onSchoolChange(inputValue);
                    onClose();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {localize('com_ui_accept')}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SchoolInput = (props) => {
  const localize = useLocalize();
  const initRef = useRef(false);
  const [schoolList, setSchoolList] = useState<{ id: number; name: string }[]>([{ id: 0, name: 'Loading...' }]);
  const [showModal, setShowModal] = useState(false);
  const [schoolValue, setSchoolValue] = useState('');
  
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { register, errors, setValue, watch } = props;
  
  const validation = (value: string | number) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return localize('com_auth_school_required');
    }
    return true;
  };

  // ดึงข้อมูลโรงเรียนเมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    if (initRef.current) {
      return;
    }
    initRef.current = true;
    axios.get(`${codekitBackend}/api/school?id=1`).then(({ data }) => {
      setSchoolList(data);
    });
  }, []);

  // ติดตามการเปลี่ยนแปลงค่าจาก form
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'school' && value.school) {
        setSchoolValue(value.school);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // เปิดโมดัล
  const handleOpenModal = () => {
    setShowModal(true);
  };

  // อัพเดทค่า input เมื่อมีการเปลี่ยนแปลงจากโมดัล
  const handleSchoolChange = (value) => {
    setSchoolValue(value);
    setValue('school', value, { shouldValidate: true });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <input
            id="school"
            type="text"
            autoComplete="off"
            aria-label={localize('com_auth_school')}
            {...register(
              'school',
              { validate: validation }
            )}
            aria-invalid={!!errors['school']}
            className="
              webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light
              bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none
            "
            placeholder=" "
            data-testid="school"
            list="school-options"
          />
          <datalist id="school-options">
            {schoolList.map(({ id: schoolId, name }) => (
              <option key={schoolId} value={name} data-id={schoolId} />
            ))}
          </datalist>
          <label
            htmlFor="school"
            className="
              absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100
              peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500
              rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4
            "
          >
            {localize('com_auth_school')}
          </label>
        </div>
        
        {/* ปุ่มเปิดโมดัลโรงเรียน */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="เลือกโรงเรียน"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      {errors['school'] && (
        <span role="alert" className="mt-1 text-sm text-red-500">
          {localize('com_auth_school_required')}
        </span>
      )}

      {/* โมดัลสำหรับกรอกโรงเรียน */}
      <SchoolInputModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        schoolValue={schoolValue}
        onSchoolChange={handleSchoolChange}
        register={register}
        errors={errors}
      />
    </div>
  );
};