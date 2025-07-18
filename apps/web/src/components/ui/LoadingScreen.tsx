import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Caricamento...", 
  showLogo = true 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {showLogo && (
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">W</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">WikiGaiaLab</h2>
          </div>
        )}
        
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-gray-700">{message}</span>
        </div>
        
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export const AuthLoadingScreen: React.FC = () => {
  return (
    <LoadingScreen 
      message="Verifico le tue credenziali..." 
      showLogo={true}
    />
  );
};

export const AppLoadingScreen: React.FC = () => {
  return (
    <LoadingScreen 
      message="Caricamento dell'applicazione..." 
      showLogo={true}
    />
  );
};