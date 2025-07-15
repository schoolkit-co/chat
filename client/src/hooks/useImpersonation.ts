import { useRecoilState } from 'recoil';
import store from '~/store';
import type { ImpersonationState } from '~/store/impersonation';

export const useImpersonation = () => {
  const [impersonationState, setImpersonationState] = useRecoilState(store.impersonationState);

  const startImpersonation = (impersonatedBy: string, impersonatedUser: string) => {
    setImpersonationState({
      isImpersonating: true,
      impersonatedBy,
      impersonatedUser,
    });
  };

  const endImpersonation = () => {
    setImpersonationState({
      isImpersonating: false,
      impersonatedBy: null,
      impersonatedUser: null,
    });
  };

  const checkImpersonation = () => {
    return impersonationState.isImpersonating;
  };

  return {
    impersonationState,
    startImpersonation,
    endImpersonation,
    checkImpersonation,
    isImpersonating: impersonationState.isImpersonating,
    impersonatedBy: impersonationState.impersonatedBy,
    impersonatedUser: impersonationState.impersonatedUser,
  };
}; 