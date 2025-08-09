import React, { MouseEventHandler, forwardRef, useState, useMemo } from 'react';
import { Room } from 'matrix-js-sdk';
import {
  Avatar,
  Box,
  Icon,
  IconButton,
  Icons,
  Text,
  Menu,
  MenuItem,
  config,
  PopOut,
  toRem,
  Line,
  RectCords,
  Badge,
  Spinner,
} from 'folds';
import { useFocusWithin, useHover } from 'react-aria';
import FocusTrap from 'focus-trap-react';
import { NavItem, NavItemContent, NavItemOptions, NavLink } from '../nav';
import { UnreadBadge, UnreadBadgeCenter } from '../unread-badge';
import { RoomAvatar, RoomIcon } from '../room-avatar';
import { getRoomAvatarUrl } from '../../utils/room';
import { nameInitials } from '../../utils/common';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomUnread } from '../../state/hooks/unread';
import { roomToUnreadAtom } from '../../state/room/roomToUnread';
import { usePowerLevels, usePowerLevelsAPI } from '../../hooks/usePowerLevels';
import { copyToClipboard } from '../../utils/dom';
import { markAsRead } from '../../../client/action/notifications';
import { openInviteUser } from '../../../client/action/navigation';
import { UseStateProvider } from '../UseStateProvider';
import { LeaveRoomPrompt } from '../leave-room-prompt';
import { useRoomTypingMember } from '../../hooks/useRoomTypingMembers';
import { TypingIndicator } from '../typing-indicator';
import { stopPropagation } from '../../utils/keyboard';
import { getMatrixToRoom } from '../../plugins/matrix-to';
import { getCanonicalAliasOrRoomId, isRoomAlias } from '../../utils/matrix';
import { getViaServers } from '../../plugins/via-servers';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { useOpenRoomSettings } from '../../state/hooks/roomSettings';
import { useSpaceOptionally } from '../../hooks/useSpace';
import {
  getRoomNotificationModeIcon,
  RoomNotificationMode,
} from '../../hooks/useRoomsNotificationPreferences';
import { RoomNotificationModeSwitcher } from '../RoomNotificationSwitcher';
import { useRoomLatestRenderedEvent } from '../../hooks/useRoomLatestRenderedEvent';
import { Time } from '../message';
import { useSpaceHierarchy } from '../../hooks/useSpaceHierarchy';
import { StateEvent } from '../../../types/matrix/room';
import { getStateEvents, isValidChild } from '../../utils/room';

type EnhancedSpaceItemMenuProps = {
  space: Room;
  requestClose: () => void;
  notificationMode?: RoomNotificationMode;
};
const EnhancedSpaceItemMenu = forwardRef<HTMLDivElement, EnhancedSpaceItemMenuProps>(
  ({ space, requestClose, notificationMode }, ref) => {
    const mx = useMatrixClient();
    const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
    const unread = useRoomUnread(space.roomId, roomToUnreadAtom);
    const powerLevels = usePowerLevels(space);
    const { getPowerLevel, canDoAction } = usePowerLevelsAPI(powerLevels);
    const canInvite = canDoAction('invite', getPowerLevel(mx.getUserId() ?? ''));
    const openRoomSettings = useOpenRoomSettings();
    const currentSpace = useSpaceOptionally();

    const handleMarkAsRead = () => {
      markAsRead(mx, space.roomId, hideActivity);
      requestClose();
    };

    const handleInvite = () => {
      openInviteUser(space.roomId);
      requestClose();
    };

    const handleCopyLink = () => {
      const roomIdOrAlias = getCanonicalAliasOrRoomId(mx, space.roomId);
      const viaServers = isRoomAlias(roomIdOrAlias) ? undefined : getViaServers(space);
      copyToClipboard(getMatrixToRoom(roomIdOrAlias, viaServers));
      requestClose();
    };

    const handleSpaceSettings = () => {
      openRoomSettings(space.roomId, currentSpace?.roomId);
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
            disabled={!unread}
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Mark as Read
            </Text>
          </MenuItem>
          <RoomNotificationModeSwitcher roomId={space.roomId} value={notificationMode}>
            {(handleOpen, opened, changing) => (
              <MenuItem
                size="300"
                after={
                  changing ? (
                    <Spinner size="100" variant="Secondary" />
                  ) : (
                    <Icon size="100" src={getRoomNotificationModeIcon(notificationMode)} />
                  )
                }
                radii="300"
                aria-pressed={opened}
                onClick={handleOpen}
              >
                <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                  Notifications
                </Text>
              </MenuItem>
            )}
          </RoomNotificationModeSwitcher>
        </Box>
        <Line variant="Surface" size="300" />
        <Box direction="Column" gap="100" style={{ padding: config.space.S200 }}>
          <MenuItem
            onClick={handleInvite}
            variant="Primary"
            fill="None"
            size="300"
            after={<Icon size="100" src={Icons.UserPlus} />}
            radii="300"
            disabled={!canInvite}
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Invite
            </Text>
          </MenuItem>
          <MenuItem
            onClick={handleCopyLink}
            size="300"
            after={<Icon size="100" src={Icons.Link} />}
            radii="300"
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Copy Link
            </Text>
          </MenuItem>
          <MenuItem
            onClick={handleSpaceSettings}
            size="300"
            after={<Icon size="100" src={Icons.Setting} />}
            radii="300"
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Space Settings
            </Text>
          </MenuItem>
        </Box>
        <Line variant="Surface" size="300" />
        <Box direction="Column" gap="100" style={{ padding: config.space.S200 }}>
          <UseStateProvider initial={false}>
            {(promptLeave, setPromptLeave) => (
              <>
                <MenuItem
                  onClick={() => setPromptLeave(true)}
                  variant="Critical"
                  fill="None"
                  size="300"
                  after={<Icon size="100" src={Icons.ArrowGoLeft} />}
                  radii="300"
                  aria-pressed={promptLeave}
                >
                  <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                    Leave Space
                  </Text>
                </MenuItem>
                {promptLeave && (
                  <LeaveRoomPrompt
                    roomId={space.roomId}
                    onDone={requestClose}
                    onCancel={() => setPromptLeave(false)}
                  />
                )}
              </>
            )}
          </UseStateProvider>
        </Box>
      </Menu>
    );
  }
);

const getSenderName = (event: any, room: Room): string => {
  if (!event) return '';
  const senderId = event.getSender();
  if (!senderId) return '';
  
  const member = room.getMember(senderId);
  let displayName = member?.name || member?.rawDisplayName || '';
  
  // Fallback to user ID but clean it up
  if (!displayName) {
    displayName = senderId.split(':')[0].replace('@', '');
  }
  
  return displayName;
};

const getMessagePreview = (event: any): string => {
  if (!event) return '';
  
  const msgType = event.getContent()?.msgtype;
  const body = event.getContent()?.body || '';
  
  switch (msgType) {
    case 'm.image':
      return '📷 Image';
    case 'm.video':
      return '🎥 Video';
    case 'm.audio':
      return '🎵 Audio';
    case 'm.file':
      return '📁 File';
    case 'm.location':
      return '📍 Location';
    default:
      return body.length > 50 ? `${body.substring(0, 50)}...` : body;
  }
};

type EnhancedSpaceItemProps = {
  space: Room;
  selected: boolean;
  linkPath: string;
  notificationMode?: RoomNotificationMode;
  showAvatar?: boolean;
  className?: string;
  avatarClassName?: string;
  homeLayout?: boolean;
  homeCss?: any;
};

export function EnhancedSpaceItem({
  space,
  selected,
  showAvatar,
  notificationMode,
  linkPath,
  className,
  avatarClassName,
  homeLayout = false,
  homeCss,
}: EnhancedSpaceItemProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const [hover, setHover] = useState(false);
  const { hoverProps } = useHover({ onHoverChange: setHover });
  const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setHover });
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();
  const unread = useRoomUnread(space.roomId, roomToUnreadAtom);
  const typingMember = useRoomTypingMember(space.roomId).filter(
    (receipt) => receipt.userId !== mx.getUserId()
  );
  const [hour24Clock] = useSetting(settingsAtom, 'hour24Clock');
  const [dateFormatString] = useSetting(settingsAtom, 'dateFormatString');

  // Get first child room of the space and its latest message
  const { firstRoom, latestEvent, messageWithSender } = useMemo(() => {
    const childEvents = getStateEvents(space, StateEvent.SpaceChild);
    
    // Find first non-space child room
    for (const childEvent of childEvents) {
      if (!isValidChild(childEvent)) continue;
      const childId = childEvent.getStateKey();
      if (!childId) continue;
      
      const childRoom = mx.getRoom(childId);
      if (!childRoom || childRoom.isSpaceRoom()) continue;
      
      // Found a valid child room
      const timeline = childRoom.getLiveTimeline().getEvents();
      const lastEvent = timeline[timeline.length - 1];
      
      // Get message with sender for spaces
      let messageDisplay = '';
      if (lastEvent) {
        const senderName = getSenderName(lastEvent, childRoom);
        const messagePreview = getMessagePreview(lastEvent);
        
        if (messagePreview) {
          messageDisplay = senderName ? `${senderName}: ${messagePreview}` : messagePreview;
        }
      }
      
      return {
        firstRoom: childRoom,
        latestEvent: lastEvent,
        messageWithSender: messageDisplay || 'No messages yet',
      };
    }
    
    return { firstRoom: null, latestEvent: null, messageWithSender: 'No rooms in space' };
  }, [space, mx]);

  const handleContextMenu: MouseEventHandler<HTMLElement> = (evt) => {
    evt.preventDefault();
    setMenuAnchor({
      x: evt.clientX,
      y: evt.clientY,
      width: 0,
      height: 0,
    });
  };

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setMenuAnchor(evt.currentTarget.getBoundingClientRect());
  };

  const optionsVisible = hover || !!menuAnchor;

  return (
    <NavItem
      variant="Background"
      radii="400"
      highlight={unread !== undefined}
      aria-selected={selected}
      data-hover={!!menuAnchor}
      onContextMenu={handleContextMenu}
      {...hoverProps}
      {...focusWithinProps}
    >
      <NavLink to={linkPath}>
        <NavItemContent>
          {homeLayout ? (
            // New home layout design for spaces
            <Box as="span" grow="Yes" alignItems="Stretch" gap="300" className={className} style={{ overflow: 'hidden' }}>
              <Avatar size="300" radii="400" className={avatarClassName} shrink="No">
                {showAvatar ? (
                  <RoomAvatar
                    roomId={space.roomId}
                    src={getRoomAvatarUrl(mx, space, 96, useAuthentication)}
                    alt={space.name}
                    circular={false}
                    renderFallback={() => (
                      <Text as="span" size="H5">
                        {nameInitials(space.name)}
                      </Text>
                    )}
                  />
                ) : (
                  <RoomIcon
                    style={{ opacity: unread ? config.opacity.P500 : config.opacity.P300 }}
                    filled={selected}
                    size="200"
                    joinRule={space.getJoinRule()}
                  />
                )}
              </Avatar>
              
              <Box as="span" grow="Yes" className={homeCss?.homeRoomContent} style={{ minWidth: 0, overflow: 'hidden' }}>
                <Text 
                  as="span" 
                  className={homeCss?.homeRoomName}
                  truncate
                >
                  {space.name}
                </Text>
                <Text 
                  as="span" 
                  className={homeCss?.homeRoomMessage}
                  truncate
                >
                  {messageWithSender}
                </Text>
              </Box>
              
              <Box as="span" className={homeCss?.homeRoomMeta} shrink="No">
                {latestEvent && (
                  <Text as="span" className={homeCss?.homeRoomTime}>
                    <Time 
                      compact 
                      ts={latestEvent.getTs()} 
                      hour24Clock={hour24Clock}
                      dateFormatString={dateFormatString}
                    />
                  </Text>
                )}
                {!optionsVisible && unread && (
                  <UnreadBadge highlight={unread.highlight > 0} count={unread.total} />
                )}
              </Box>
            </Box>
          ) : (
            // Original layout for other pages
            <Box as="span" grow="Yes" alignItems="Center" gap="200" style={{ minHeight: toRem(48) }}>
              <Avatar size="300" radii="400">
                {showAvatar ? (
                  <RoomAvatar
                    roomId={space.roomId}
                    src={getRoomAvatarUrl(mx, space, 96, useAuthentication)}
                    alt={space.name}
                    circular={false}
                    renderFallback={() => (
                      <Text as="span" size="H6">
                        {nameInitials(space.name)}
                      </Text>
                    )}
                  />
                ) : (
                  <RoomIcon
                    style={{ opacity: unread ? config.opacity.P500 : config.opacity.P300 }}
                    filled={selected}
                    size="100"
                    joinRule={space.getJoinRule()}
                  />
                )}
              </Avatar>
              <Box as="span" grow="Yes" direction="Column" gap="50">
                <Box as="span" alignItems="Center" justifyContent="SpaceBetween">
                  <Text priority={unread ? '500' : '300'} as="span" size="B300" truncate>
                    {space.name}
                  </Text>
                  <Box as="span" alignItems="Center" gap="100">
                    {latestEvent && (
                      <Time 
                        compact 
                        ts={latestEvent.getTs()} 
                        hour24Clock={hour24Clock}
                        dateFormatString={dateFormatString}
                      />
                    )}
                    {!optionsVisible && unread && (
                      <UnreadBadgeCenter>
                        <UnreadBadge highlight={unread.highlight > 0} count={unread.total} />
                      </UnreadBadgeCenter>
                    )}
                  </Box>
                </Box>
                <Box as="span" direction="Row" gap="100" alignItems="Center">
                  <Text as="span" size="T300" priority="200" truncate>
                    {messageWithSender}
                  </Text>
                </Box>
              </Box>
              {!optionsVisible && !unread && !selected && typingMember.length > 0 && (
                <Badge size="300" variant="Secondary" fill="Soft" radii="Pill" outlined>
                  <TypingIndicator size="300" disableAnimation />
                </Badge>
              )}
              {!optionsVisible && notificationMode !== RoomNotificationMode.Unset && (
                <Icon size="50" src={getRoomNotificationModeIcon(notificationMode)} />
              )}
            </Box>
          )}
        </NavItemContent>
      </NavLink>
      {optionsVisible && (
        <NavItemOptions>
          <PopOut
            anchor={menuAnchor}
            offset={menuAnchor?.width === 0 ? 0 : undefined}
            alignOffset={menuAnchor?.width === 0 ? 0 : -5}
            position="Bottom"
            align={menuAnchor?.width === 0 ? 'Start' : 'End'}
            content={
              <FocusTrap
                focusTrapOptions={{
                  initialFocus: false,
                  returnFocusOnDeactivate: false,
                  onDeactivate: () => setMenuAnchor(undefined),
                  clickOutsideDeactivates: true,
                  isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
                  isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
                  escapeDeactivates: stopPropagation,
                }}
              >
                <EnhancedSpaceItemMenu
                  space={space}
                  requestClose={() => setMenuAnchor(undefined)}
                  notificationMode={notificationMode}
                />
              </FocusTrap>
            }
          >
            <IconButton
              onClick={handleOpenMenu}
              aria-pressed={!!menuAnchor}
              variant="Background"
              fill="None"
              size="300"
              radii="300"
            >
              <Icon size="50" src={Icons.VerticalDots} />
            </IconButton>
          </PopOut>
        </NavItemOptions>
      )}
    </NavItem>
  );
}