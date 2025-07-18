'use client';

import React, { useState, useEffect } from 'react';
import { generatePerformanceReport } from '../../lib/performance-monitor';

interface PerformanceMetrics {
  startupTime: number;
  authInitTime: number;
  apiResponseTime: number;
  bundleSize: number;
  memoryUsage: number;
  improvements: {
    [key: string]: {
      before: number;
      after: number;
      improvement: number;
      unit: string;
    };
  };
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Generate performance report after component mounts
    setTimeout(() => {
      const report = generatePerformanceReport();
      setMetrics(report.report.summary as PerformanceMetrics);
    }, 1000);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceStatus = (value: number, threshold: number): string => {
    if (value <= threshold * 0.5) return 'excellent';
    if (value <= threshold) return 'good';
    if (value <= threshold * 1.5) return 'fair';
    return 'poor';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!metrics) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
        <div className="text-sm text-gray-600">Collecting performance metrics...</div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setShowDashboard(!showDashboard)}
        className="mb-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        🚀 Performance
      </button>

      {/* Dashboard */}
      {showDashboard && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xl max-w-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Performance Metrics</h3>
          
          <div className="space-y-3">
            {/* Startup Time */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Startup Time</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                getStatusColor(getPerformanceStatus(metrics.startupTime, 3000))
              }`}>
                {metrics.startupTime.toFixed(0)}ms
              </span>
            </div>

            {/* Auth Initialization */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Auth Init</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                getStatusColor(getPerformanceStatus(metrics.authInitTime, 1000))
              }`}>
                {metrics.authInitTime.toFixed(0)}ms
              </span>
            </div>

            {/* API Response Time */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">API Response</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                getStatusColor(getPerformanceStatus(metrics.apiResponseTime, 500))
              }`}>
                {metrics.apiResponseTime.toFixed(0)}ms
              </span>
            </div>

            {/* Bundle Size */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Bundle Size</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                getStatusColor(getPerformanceStatus(metrics.bundleSize, 1000000))
              }`}>
                {formatBytes(metrics.bundleSize)}
              </span>
            </div>

            {/* Memory Usage */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Memory</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                getStatusColor(getPerformanceStatus(metrics.memoryUsage, 50000000))
              }`}>
                {formatBytes(metrics.memoryUsage)}
              </span>
            </div>
          </div>

          {/* Improvements Section */}
          {metrics.improvements && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Improvements</h4>
              <div className="space-y-2">
                {Object.entries(metrics.improvements).map(([key, improvement]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 capitalize">{key}</span>
                    <span className={`text-xs font-medium ${
                      improvement.improvement > 0 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {improvement.improvement > 0 ? '+' : ''}{improvement.improvement.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                <span className="text-gray-600">Excellent</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
                <span className="text-gray-600">Good</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-100 rounded mr-2"></div>
                <span className="text-gray-600">Fair</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
                <span className="text-gray-600">Poor</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;