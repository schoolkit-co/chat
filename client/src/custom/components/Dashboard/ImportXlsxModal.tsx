import React, { useState, useRef } from 'react';
import axios from 'axios';
import { X, FileSpreadsheet, Upload, AlertCircle, CheckCircle, Eye, EyeOff, Download } from 'lucide-react';
import { cn } from '~/utils';
import * as XLSX from 'xlsx';

interface ImportXlsxModalProps {
  onClose: () => void;
  onUsersImported: () => void;
}

interface ImportResult {
  success: Array<{
    email: string;
    name: string;
    status: string;
  }>;
  failed: Array<{
    email: string;
    reason: string;
  }>;
}

interface UserData {
  name: string;
  email: string;
  password: string;
}

const ImportXlsxModal: React.FC<ImportXlsxModalProps> = ({ onClose, onUsersImported }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // จัดการ drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx')) {
        handleFile(file);
      } else {
        setError('รองรับเฉพาะไฟล์ XLSX เท่านั้น');
      }
    }
  };

  // อัปโหลดไฟล์ XLSX
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    handleFile(files[0]);
  };

  // จัดการไฟล์
  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      setError('รองรับเฉพาะไฟล์ XLSX เท่านั้น');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    
    // อ่านข้อมูลจากไฟล์ XLSX
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // ดึงข้อมูลจาก sheet แรก
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // แปลงข้อมูลเป็น JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        // ตรวจสอบหัวตาราง
        const headers = jsonData[0];
        if (!headers || headers.length < 3 || 
            headers[0].toLowerCase() !== 'name' || 
            headers[1].toLowerCase() !== 'email' || 
            headers[2].toLowerCase() !== 'password') {
          setError('รูปแบบไฟล์ไม่ถูกต้อง กรุณาตรวจสอบหัวตาราง (Name, Email, Password)');
          return;
        }
        
        // แปลงข้อมูลให้เป็นรูปแบบที่ต้องการ
        const extractedData = jsonData
          .slice(1) // ข้ามแถวหัวตาราง
          .map(row => {
            if (row.length < 3) return null;
            
            const name = row[0]?.toString().trim() || '';
            const email = row[1]?.toString().trim() || '';
            const password = row[2]?.toString().trim() || '';
            
            // ตรวจสอบความถูกต้องของข้อมูล
            if (!name || !email || !password) return null;
            if (!email.includes('@')) return null;
            
            return { name, email, password };
          })
          .filter((data): data is UserData => data !== null);
        
        if (extractedData.length === 0) {
          setError('ไม่พบข้อมูลที่ถูกต้องในไฟล์');
          return;
        }
        
        setUserData(extractedData);
      } catch (err) {
        console.error('Error parsing XLSX file:', err);
        setError('ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ส่งข้อมูลไปยัง API
  const handleImport = async () => {
    if (!selectedFile || userData.length === 0) {
      setError('ไม่ได้เลือกไฟล์หรือไม่พบข้อมูลที่ถูกต้อง');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/user/school-admin/import-users', {
        users: userData
      });
      
      setImportResult(response.data.results);
      onUsersImported();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      console.error('Error importing users:', err);
    } finally {
      setLoading(false);
    }
  };

  // ปิด Modal
  const handleClose = () => {
    onClose();
  };

  // แสดง/ซ่อนรหัสผ่าน
  const togglePasswordVisibility = (index: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // ดาวน์โหลดไฟล์เทมเพลต
  const handleDownloadTemplate = () => {
    // ใช้ไฟล์ reg_template.xlsx จากโฟลเดอร์ public/assets
    const templatePath = '/assets/reg_template.xlsx';
    
    // สร้าง element a สำหรับดาวน์โหลด
    const a = document.createElement('a');
    a.href = templatePath;
    a.download = 'reg_template.xlsx';
    a.click();
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
  
  // แสดงตัวอย่างไฟล์ตัวอย่าง
  const renderSampleFile = () => {
    return (
      <div className="mb-4 p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">ตัวอย่างไฟล์ XLSX</h4>
          <button
            onClick={handleDownloadTemplate}
            className="text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xs px-3 py-1.5 text-center inline-flex items-center dark:bg-blue-800/30 dark:text-blue-300 dark:hover:bg-blue-800/40 dark:focus:ring-blue-800/50"
          >
            <Download size={14} className="mr-1.5" />
            ดาวน์โหลดเทมเพลต
          </button>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">ไฟล์ควรมีรูปแบบดังนี้:</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-blue-100 dark:bg-blue-800">
              <tr>
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">Email</th>
                <th className="px-2 py-1 text-left">Password</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-gray-800">
                <td className="px-2 py-1">John Doe</td>
                <td className="px-2 py-1">john@example.com</td>
                <td className="px-2 py-1">password123</td>
              </tr>
              <tr className="bg-white dark:bg-gray-800">
                <td className="px-2 py-1">Jane Smith</td>
                <td className="px-2 py-1">jane@example.com</td>
                <td className="px-2 py-1">password456</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // แสดงผลลัพธ์การนำเข้า
  const renderImportResult = () => {
    if (!importResult) return null;
    
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">ผลการนำเข้า</h4>
        
        {/* แสดงรายการที่สำเร็จ */}
        {importResult.success.length > 0 && (
          <div className="mb-4">
            <h5 className="flex items-center text-xs font-medium text-green-800 dark:text-green-300 mb-2">
              <CheckCircle size={14} className="mr-1" />
              นำเข้าสำเร็จ ({importResult.success.length})
            </h5>
            <div className="max-h-32 overflow-y-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-green-50 dark:bg-green-900/30">
                  <tr>
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Email</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.success.map((item, index) => (
                    <tr key={index} className="bg-white dark:bg-gray-800">
                      <td className="px-2 py-1">{item.name}</td>
                      <td className="px-2 py-1">{item.email}</td>
                      <td className="px-2 py-1">{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* แสดงรายการที่ล้มเหลว */}
        {importResult.failed.length > 0 && (
          <div>
            <h5 className="flex items-center text-xs font-medium text-red-800 dark:text-red-300 mb-2">
              <AlertCircle size={14} className="mr-1" />
              นำเข้าล้มเหลว ({importResult.failed.length})
            </h5>
            <div className="max-h-32 overflow-y-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-red-50 dark:bg-red-900/30">
                  <tr>
                    <th className="px-2 py-1 text-left">Email</th>
                    <th className="px-2 py-1 text-left">เหตุผล</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.failed.map((item, index) => (
                    <tr key={index} className="bg-white dark:bg-gray-800">
                      <td className="px-2 py-1">{item.email}</td>
                      <td className="px-2 py-1">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // แสดงรายการข้อมูลที่จะนำเข้า
  const renderDataPreview = () => {
    if (userData.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">ข้อมูลที่จะนำเข้า ({userData.length})</h4>
        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 dark:border-gray-700">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">Email</th>
                <th className="px-2 py-1 text-left">Password</th>
                <th className="px-2 py-1 text-left">แสดง</th>
              </tr>
            </thead>
            <tbody>
              {userData.map((user, index) => (
                <tr key={index} className="bg-white dark:bg-gray-700">
                  <td className="px-2 py-1">{user.name}</td>
                  <td className="px-2 py-1">{user.email}</td>
                  <td className="px-2 py-1">
                    {showPasswords[index] ? user.password : '••••••••'}
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(index)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPasswords[index] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative p-4 w-full max-w-2xl">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              นำเข้าบัญชีผู้ใช้จาก XLSX
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
            
            {!importResult ? (
              <>
                {renderSampleFile()}
                
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    อัปโหลดไฟล์ XLSX
                  </label>
                  <div 
                    className="flex items-center justify-center w-full"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {selectedFile ? (
                          <div className="flex flex-col items-center">
                            <FileSpreadsheet size={32} className="text-green-500 mb-2" />
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">{selectedFile.name}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        ) : (
                          <>
                            <Upload size={32} className="mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> หรือลากและวาง
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              (รองรับเฉพาะไฟล์ XLSX เท่านั้น)
                            </p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".xlsx" 
                        onChange={handleFileChange}
                        ref={fileInputRef}
                      />
                    </label>
                  </div>
                </div>
                
                {renderDataPreview()}
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={loading || userData.length === 0}
                    className={cn(
                      "text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
                      (loading || userData.length === 0) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {loading ? 'กำลังนำเข้า...' : 'นำเข้า'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {renderImportResult()}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    ปิด
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportXlsxModal; 