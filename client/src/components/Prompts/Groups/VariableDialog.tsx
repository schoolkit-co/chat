import React, { useMemo } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { TPromptGroup } from 'librechat-data-provider';
import { OGDialog, OGDialogTitle, OGDialogContent } from '~/components/ui';
import { detectVariables } from '~/utils';
import VariableForm from './VariableForm';

interface VariableDialogProps extends Omit<DialogPrimitive.DialogProps, 'onOpenChange'> {
  onClose: () => void;
  group: TPromptGroup | null;
  onSavePromptHistory?: (groupId: string) => Promise<string[]|[]>;
}

const VariableDialog: React.FC<VariableDialogProps> = ({ open, onClose, group, onSavePromptHistory }) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const hasVariables = useMemo(
    () => detectVariables(group?.productionPrompt?.prompt ?? ''),
    [group?.productionPrompt?.prompt],
  );
  if (!group) {
    return null;
  }

  if (!hasVariables) {
    return null;
  }

  return (
    <OGDialog open={open} onOpenChange={handleOpenChange}>
      <OGDialogContent className="max-h-[90vh] max-w-full overflow-y-auto bg-white dark:border-gray-700 dark:bg-gray-850 dark:text-gray-300 md:max-w-[60vw]">
        <OGDialogTitle>{group.name}</OGDialogTitle>
        <VariableForm group={group} onClose={onClose} onSavePromptHistory={onSavePromptHistory} />
      </OGDialogContent>
    </OGDialog>
  );
};

export default VariableDialog;
