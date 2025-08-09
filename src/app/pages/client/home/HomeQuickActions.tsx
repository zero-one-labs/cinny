import React, { useMemo, useRef } from 'react';
import {
  Avatar,
  Box,
  Icon,
  IconButton,
  Icons,
  Text,
  config,
} from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAtomValue } from 'jotai';
import { factoryRoomIdByActivity } from '../../../utils/sort';
import {
  NavButton,
  NavCategory,
  NavItem,
  NavItemContent,
  NavLink,
} from '../../../components/nav';
import { getDirectRoomPath } from '../../pathUtils';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { useDirectRooms } from '../direct/useDirectRooms';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavItem } from '../../../features/room-nav';
import { PageNav, PageNavContent, PageNavHeader } from '../../../components/page';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { openCreateRoom, openJoinAlias, openInviteUser } from '../../../../client/action/navigation';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { useNavigate } from 'react-router-dom';
import { getHomePath } from '../../pathUtils';

function QuickActionsHeader() {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(getHomePath());
  };

  return (
    <PageNavHeader>
      <Box alignItems="Center" grow="Yes" gap="300">
        <IconButton
          onClick={handleBackClick}
          variant="Background"  
          fill="None"
          size="300"
          radii="300"
          aria-label="Back to Home"
        >
          <Icon src={Icons.ArrowLeft} size="100" />
        </IconButton>
        <Box grow="Yes">
          <Text size="H4" truncate>
            Quick Actions
          </Text>
        </Box>
      </Box>
    </PageNavHeader>
  );
}

export function HomeQuickActions() {
  const mx = useMatrixClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const directRooms = useDirectRooms();
  const selectedRoomId = useSelectedRoom();
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  const roomToUnread = useAtomValue(roomToUnreadAtom);

  // Sort direct rooms by activity (most recent first)
  const sortedDirectRooms = useMemo(() => {
    return Array.from(directRooms).sort(factoryRoomIdByActivity(mx));
  }, [mx, directRooms]);

  const roomsVirtualizer = useVirtualizer({
    count: sortedDirectRooms.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  return (
    <PageNav>
      <QuickActionsHeader />
      <PageNavContent scrollRef={scrollRef}>
        <Box direction="Column" gap="300">
          <NavCategory>
            <NavItem variant="Background" radii="400">
              <NavButton onClick={() => openCreateRoom()}>
                <NavItemContent>
                  <Box as="span" grow="Yes" alignItems="Center" gap="200">
                    <Avatar size="200" radii="Pill">
                      <Icon src={Icons.Plus} size="100" />
                    </Avatar>
                    <Box as="span" grow="Yes">
                      <Text as="span" size="Inherit" truncate>
                        Create Room
                      </Text>
                    </Box>
                  </Box>
                </NavItemContent>
              </NavButton>
            </NavItem>
            <NavItem variant="Background" radii="400">
              <NavButton onClick={() => openJoinAlias()}>
                <NavItemContent>
                  <Box as="span" grow="Yes" alignItems="Center" gap="200">
                    <Avatar size="200" radii="Pill">
                      <Icon src={Icons.Link} size="100" />
                    </Avatar>
                    <Box as="span" grow="Yes">
                      <Text as="span" size="Inherit" truncate>
                        Join with Address
                      </Text>
                    </Box>
                  </Box>
                </NavItemContent>
              </NavButton>
            </NavItem>
            <NavItem variant="Background" radii="400">
              <NavButton onClick={() => openInviteUser()}>
                <NavItemContent>
                  <Box as="span" grow="Yes" alignItems="Center" gap="200">
                    <Avatar size="200" radii="Pill">
                      <Icon src={Icons.User} size="100" />
                    </Avatar>
                    <Box as="span" grow="Yes">
                      <Text as="span" size="Inherit" truncate>
                        Create Direct Message
                      </Text>
                    </Box>
                  </Box>
                </NavItemContent>
              </NavButton>
            </NavItem>
          </NavCategory>

          {sortedDirectRooms.length > 0 && (
            <>
              <Box direction="Column" gap="100">
                <Text size="H6" priority="300">
                  Recent Direct Messages
                </Text>
              </Box>
              <NavCategory>
                <div
                  style={{
                    position: 'relative',
                    height: roomsVirtualizer.getTotalSize(),
                  }}
                >
                  {roomsVirtualizer.getVirtualItems().map((vItem) => {
                    const roomId = sortedDirectRooms[vItem.index];
                    if (!roomId) return null;
                    
                    const room = mx.getRoom(roomId);
                    if (!room) return null;
                    
                    const selected = selectedRoomId === roomId;
                    const linkPath = getDirectRoomPath(getCanonicalAliasOrRoomId(mx, roomId));

                    return (
                      <VirtualTile
                        virtualItem={vItem}
                        key={vItem.index}
                        ref={roomsVirtualizer.measureElement}
                      >
                        <RoomNavItem
                          room={room}
                          selected={selected}
                          showAvatar
                          direct
                          linkPath={linkPath}
                          notificationMode={getRoomNotificationMode(
                            notificationPreferences,
                            room.roomId
                          )}
                        />
                      </VirtualTile>
                    );
                  })}
                </div>
              </NavCategory>
            </>
          )}

          {sortedDirectRooms.length === 0 && (
            <Box style={{ padding: config.space.S400, textAlign: 'center' }}>
              <Text size="T300" priority="300">
                No direct messages yet. Start a conversation!
              </Text>
            </Box>
          )}
        </Box>
      </PageNavContent>
    </PageNav>
  );
}