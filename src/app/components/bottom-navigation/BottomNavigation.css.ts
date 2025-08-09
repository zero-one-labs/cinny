import { style } from '@vanilla-extract/css';
import { config } from 'folds';

export const bottomNavigation = style({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: `calc(56px + env(safe-area-inset-bottom))`,
  paddingBottom: 'env(safe-area-inset-bottom)',
  background: 'var(--bg-surface)',
  borderTop: '1px solid var(--bg-surface-border)',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'space-around',
  zIndex: 100,
});

export const bottomNavItem = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${config.space.S100} ${config.space.S200}`,
  textDecoration: 'none',
  color: 'var(--tc-surface-normal)',
  position: 'relative',
  transition: 'all 0.2s ease',
  
  selectors: {
    '&.active': {
      color: 'var(--tc-primary)',
    },
  },
});

export const bottomNavItemActive = style({
  color: 'var(--tc-primary)',
});

export const bottomNavIconWrapper = style({
  position: 'relative',
});

export const bottomNavBadge = style({
  position: 'absolute',
  top: -4,
  right: -8,
  minWidth: 18,
  height: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-danger)',
  color: 'var(--tc-primary-high)',
  borderRadius: 9,
  fontSize: 10,
  fontWeight: 600,
  padding: '0 4px',
});

export const clientLayoutMobile = style({
  paddingBottom: `calc(56px + env(safe-area-inset-bottom))`,
});