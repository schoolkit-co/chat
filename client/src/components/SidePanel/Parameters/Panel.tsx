import { RotateCcw } from 'lucide-react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  excludedKeys,
  paramSettings,
  getSettingsKeys,
  SettingDefinition,
  tConvoUpdateSchema,
} from 'librechat-data-provider';
import type { TPreset } from 'librechat-data-provider';
import { SaveAsPresetDialog } from '~/components/Endpoints';
import { useSetIndexOptions, useLocalize } from '~/hooks';
import { useGetEndpointsQuery } from '~/data-provider';
import { getEndpointField, logger } from '~/utils';
import { componentMapping } from './components';
import { useChatContext } from '~/Providers';
import keyBy from 'lodash/keyBy';
import axios from 'axios';

export default function Parameters() {
  const localize = useLocalize();
  const { conversation, setConversation } = useChatContext();
  const { setOption } = useSetIndexOptions();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preset, setPreset] = useState<TPreset | null>(null);
  const [defaultMaxContextTokens, setDefaultMaxContextTokens] = useState<number | ''>('');

  const { data: endpointsConfig = {} } = useGetEndpointsQuery();
  const provider = conversation?.endpoint ?? '';
  const model = conversation?.model ?? '';

  const bedrockRegions = useMemo(() => {
    return endpointsConfig?.[conversation?.endpoint ?? '']?.availableRegions ?? [];
  }, [endpointsConfig, conversation?.endpoint]);

  const endpointType = useMemo(
    () => getEndpointField(endpointsConfig, conversation?.endpoint, 'type'),
    [conversation?.endpoint, endpointsConfig],
  );

  const parameters = useMemo((): SettingDefinition[] => {
    const customParams = endpointsConfig[provider]?.customParams ?? {};
    const [combinedKey, endpointKey] = getSettingsKeys(endpointType ?? provider, model);
    const overriddenEndpointKey = customParams.defaultParamsEndpoint ?? endpointKey;
    const defaultParams = paramSettings[combinedKey] ?? paramSettings[overriddenEndpointKey] ?? [];
    const overriddenParams = endpointsConfig[provider]?.customParams?.paramDefinitions ?? [];
    const overriddenParamsMap = keyBy(overriddenParams, 'key');
    return defaultParams.map(
      (param) => (overriddenParamsMap[param.key] as SettingDefinition) ?? param,
    );
  }, [endpointType, endpointsConfig, model, provider]);

  // Fetch maxContextTokens from API when component mounts
  useEffect(() => {
    (async function() {
      try {
        const response = await axios.get('/api/custom-presets/max-context');
        setDefaultMaxContextTokens(response.data?.maxContextTokens ? Number(response.data.maxContextTokens) : '');
      } catch (error) {
        logger.error('Failed to fetch maxContextTokens:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!parameters) {
      return;
    }

    // const defaultValueMap = new Map();
    // const paramKeys = new Set(
    //   parameters.map((setting) => {
    //     if (setting.default != null) {
    //       defaultValueMap.set(setting.key, setting.default);
    //     }
    //     return setting.key;
    //   }),
    // );
    const paramKeys = new Set(parameters.map((setting) => setting.key));
    setConversation((prev) => {
      if (!prev) {
        return prev;
      }

      const updatedConversation = { ...prev };

      const conversationKeys = Object.keys(updatedConversation);
      const updatedKeys: string[] = [];
      conversationKeys.forEach((key) => {
        // const defaultValue = defaultValueMap.get(key);
        // if (paramKeys.has(key) && defaultValue != null && prev[key] != null) {
        //   updatedKeys.push(key);
        //   updatedConversation[key] = defaultValue;
        //   return;
        // }

        if (paramKeys.has(key)) {
          return;
        }

        if (excludedKeys.has(key)) {
          return;
        }

        if (prev[key] != null) {
          updatedKeys.push(key);
          delete updatedConversation[key];
        }
      });

      logger.log('parameters', 'parameters effect, updated keys:', updatedKeys);

      return updatedConversation;
    });
  }, [parameters, setConversation]);

  const resetParameters = useCallback(() => {
    setConversation((prev) => {
      if (!prev) {
        return prev;
      }

      const updatedConversation = { ...prev };
      const resetKeys: string[] = [];

      Object.keys(updatedConversation).forEach((key) => {
        if (excludedKeys.has(key)) {
          return;
        }

        // ถ้าเป็น maxContextTokens และมีค่า defaultMaxContextTokens ให้ใช้ค่า defaultMaxContextTokens แทนค่าว่าง
        if (key === 'maxContextTokens' && defaultMaxContextTokens) {
          resetKeys.push(key);
          updatedConversation[key] = Number(defaultMaxContextTokens);
          return;
        }

        if (updatedConversation[key] !== undefined) {
          resetKeys.push(key);
          delete updatedConversation[key];
        }
      });

      logger.log('parameters', 'parameters reset, affected keys:', resetKeys);
      return updatedConversation;
    });
  }, [setConversation, defaultMaxContextTokens]);

  const openDialog = useCallback(() => {
    const newPreset = tConvoUpdateSchema.parse({
      ...conversation,
    }) as TPreset;
    setPreset(newPreset);
    setIsDialogOpen(true);
  }, [conversation]);

  if (!parameters) {
    return null;
  }

  return (
    <div className="h-auto max-w-full overflow-x-hidden p-3">
      <div className="grid grid-cols-2 gap-4">
        {' '}
        {/* This is the parent element containing all settings */}
        {/* Below is an example of an applied dynamic setting, each be contained by a div with the column span specified */}
        {parameters.map((setting) => {
          const Component = componentMapping[setting.component];
          if (!Component) {
            return null;
          }
          const { key, default: defaultValue, ...rest } = setting;

          if (key === 'region' && bedrockRegions.length) {
            rest.options = bedrockRegions;
          }

          // ถ้าเป็น maxContextTokens และมี defaultMaxContextTokens ให้ใช้เป็นค่าเริ่มต้น
          if (key === 'maxContextTokens' && !conversation?.[key] && defaultMaxContextTokens) {
            rest.placeholder = defaultMaxContextTokens;
            
            // ใช้ setOption เพื่อตั้งค่า defaultMaxContextTokens เมื่อ Input field ว่างเปล่า
            const originalSetOption = setOption;
            const wrappedSetOption = (settingKey: string) => {
              return (value: any) => {
                if ((value === null || value === undefined || value === '') && settingKey === 'maxContextTokens' && defaultMaxContextTokens) {
                  return originalSetOption(settingKey)(String(defaultMaxContextTokens));
                }
                return originalSetOption(settingKey)(value);
              };
            };
            
            return (
              <Component
                key={key}
                settingKey={key}
                defaultValue={defaultValue}
                {...rest}
                setOption={wrappedSetOption}
                conversation={conversation}
              />
            );
          }

          return (
            <Component
              key={key}
              settingKey={key}
              defaultValue={defaultValue}
              {...rest}
              setOption={setOption}
              conversation={conversation}
            />
          );
        })}
      </div>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={resetParameters}
          className="btn btn-neutral flex w-full items-center justify-center gap-2 px-4 py-2 text-sm"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {localize('com_ui_reset_var', { 0: localize('com_ui_model_parameters') })}
        </button>
      </div>
      <div className="mt-2 flex justify-center">
        <button
          onClick={openDialog}
          className="btn btn-primary focus:shadow-outline flex w-full items-center justify-center px-4 py-2 font-semibold text-white hover:bg-green-600 focus:border-green-500"
          type="button"
        >
          {localize('com_endpoint_save_as_preset')}
        </button>
      </div>
      {preset && (
        <SaveAsPresetDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} preset={preset} />
      )}
    </div>
  );
}
