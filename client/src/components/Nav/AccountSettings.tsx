import { useState, memo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import * as Select from '@ariakit/react/select';
import { FileText, LogOut, RefreshCw, Ticket } from 'lucide-react';
import { LinkIcon, GearIcon, DropdownMenuSeparator } from '~/components';
import { useGetStartupConfig, useGetUserBalance } from '~/data-provider';
import FilesView from '~/components/Chat/Input/Files/FilesView';
import { useAuthContext } from '~/hooks/AuthContext';
import useAvatar from '~/hooks/Messages/useAvatar';
import { UserIcon } from '~/components/svg';
import { useLocalize } from '~/hooks';
import Settings from './Settings';
import store from '~/store';
// Custom
import CouponRedeemModal from '~/custom/components/Nav/CouponRedeemModal';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { CouponMenuItem } from '~/custom/components/Nav/AccountSettingsUtil';

function AccountSettings() {
  const localize = useLocalize();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const balanceQuery = useGetUserBalance({
    enabled: !!isAuthenticated && startupConfig?.balance?.enabled,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showFiles, setShowFiles] = useRecoilState(store.showFiles);
  const [refreshing, setRefreshing] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const queriesEnabled = useRecoilValue(store.queriesEnabled);

  // School balance query with auto-refresh every minute
  const schoolBalanceQuery = useQuery({
    queryKey: ['schoolBalance'],
    queryFn: async () => {
      const response = await axios.get('/api/school/balance');
      return response.data;
    },
    enabled: !!isAuthenticated && queriesEnabled && !!(user as any)?.school,
    refetchInterval: 60000, // รีเฟรชทุก 60 วินาที (1 นาที)
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });

  const handleRefreshBalance = async () => {
    if (refreshing) return;
    setRefreshing(true);
    
    try {
      // เรียกใช้ API ใหม่เพื่อทำ auto-refill แทนที่จะใช้ refetch
      const response = await axios.post('/api/custom-balance/auto-refill');
      
      // อัปเดตข้อมูลหลังจากได้รับการตอบกลับจาก API
      if (response.data.success) {
        // ถ้า refill สำเร็จ จะได้ balance ใหม่มาด้วย
        balanceQuery.refetch();
      } else {
        // ถ้า refill ไม่สำเร็จ (เช่น ยังไม่ถึงเวลา) ก็แค่ refetch balance ปกติ
        balanceQuery.refetch();
      }
    } catch (error) {
      console.error('Failed to trigger auto-refill:', error);
      // ถ้าเกิดข้อผิดพลาด ก็แค่ refetch balance ปกติ
      balanceQuery.refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const avatarSrc = useAvatar(user);
  const avatarSeed = user?.avatar || user?.name || user?.username || '';

  return (
    <Select.SelectProvider>
      <Select.Select
        aria-label={localize('com_nav_account_settings')}
        data-testid="nav-user"
        className="mt-text-sm flex h-auto w-full items-center gap-2 rounded-xl p-2 text-sm transition-all duration-200 ease-in-out hover:bg-surface-hover"
      >
        <div className="-ml-0.9 -mt-0.8 h-8 w-8 flex-shrink-0">
          <div className="relative flex">
            {avatarSeed.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'rgb(121, 137, 255)',
                  width: '32px',
                  height: '32px',
                  boxShadow: 'rgba(240, 246, 252, 0.1) 0px 0px 0px 1px',
                }}
                className="relative flex items-center justify-center rounded-full p-1 text-text-primary"
                aria-hidden="true"
              >
                <UserIcon />
              </div>
            ) : (
              <img
                className="rounded-full"
                src={(user?.avatar ?? '') || avatarSrc}
                alt={`${user?.name || user?.username || user?.email || ''}'s avatar`}
              />
            )}
          </div>
        </div>
        <div
          className="mt-2 grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-text-primary"
          style={{ marginTop: '0', marginLeft: '0' }}
        >
          {user?.name ?? user?.username ?? localize('com_nav_user')}
        </div>
      </Select.Select>
      <Select.SelectPopover
        className="popover-ui w-[235px]"
        style={{
          transformOrigin: 'bottom',
          marginRight: '0px',
          translate: '0px',
        }}
      >
        <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm" role="note">
          {user?.email ?? localize('com_nav_user')}
        </div>
        <DropdownMenuSeparator />
        {/* {startupConfig?.balance?.enabled === true && balanceQuery.data != null && ( */}
        {schoolBalanceQuery.data?.remainingBalance != null && !isNaN(parseFloat(schoolBalanceQuery.data.remainingBalance)) ? (
          <>
            {/* <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm" role="note"> */}
            <div className="ml-3 mr-2 py-2 text-sm text-token-text-secondary" role="note">
              <span>
                ยอดเงินคงเหลือโรงเรียน: <span className={parseFloat(schoolBalanceQuery.data.remainingBalance) <= 0 ? 'text-red-500' : ''}>{parseFloat(schoolBalanceQuery.data.remainingBalance).toFixed(2).toLocaleString()}</span>
              </span>
            </div>
            <DropdownMenuSeparator />
          </>
        ) : !isNaN(parseFloat(balanceQuery?.data?.tokenCredits)) &&
        startupConfig?.balance?.enabled === true && balanceQuery.data != null && (
          <>
            {/* <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm" role="note"> */}
            <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm flex items-center justify-between" role="note">
              <span>
              {localize('com_nav_balance')}:{' '}
              {new Intl.NumberFormat().format(Math.round(balanceQuery.data.tokenCredits))}
              </span>
              <div className="flex space-x-1">
                <button 
                  onClick={handleRefreshBalance} 
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  disabled={refreshing}
                  title="อัพเดทยอดเงิน"
                >
                  <RefreshCw size={14} className={`${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <Select.SelectItem
          value=""
          onClick={() => setShowFiles(true)}
          className="select-item text-sm"
        >
          <FileText className="icon-md" aria-hidden="true" />
          {localize('com_nav_my_files')}
        </Select.SelectItem>
        {/* {startupConfig?.helpAndFaqURL !== '/' && (
          <Select.SelectItem
            value=""
            onClick={() => window.open(startupConfig?.helpAndFaqURL, '_blank')}
            className="select-item text-sm"
          >
            <LinkIcon aria-hidden="true" />
            {localize('com_nav_help_faq')}
          </Select.SelectItem>
        )} */}
        <CouponMenuItem onClick={() => setShowCouponModal(true)}/>
        <Select.SelectItem
          value=""
          onClick={() => setShowSettings(true)}
          className="select-item text-sm"
        >
          <GearIcon className="icon-md" aria-hidden="true" />
          {localize('com_nav_settings')}
        </Select.SelectItem>
        <DropdownMenuSeparator />
        <Select.SelectItem
          aria-selected={true}
          onClick={() => logout()}
          value="logout"
          className="select-item text-sm"
        >
          <LogOut className="icon-md" />
          {localize('com_nav_log_out')}
        </Select.SelectItem>
      </Select.SelectPopover>
      {showFiles && <FilesView open={showFiles} onOpenChange={setShowFiles} />}
      {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} />}
      {showCouponModal && (
        <CouponRedeemModal 
          onClose={() => setShowCouponModal(false)} 
          onSuccess={() => balanceQuery.refetch()}
        />
      )}
    </Select.SelectProvider>
  );
}

export default memo(AccountSettings);
