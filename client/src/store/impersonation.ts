import { atomWithLocalStorage } from '~/store/utils';

export interface ImpersonationState {
  isImpersonating: boolean;
  impersonatedBy: string | null;
  impersonatedUser: string | null;
}

const defaultImpersonationState: ImpersonationState = {
  isImpersonating: false,
  impersonatedBy: null,
  impersonatedUser: null,
};

const impersonationState = atomWithLocalStorage<ImpersonationState>(
  'impersonationState',
  defaultImpersonationState,
);

export default { impersonationState }; 