import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Icon, Icons, Text, IconSrc } from 'folds';
import { useAtomValue } from 'jotai';
import { useRoomsUnread } from '../../state/hooks/unread';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { roomToUnreadAtom } from '../../state/room/roomToUnread';
import { UnreadBadge } from '../unread-badge';
import { getHomePath, getInboxPath, getSpacesPath, getSettingsPath } from '../../pages/pathUtils';

import * as css from './BottomNavigation.css';

type NavItemProps = {
  icon: IconSrc;
  label: string;
  to: string;
  badge?: React.ReactNode;
};

function NavItem({ icon, label, to, badge }: NavItemProps) {
  // Helper function to safely call icon with filled parameter
  const getIconSrc = (iconFn: IconSrc, filled: boolean) => {
    try {
      // Try calling the icon function with filled parameter
      return iconFn(filled);
    } catch (error) {
      // If that fails, try calling without parameter (for icons that don't support filled)
      try {
        return iconFn();
      } catch (fallbackError) {
        console.warn('Icon function failed:', error, fallbackError);
        return iconFn;
      }
    }
  };

  return (
    <NavLink to={to} className={({ isActive }) => `${css.bottomNavItem} ${isActive ? css.bottomNavItemActive : ''}`}>
      {({ isActive }) => (
        <>
          <Box className={css.bottomNavIconWrapper} direction="Column" alignItems="Center" gap="100">
            <Icon 
              size="300" 
              src={() => getIconSrc(icon, isActive)}
            />
            {badge && <div className={css.bottomNavBadge}>{badge}</div>}
          </Box>
          <Text 
            size="T200" 
            weight={isActive ? 'Medium' : 'Regular'}
            style={{ color: isActive ? 'var(--tc-primary)' : 'var(--tc-surface-normal)' }}
          >
            {label}
          </Text>
        </>
      )}
    </NavLink>
  );
}

export function BottomNavigation() {
  const allRooms = useAtomValue(allRoomsAtom);
  const unread = useRoomsUnread(allRooms, roomToUnreadAtom);
  
  return (
    <Box className={css.bottomNavigation} shrink="No">
      <NavItem
        icon={Icons.Home}
        label="Home"
        to={getHomePath()}
      />
      <NavItem
        icon={Icons.Space}
        label="Spaces"
        to={getSpacesPath()}
      />
      <NavItem
        icon={Icons.Bell}
        label="Activity"
        to={getInboxPath()}
        badge={unread && (unread.highlight > 0 || unread.total > 0) && (
          <UnreadBadge highlight={unread.highlight > 0} count={unread.total} />
        )}
      />
      <NavItem
        icon={Icons.Setting}
        label="Settings"
        to={getSettingsPath()}
      />
    </Box>
  );
}