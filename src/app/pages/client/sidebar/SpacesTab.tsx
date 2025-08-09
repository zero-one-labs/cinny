import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Icons } from 'folds';
import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { getSpacesPath } from '../../pathUtils';
import { useSpaces } from '../../../state/hooks/roomList';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { useNavToActivePathAtom } from '../../../state/hooks/navToActivePath';
import { joinPathComponent } from '../../pathUtils';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';

export function SpacesTab() {
  const navigate = useNavigate();
  const mx = useMatrixClient();
  const screenSize = useScreenSizeContext();
  const navToActivePath = useAtomValue(useNavToActivePathAtom());
  const spaces = useSpaces(mx, allRoomsAtom);
  
  // Check if we're currently on the spaces page
  const isSpacesActive = window.location.pathname.includes('/spaces');

  const handleSpacesClick = () => {
    const activePath = navToActivePath.get('spaces');
    if (activePath && screenSize !== ScreenSize.Mobile) {
      navigate(joinPathComponent(activePath));
      return;
    }

    navigate(getSpacesPath());
  };

  return (
    <SidebarItem active={isSpacesActive}>
      <SidebarItemTooltip tooltip="Spaces">
        {(triggerRef) => (
          <SidebarAvatar
            as="button"
            ref={triggerRef}
            outlined
            onClick={handleSpacesClick}
          >
            <Icon src={Icons.Space} filled={isSpacesActive} />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}