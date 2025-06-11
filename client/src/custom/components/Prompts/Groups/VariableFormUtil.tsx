/**
 * Utility functions for the VariableForm component
 */

/**
 * Closes the sidepanel by finding and clicking the close button, but only on mobile devices
 * Mobile detection is based on screen width (< 768px is considered mobile)
 * returns {boolean} True if the sidepanel was successfully closed, false otherwise
 */
export const closeSidePanel = (): boolean => {
  // Only close on mobile devices (< 768px width)
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    try {
      const closePanelButton = document.querySelector('button[aria-label="Close right side panel"]');
      if (closePanelButton) {
        (closePanelButton as HTMLButtonElement).click();
        return true;
      }
    } catch (e) {
      console.error('Failed to close side panel:', e);
    }
  }
  return false;
};
