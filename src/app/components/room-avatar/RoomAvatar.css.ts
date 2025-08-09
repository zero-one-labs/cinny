import { style } from '@vanilla-extract/css';
import { color } from 'folds';

export const RoomAvatar = style({
  backgroundColor: color.Secondary.Container,
  color: color.Secondary.OnContainer,
  textTransform: 'capitalize',
  overflow: 'hidden',

  selectors: {
    '&[data-image-loaded="true"]': {
      backgroundColor: 'transparent',
    },
    '&[data-circular="true"]': {
      borderRadius: '50%',
    },
    '&[data-circular="false"]': {
      borderRadius: '8px', // Squircle (R400)
    },
  },
});
