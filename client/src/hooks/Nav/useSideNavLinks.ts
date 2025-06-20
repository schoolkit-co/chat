import { useMemo } from 'react';
import { MessageSquareQuote, ArrowRightToLine, Settings2, Database, Bookmark, LayoutDashboard } from 'lucide-react';
import {
  isAssistantsEndpoint,
  isAgentsEndpoint,
  PermissionTypes,
  isParamEndpoint,
  EModelEndpoint,
  Permissions,
} from 'librechat-data-provider';
import type { TInterfaceConfig, TEndpointsConfig } from 'librechat-data-provider';
import type { NavLink } from '~/common';
import AgentPanelSwitch from '~/components/SidePanel/Agents/AgentPanelSwitch';
import BookmarkPanel from '~/components/SidePanel/Bookmarks/BookmarkPanel';
import MemoryViewer from '~/components/SidePanel/Memories/MemoryViewer';
import PanelSwitch from '~/components/SidePanel/Builder/PanelSwitch';
import PromptsAccordion from '~/components/Prompts/PromptsAccordion';
import Parameters from '~/components/SidePanel/Parameters/Panel';
import FilesPanel from '~/components/SidePanel/Files/Panel';
import MCPPanel from '~/components/SidePanel/MCP/MCPPanel';
import { Blocks, AttachmentIcon } from '~/components/svg';
import { useGetStartupConfig } from '~/data-provider';
import MCPIcon from '~/components/ui/MCPIcon';
import { useHasAccess, useAuthContext } from '~/hooks';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import store from '~/store';

export default function useSideNavLinks({
  hidePanel,
  keyProvided,
  endpoint,
  endpointType,
  interfaceConfig,
  endpointsConfig,
}: {
  hidePanel: () => void;
  keyProvided: boolean;
  endpoint?: EModelEndpoint | null;
  endpointType?: EModelEndpoint | null;
  interfaceConfig: Partial<TInterfaceConfig>;
  endpointsConfig: TEndpointsConfig;
}) {
  const hasAccessToPrompts = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });
  const hasAccessToBookmarks = useHasAccess({
    permissionType: PermissionTypes.BOOKMARKS,
    permission: Permissions.USE,
  });
  const hasAccessToMemories = useHasAccess({
    permissionType: PermissionTypes.MEMORIES,
    permission: Permissions.USE,
  });
  const hasAccessToReadMemories = useHasAccess({
    permissionType: PermissionTypes.MEMORIES,
    permission: Permissions.READ,
  });
  const hasAccessToAgents = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.USE,
  });
  const hasAccessToCreateAgents = useHasAccess({
    permissionType: PermissionTypes.AGENTS,
    permission: Permissions.CREATE,
  });
  const { data: startupConfig } = useGetStartupConfig();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const usageEnabled = useRecoilValue(store.usageEnabled);

  const Links = useMemo(() => {
    const links: NavLink[] = [];

    // ถ้า usageEnabled เป็น false ให้แสดงเฉพาะปุ่ม Dashboard, Bookmark และปุ่มซ่อนแผง
    if (!usageEnabled) {
      // Dashboard buttons (admin/school) when usageEnabled is false
      if (user?.role === 'ADMIN' && usageEnabled) {
        links.push({
          title: 'com_ui_dashboard',
          label: 'Admin',
          icon: LayoutDashboard,
          id: 'admin-dashboard',
          onClick: () => navigate('/d/admin'),
        });
      } else if (user?.schoolAdmin === true) {
        links.push({
          title: 'com_ui_dashboard',
          label: 'School',
          icon: LayoutDashboard,
          id: 'school-dashboard',
          onClick: () => navigate('/d/school'),
        });
      }

      // Bookmark button
      if (hasAccessToBookmarks) {
        links.push({
          title: 'com_sidepanel_conversation_tags',
          label: '',
          icon: Bookmark,
          id: 'bookmarks',
          Component: BookmarkPanel,
        });
      }

      // Toggle panel button (always show)
      links.push({
        title: 'com_sidepanel_hide_panel',
        label: '',
        icon: ArrowRightToLine,
        onClick: hidePanel,
        id: 'hide-panel',
      });

      return links;
    }

    // Normal behavior when usageEnabled is true
    if (
      isAssistantsEndpoint(endpoint) &&
      ((endpoint === EModelEndpoint.assistants &&
        endpointsConfig?.[EModelEndpoint.assistants] &&
        endpointsConfig[EModelEndpoint.assistants].disableBuilder !== true) ||
        (endpoint === EModelEndpoint.azureAssistants &&
          endpointsConfig?.[EModelEndpoint.azureAssistants] &&
          endpointsConfig[EModelEndpoint.azureAssistants].disableBuilder !== true)) &&
      keyProvided
    ) {
      links.push({
        title: 'com_sidepanel_assistant_builder',
        label: '',
        icon: Blocks,
        id: 'assistants',
        Component: PanelSwitch,
      });
    }

    if (
      endpointsConfig?.[EModelEndpoint.agents] &&
      hasAccessToAgents &&
      hasAccessToCreateAgents &&
      endpointsConfig[EModelEndpoint.agents].disableBuilder !== true
    ) {
      links.push({
        title: 'com_sidepanel_agent_builder',
        label: '',
        icon: Blocks,
        id: 'agents',
        Component: AgentPanelSwitch,
      });
    }

    // Dashboard buttons (admin/school) when usageEnabled is true
    if (user?.role === 'ADMIN') {
      links.push({
        title: 'com_ui_dashboard',
        label: 'Admin',
        icon: LayoutDashboard,
        id: 'admin-dashboard',
        onClick: () => navigate('/d/admin'),
      });
    } else if (user?.schoolAdmin === true) {
      links.push({
        title: 'com_ui_dashboard',
        label: 'School',
        icon: LayoutDashboard,
        id: 'school-dashboard',
        onClick: () => navigate('/d/school'),
      });
    }

    if (hasAccessToPrompts) {
      links.push({
        title: 'com_ui_prompts',
        label: '',
        icon: MessageSquareQuote,
        id: 'prompts',
        Component: PromptsAccordion,
      });
    }

    if (hasAccessToMemories && hasAccessToReadMemories) {
      links.push({
        title: 'com_ui_memories',
        label: '',
        icon: Database,
        id: 'memories',
        Component: MemoryViewer,
      });
    }

    if (
      interfaceConfig.parameters === true &&
      isParamEndpoint(endpoint ?? '', endpointType ?? '') === true &&
      !isAgentsEndpoint(endpoint) &&
      keyProvided
    ) {
      links.push({
        title: 'com_sidepanel_parameters',
        label: '',
        icon: Settings2,
        id: 'parameters',
        Component: Parameters,
      });
    }

    links.push({
      title: 'com_sidepanel_attach_files',
      label: '',
      icon: AttachmentIcon,
      id: 'files',
      Component: FilesPanel,
    });

    if (hasAccessToBookmarks) {
      links.push({
        title: 'com_sidepanel_conversation_tags',
        label: '',
        icon: Bookmark,
        id: 'bookmarks',
        Component: BookmarkPanel,
      });
    }

    if (
      startupConfig?.mcpServers &&
      Object.values(startupConfig.mcpServers).some(
        (server) => server.customUserVars && Object.keys(server.customUserVars).length > 0,
      )
    ) {
      links.push({
        title: 'com_nav_setting_mcp',
        label: '',
        icon: MCPIcon,
        id: 'mcp-settings',
        Component: MCPPanel,
      });
    }

    links.push({
      title: 'com_sidepanel_hide_panel',
      label: '',
      icon: ArrowRightToLine,
      onClick: hidePanel,
      id: 'hide-panel',
    });

    return links;
  }, [
    endpointsConfig,
    interfaceConfig.parameters,
    keyProvided,
    endpointType,
    endpoint,
    hasAccessToAgents,
    hasAccessToPrompts,
    hasAccessToMemories,
    hasAccessToReadMemories,
    hasAccessToBookmarks,
    hasAccessToCreateAgents,
    hidePanel,
    startupConfig,
    user,
    navigate,
    usageEnabled,
  ]);

  return Links;
}
