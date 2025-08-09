import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  config,
  Icon,
  IconButton,
  Icons,
  IconSrc,
  MenuItem,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Text,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { PageNav, PageNavContent, PageNavHeader } from '../../components/page';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../utils/matrix';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { UserAvatar } from '../../components/user-avatar';
import { nameInitials } from '../../utils/common';
import { UseStateProvider } from '../../components/UseStateProvider';
import { stopPropagation } from '../../utils/keyboard';
import { LogoutDialog } from '../../components/LogoutDialog';
import {
  getSettingsGeneralPath,
  getSettingsAccountPath,
  getSettingsNotificationsPath,
  getSettingsDevicesPath,
  getSettingsEmojisPath,
  getSettingsDeveloperPath,
  getSettingsAboutPath,
} from '../../pages/pathUtils';

type SettingsMenuItem = {
  name: string;
  icon: IconSrc;
  path: string;
};

const useSettingsMenuItems = (): SettingsMenuItem[] =>
  useMemo(
    () => [
      {
        name: 'General',
        icon: Icons.Setting,
        path: getSettingsGeneralPath(),
      },
      {
        name: 'Account',
        icon: Icons.User,
        path: getSettingsAccountPath(),
      },
      {
        name: 'Notifications',
        icon: Icons.Bell,
        path: getSettingsNotificationsPath(),
      },
      {
        name: 'Devices',
        icon: Icons.Monitor,
        path: getSettingsDevicesPath(),
      },
      {
        name: 'Emojis & Stickers',
        icon: Icons.Smile,
        path: getSettingsEmojisPath(),
      },
      {
        name: 'Developer Tools',
        icon: Icons.Terminal,
        path: getSettingsDeveloperPath(),
      },
      {
        name: 'About',
        icon: Icons.Info,
        path: getSettingsAboutPath(),
      },
    ],
    []
  );

type SettingsProps = {
  requestClose: () => void;
};
export function Settings({ requestClose }: SettingsProps) {
  const navigate = useNavigate();
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const userId = mx.getUserId()!;
  const profile = useUserProfile(userId);
  const displayName = profile.displayName ?? getMxIdLocalPart(userId) ?? userId;
  const avatarUrl = profile.avatarUrl
    ? mxcUrlToHttp(mx, profile.avatarUrl, useAuthentication, 96, 96, 'crop') ?? undefined
    : undefined;

  const screenSize = useScreenSizeContext();
  const menuItems = useSettingsMenuItems();

  return (
    <PageNav>
      <PageNavHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Avatar size="200" radii="300">
            <UserAvatar
              userId={userId}
              src={avatarUrl}
              renderFallback={() => <Text size="H6">{nameInitials(displayName)}</Text>}
            />
          </Avatar>
          <Text size="H4" truncate>
            Settings
          </Text>
        </Box>
        <Box shrink="No">
          {screenSize === ScreenSize.Mobile && (
            <IconButton onClick={requestClose} variant="Background">
              <Icon src={Icons.Cross} />
            </IconButton>
          )}
        </Box>
      </PageNavHeader>
      <Box grow="Yes" direction="Column">
        <PageNavContent>
          <div style={{ flexGrow: 1 }}>
            {menuItems.map((item) => (
              <MenuItem
                key={item.name}
                variant="Background"
                radii="400"
                before={<Icon src={item.icon} size="100" />}
                onClick={() => navigate(item.path)}
              >
                <Text size="T300" truncate>
                  {item.name}
                </Text>
              </MenuItem>
            ))}
          </div>
        </PageNavContent>
        <Box style={{ padding: config.space.S200 }} shrink="No" direction="Column">
          <UseStateProvider initial={false}>
            {(logout, setLogout) => (
              <>
                <Button
                  size="300"
                  variant="Critical"
                  fill="None"
                  radii="Pill"
                  before={<Icon src={Icons.Power} size="100" />}
                  onClick={() => setLogout(true)}
                >
                  <Text size="B400">Logout</Text>
                </Button>
                {logout && (
                  <Overlay open backdrop={<OverlayBackdrop />}>
                    <OverlayCenter>
                      <FocusTrap
                        focusTrapOptions={{
                          onDeactivate: () => setLogout(false),
                          clickOutsideDeactivates: true,
                          escapeDeactivates: stopPropagation,
                        }}
                      >
                        <LogoutDialog handleClose={() => setLogout(false)} />
                      </FocusTrap>
                    </OverlayCenter>
                  </Overlay>
                )}
              </>
            )}
          </UseStateProvider>
        </Box>
      </Box>
    </PageNav>
  );
}
