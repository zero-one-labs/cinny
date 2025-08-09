import React, { ReactNode } from 'react';
import { Box } from 'folds';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { BottomNavigation } from '../../components/bottom-navigation/BottomNavigation';
import { clientLayoutMobile } from '../../components/bottom-navigation/BottomNavigation.css';

type ClientLayoutProps = {
  nav: ReactNode;
  children: ReactNode;
};
export function ClientLayout({ nav, children }: ClientLayoutProps) {
  const screenSize = useScreenSizeContext();
  
  if (screenSize === ScreenSize.Mobile) {
    return (
      <Box grow="Yes" direction="Column">
        <Box grow="Yes" className={clientLayoutMobile}>
          {children}
        </Box>
        <BottomNavigation />
      </Box>
    );
  }
  
  return (
    <Box grow="Yes">
      <Box shrink="No">{nav}</Box>
      <Box grow="Yes">{children}</Box>
    </Box>
  );
}
