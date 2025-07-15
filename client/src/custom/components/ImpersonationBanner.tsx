import React, { useState } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import axios from 'axios';
import { UserCog, X } from 'lucide-react';
import { useImpersonation } from '~/hooks/useImpersonation';
import { useNavigate } from 'react-router-dom';

const ImpersonationBanner: React.FC = () => {
  const { user, setUserContext } = useAuthContext();
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isImpersonating, impersonatedBy, impersonatedUser, endImpersonation } = useImpersonation();
  const navigate = useNavigate();

  const handleEndImpersonation = async () => {
    if (isEnding) return;

    setIsEnding(true);
    setError(null);

    try {
      const response = await axios.post('/api/admin/end-impersonate');
      
      if (response.data.token && response.data.user) {
        // Clear impersonation state
        endImpersonation();
        
        // Update auth context with admin user
        setUserContext({
          token: response.data.token,
          isAuthenticated: true,
          user: response.data.user,
          redirect: undefined,
        });
        navigate('/');
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Error ending impersonation:', err);
      setError(err.response?.data?.message || 'ไม่สามารถสิ้นสุดการแสดงตัวแทนได้');
    } finally {
      setIsEnding(false);
    }
  };

  // Don't render if not impersonating
  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="bg-purple-100 border-b border-purple-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <UserCog className="h-4 w-4 text-purple-600" />
        <span className="text-sm text-purple-800">
          คุณกำลังแสดงตัวแทนผู้ใช้ {impersonatedUser || (user && user.email)} โดย {impersonatedBy || 'admin'}
        </span>
        {user && (
          <span className="text-sm text-purple-600 bg-purple-200 px-2 py-1 rounded">
            {user.email}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
        <button
          onClick={handleEndImpersonation}
          disabled={isEnding}
          className="flex items-center space-x-1 text-sm text-purple-700 hover:text-purple-900 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          <span>
            {isEnding ? 'กำลังสิ้นสุด...' : 'สิ้นสุดการแสดงตัวแทน'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner; 