'use client';

import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '../../../components/layout';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  Server, 
  TrendingUp,
  Users,
  Eye,
  Zap,
  RefreshCw
} from 'lucide-react';

interface SystemMetrics {
  timestamp: string;
  application: {
    name: string;
    version: string;
    environment: string;
  };
  database: {
    totalUsers: number;
    totalProblems: number;
    totalVotes: number;
    activeUsers: number;
  };
  performance: {
    responseTime: number;
    votesLastHour: number;
    healthStatus: string;
  };
  system: {
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    nodeVersion: string;
    platform: string;
  };
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/monitoring/alerts?limit=20');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchMetrics(), fetchAlerts()]);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertBadgeColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !metrics) {
    return (
      <AuthenticatedLayout title="Monitoring Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Caricamento metriche...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Monitoring Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Monitoring Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Monitoraggio delle prestazioni e degli avvisi del sistema
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Ultimo aggiornamento: {lastRefresh.toLocaleTimeString('it-IT')}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stato Sistema</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-2xl font-bold">
                  {metrics?.performance.healthStatus || 'Sconosciuto'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Uptime: {metrics ? formatUptime(metrics.system.uptime) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utenti Attivi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.database.activeUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Totale: {metrics?.database.totalUsers || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo di Risposta</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.performance.responseTime || 0}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Media delle API
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voti Recenti</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.performance.votesLastHour || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Ultima ora
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Database & Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database
              </CardTitle>
              <CardDescription>
                Statistiche del database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Problemi</div>
                  <div className="text-2xl font-bold">{metrics?.database.totalProblems || 0}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Voti</div>
                  <div className="text-2xl font-bold">{metrics?.database.totalVotes || 0}</div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm font-medium text-gray-500">Engagement</div>
                <div className="text-sm text-gray-600 mt-1">
                  {metrics?.database.totalVotes && metrics?.database.totalProblems 
                    ? (metrics.database.totalVotes / metrics.database.totalProblems).toFixed(1)
                    : 0} voti per problema
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Sistema
              </CardTitle>
              <CardDescription>
                Metriche di sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Memoria Usata</div>
                  <div className="text-lg font-bold">
                    {metrics ? formatMemory(metrics.system.memory.heapUsed) : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Memoria Totale</div>
                  <div className="text-lg font-bold">
                    {metrics ? formatMemory(metrics.system.memory.heapTotal) : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Utilizzo Memoria</span>
                  <span className="text-sm font-bold">
                    {metrics 
                      ? Math.round((metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${metrics 
                        ? Math.round((metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100)
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Avvisi Recenti
            </CardTitle>
            <CardDescription>
              Ultimi avvisi e notifiche del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Nessun avviso recente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getAlertBadgeColor(alert.type)}>
                            {alert.type}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {alert.source}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(alert.timestamp).toLocaleString('it-IT')}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.message}
                      </p>
                      {alert.metadata && (
                        <div className="mt-2 text-xs text-gray-500">
                          <details className="cursor-pointer">
                            <summary>Dettagli</summary>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(alert.metadata, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Informazioni Applicazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Nome</div>
                <div className="text-lg font-bold">{metrics?.application.name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Versione</div>
                <div className="text-lg font-bold">{metrics?.application.version || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Ambiente</div>
                <div className="text-lg font-bold">{metrics?.application.environment || 'N/A'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}