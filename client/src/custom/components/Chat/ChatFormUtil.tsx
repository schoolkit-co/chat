import React, { useState }  from 'react';
import { DownloadIcon } from 'lucide-react';
import { WordIcon } from 'lucide-react'; //Custom Icon
import { ExcelIcon } from 'lucide-react'; //Custom Icon
import { cn } from '~/utils';

// Custom Tooltip component
const Tooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export const DownloadBar = (props) => {
  const { textAreaRef, methods, submitMessage } = props;

  const handleFormatClick = (format: string) => {
    let text = '';
    switch (format) {
      case 'DOCX':
        text = 'จากเนื้อหาข้างต้น ขอ python script ที่ใช้ python-docx เพื่อดาวน์โหลดเป็นไฟล์ชื่อ word.docx โดยไม่ต้องใส่ web framework (ขอคำตอบแค่ code โดยไม่ต้องการคำอธิบายเพิ่มเติม, หากมีการใช้ package อื่นนอกจาก "pandas", "lxml", "typing-extensions" ให้ใส่โค้ด import ด้วย, หากเนื้อหาไม่สามารถสร้างเป็นเอกสาร Word ได้โดยตรง ให้แปลงเป็น markdown จากนั้นแปลงเป็น markup จากนั้นจึงสร้างเอกสาร)';
        break;
      case 'XLSX':
        text = 'จากเนื้อหาข้างต้น ขอ python script ที่ใช้ openpyxl เพื่อดาวน์โหลดเป็นไฟล์ชื่อ output.xlsx โดยไม่ต้องใส่ web framework (ขอคำตอบแค่ code โดยไม่ต้องการคำอธิบายเพิ่มเติม, หากมีการใช้ package อื่นนอกจาก "pandas" ให้ใส่โค้ด import ด้วย)';
        break;
      case 'official':
        text = '(เปิด Artifact) นำข้อมูลทั้งหมดมานำเสนอ เป็น html รูปแบบเอกสารราชการเป็นระเบียบ อ่านง่าย และสามารถพิมพ์ออกมาได้ ละใช้ font thai sarabun ขนาดตามระเบียบราชการ';
        break;
      default:
        return;
    }

    if (textAreaRef.current) {
      // เพิ่มข้อความตามรูปแบบที่เลือก
      textAreaRef.current.value = text;
      methods.setValue('text', text, { shouldValidate: true });
      
      // ส่งฟอร์ม
      const data = { text };
      submitMessage(data);
    }
  };

  return (
    <div className="flex gap-2 pt-3">
      <button
        type="button"
        className="mb-1 px-2 py-1 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition duration-300 text-xs flex items-center gap-1"
        onClick={() => handleFormatClick('DOCX')}
      >
        <DownloadIcon className="h-4 w-4 p-[0.05rem]"/>
        WORD
      </button>
      <button
        type="button"
        className="mb-1 px-2 py-1 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition duration-300 text-xs flex items-center gap-1"
        onClick={() => handleFormatClick('XLSX')}
      >
        <DownloadIcon className="h-4 w-4 p-[0.05rem]"/>
        EXCEL
      </button>
      <button
        type="button"
        className="mb-1 px-2 py-1 bg-sky-900 text-white rounded-md shadow-md hover:bg-green-600 transition duration-300 text-xs flex items-center gap-1"
        onClick={() => handleFormatClick('official')}
      >
        <DownloadIcon className="h-4 w-4 p-[0.05rem]"/>
        สร้างเอกสาร
      </button>
    </div>
  );
};

export const DownloadButtons = (props) => {
  const { isCreatedByUser, isLast, isSubmitting } = props;

  return (
    <>
      <Tooltip text="Word">
      <button
        className={cn(
          'ml-0 flex items-center gap-1.5 rounded-md p-1 text-xs hover:bg-gray-100 hover:text-gray-500 focus:opacity-100 dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:group-hover:visible md:group-[.final-completion]:visible',
          isSubmitting && isCreatedByUser ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          !isLast ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          'font-medium text-base text-blue-500', //Custom Style
        )}
        // onClick={() => handleFormatClick('DOCX')}
        type="button"
      >
        W
      </button>
      </Tooltip>
      <Tooltip text="Excel">
      <button
        className={cn(
          'ml-0 flex items-center gap-1.5 rounded-md p-1 text-xs hover:bg-gray-100 hover:text-gray-500 focus:opacity-100 dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:group-hover:visible md:group-[.final-completion]:visible',
          isSubmitting && isCreatedByUser ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          !isLast ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          'font-medium text-base text-green-500', //Custom Style
        )}
        // onClick={() => handleFormatClick('XLSX')}
        type="button"
      >
        X
      </button>
      </Tooltip>
      <Tooltip text="Slide Prompt">
      <button
        className={cn(
          'ml-0 flex items-center gap-1.5 rounded-md p-1 text-xs hover:bg-gray-100 hover:text-gray-500 focus:opacity-100 dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:group-hover:visible md:group-[.final-completion]:visible',
          isSubmitting && isCreatedByUser ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          !isLast ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          'font-medium text-base text-sky-900', //Custom Style
        )}
        // onClick={() => handleFormatClick('XLSX')}
        type="button"
      >
        SP
      </button>
      </Tooltip>
    </>
  );
};