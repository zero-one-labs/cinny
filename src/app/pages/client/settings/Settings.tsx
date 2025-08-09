import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsComponent } from '../../../features/settings';

export function Settings() {
  const navigate = useNavigate();
  
  // For full page settings, we provide a requestClose that navigates back
  const handleRequestClose = () => {
    navigate(-1);
  };

  return <SettingsComponent requestClose={handleRequestClose} />;
}