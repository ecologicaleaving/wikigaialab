'use client';

import React, { useState } from 'react';
import { 
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  PaintBrushIcon,
  CircleStackIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'Generale', icon: CogIcon },
    { id: 'security', name: 'Sicurezza', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifiche', icon: BellIcon },
    { id: 'appearance', name: 'Aspetto', icon: PaintBrushIcon },
    { id: 'database', name: 'Database', icon: CircleStackIcon },
    { id: 'system', name: 'Sistema', icon: ServerIcon },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <CogIcon className="w-8 h-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-teal-800">Configurazione del Laboratorio</h1>
            <p className="text-teal-700 font-medium">Impostazioni avanzate di WikiGaiaLab</p>
          </div>
        </div>
        <p className="text-teal-700">
          Configura il funzionamento del laboratorio, dalla sicurezza all'aspetto del sito.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200">
        {activeTab === 'general' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni Generali</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome del Laboratorio
                </label>
                <input
                  type="text"
                  defaultValue="WikiGaiaLab"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  rows={3}
                  defaultValue="Laboratorio Artigiano Digitale per la risoluzione collaborativa dei problemi della comunità"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email di Contatto
                </label>
                <input
                  type="email"
                  defaultValue="info@wikigaialab.org"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="maintenance-mode"
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenance-mode" className="ml-2 block text-sm text-gray-700">
                  Modalità Manutenzione
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni di Sicurezza</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Autenticazione a Due Fattori</h3>
                  <p className="text-sm text-gray-600">Richiede 2FA per tutti gli amministratori</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Moderazione Automatica</h3>
                  <p className="text-sm text-gray-600">Filtra automaticamente contenuti inappropriati</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Rate Limiting</h3>
                  <p className="text-sm text-gray-600">Limita il numero di richieste per utente</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durata Sessione (ore)
                </label>
                <input
                  type="number"
                  defaultValue="24"
                  min="1"
                  max="168"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestione Notifiche</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Notifiche Email</h3>
                  <p className="text-sm text-gray-600">Invia email per eventi importanti</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Digest Settimanale</h3>
                  <p className="text-sm text-gray-600">Riassunto settimanale dell'attività</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Allerte di Moderazione</h3>
                  <p className="text-sm text-gray-600">Notifica contenuti che richiedono moderazione</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personalizzazione Aspetto</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schema Colori
                </label>
                <div className="flex space-x-3">
                  <button className="w-8 h-8 bg-teal-500 rounded-full border-2 border-teal-600"></button>
                  <button className="w-8 h-8 bg-emerald-500 rounded-full border-2 border-gray-300"></button>
                  <button className="w-8 h-8 bg-blue-500 rounded-full border-2 border-gray-300"></button>
                  <button className="w-8 h-8 bg-green-500 rounded-full border-2 border-gray-300"></button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo del Laboratorio
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <PaintBrushIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Carica il logo del laboratorio</p>
                  <button className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                    Seleziona File
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Modalità Scura</h3>
                  <p className="text-sm text-gray-600">Tema scuro per il pannello admin</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestione Database</h2>
            
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CircleStackIcon className="w-5 h-5 text-yellow-600 mr-2" />
                  <h3 className="text-sm font-medium text-yellow-800">Attenzione</h3>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Le operazioni sul database possono essere irreversibili. Procedi con cautela.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium text-gray-900">Backup Database</h3>
                  <p className="text-sm text-gray-600 mt-1">Crea un backup completo</p>
                </button>
                
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium text-gray-900">Ottimizza Tabelle</h3>
                  <p className="text-sm text-gray-600 mt-1">Migliora le performance</p>
                </button>
                
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium text-gray-900">Pulisci Log</h3>
                  <p className="text-sm text-gray-600 mt-1">Rimuovi log vecchi</p>
                </button>
                
                <button className="p-4 border border-red-300 rounded-lg hover:bg-red-50 text-red-700">
                  <h3 className="font-medium">Reset Cache</h3>
                  <p className="text-sm mt-1">Svuota tutte le cache</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Sistema</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Stato Servizi</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cache Redis</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email Service</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Statistiche Server</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">CPU Usage</span>
                      <span className="text-sm text-gray-900">23%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Memory Usage</span>
                      <span className="text-sm text-gray-900">67%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Disk Space</span>
                      <span className="text-sm text-gray-900">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Uptime</span>
                      <span className="text-sm text-gray-900">7d 12h 34m</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Versione Sistema</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">WikiGaiaLab:</span>
                      <span className="ml-2 font-medium">v2.1.0</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Next.js:</span>
                      <span className="ml-2 font-medium">14.0.4</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Node.js:</span>
                      <span className="ml-2 font-medium">18.17.0</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Database:</span>
                      <span className="ml-2 font-medium">PostgreSQL 15.2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Annulla
            </button>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
              Salva Modifiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}