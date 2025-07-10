import { useAuthContext } from '~/hooks/AuthContext';

export const ClearLocalStorageButton = () => {
  const { logout } = useAuthContext();

  return (
    <div className="mt-4 text-center">
      <p className="mb-2">If any conversation is not saved, try to press this button:</p>
      <button 
        type="button"
        className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded"
        onClick={() => {
          localStorage.clear();
          logout();
        }}
      >
        Fix LocalStorage & Logout
      </button>
    </div>
  );
};
