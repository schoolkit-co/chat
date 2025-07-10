/**
 * Utility functions for the Artifacts component
 */

/**
 * Returns the appropriate overflow class based on screen width
 * Adds overflow-x-auto class when on mobile devices (< 768px)
 * @returns {string} CSS class string
 */
export const getArtifactOverflowClass = (): string => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return 'overflow-x-auto';
  }
  return '';
}; 