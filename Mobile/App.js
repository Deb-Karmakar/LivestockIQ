// Mobile/App.js
import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import { SyncProvider } from './src/contexts/SyncContext';
import OfflineBanner from './src/components/OfflineBanner';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <NetworkProvider>
            <SyncProvider>
              <OfflineBanner />
              <AppNavigator />
            </SyncProvider>
          </NetworkProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
