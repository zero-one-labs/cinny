import React, { forwardRef, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  Text,
  config,
  toRem,
  Input,
  Line,
} from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAtom, useAtomValue } from 'jotai';
import { factoryRoomIdByActivity, factoryRoomIdByAtoZ } from '../../../utils/sort';
import {
  NavButton,
  NavCategory,
  NavCategoryHeader,
  NavEmptyCenter,
  NavEmptyLayout,
  NavItem,
  NavItemContent,
  NavLink,
} from '../../../components/nav';
import { getExplorePath, getHomeRoomPath, getHomeSearchPath, getDirectRoomPath, getHomeCreatePath } from '../../pathUtils';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { useHomeSearchSelected } from '../../../hooks/router/useHomeSelected';
import { useHomeRooms } from './useHomeRooms';
import { useDirectRooms } from '../direct/useDirectRooms';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavCategoryButton, RoomNavItem } from '../../../features/room-nav';
import { EnhancedRoomItem } from '../../../components/enhanced-room-item';
import { makeNavCategoryId } from '../../../state/closedNavCategories';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useCategoryHandler } from '../../../hooks/useCategoryHandler';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { openCreateRoom, openJoinAlias, openInviteUser } from '../../../../client/action/navigation';
import { PageNav, PageNavHeader, PageNavContent } from '../../../components/page';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { markAsRead } from '../../../../client/action/notifications';
import { useClosedNavCategoriesAtom } from '../../../state/hooks/closedNavCategories';
import { stopPropagation } from '../../../utils/keyboard';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import * as css from './Home.css';

type HomeMenuProps = {
  requestClose: () => void;
};
const HomeMenu = forwardRef<HTMLDivElement, HomeMenuProps>(({ requestClose }, ref) => {
  const orphanRooms = useHomeRooms();
  const directRooms = useDirectRooms();
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const orphanUnread = useRoomsUnread(orphanRooms, roomToUnreadAtom);
  const directUnread = useRoomsUnread(directRooms, roomToUnreadAtom);
  const mx = useMatrixClient();

  const handleMarkAsRead = () => {
    if (!orphanUnread && !directUnread) return;
    orphanRooms.forEach((rId) => markAsRead(mx, rId, hideActivity));
    directRooms.forEach((rId) => markAsRead(mx, rId, hideActivity));
    requestClose();
  };

  const handleJoinAddress = () => {
    openJoinAlias();
    requestClose();
  };

  return (
    <Menu ref={ref} style={{ minWidth: toRem(200) }}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S200 }}>
        <MenuItem
          onClick={handleMarkAsRead}
          size="300"
          after={<Icon size="100" src={Icons.CheckTwice} />}
          radii="300"
          aria-disabled={!orphanUnread && !directUnread}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Mark as Read
          </Text>
        </MenuItem>
        <MenuItem
          onClick={handleJoinAddress}
          size="300"
          radii="300"
          after={<Icon size="100" src={Icons.Link} />}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Join with Address
          </Text>
        </MenuItem>
      </Box>
    </Menu>
  );
});

type HomeHeaderProps = {
  showQuickActions: boolean;
  onToggleQuickActions: () => void;
  onBackToHome: () => void;
};

function HomeHeader({ showQuickActions, onToggleQuickActions, onBackToHome }: HomeHeaderProps) {
  if (showQuickActions) {
    return (
      <PageNavHeader>
        <Box alignItems="Center" grow="Yes" gap="300">
          <IconButton
            onClick={onBackToHome}
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
              New Chat
            </Text>
          </Box>
        </Box>
      </PageNavHeader>
    );
  }

  return (
    <PageNavHeader>
      <Box alignItems="Center" grow="Yes" gap="300">
        <Box grow="Yes">
          <Text size="H4" truncate>
            Home
          </Text>
        </Box>
        <IconButton
          onClick={onToggleQuickActions}
          variant="Primary"
          fill="Solid"
          size="300"
          radii="Pill"
          aria-label="New Chat"
        >
          <Icon src={Icons.Plus} size="100" />
        </IconButton>
      </Box>
    </PageNavHeader>
  );
}

function HomeEmpty() {
  const navigate = useNavigate();

  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Hash} />}
        title={
          <Text size="H5" align="Center">
            No Rooms
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            You do not have any rooms yet.
          </Text>
        }
        options={
          <>
            <Button onClick={() => openCreateRoom()} variant="Secondary" size="300">
              <Text size="B300" truncate>
                Create Room
              </Text>
            </Button>
            <Button
              onClick={() => navigate(getExplorePath())}
              variant="Secondary"
              fill="Soft"
              size="300"
            >
              <Text size="B300" truncate>
                Explore Community Rooms
              </Text>
            </Button>
          </>
        }
      />
    </NavEmptyCenter>
  );
}

function QuickActionsContent() {
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
                  const linkPath = getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId));

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
  );
}

type RoomFilter = 'all' | 'unread' | 'dms' | 'groups';

const DEFAULT_CATEGORY_ID = makeNavCategoryId('home', 'room');
const DIRECT_CATEGORY_ID = makeNavCategoryId('home', 'direct');

export function Home() {
  const mx = useMatrixClient();
  useNavToActivePathMapper('home');
  const scrollRef = useRef<HTMLDivElement>(null);
  const rooms = useHomeRooms();
  const directs = useDirectRooms();
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  const roomToUnread = useAtomValue(roomToUnreadAtom);
  const screenSize = useScreenSizeContext();

  const selectedRoomId = useSelectedRoom();
  const searchSelected = useHomeSearchSelected();
  const noRoomToDisplay = rooms.length === 0 && directs.length === 0;
  const [closedCategories, setClosedCategories] = useAtom(useClosedNavCategoriesAtom());
  
  // New state for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<RoomFilter>('all');
  
  // State for showing quick actions
  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleToggleQuickActions = () => {
    setShowQuickActions(true);
  };

  const handleBackToHome = () => {
    setShowQuickActions(false);
  };

  // Combine all rooms (rooms + directs) for unified display
  const allRooms = useMemo(() => {
    const roomList = rooms.map(id => ({ id, isDirect: false }));
    const directList = directs.map(id => ({ id, isDirect: true }));
    return [...roomList, ...directList];
  }, [rooms, directs]);

  // Filter and sort rooms based on active filter and search
  const filteredRooms = useMemo(() => {
    let filtered = allRooms;

    // Apply room type filter
    switch (activeFilter) {
      case 'unread':
        filtered = filtered.filter(({ id }) => roomToUnread.has(id));
        break;
      case 'dms':
        filtered = filtered.filter(({ isDirect }) => isDirect);
        break;
      case 'groups':
        filtered = filtered.filter(({ isDirect }) => !isDirect);
        break;
      case 'all':
      default:
        // Show all rooms
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(({ id }) => {
        const room = mx.getRoom(id);
        return room?.name?.toLowerCase().includes(query);
      });
    }

    // Sort by activity
    filtered.sort((a, b) => {
      const roomA = mx.getRoom(a.id);
      const roomB = mx.getRoom(b.id);
      if (!roomA || !roomB) return 0;
      
      const lastEventA = roomA.getLastActiveTimestamp();
      const lastEventB = roomB.getLastActiveTimestamp();
      return lastEventB - lastEventA;
    });

    return filtered;
  }, [allRooms, activeFilter, searchQuery, mx, roomToUnread]);

  const roomsVirtualizer = useVirtualizer({
    count: filteredRooms.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 88, // Increased to 88px (72px minHeight + 16px padding)
    overscan: 10,
  });

  const getUnreadCount = (filterType: RoomFilter) => {
    let count = 0;
    switch (filterType) {
      case 'unread':
        return allRooms.filter(({ id }) => roomToUnread.has(id)).length;
      case 'dms':
        return directs.filter(id => roomToUnread.has(id)).length;
      case 'groups':
        return rooms.filter(id => roomToUnread.has(id)).length;
      case 'all':
      default:
        return [...rooms, ...directs].filter(id => roomToUnread.has(id)).length;
    }
  };

  const renderFilterButton = (filter: RoomFilter, label: string) => {
    const isActive = activeFilter === filter;
    
    return (
      <button
        key={filter}
        onClick={() => setActiveFilter(filter)}
        className={css.filterPill}
        data-active={isActive}
        type="button"
      >
        {label}
      </button>
    );
  };

  if (showQuickActions) {
    return (
      <PageNav>
        <HomeHeader 
          showQuickActions={showQuickActions}
          onToggleQuickActions={handleToggleQuickActions}
          onBackToHome={handleBackToHome}
        />
        <QuickActionsContent />
      </PageNav>
    );
  }

  return (
    <PageNav>
      <HomeHeader 
        showQuickActions={showQuickActions}
        onToggleQuickActions={handleToggleQuickActions}
        onBackToHome={handleBackToHome}
      />
      {noRoomToDisplay ? (
        <HomeEmpty />
      ) : (
        <PageNavContent scrollRef={scrollRef}>
          <Box direction="Column">
            {/* Search input */}
            <div className={css.searchContainer}>
              <Input
                className={css.searchInput}
                variant="Surface"
                size="400"
                radii="400"
                placeholder="Search messages"
                before={<Icon size="100" src={Icons.Search} />}
                value={searchQuery}
                onChange={(evt) => setSearchQuery(evt.target.value)}
              />
            </div>

            {/* Filter pills */}
            <div className={css.filterPillsContainer}>
              {renderFilterButton('all', 'All')}
              {renderFilterButton('unread', 'Unread')}
              {renderFilterButton('dms', 'DMs')}
              {renderFilterButton('groups', 'Groups')}
            </div>

            {/* Room list */}
            <NavCategory>
              <div
                style={{
                  position: 'relative',
                  height: roomsVirtualizer.getTotalSize(),
                }}
              >
                {roomsVirtualizer.getVirtualItems().map((vItem) => {
                  const roomInfo = filteredRooms[vItem.index];
                  if (!roomInfo) return null;
                  
                  const room = mx.getRoom(roomInfo.id);
                  if (!room) return null;
                  
                  const selected = selectedRoomId === roomInfo.id;
                  const linkPath = getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomInfo.id));

                  return (
                    <VirtualTile
                      virtualItem={vItem}
                      key={vItem.index}
                      ref={roomsVirtualizer.measureElement}
                    >
                      <EnhancedRoomItem
                        room={room}
                        selected={selected}
                        showAvatar
                        direct={roomInfo.isDirect}
                        linkPath={linkPath}
                        className={css.homeRoomItem}
                        avatarClassName={css.homeRoomAvatar}
                        homeLayout={true}
                        homeCss={css}
                        notificationMode={getRoomNotificationMode(
                          notificationPreferences,
                          room.roomId
                        )}
                      />
                    </VirtualTile>
                  );
                })}
              </div>
              {filteredRooms.length === 0 && (
                <Box style={{ padding: config.space.S400, textAlign: 'center' }}>
                  <Text size="T300" priority="300">
                    {searchQuery ? 'No rooms found matching your search.' : 'No rooms to display.'}
                  </Text>
                </Box>
              )}
            </NavCategory>
          </Box>
        </PageNavContent>
      )}
    </PageNav>
  );
}
