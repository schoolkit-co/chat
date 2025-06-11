//This custom hook is used to handle the side panel collapse to prevent modal from closing when reducing the screen size
import { useEffect, useRef } from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';

interface UsePanelCollapseProps {
  isSmallScreen: boolean;
  defaultCollapsed: boolean;
  navCollapsedSize: number;
  defaultMinSize: number;
  fullPanelCollapse: boolean;
  setIsCollapsed: (value: boolean) => void;
  setCollapsedSize: (value: number) => void;
  setMinSize: (value: number) => void;
  setFullCollapse: (value: boolean) => void;
  panelRef: React.RefObject<ImperativePanelHandle>;
}

export function usePanelCollapse({
  isSmallScreen,
  defaultCollapsed,
  navCollapsedSize,
  defaultMinSize,
  fullPanelCollapse,
  setIsCollapsed,
  setCollapsedSize,
  setMinSize,
  setFullCollapse,
  panelRef,
}: UsePanelCollapseProps) {
  const prevWidth = useRef(window.innerWidth);

  useEffect(() => {
    const currentWidth = window.innerWidth;
    const isReducing = currentWidth < prevWidth.current;
    
    if (isSmallScreen && !isReducing) {
      setIsCollapsed(true);
      setCollapsedSize(0);
      setMinSize(defaultMinSize);
      setFullCollapse(true);
      localStorage.setItem('fullPanelCollapse', 'true');
      panelRef.current?.collapse();
    } else if (!isSmallScreen) {
      setIsCollapsed(defaultCollapsed);
      setCollapsedSize(navCollapsedSize);
      setMinSize(defaultMinSize);
    }
    
    prevWidth.current = currentWidth;
  }, [isSmallScreen, defaultCollapsed, navCollapsedSize, fullPanelCollapse, defaultMinSize, setIsCollapsed, setCollapsedSize, setMinSize, setFullCollapse, panelRef]);
} 