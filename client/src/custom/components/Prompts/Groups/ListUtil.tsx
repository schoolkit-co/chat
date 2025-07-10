import React, { useCallback, useState } from 'react'; // Added useState
import axios from 'axios';
import type { TPromptGroup } from 'librechat-data-provider';
import { useLocalize, useCategories, useCustomLink } from '~/hooks'; // Added useCustomLink
import { useSetRecoilState } from 'recoil'; // Added useSetRecoilState
import store from '~/store'; // Added store
import { useLocation } from 'react-router-dom'; // Import useLocation
import CategoryIcon from '~/components/Prompts/Groups/CategoryIcon'; // Adjust this path
import ChatGroupItem from '~/components/Prompts/Groups/ChatGroupItem'; // Added import
import DashGroupItem from '~/components/Prompts/Groups/DashGroupItem'; // Added import
import { useGetRecentPrompts } from '~/data-provider';
import { useQueryClient } from '@tanstack/react-query'; // Add this import

interface GroupedPrompts {
  [key: string]: TPromptGroup[];
}

const RECENTLY_USED_HEADER_KEY = 'RECENTLY_USED_PROMPTS'; // Internal key
const NUM_RECENT_PROMPTS = 3; // Number of recent prompts to show

export const groupPromptsByCategory = (groups: TPromptGroup[]): GroupedPrompts => {
  return groups.reduce((acc, group) => {
    const category = group.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(group);
    return acc;
  }, {} as GroupedPrompts);
};

// 1. PromptHeader Component - Handles the display and interaction of category headers
export const PromptHeader = ({ category, isCollapsed, onToggle }: { 
  category: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}) => {
  // Hooks for state management and localization
  const localize = useLocalize();
  const location = useLocation();
  const { categories: availableCategories } = useCategories();
  
  // Recoil state for managing filters
  const setPromptsName = useSetRecoilState(store.promptsName);
  const setPromptsCategory = useSetRecoilState(store.promptsCategory);

  // Function to clear filters and navigate to prompts page
  // Using useCallback to prevent unnecessary re-renders
  const clearFiltersAndNavigate = useCallback(() => {
    setPromptsName('');
    setPromptsCategory(category === RECENTLY_USED_HEADER_KEY || category === 'Uncategorized' ? '' : category);
  }, [setPromptsName, setPromptsCategory, category]);

  // Custom hook for navigation
  const customLink = useCustomLink('/d/prompts', clearFiltersAndNavigate);
  
  // Handler for "See all" link click
  const seeAllClickHandler = (e: React.MouseEvent<HTMLAnchorElement>) => {
    customLink(e);
  };

  let displayCategoryName = category;

  if (category === RECENTLY_USED_HEADER_KEY) {
    displayCategoryName = 'ใช้งานล่าสุด'; // Ensure this localization key exists
  } else if (category === 'Uncategorized') {
    displayCategoryName = localize('com_ui_no_category');
  } else if (availableCategories) {
    const matchedCategory = availableCategories.find(cat => cat.value === category);
    if (matchedCategory && matchedCategory.label) {
      displayCategoryName = matchedCategory.label;
    }
  }
  
  const isOnPromptsPage = location.pathname === '/d/prompts'; // Check if on the target page
  const showSeeAll = 
    category !== RECENTLY_USED_HEADER_KEY && 
    category !== 'Uncategorized' && 
    !isOnPromptsPage; // Hide if on /d/prompts
  
  const isCollapsible = category !== RECENTLY_USED_HEADER_KEY;
  
  // Header click handler with event bubbling prevention
  const handleHeaderClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) {
      return;
    }
    if (isCollapsible && onToggle) {
      onToggle();
    }
  };
  
  return (
    <div 
      className={`flex items-center justify-between gap-2 px-2 py-2 ${isCollapsible ? 'cursor-pointer hover:bg-gray-50 rounded-lg' : ''} ${isOnPromptsPage ? 'mx-2' : ''}`}
      onClick={handleHeaderClick}
    >
      <div className="flex items-center gap-2">
        {isCollapsible && (
          <svg
            className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
        <CategoryIcon category={category} className="h-5 w-5" />
        <h3 className="text-lg font-semibold text-text-primary">
          {displayCategoryName}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        {showSeeAll && (
          <a 
            href="/d/prompts"
            onClick={seeAllClickHandler} 
            className="cursor-pointer text-sm text-text-secondary hover:text-text-primary hover:underline"
          >
            See all
          </a>
        )}
      </div>
    </div>
  );
};

// Helper component to render individual prompt items
interface PromptItemProps {
  group: TPromptGroup;
  isChatRoute: boolean;
  instanceProjectId?: string;
  onSavePromptHistory?: (groupId: string) => Promise<string[]|[]>;
}

// Modify RenderPromptListItems to accept raw groups and isLoading
interface RenderPromptListItemsProps {
  groups: TPromptGroup[];      // Changed from groupedPrompts
  isLoading: boolean;          // Added isLoading
  isChatRoute: boolean;
  instanceProjectId?: string;
}

// 2. RenderPromptListItems Component - Main component for rendering the prompt list
export const RenderPromptListItems: React.FC<RenderPromptListItemsProps> = ({ 
  groups,
  isLoading,
  isChatRoute, 
  instanceProjectId 
}) => {
  // React Query client for cache management
  const queryClient = useQueryClient();
  
  // State for managing collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  
  // Function to toggle category visibility
  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  // Fetch recent prompts data from API
  const { data: recentGroupIds = [], isLoading: isLoadingRecentPrompts } = useGetRecentPrompts();

  // Function to save prompt usage history
  const onSavePromptHistory = useCallback(async (groupId: string): Promise<string[]|[]> => {
    try {
      const response = await axios.post('/api/prompts/history', {
        groupId: groupId
      }, { withCredentials: true });
      
      // Update React Query cache
      queryClient.setQueryData(['recentPrompts'], response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error saving prompt history:', error);
      return [];
    }
  }, [queryClient]);
  
  // Component for rendering individual prompt items
  // Using useCallback to prevent unnecessary re-renders
  const PromptItem: React.FC<PromptItemProps> = useCallback(({ group, isChatRoute, instanceProjectId }) => {
    if (isChatRoute) {
      return (
        <ChatGroupItem
          group={group}
          instanceProjectId={instanceProjectId}
          onSavePromptHistory={onSavePromptHistory}
        />
      );
    }
    return (
      <DashGroupItem group={group} instanceProjectId={instanceProjectId} />
    );
  }, [onSavePromptHistory]);

  // Create Map for efficient prompt lookup by ID
  const groupsMap = new Map(groups.map(group => [group._id, group]));
  
  // Get recent prompts and sort by most recent usage
  const recentPrompts = recentGroupIds
    .slice()
    .reverse()
    .map(groupId => groupsMap.get(groupId))
    .filter((group): group is TPromptGroup => group !== undefined)
    .slice(0, NUM_RECENT_PROMPTS);
  
  // Group prompts by category
  const categorizedPrompts = groups.length > 0 ? groupPromptsByCategory(groups) : {};

  // Return null if data is still loading or empty
  if (isLoading || isLoadingRecentPrompts || !groups || groups.length === 0) {
    return null; 
  }
  
  return (
    <>

      {/* Original Code Before Modify with Recent Used Section */}
      {/* {Object.entries(groupedPrompts).map(([category, categoryGroups]) => (
        <div key={category}>
          <PromptHeader category={category} />
          {categoryGroups.map((group) => {
            if (isChatRoute) {
              return (
                <ChatGroupItem
                  key={group._id}
                  group={group}
                  instanceProjectId={instanceProjectId}
                />
              );
            }
            return (
              <DashGroupItem 
                key={group._id} 
                group={group} 
                instanceProjectId={instanceProjectId} 
              />
            );
          })}
        </div>
      ))} */}
      
      {/* Render recent prompts section if available */}
      {recentPrompts.length > 0 && (
        <div className="mb-4 mt-2">
          <PromptHeader category={RECENTLY_USED_HEADER_KEY} />
          {recentPrompts.map((group) => (
            <PromptItem 
              key={`${RECENTLY_USED_HEADER_KEY}-${group._id}`}
              group={group} 
              isChatRoute={isChatRoute} 
              instanceProjectId={instanceProjectId} 
            />
          ))}
        </div>
      )}

      {/* Render categorized prompts section */}
      {Object.entries(categorizedPrompts).map(([category, categoryGroups]) => (
        category === RECENTLY_USED_HEADER_KEY ? null : (
          <div className="mb-4" key={category}>
            <PromptHeader 
              category={category} 
              isCollapsed={collapsedCategories[category]}
              onToggle={() => toggleCategory(category)}
            />
            {!collapsedCategories[category] && (
              <div className="mt-2">
                {categoryGroups.map((group) => (
                  <PromptItem 
                    key={group._id}
                    group={group} 
                    isChatRoute={isChatRoute} 
                    instanceProjectId={instanceProjectId} 
                  />
                ))}
              </div>
            )}
          </div>
        )
      ))}
    </>
  );
};
