import { style } from '@vanilla-extract/css';
import { config } from 'folds';

export const filterPillsContainer = style({
  display: 'flex',
  flexDirection: 'row',
  gap: config.space.S200,
  flexWrap: 'wrap',
  marginBottom: config.space.S400, // Changed from paddingBottom S100 to marginBottom S400 for consistent spacing
  paddingLeft: '3px', // Add 3px left padding to align with search bar
});

export const filterPill = style({
  borderRadius: '50px', // Fully circular end caps (pill shape)
  padding: `${config.space.S100} ${config.space.S300}`,
  fontSize: config.fontSize.T300,
  fontWeight: config.fontWeight.W500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: '1px solid transparent',
  
  selectors: {
    '&[data-active="false"]': {
      backgroundColor: 'transparent',
      color: 'var(--tc-surface-normal)',
      border: '1px solid var(--bg-surface-border)', // Light border for deselected state
    },
    '&[data-active="true"]': {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--tc-primary-high)',
      border: '1px solid var(--bg-primary)',
    },
    '&[data-active="false"]:hover': {
      backgroundColor: 'var(--bg-surface-hover)',
      borderColor: 'var(--bg-surface-border)',
    },
    '&[data-active="true"]:hover': {
      backgroundColor: 'var(--bg-primary-hover)',
    },
  },
});

export const searchContainer = style({
  marginTop: '10px', // Adjusted to align text baseline with spaces icon bottom
  marginBottom: config.space.S400, // Increased spacing from S300 to S400 (16px to 24px)
  paddingLeft: '3px', // Add 3px left padding to align with sidebar icons
});

export const searchInput = style({
  width: '100%',
  borderRadius: '50px', // Fully circular end caps (pill shape)
  border: '1px solid var(--bg-surface-border)',
  minHeight: '42px', // Increase height by a few pixels
  display: 'flex',
  alignItems: 'center', // Center the text vertically within the input
});

// Enhanced room item styling for Home page
export const homeRoomItem = style({
  minHeight: '72px', // Increased significantly to accommodate larger avatars and better spacing
  padding: `${config.space.S200} 0`, // Add vertical padding
});

export const homeRoomAvatar = style({
  width: '56px', // Much larger avatar to match inspiration
  height: '56px', // Much larger avatar to match inspiration
});

export const homeRoomContent = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start', // Align content to top
  justifyContent: 'flex-start',
  gap: config.space.S50, // Small gap between name and message
});

export const homeRoomName = style({
  fontWeight: config.fontWeight.W600, // Bold text for room names
  fontSize: '17px', // Increased by 1px from B400 (16px to 17px)
  lineHeight: 1.2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
});

export const homeRoomMessage = style({
  fontSize: config.fontSize.T300,
  color: 'var(--tc-surface-low)', // Slightly muted color for messages
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
});

export const homeRoomMeta = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: config.space.S100,
  minWidth: 'fit-content',
});

export const homeRoomTime = style({
  fontSize: config.fontSize.T200,
  color: 'var(--tc-surface-low)',
  whiteSpace: 'nowrap',
});