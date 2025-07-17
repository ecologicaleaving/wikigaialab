'use client';

import React from 'react';
import { useAuth, useUserStats } from '../../hooks/useAuth';
import { AuthenticatedLayout } from '../../components/layout';
import Link from 'next/link';
import { TrendingUp, Users, Award, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { totalVotes, totalProblems, subscriptionStatus, memberSince } = useUserStats();

  if (!user) return null;

  const displayName = user.name || user.email || 'Utente';

  return (
    <AuthenticatedLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Benvenuto, {displayName}!
          </h2>
          <p className="text-gray-600">
            Ecco una panoramica della tua attività nella comunità WikiGaiaLab.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Voti Espressi"
            value={totalVotes}
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="Problemi Proposti"
            value={totalProblems}
            icon={Users}
            color="green"
          />
          <StatsCard
            title="Stato Abbonamento"
            value={subscriptionStatus === 'active' ? 'Attivo' : 'Gratuito'}
            icon={Award}
            color={subscriptionStatus === 'active' ? 'purple' : 'gray'}
          />
          <StatsCard
            title="Membro da"
            value={memberSince ? new Date(memberSince).toLocaleDateString('it-IT') : 'N/A'}
            icon={Calendar}
            color="indigo"
          />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            title="Proponi una Soluzione"
            description="Condividi la tua idea per risolvere un problema globale"
            href="/problems/new"
            buttonText="Inizia"
          />
          <ActionCard
            title="Vota le Proposte"
            description="Supporta le migliori idee della comunità"
            href="/problems"
            buttonText="Vota"
          />
          <ActionCard
            title="Esplora la Comunità"
            description="Scopri cosa stanno facendo gli altri membri"
            href="/community"
            buttonText="Esplora"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Attività Recente
          </h3>
          <div className="text-center py-8">
            <p className="text-gray-500">
              Nessuna attività recente. Inizia partecipando alla comunità!
            </p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'gray';
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colorClasses[color]}`}>
          <Icon size={16} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  buttonText: string;
}

function ActionCard({ title, description, href, buttonText }: ActionCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
      >
        {buttonText}
      </Link>
    </div>
  );
}