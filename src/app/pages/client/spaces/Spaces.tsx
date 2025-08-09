import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Icon,
  Icons,
  Text,
} from 'folds';
import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { useSpaces } from '../../../state/hooks/roomList';
import { PageNav, PageNavContent, PageNavHeader } from '../../../components/page';
import {
  NavCategory,
  NavItem,
  NavLink,
  NavItemContent,
  NavEmptyCenter,
  NavEmptyLayout,
} from '../../../components/nav';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { openCreateRoom } from '../../../../client/action/navigation';
import { getSpacePath } from '../../pathUtils';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { factoryRoomIdByActivity } from '../../../utils/sort';
import { RoomNavItem } from '../../../features/room-nav';
import { EnhancedSpaceItem } from '../../../components/enhanced-space-item';
import * as css from '../home/Home.css';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';

function SpacesEmpty() {
  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Circle} />}
        title={
          <Text size="H5" align="Center">
            No Spaces Yet
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            Join or create spaces to organize your conversations.
          </Text>
        }
        options={
          <Button onClick={() => openCreateRoom(true)} variant="Secondary" size="300">
            <Text size="B300" truncate>
              Create Space
            </Text>
          </Button>
        }
      />
    </NavEmptyCenter>
  );
}

export function Spaces() {
  const mx = useMatrixClient();
  const navigate = useNavigate();
  useNavToActivePathMapper('spaces');
  const scrollRef = useRef<HTMLDivElement>(null);
  const allRooms = useAtomValue(allRoomsAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const spaces = useSpaces(mx, allRoomsAtom);
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  
  const selectedRoomId = useSelectedRoom();
  const noSpacesToDisplay = spaces.length === 0;
  
  const sortedSpaces = useMemo(() => {
    return Array.from(spaces).sort(factoryRoomIdByActivity(mx));
  }, [mx, spaces]);

  const handleCreateSpace = () => {
    openCreateRoom(true);
  };

  const getSpacePathForRoom = (spaceId: string) => {
    const canonicalId = getCanonicalAliasOrRoomId(mx, spaceId);
    const path = getSpacePath(canonicalId);
    
    return path;
  };

  return (
    <PageNav>
      <PageNavHeader>
        <Box alignItems="Center" grow="Yes" gap="300">
          <Box grow="Yes">
            <Text size="H4" truncate>
              Spaces
            </Text>
          </Box>
        </Box>
      </PageNavHeader>
      {noSpacesToDisplay ? (
        <SpacesEmpty />
      ) : (
        <PageNavContent scrollRef={scrollRef}>
          <Box direction="Column" gap="300">
            <NavCategory>
              <NavItem variant="Background" radii="400">
                <Button onClick={handleCreateSpace} variant="Secondary" fill="Soft" style={{ width: '100%' }}>
                  <NavItemContent>
                    <Box as="span" grow="Yes" alignItems="Center" gap="200">
                      <Avatar size="200" radii="400">
                        <Icon src={Icons.Plus} size="100" />
                      </Avatar>
                      <Box as="span" grow="Yes">
                        <Text as="span" size="Inherit" truncate>
                          Create New Space
                        </Text>
                      </Box>
                    </Box>
                  </NavItemContent>
                </Button>
              </NavItem>
            </NavCategory>
            <NavCategory>
              {sortedSpaces.map((spaceId) => {
                const space = mx.getRoom(spaceId);
                if (!space) return null;
                const selected = selectedRoomId === spaceId;

                return (
                  <EnhancedSpaceItem
                    key={spaceId}
                    space={space}
                    selected={selected}
                    showAvatar
                    linkPath={getSpacePathForRoom(spaceId)}
                    className={css.homeRoomItem}
                    avatarClassName={css.homeRoomAvatar}
                    homeLayout={true}
                    homeCss={css}
                    notificationMode={getRoomNotificationMode(
                      notificationPreferences,
                      space.roomId
                    )}
                  />
                );
              })}
            </NavCategory>
          </Box>
        </PageNavContent>
      )}
    </PageNav>
  );
}