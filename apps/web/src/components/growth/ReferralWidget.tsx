/**
 * Referral Widget Component
 * Story 4.5: Community Growth Tools
 * Widget for displaying and managing user referrals
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  recentReferrals: any[];
  shareUrls: {
    direct: string;
    email: string;
    social: string;
  };
}

interface ReferralWidgetProps {
  userId: string;
  compact?: boolean;
  className?: string;
}

export function ReferralWidget({ userId, compact = false, className = '' }: ReferralWidgetProps) {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/referrals?user_id=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      } else {
        console.error('Failed to fetch referral data');
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async (url: string) => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy referral link:', error);
    } finally {
      setCopying(false);
    }
  };

  const shareToSocial = (platform: string) => {
    if (!referralData) return;

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out WikiGaiaLab - help solve community problems!')}&url=${encodeURIComponent(referralData.shareUrls.social)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralData.shareUrls.social)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralData.shareUrls.social)}`,
      email: `mailto:?subject=${encodeURIComponent('Join WikiGaiaLab')}&body=${encodeURIComponent(`Hi! I think you'd be interested in WikiGaiaLab - a platform for solving community problems. Join using my referral link: ${referralData.shareUrls.email}`)}`
    };

    const url = urls[platform as keyof typeof urls];
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (!referralData) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-600">
          <p>Unable to load referral data</p>
          <Button 
            onClick={fetchReferralData}
            variant="outline"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Invita Amici</h3>
            <p className="text-sm text-gray-600">
              {referralData.successfulReferrals} inviti riusciti
            </p>
          </div>
          <Button
            onClick={() => copyReferralLink(referralData.shareUrls.direct)}
            disabled={copying}
            size="sm"
          >
            {copied ? 'Copiato!' : copying ? 'Copiando...' : 'Condividi'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-semibold">Invita Amici su WikiGaiaLab</h2>
          <p className="text-gray-600 mt-1">
            Guadagna ricompense per ogni amico che porti nella community
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{referralData.totalReferrals}</div>
            <div className="text-sm text-gray-600">Inviti Totali</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{referralData.successfulReferrals}</div>
            <div className="text-sm text-gray-600">Riusciti</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{referralData.pendingReferrals}</div>
            <div className="text-sm text-gray-600">In Attesa</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{referralData.totalRewards}</div>
            <div className="text-sm text-gray-600">Punti Guadagnati</div>
          </div>
        </div>

        {/* Referral Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Il Tuo Codice Invito
          </label>
          <div className="flex">
            <input
              type="text"
              value={referralData.referralCode}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 font-mono text-sm"
            />
            <Button
              onClick={() => copyReferralLink(referralData.shareUrls.direct)}
              disabled={copying}
              className="rounded-l-none"
            >
              {copied ? 'Copiato!' : copying ? 'Copiando...' : 'Copia Link'}
            </Button>
          </div>
        </div>

        {/* Social Sharing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Condividi il Tuo Invito
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => shareToSocial('twitter')}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              <span>Twitter</span>
            </Button>
            
            <Button
              onClick={() => shareToSocial('facebook')}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </Button>
            
            <Button
              onClick={() => shareToSocial('linkedin')}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>LinkedIn</span>
            </Button>
            
            <Button
              onClick={() => shareToSocial('email')}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span>Email</span>
            </Button>
          </div>
        </div>

        {/* Recent Referrals */}
        {referralData.recentReferrals.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Inviti Recenti</h3>
            <div className="space-y-2">
              {referralData.recentReferrals.slice(0, 5).map((referral, index) => (
                <div key={referral.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-sm">
                      {referral.referee?.name || 'Registrazione in attesa'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {referral.status === 'completed' ? (
                      <span className="text-green-600 font-medium">Iscritto!</span>
                    ) : referral.clicked_at ? (
                      <span className="text-yellow-600">Cliccato</span>
                    ) : (
                      <span className="text-gray-400">Inviato</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900">Come Funziona</h3>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>• Condividi il tuo link di invito con gli amici</li>
            <li>• Quando si iscrivono e votano, entrambi guadagnate punti</li>
            <li>• Sblocca ricompense e funzionalità premium</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}