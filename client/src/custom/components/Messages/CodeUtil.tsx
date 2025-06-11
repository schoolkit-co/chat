import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { codeBlockAnalysisStatusState } from '~/store/temporary';

export const handlePythonExecute = ({ codeRef, setPythonIsLoading }) => {
  return async function() {
    try {
      setPythonIsLoading(true);
      const codeString: string = codeRef.current?.textContent ?? '';
      if (/\b(openpyxl)\b/i.test(codeString)) {
        await window.downloadXlsx(codeString);
      } else {
        await window.downloadDocx(codeString);
      }
    } catch (error) {
      console.log('handlePythonExecute', error);
    } finally {
      setPythonIsLoading(false);
    }
  }
}

export const AnalyzeCodeToggle = (props) => {
  const { codeRef, lang, children } = props;
  const [analysisStatus] = useRecoilState(codeBlockAnalysisStatusState);
  const [showCode, setShowCode] = useState(false);

  const toggleCode = () => {
    if (showCode)
      setShowCode(false);
    else
      setShowCode(true);
  }

  return (
    <>
    { lang !== 'python' ? null :
      <div>
        <span className={`analysis-status ${analysisStatus}`}>
          {analysisStatus === 'analyzing' ? 'Analyzing' : 'Analyzed'}
        </span>
        &nbsp;
        <button onClick={toggleCode}>
          { showCode ?
          <svg viewBox="0 0 32 16" width="24px" xmlns="http://www.w3.org/2000/svg">
            <path d="M16,2a2,2,0,0,1,1.41.59l10,10A2,2,0,0,1,24.59,15.41L16,6.83l-8.59,8.58a2,2,0,0,1-2.82-2.82l10-10A2,2,0,0,1,16,2Z" />
          </svg>
          :
          <svg viewBox="0 0 32 24" width="24px" xmlns="http://www.w3.org/2000/svg">
            <path d="M16,22a2,2,0,0,1-1.41-.59l-10-10A2,2,0,0,1,7.41,8.59L16,17.17l8.59-8.58a2,2,0,0,1,2.82,2.82l-10,10A2,2,0,0,1,16,22Z" />
          </svg>
          }
        </button>
      </div>
    }
      <div style={{ display: (lang !== 'python' || showCode) ? '' : 'none' }}>
        {children}
      </div>
    { lang !== 'python' || analysisStatus === 'analyzing' ? null :
      <>
      { /\b(openpyxl)\b/i.test(codeRef?.current?.innerText || "") ? 
      <p>
        📂 
        <span>
          <a className="cursor-pointer" onClick={async () => await window.downloadXlsx(codeRef?.current?.innerText || "")}>ดาวน์โหลดไฟล์ xlsx</a>
        </span>
      </p> : 
      <p>
        📂 
        <span>
          <a className="cursor-pointer" onClick={async () => await window.downloadDocx(codeRef?.current?.innerText || "")}>ดาวน์โหลดไฟล์ docx</a>
        </span>
      </p>
      }
      </>
    }
    </>
  );
}