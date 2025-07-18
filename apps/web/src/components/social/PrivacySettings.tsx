/**
 * Privacy Settings Component
 * Story 4.3: User Profiles & Social Features
 * Comprehensive privacy controls and visibility settings for user profiles
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { UserProfile, PrivacySettings as PrivacySettingsType, UserVisibility } from '../../../../../packages/shared/src/types/social';

interface PrivacySettingsProps {
  onSettingsUpdate?: (settings: PrivacySettingsType) => void;
  showAdvanced?: boolean;
}

interface PrivacyState {
  settings: PrivacySettingsType;
  loading: boolean;
  saving: boolean;
  error: string | null;
  hasChanges: boolean;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  onSettingsUpdate,
  showAdvanced = true
}) => {
  const { user } = useAuth();
  
  const [state, setState] = useState<PrivacyState>({
    settings: {
      profile_visibility: 'public',
      activity_visibility: 'public',
      email_visibility: 'private',
      allow_follow: true
    },
    loading: true,
    saving: false,
    error: null,
    hasChanges: false
  });

  useEffect(() => {
    if (user) {
      loadPrivacySettings();
    }
  }, [user]);

  const loadPrivacySettings = () => {
    if (!user) return;

    setState(prev => ({
      ...prev,
      settings: {
        profile_visibility: user.profile_visibility || 'public',
        activity_visibility: user.activity_visibility || 'public',
        email_visibility: user.email_visibility || 'private',
        allow_follow: user.allow_follow !== undefined ? user.allow_follow : true
      },
      loading: false
    }));
  };

  const handleSettingChange = (setting: keyof PrivacySettingsType, value: any) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      },
      hasChanges: true,
      error: null
    }));
  };

  const saveSettings = async () => {
    if (!user) return;

    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(state.settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel salvataggio delle impostazioni');
      }

      setState(prev => ({ ...prev, hasChanges: false }));
      
      if (onSettingsUpdate) {
        onSettingsUpdate(state.settings);
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const resetSettings = () => {
    loadPrivacySettings();
    setState(prev => ({ ...prev, hasChanges: false, error: null }));
  };

  if (state.loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Impostazioni Privacy
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Controlla chi può vedere le tue informazioni e attività
            </p>
          </div>
          
          {state.hasChanges && (
            <div className="flex space-x-3">
              <button
                onClick={resetSettings}
                disabled={state.saving}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={saveSettings}
                disabled={state.saving}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {state.saving ? (
                  <>
                    <LoadingSpinner size="xs" color="white" className="mr-2" />
                    Salvataggio...
                  </>
                ) : (
                  'Salva'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-800">{state.error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setState(prev => ({ ...prev, error: null }))}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Visibility */}
          <PrivacySettingCard
            title="Visibilità Profilo"
            description="Chi può vedere le informazioni del tuo profilo"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            value={state.settings.profile_visibility}
            onChange={(value) => handleSettingChange('profile_visibility', value)}
            options={[
              {
                value: 'public',
                label: 'Pubblico',
                description: 'Tutti possono vedere il tuo profilo'
              },
              {
                value: 'followers_only',
                label: 'Solo Follower',
                description: 'Solo i tuoi follower possono vedere il profilo'
              },
              {
                value: 'private',
                label: 'Privato',
                description: 'Solo tu puoi vedere il tuo profilo'
              }
            ]}
          />

          {/* Activity Visibility */}
          <PrivacySettingCard
            title="Visibilità Attività"
            description="Chi può vedere le tue attività e azioni"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            value={state.settings.activity_visibility}
            onChange={(value) => handleSettingChange('activity_visibility', value)}
            options={[
              {
                value: 'public',
                label: 'Pubblico',
                description: 'Tutti possono vedere le tue attività'
              },
              {
                value: 'followers_only',
                label: 'Solo Follower',
                description: 'Solo i tuoi follower possono vedere le attività'
              },
              {
                value: 'private',
                label: 'Privato',
                description: 'Solo tu puoi vedere le tue attività'
              }
            ]}
          />

          {/* Email Visibility */}
          <PrivacySettingCard
            title="Visibilità Email"
            description="Chi può vedere il tuo indirizzo email"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            value={state.settings.email_visibility}
            onChange={(value) => handleSettingChange('email_visibility', value)}
            options={[
              {
                value: 'private',
                label: 'Privato',
                description: 'Solo tu puoi vedere il tuo email'
              },
              {
                value: 'followers_only',
                label: 'Solo Follower',
                description: 'Solo i tuoi follower possono vedere l\'email'
              },
              {
                value: 'public',
                label: 'Pubblico',
                description: 'Tutti possono vedere il tuo email'
              }
            ]}
          />

          {/* Follow Permission */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="allow_follow"
                  name="allow_follow"
                  type="checkbox"
                  checked={state.settings.allow_follow}
                  onChange={(e) => handleSettingChange('allow_follow', e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="allow_follow" className="font-medium text-gray-700">
                  Permetti di essere seguito
                </label>
                <p className="text-gray-500">
                  Altri utenti possono seguirti per vedere le tue attività pubbliche
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Impostazioni Avanzate
              </h4>
              
              <div className="space-y-4">
                <AdvancedPrivacySetting
                  title="Ricerca del Profilo"
                  description="Il tuo profilo può apparire nei risultati di ricerca"
                  enabled={state.settings.profile_visibility !== 'private'}
                  disabled={state.settings.profile_visibility === 'private'}
                  disabledReason="Il profilo privato non appare mai nelle ricerche"
                />
                
                <AdvancedPrivacySetting
                  title="Suggerimenti di Connessione"
                  description="Il tuo profilo può essere suggerito ad altri utenti"
                  enabled={state.settings.allow_follow && state.settings.profile_visibility !== 'private'}
                  disabled={!state.settings.allow_follow || state.settings.profile_visibility === 'private'}
                  disabledReason="Disabilitato perché non permetti di essere seguito o hai un profilo privato"
                />

                <AdvancedPrivacySetting
                  title="Attività nel Feed"
                  description="Le tue attività possono apparire nel feed degli altri utenti"
                  enabled={state.settings.activity_visibility === 'public'}
                  disabled={state.settings.activity_visibility !== 'public'}
                  disabledReason="Le attività devono essere pubbliche per apparire nei feed"
                />
              </div>
            </div>
          )}

          {/* Privacy Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  Riepilogo Privacy
                </h4>
                <div className="mt-2 text-sm text-blue-700">
                  <PrivacySummary settings={state.settings} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Privacy Setting Card Component
 */
interface PrivacySettingCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: UserVisibility;
  onChange: (value: UserVisibility) => void;
  options: {
    value: UserVisibility;
    label: string;
    description: string;
  }[];
}

const PrivacySettingCard: React.FC<PrivacySettingCardProps> = ({
  title,
  description,
  icon,
  value,
  onChange,
  options
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 text-gray-400">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500 mb-3">{description}</p>
          
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option.value} className="flex items-start">
                <input
                  type="radio"
                  name={title}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                  className="mt-1 focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-500">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Advanced Privacy Setting Component
 */
interface AdvancedPrivacySettingProps {
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

const AdvancedPrivacySetting: React.FC<AdvancedPrivacySettingProps> = ({
  title,
  description,
  enabled,
  disabled = false,
  disabledReason
}) => {
  return (
    <div className={`flex items-start space-x-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center h-5">
        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
          enabled 
            ? 'bg-green-500 border-green-500' 
            : 'bg-gray-200 border-gray-300'
        }`}>
          {enabled && (
            <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700">
          {title}
        </div>
        <div className="text-sm text-gray-500">
          {disabled && disabledReason ? disabledReason : description}
        </div>
      </div>
    </div>
  );
};

/**
 * Privacy Summary Component
 */
const PrivacySummary: React.FC<{ settings: PrivacySettingsType }> = ({ settings }) => {
  const getVisibilityLevel = () => {
    if (settings.profile_visibility === 'private') {
      return 'Il tuo profilo è completamente privato.';
    } else if (settings.profile_visibility === 'followers_only' && settings.activity_visibility === 'followers_only') {
      return 'Il tuo profilo e le attività sono visibili solo ai follower.';
    } else if (settings.profile_visibility === 'public' && settings.activity_visibility === 'public') {
      return 'Il tuo profilo e le attività sono completamente pubblici.';
    } else {
      return 'Hai una configurazione mista di privacy.';
    }
  };

  const getFollowStatus = () => {
    if (!settings.allow_follow) {
      return ' Non permetti di essere seguito.';
    } else if (settings.profile_visibility === 'private') {
      return ' Altri non possono trovarti per seguirti.';
    } else {
      return ' Altri utenti possono seguirti.';
    }
  };

  return (
    <p>
      {getVisibilityLevel()}
      {getFollowStatus()}
      {settings.email_visibility === 'public' && ' Il tuo email è pubblico.'}
    </p>
  );
};

export default PrivacySettings;