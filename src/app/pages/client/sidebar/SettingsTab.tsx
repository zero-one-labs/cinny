import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Text } from 'folds';
import { SidebarItem, SidebarItemTooltip, SidebarAvatar } from '../../../components/sidebar';
import { UserAvatar } from '../../../components/user-avatar';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../../utils/matrix';
import { nameInitials } from '../../../utils/common';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { getSettingsPath } from '../../pathUtils';

export function SettingsTab() {
  const navigate = useNavigate();
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const userId = mx.getUserId()!;
  const profile = useUserProfile(userId);

  const displayName = profile.displayName ?? getMxIdLocalPart(userId) ?? userId;
  const avatarUrl = profile.avatarUrl
    ? mxcUrlToHttp(mx, profile.avatarUrl, useAuthentication, 96, 96, 'crop') ?? undefined
    : undefined;

  // Check if we're currently on the settings page
  const isSettingsActive = window.location.pathname.includes('/settings');

  const openSettings = () => navigate(getSettingsPath());

  return (

    <SidebarItem active={settings}>
      <SidebarItemTooltip tooltip="User Settings">
        {(triggerRef) => (
          <SidebarAvatar as="button" ref={triggerRef} onClick={openSettings}>
            <UserAvatar
              userId={userId}
              src={avatarUrl}
              renderFallback={() => <Text size="H4">{nameInitials(displayName)}</Text>}
            />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}
