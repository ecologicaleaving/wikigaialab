'use client';

import React, { useState, useEffect } from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAuth } from '@/hooks/useAuth';
import { PremiumFeature } from './PremiumFeature';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BoltIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'technical' | 'account' | 'feature' | 'billing' | 'other';
  created_at: string;
  updated_at: string;
  responses?: SupportResponse[];
  estimated_response_time?: string;
}

interface SupportResponse {
  id: string;
  message: string;
  from_admin: boolean;
  created_at: string;
  admin_name?: string;
}

export function PremiumPrioritySupport() {
  const { accessData } = usePremiumAccess();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    if (accessData?.canAccessPremium) {
      loadSupportTickets();
    } else {
      setLoading(false);
    }
  }, [accessData]);

  const loadSupportTickets = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from API
      // const response = await fetch('/api/support/tickets');
      
      // Simulated data
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          title: 'Problema con il caricamento delle analisi',
          description: 'Le mie analisi premium non si caricano correttamente da ieri.',
          priority: 'high',
          status: 'in_progress',
          category: 'technical',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_response_time: '2 ore',
          responses: [
            {
              id: '1',
              message: 'Ciao! Stiamo investigando il problema. Ti terremo aggiornato.',
              from_admin: true,
              admin_name: 'Marco - Support Team',
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          id: '2',
          title: 'Richiesta nuova funzionalità per le notifiche',
          description: 'Sarebbe possibile aggiungere notifiche personalizzate per categoria?',
          priority: 'medium',
          status: 'resolved',
          category: 'feature',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_response_time: '24 ore'
        }
      ];
      
      setTickets(mockTickets);
    } catch (error) {
      console.error('Failed to load support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: Partial<SupportTicket>) => {
    try {
      // In real app: await fetch('/api/support/tickets', { method: 'POST', ... })
      
      const newTicket: SupportTicket = {
        id: Date.now().toString(),
        title: ticketData.title || '',
        description: ticketData.description || '',
        priority: ticketData.priority || 'medium',
        status: 'open',
        category: ticketData.category || 'other',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_response_time: getEstimatedResponseTime(ticketData.priority || 'medium')
      };

      setTickets(prev => [newTicket, ...prev]);
      setShowNewTicketForm(false);
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const getEstimatedResponseTime = (priority: string): string => {
    switch (priority) {
      case 'urgent': return '30 minuti';
      case 'high': return '2 ore';
      case 'medium': return '24 ore';
      case 'low': return '48 ore';
      default: return '24 ore';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return BoltIcon;
      case 'account': return InformationCircleIcon;
      case 'feature': return StarIcon;
      case 'billing': return DocumentTextIcon;
      default: return ChatBubbleLeftRightIcon;
    }
  };

  return (
    <PremiumFeature
      requiredVotes={5}
      feature="Supporto Prioritario"
      fallback={
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 text-center">
          <PhoneIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Supporto Prioritario Premium
          </h3>
          <p className="text-gray-600 mb-6">
            Accedi a supporto dedicato con tempi di risposta garantiti e canali privilegiati
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
            <div className="flex items-start gap-3">
              <ClockIcon className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Risposta Rapida</h4>
                <p className="text-sm text-gray-600">Tempi di risposta garantiti entro 2 ore</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <VideoCameraIcon className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Supporto Dedicato</h4>
                <p className="text-sm text-gray-600">Chat, email e videochiamate su richiesta</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StarIcon className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Priorità Massima</h4>
                <p className="text-sm text-gray-600">I tuoi ticket hanno priorità assoluta</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DocumentTextIcon className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Documentazione Premium</h4>
                <p className="text-sm text-gray-600">Guide avanzate e best practices</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Richiede almeno 5 voti per essere sbloccato
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
              Supporto Prioritario
            </h2>
            <p className="text-gray-600">
              Supporto dedicato con tempi di risposta garantiti per utenti premium
            </p>
          </div>

          <button
            onClick={() => setShowNewTicketForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Nuovo Ticket
          </button>
        </div>

        {/* Support Channels */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Canali di Supporto Premium</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <EnvelopeIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Email Priority</h4>
              <p className="text-sm text-gray-600">Risposta garantita entro 2 ore</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Chat Dedicata</h4>
              <p className="text-sm text-gray-600">Supporto in tempo reale</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <VideoCameraIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Video Assistenza</h4>
              <p className="text-sm text-gray-600">Su appuntamento per casi complessi</p>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">I Tuoi Ticket</h3>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : tickets.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {tickets.map((ticket) => {
                const CategoryIcon = getCategoryIcon(ticket.category);
                
                return (
                  <div
                    key={ticket.id}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <CategoryIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">{ticket.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>#{ticket.id}</span>
                            <span>Creato {new Date(ticket.created_at).toLocaleDateString('it-IT')}</span>
                            {ticket.estimated_response_time && (
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                Risposta entro {ticket.estimated_response_time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status === 'in_progress' ? 'In corso' : 
                             ticket.status === 'resolved' ? 'Risolto' :
                             ticket.status === 'closed' ? 'Chiuso' : 'Aperto'}
                          </span>
                        </div>
                        {ticket.responses && ticket.responses.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {ticket.responses.length} risposta{ticket.responses.length !== 1 ? 'e' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun ticket aperto
              </h3>
              <p className="text-gray-600 mb-4">
                Hai bisogno di aiuto? Crea un nuovo ticket per ricevere supporto prioritario.
              </p>
              <button
                onClick={() => setShowNewTicketForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Crea Primo Ticket
              </button>
            </div>
          )}
        </div>

        {/* Premium Support Benefits */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vantaggi del Supporto Premium</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Tempi di Risposta Garantiti</h4>
                  <p className="text-sm text-gray-600">Priorità urgente: 30 min, Alta: 2 ore, Media: 24 ore</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Supporto Tecnico Avanzato</h4>
                  <p className="text-sm text-gray-600">Accesso diretto agli sviluppatori per problemi complessi</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Canali Privilegiati</h4>
                  <p className="text-sm text-gray-600">Chat dedicata, email priority e video assistenza</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Consultazioni Personalizzate</h4>
                  <p className="text-sm text-gray-600">Sessioni one-to-one per ottimizzare l'uso della piattaforma</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Accesso Beta</h4>
                  <p className="text-sm text-gray-600">Test anticipato di nuove funzionalità con supporto dedicato</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Documentazione Avanzata</h4>
                  <p className="text-sm text-gray-600">Guide dettagliate e best practices esclusive</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketForm && (
        <NewTicketModal
          onClose={() => setShowNewTicketForm(false)}
          onSubmit={createTicket}
        />
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </PremiumFeature>
  );
}

// New Ticket Modal Component
interface NewTicketModalProps {
  onClose: () => void;
  onSubmit: (ticket: Partial<SupportTicket>) => void;
}

function NewTicketModal({ onClose, onSubmit }: NewTicketModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Nuovo Ticket di Supporto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titolo del Problema
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as SupportTicket['category'] }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="technical">Tecnico</option>
                <option value="account">Account</option>
                <option value="feature">Funzionalità</option>
                <option value="billing">Fatturazione</option>
                <option value="other">Altro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorità
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as SupportTicket['priority'] }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Crea Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Ticket Detail Modal Component
interface TicketDetailModalProps {
  ticket: SupportTicket;
  onClose: () => void;
}

function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
            <p className="text-sm text-gray-500">Ticket #{ticket.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900">{ticket.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>Creato: {new Date(ticket.created_at).toLocaleString('it-IT')}</span>
              <span>Aggiornato: {new Date(ticket.updated_at).toLocaleString('it-IT')}</span>
            </div>
          </div>

          {ticket.responses && ticket.responses.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Risposte</h4>
              {ticket.responses.map((response) => (
                <div
                  key={response.id}
                  className={`p-4 rounded-lg ${response.from_admin ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {response.from_admin ? response.admin_name || 'Supporto' : 'Tu'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(response.created_at).toLocaleString('it-IT')}
                    </span>
                  </div>
                  <p className="text-gray-900">{response.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}