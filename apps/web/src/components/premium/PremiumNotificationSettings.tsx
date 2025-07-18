'use client';

import React, { useState, useEffect } from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { PremiumFeature } from './PremiumFeature';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  TrendingUpIcon as TrendingUpIcon,
  UserGroupIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface NotificationPreference {
  id: string;
  category: 'instant' | 'daily' | 'weekly' | 'trending' | 'personal';
  title: string;
  description: string;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  enabled: boolean;
  premium: boolean;
  frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
  customizable: boolean;
}

export function PremiumNotificationSettings() {
  const { accessData } = usePremiumAccess();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    // In a real app, this would load from API
    const defaultPreferences: NotificationPreference[] = [
      // Free tier notifications
      {
        id: 'problem_voted',
        category: 'personal',
        title: 'I tuoi problemi ricevono voti',
        description: 'Notifica quando qualcuno vota uno dei tuoi problemi',
        channels: { email: true, push: true, sms: false },
        enabled: true,
        premium: false,
        frequency: 'immediate',
        customizable: false
      },
      {
        id: 'weekly_summary',
        category: 'weekly',
        title: 'Riassunto settimanale',
        description: 'Riepilogo della tua attività e dei problemi più votati',
        channels: { email: true, push: false, sms: false },
        enabled: true,
        premium: false,
        frequency: 'weekly',
        customizable: false
      },

      // Premium notifications
      {
        id: 'trending_alerts',
        category: 'trending',
        title: 'Avvisi Problemi in Tendenza',
        description: 'Notifiche in tempo reale sui problemi che stanno diventando virali',
        channels: { email: true, push: true, sms: true },
        enabled: true,
        premium: true,
        frequency: 'immediate',
        customizable: true
      },
      {
        id: 'category_insights',
        category: 'daily',
        title: 'Insights Categorie Preferite',
        description: 'Analisi giornaliere sulle tue categorie di interesse',
        channels: { email: true, push: false, sms: false },
        enabled: false,
        premium: true,
        frequency: 'daily',
        customizable: true
      },
      {
        id: 'expert_recommendations',
        category: 'personal',
        title: 'Raccomandazioni Personalizzate',
        description: 'Problemi selezionati basati sui tuoi pattern di voto',
        channels: { email: true, push: true, sms: false },
        enabled: true,
        premium: true,
        frequency: 'daily',
        customizable: true
      },
      {
        id: 'milestone_achievements',
        category: 'personal',
        title: 'Traguardi e Risultati',
        description: 'Celebra i tuoi successi e milestone nella community',
        channels: { email: true, push: true, sms: false },
        enabled: true,
        premium: true,
        frequency: 'immediate',
        customizable: true
      },
      {
        id: 'smart_voting_reminders',
        category: 'daily',
        title: 'Promemoria Voto Intelligenti',
        description: 'Suggerimenti basati sui tuoi orari di attività ottimali',
        channels: { email: false, push: true, sms: false },
        enabled: false,
        premium: true,
        frequency: 'daily',
        customizable: true
      },
      {
        id: 'community_pulse',
        category: 'weekly',
        title: 'Pulse della Community',
        description: 'Report approfonditi su tendenze e dinamiche della community',
        channels: { email: true, push: false, sms: false },
        enabled: true,
        premium: true,
        frequency: 'weekly',
        customizable: true
      },
      {
        id: 'early_access_alerts',
        category: 'instant',
        title: 'Accesso Anticipato',
        description: 'Prime notifiche su nuove funzionalità e beta test',
        channels: { email: true, push: true, sms: false },
        enabled: true,
        premium: true,
        frequency: 'immediate',
        customizable: false
      }
    ];

    setPreferences(defaultPreferences);
  };

  const handlePreferenceToggle = (id: string, field: keyof NotificationPreference, value: any) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id 
        ? { ...pref, [field]: value }
        : pref
    ));
  };

  const handleChannelToggle = (id: string, channel: keyof NotificationPreference['channels']) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id 
        ? { 
            ...pref, 
            channels: { 
              ...pref.channels, 
              [channel]: !pref.channels[channel] 
            }
          }
        : pref
    ));
  };

  const savePreferences = async () => {
    setSaving(true);
    setSaveStatus('saving');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app: await fetch('/api/user/notification-preferences', { ... })
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'instant': return BellIcon;
      case 'daily': return ClockIcon;
      case 'weekly': return EnvelopeIcon;
      case 'trending': return TrendingUpIcon as TrendingUpIcon;
      case 'personal': return UserGroupIcon;
      default: return InformationCircleIcon;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'instant': return 'Immediate';
      case 'daily': return 'Giornaliere';
      case 'weekly': return 'Settimanali';
      case 'trending': return 'Tendenze';
      case 'personal': return 'Personali';
      default: return 'Altre';
    }
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BellIcon className="w-6 h-6" />
            Notifiche Premium
          </h2>
          <p className="text-gray-600">
            Personalizza le tue notifiche per rimanere aggiornato in modo intelligente
          </p>
        </div>

        <button
          onClick={savePreferences}
          disabled={saving}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            saveStatus === 'saved' 
              ? 'bg-green-100 text-green-800' 
              : saveStatus === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
          }`}
        >
          {saving ? 'Salvataggio...' : 
           saveStatus === 'saved' ? 'Salvato ✓' :
           saveStatus === 'error' ? 'Errore ✗' :
           'Salva Preferenze'}
        </button>
      </div>

      {/* Free vs Premium Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <StarIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">Notifiche Premium Sbloccate</h3>
            <p className="text-sm text-gray-600">
              {accessData?.canAccessPremium 
                ? 'Hai accesso a tutte le notifiche avanzate e alla personalizzazione completa.'
                : 'Vota 5 problemi per sbloccare notifiche intelligenti e personalizzate.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      {Object.entries(groupedPreferences).map(([category, prefs]) => {
        const Icon = getCategoryIcon(category);
        const label = getCategoryLabel(category);
        
        return (
          <div key={category} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
            </div>
            
            <div className="space-y-4">
              {prefs.map(pref => (
                <div key={pref.id} className="border border-gray-100 rounded-lg p-4">
                  <PremiumFeature
                    requiredVotes={pref.premium ? 5 : 0}
                    feature={pref.title}
                    showUpgradePrompt={false}
                    fallback={
                      <div className="opacity-50">
                        <NotificationPreferenceItem 
                          preference={pref}
                          onToggle={() => {}}
                          onChannelToggle={() => {}}
                          disabled={true}
                        />
                      </div>
                    }
                  >
                    <NotificationPreferenceItem
                      preference={pref}
                      onToggle={(field, value) => handlePreferenceToggle(pref.id, field, value)}
                      onChannelToggle={(channel) => handleChannelToggle(pref.id, channel)}
                      disabled={false}
                    />
                  </PremiumFeature>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Channel Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni Canali</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <EnvelopeIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Email</h4>
            <p className="text-sm text-gray-600">Notifiche dettagliate e riepiloghi</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <DevicePhoneMobileIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Push</h4>
            <p className="text-sm text-gray-600">Aggiornamenti immediati</p>
          </div>
          
          <PremiumFeature
            requiredVotes={5}
            feature="SMS Premium"
            showUpgradePrompt={false}
            fallback={
              <div className="text-center p-4 bg-gray-50 rounded-lg opacity-50">
                <DevicePhoneMobileIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h4 className="font-medium text-gray-600">SMS</h4>
                <p className="text-sm text-gray-500">Notifiche urgenti (Premium)</p>
              </div>
            }
          >
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DevicePhoneMobileIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">SMS</h4>
              <p className="text-sm text-gray-600">Notifiche urgenti</p>
            </div>
          </PremiumFeature>
        </div>
      </div>
    </div>
  );
}

interface NotificationPreferenceItemProps {
  preference: NotificationPreference;
  onToggle: (field: keyof NotificationPreference, value: any) => void;
  onChannelToggle: (channel: keyof NotificationPreference['channels']) => void;
  disabled: boolean;
}

function NotificationPreferenceItem({ 
  preference, 
  onToggle, 
  onChannelToggle,
  disabled 
}: NotificationPreferenceItemProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => !disabled && onToggle('enabled', !preference.enabled)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              preference.enabled && !disabled ? 'bg-blue-600' : 'bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preference.enabled && !disabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          
          <div>
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              {preference.title}
              {preference.premium && (
                <StarIcon className="w-4 h-4 text-purple-500" />
              )}
            </h4>
            <p className="text-sm text-gray-600">{preference.description}</p>
          </div>
        </div>

        {preference.enabled && !disabled && (
          <div className="ml-14 space-y-3">
            {/* Frequency Selection */}
            {preference.customizable && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Frequenza
                </label>
                <select
                  value={preference.frequency}
                  onChange={(e) => onToggle('frequency', e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="immediate">Immediato</option>
                  <option value="hourly">Ogni ora</option>
                  <option value="daily">Giornaliero</option>
                  <option value="weekly">Settimanale</option>
                </select>
              </div>
            )}

            {/* Channel Selection */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Canali di notifica
              </label>
              <div className="flex gap-3">
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={preference.channels.email}
                    onChange={() => onChannelToggle('email')}
                    className="mr-1 text-blue-600 rounded"
                  />
                  Email
                </label>
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={preference.channels.push}
                    onChange={() => onChannelToggle('push')}
                    className="mr-1 text-blue-600 rounded"
                  />
                  Push
                </label>
                {preference.premium && (
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={preference.channels.sms}
                      onChange={() => onChannelToggle('sms')}
                      className="mr-1 text-blue-600 rounded"
                    />
                    SMS
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}