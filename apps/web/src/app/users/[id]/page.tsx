/**
 * Public User Profile Page
 * Story 4.3: User Profiles & Social Features
 * Display comprehensive user profile with social features, achievements, and activity
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { UserMenu } from '../../../components/auth/UserMenu';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { UserProfile, UserProfileResponse, UserSocialStats } from '../../../../../packages/shared/src/types/social';
import { useAuth } from '../../../hooks/useAuth';

interface ProfilePageState {
  profile: UserProfile | null;
  socialStats: UserSocialStats | null;
  isOwnProfile: boolean;
  isFollowing: boolean;
  mutualFollowers: number;
  loading: boolean;
  error: string | null;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuth();
  
  const [state, setState] = useState<ProfilePageState>({
    profile: null,
    socialStats: null,
    isOwnProfile: false,
    isFollowing: false,
    mutualFollowers: 0,
    loading: true,
    error: null
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'achievements' | 'followers' | 'following'>('overview');

  useEffect(() => {
    loadUserProfile();
  }, [userId, currentUser]);

  const loadUserProfile = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Get user profile
      const profileUrl = `/api/users/${userId}${currentUser ? `?requesting_user_id=${currentUser.id}` : ''}`;
      const profileResponse = await fetch(profileUrl);
      
      if (!profileResponse.ok) {
        if (profileResponse.status === 403) {
          throw new Error('This profile is private');
        } else if (profileResponse.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to load profile');
      }

      const profileData: UserProfileResponse = await profileResponse.json();

      // Get social stats (separate endpoint for better performance)
      const statsResponse = await fetch(`/api/users/${userId}/stats`);
      let socialStats = null;
      if (statsResponse.ok) {
        socialStats = await statsResponse.json();
      }

      setState(prev => ({
        ...prev,
        profile: profileData.user,
        socialStats,
        isOwnProfile: profileData.isOwnProfile,
        isFollowing: profileData.isFollowing || false,
        mutualFollowers: profileData.mutualFollowers || 0,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || state.isOwnProfile) return;

    try {
      const method = state.isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }

      setState(prev => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        profile: prev.profile ? {
          ...prev.profile,
          total_followers: prev.profile.total_followers + (prev.isFollowing ? -1 : 1)
        } : null
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-20 px-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Errore</h3>
            <p className="mt-1 text-sm text-gray-500">{state.error}</p>
            <div className="mt-6">
              <Link
                href="/community"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Torna alla Comunità
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!state.profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-20 px-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Profilo non disponibile</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Profile Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {state.profile.avatar_url ? (
                      <img
                        src={state.profile.avatar_url}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-medium text-gray-600">
                        {(state.profile.name || state.profile.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {state.profile.name || state.profile.email.split('@')[0]}
                  </h1>
                  {state.profile.bio && (
                    <p className="mt-1 text-gray-600">{state.profile.bio}</p>
                  )}
                  
                  {/* Location and Links */}
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    {state.profile.location && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {state.profile.location}
                      </div>
                    )}
                    
                    {state.profile.website_url && (
                      <a
                        href={state.profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-blue-600"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Sito web
                      </a>
                    )}
                    
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Membro dal {new Date(state.profile.created_at).toLocaleDateString('it-IT')}
                    </div>
                  </div>

                  {/* Interests */}
                  {state.profile.interests && state.profile.interests.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {state.profile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {!state.isOwnProfile && currentUser && (
                  <button
                    onClick={handleFollowToggle}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      state.isFollowing
                        ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {state.isFollowing ? 'Non seguire più' : 'Segui'}
                  </button>
                )}
                
                {state.isOwnProfile && (
                  <Link
                    href="/profile"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Modifica Profilo
                  </Link>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{state.profile.reputation_score}</div>
                <div className="text-sm text-gray-500">Reputazione</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{state.profile.total_followers}</div>
                <div className="text-sm text-gray-500">Follower</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{state.profile.total_following}</div>
                <div className="text-sm text-gray-500">Seguiti</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{state.profile.total_problems_proposed}</div>
                <div className="text-sm text-gray-500">Problemi</div>
              </div>
            </div>

            {/* Mutual followers */}
            {!state.isOwnProfile && state.mutualFollowers > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                Seguito da {state.mutualFollowers} person{state.mutualFollowers === 1 ? 'a' : 'e'} che segui
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Panoramica' },
              { key: 'activity', label: 'Attività' },
              { key: 'achievements', label: 'Achievement' },
              { key: 'followers', label: 'Follower' },
              { key: 'following', label: 'Seguiti' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <ProfileOverview profile={state.profile} socialStats={state.socialStats} />
        )}
        {activeTab === 'activity' && (
          <UserActivityTab userId={userId} currentUserId={currentUser?.id} />
        )}
        {activeTab === 'achievements' && (
          <UserAchievementsTab userId={userId} currentUserId={currentUser?.id} />
        )}
        {activeTab === 'followers' && (
          <UserFollowersTab userId={userId} currentUserId={currentUser?.id} />
        )}
        {activeTab === 'following' && (
          <UserFollowingTab userId={userId} currentUserId={currentUser?.id} />
        )}
      </div>
    </div>
  );
}

// Header Component
const Header: React.FC = () => (
  <header className="bg-white shadow">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">WikiGaiaLab</h1>
          </Link>
          <nav className="hidden md:ml-6 md:flex md:space-x-8">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/problems"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Problemi
            </Link>
            <Link
              href="/community"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Comunità
            </Link>
          </nav>
        </div>
        <UserMenu />
      </div>
    </div>
  </header>
);

// Placeholder components for tab content
const ProfileOverview: React.FC<{ profile: UserProfile; socialStats: UserSocialStats | null }> = ({ profile, socialStats }) => (
  <div className="space-y-6">
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Informazioni</h3>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500">Email</dt>
          <dd className="mt-1 text-sm text-gray-900">{profile.email || 'Non disponibile'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Voti espressi</dt>
          <dd className="mt-1 text-sm text-gray-900">{profile.total_votes_cast}</dd>
        </div>
      </dl>
    </div>
  </div>
);

const UserActivityTab: React.FC<{ userId: string; currentUserId?: string }> = ({ userId, currentUserId }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Attività Recenti</h3>
    <p className="text-gray-500">Componente attività in arrivo...</p>
  </div>
);

const UserAchievementsTab: React.FC<{ userId: string; currentUserId?: string }> = ({ userId, currentUserId }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Achievement</h3>
    <p className="text-gray-500">Componente achievement in arrivo...</p>
  </div>
);

const UserFollowersTab: React.FC<{ userId: string; currentUserId?: string }> = ({ userId, currentUserId }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Follower</h3>
    <p className="text-gray-500">Lista follower in arrivo...</p>
  </div>
);

const UserFollowingTab: React.FC<{ userId: string; currentUserId?: string }> = ({ userId, currentUserId }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Utenti Seguiti</h3>
    <p className="text-gray-500">Lista utenti seguiti in arrivo...</p>
  </div>
);