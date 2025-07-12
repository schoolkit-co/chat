import { atom } from 'recoil';
import type { TUser, TPlugin } from 'librechat-data-provider';

const user = atom<TUser | undefined>({
  key: 'user',
  default: undefined,
});

const availableTools = atom<Record<string, TPlugin>>({
  key: 'availableTools',
  default: {},
});

const usageEnabled = atom<boolean>({
  key: 'usageEnabled',
  default: false,
});

export default {
  user,
  availableTools,
  usageEnabled,
};
