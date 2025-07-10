import React, { useCallback } from 'react';
import { useAuthContext } from '~/hooks';
import { cn } from '~/utils';
import { LayoutDashboard, Users, BarChart, BookText } from 'lucide-react';

export type MenuItem = {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  onClick?: () => void;
};

type DashboardSidePanelProps = {
  title: string;
  menuItems: MenuItem[];
  activeMenu: string;
  onMenuSelect: (menuId: string) => void;
  children?: React.ReactNode;
};

const DashboardSidePanel: React.FC<DashboardSidePanelProps> = ({ 
  title, 
  menuItems, 
  activeMenu,
  onMenuSelect,
  children 
}) => {
  const handleMenuClick = useCallback((menuId: string, onClick?: () => void) => {
    if (typeof onMenuSelect === 'function') {
      onMenuSelect(menuId);
    }
    if (typeof onClick === 'function') {
      onClick();
    }
  }, [onMenuSelect]);

  return (
    <div className="mr-2 flex h-auto w-auto min-w-72 flex-col gap-2 lg:w-1/4 xl:w-1/4">
      {children}
      <div className="flex-grow overflow-y-auto mt-2">
        <h2 className="text-lg font-semibold mb-2 px-3">{title}</h2>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                activeMenu === item.id 
                  ? "bg-gray-200 dark:bg-gray-700" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              onClick={() => handleMenuClick(item.id, item.onClick)}
            >
              <item.icon className={cn(
                "h-5 w-5", 
                activeMenu === item.id 
                  ? "text-primary" 
                  : "text-gray-500"
              )} />
              <div>
                <div className={cn(
                  "font-medium",
                  activeMenu === item.id && "text-primary"
                )}>{item.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSidePanel; 