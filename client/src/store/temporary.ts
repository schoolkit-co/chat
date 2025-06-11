import { atom, selector } from 'recoil';
import { atomWithLocalStorage } from '~/store/utils';

const isTemporary = atomWithLocalStorage('isTemporary', false);

export const codeBlockAnalysisStatusState = atom<'analyzing' | 'analyzed'>({
  key: 'codeBlockAnalysisStatusState',
  default: 'analyzed',
  effects: [
    ({ onSet }) => {
      onSet((newValue, oldValue) => {
        // console.log('[DEBUG] AnalysisStatus atom changed from', oldValue, 'to', newValue);
      });
    },
  ],
});

export default {
  isTemporary,
  codeBlockAnalysisStatusState,
};
