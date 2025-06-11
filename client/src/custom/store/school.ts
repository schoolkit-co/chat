import { atom } from 'recoil';

// Define the type for the school map
export interface SchoolMap {
  [id: number]: string;
}

// Atom to store the school list as a map { id: name }
export const schoolMapAtom = atom<SchoolMap | null>({
  key: 'schoolMapState',
  default: null, // Initialize with null, will be populated by AdminDashboard
}); 