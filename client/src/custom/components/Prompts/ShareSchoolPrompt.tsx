import React, { useEffect, useMemo } from 'react';
import { Users } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import type {
  TPromptGroup,
  TUpdatePromptGroupPayload,
} from 'librechat-data-provider';
import {
  Button,
  Switch,
  OGDialog,
  OGDialogTitle,
  OGDialogClose,
  OGDialogContent,
  OGDialogTrigger,
} from '~/components/ui';
import { useUpdatePromptGroup } from '~/data-provider';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { useAuthContext } from '~/hooks';

type FormValues = {
  schoolShare: boolean;
};

const ShareSchoolPrompt = ({ group, disabled }: { group?: TPromptGroup; disabled: boolean }) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const updateGroup = useUpdatePromptGroup();
  const { user } = useAuthContext();
  
  // Log user data for debugging
  useEffect(() => {
    console.log('ShareSchoolPrompt - User data:', user);
    console.log('ShareSchoolPrompt - Can share to school:', user?.schoolAdmin === true && user?.school !== undefined && user?.school > 0);
  }, [user]);
  
  // Check if the prompt is already shared with the school
  const isSharedWithSchool = useMemo(
    () => group?.schoolId === user?.school,
    [group, user]
  );

  // Check if user is a school admin and has a school
  const canShareToSchool = useMemo(
    () => user?.schoolAdmin === true && user?.school !== undefined && user?.school > 0,
    [user]
  );

  const {
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      schoolShare: isSharedWithSchool,
    },
  });

  useEffect(() => {
    setValue('schoolShare', isSharedWithSchool);
  }, [isSharedWithSchool, setValue]);

  // If user is not a school admin or doesn't have a school, don't render the component
  if (!canShareToSchool || group == null) {
    return null;
  }

  const onSubmit = (data: FormValues) => {
    const groupId = group._id ?? '';
    if (groupId === '') {
      return;
    }

    if (data.schoolShare === true && isSharedWithSchool) {
      showToast({
        message: localize('com_ui_prompt_already_shared_to_school'),
        status: 'info',
      });
      return;
    }

    // Create the payload for the API
    const payload = {} as TUpdatePromptGroupPayload;
    
    // Use the school-specific endpoint
    const endpoint = `/api/prompts/groups/${groupId}/school`;
    
    if (data.schoolShare === true) {
      payload.schoolShare = true;
    } else {
      payload.removeSchoolShare = true;
    }

    updateGroup.mutate({
      id: groupId,
      payload,
      endpoint,
    });
  };

  return (
    <OGDialog>
      <OGDialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          aria-label="Share prompt with school"
          className="h-10 w-10 border border-transparent bg-green-500/90 p-0.5 transition-all hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-800"
          disabled={disabled}
        >
          <Users className="size-5 cursor-pointer text-white" />
        </Button>
      </OGDialogTrigger>
      <OGDialogContent className="w-11/12 max-w-lg" role="dialog" aria-labelledby="dialog-title">
        <OGDialogTitle id="dialog-title" className="truncate pr-2" title={group.name}>
          {localize('com_ui_share_school_var', { 0: `"${group.name}"` })}
        </OGDialogTitle>
        <form className="p-2" onSubmit={handleSubmit(onSubmit)} aria-describedby="form-description">
          <div id="form-description" className="sr-only">
            {localize('com_ui_share_school_form_description')}
          </div>
          <div className="mb-4 flex items-center justify-between gap-2 py-4">
            <div className="flex items-center" id="share-to-school-users">
              {localize('com_ui_share_to_school_users')}
            </div>
            <Controller
              name="schoolShare"
              control={control}
              disabled={updateGroup.isLoading}
              render={({ field }) => (
                <Switch
                  {...field}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  value={field.value.toString()}
                  aria-labelledby="share-to-school-users"
                />
              )}
            />
          </div>
          <div className="flex justify-end">
            <OGDialogClose asChild>
              <Button
                type="submit"
                disabled={isSubmitting || updateGroup.isLoading}
                variant="submit"
                aria-label={localize('com_ui_save')}
              >
                {localize('com_ui_save')}
              </Button>
            </OGDialogClose>
          </div>
        </form>
      </OGDialogContent>
    </OGDialog>
  );
};

export default ShareSchoolPrompt;