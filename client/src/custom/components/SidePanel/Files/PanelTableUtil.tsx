import { type TFile } from 'librechat-data-provider';
import { type ChatFormValues } from '~/common';
import type { FormContextValue } from '~/Providers/CustomFormContext';

export const handleImageClick = (
  fileData: TFile,
  methods: FormContextValue<ChatFormValues>,
) => {
  if (fileData.type?.startsWith('image/')) {
    const baseUrl = window.location.origin;
    const fullPath = `${baseUrl}${fileData.filepath}`;
    
    // Get current text value
    const currentText = methods.getValues('text') || '';
    
    // Split by newline and filter out empty lines
    const urls = currentText.split('\n').filter(url => url.trim());
    
    // Check if URL already exists
    if (!urls.includes(fullPath)) {
      // Add new URL with newline if there's existing content
      const newText = currentText ? `${currentText}\n${fullPath}` : fullPath;
      methods.setValue('text', newText, { shouldValidate: true });
    }
    
    return true;
  }
  return false;
}; 