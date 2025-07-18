/**
 * Enhanced User Profile Component with Social Features
 * Story 4.3: User Profiles & Social Features
 * Comprehensive profile editing with bio, interests, privacy settings, and social links
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { UserProfile, UserProfileUpdateData, PrivacySettings } from '../../../../../packages/shared/src/types/social';

interface EnhancedUserProfileProps {
  showPrivacySettings?: boolean;
  showSocialLinks?: boolean;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export const EnhancedUserProfile: React.FC<EnhancedUserProfileProps> = ({
  showPrivacySettings = true,
  showSocialLinks = true,
  onProfileUpdate
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserProfileUpdateData>({
    name: '',
    avatar_url: '',
    bio: '',
    interests: [],
    website_url: '',
    location: '',
    github_username: '',
    twitter_username: '',
    linkedin_username: '',
    profile_visibility: 'public',
    activity_visibility: 'public',
    email_visibility: 'private',
    allow_follow: true
  });

  const [newInterest, setNewInterest] = useState('');

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        avatar_url: user.avatar_url || '',
        bio: user.bio || '',
        interests: user.interests || [],
        website_url: user.website_url || '',
        location: user.location || '',
        github_username: user.github_username || '',
        twitter_username: user.twitter_username || '',
        linkedin_username: user.linkedin_username || '',
        profile_visibility: user.profile_visibility || 'public',
        activity_visibility: user.activity_visibility || 'public',
        email_visibility: user.email_visibility || 'private',
        allow_follow: user.allow_follow !== undefined ? user.allow_follow : true
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && formData.interests && formData.interests.length < 10) {
      if (!formData.interests.includes(newInterest.trim())) {
        setFormData(prev => ({
          ...prev,
          interests: [...(prev.interests || []), newInterest.trim()]
        }));
      }
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests?.filter((_, index) => index !== indexToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const { user: updatedUser } = await response.json();
      
      // Call callback if provided
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      }

      setIsEditing(false);
    } catch (error: any) {
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        avatar_url: user.avatar_url || '',
        bio: user.bio || '',
        interests: user.interests || [],
        website_url: user.website_url || '',
        location: user.location || '',
        github_username: user.github_username || '',
        twitter_username: user.twitter_username || '',
        linkedin_username: user.linkedin_username || '',
        profile_visibility: user.profile_visibility || 'public',
        activity_visibility: user.activity_visibility || 'public',
        email_visibility: user.email_visibility || 'private',
        allow_follow: user.allow_follow !== undefined ? user.allow_follow : true
      });
    }
    setIsEditing(false);
    setUpdateError(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setUpdateError(null);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Profilo utente non disponibile</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Profilo Utente Completo
          </h3>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Modifica
            </button>
          )}
        </div>

        {/* Error Message */}
        {updateError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-800">{updateError}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setUpdateError(null)}
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

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6">
              <div className="shrink-0">
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-medium text-gray-600">
                      {(formData.name || user.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700">
                  URL Avatar
                </label>
                <input
                  type="url"
                  id="avatar_url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Il tuo nome"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Posizione
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Città, Paese"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Descrivi brevemente te stesso..."
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">
                {(formData.bio || '').length}/500 caratteri
              </p>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interessi (massimo 10)
              </label>
              
              {/* Current interests */}
              {formData.interests && formData.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(index)}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add new interest */}
              {(!formData.interests || formData.interests.length < 10) && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Aggiungi un interesse..."
                    maxLength={30}
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    disabled={!newInterest.trim()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Aggiungi
                  </button>
                </div>
              )}
            </div>

            {/* Social Links */}
            {showSocialLinks && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Link Social</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">
                      Sito Web
                    </label>
                    <input
                      type="url"
                      id="website_url"
                      name="website_url"
                      value={formData.website_url}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://tuosito.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="github_username" className="block text-sm font-medium text-gray-700">
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      id="github_username"
                      name="github_username"
                      value={formData.github_username}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label htmlFor="twitter_username" className="block text-sm font-medium text-gray-700">
                      Twitter Username
                    </label>
                    <input
                      type="text"
                      id="twitter_username"
                      name="twitter_username"
                      value={formData.twitter_username}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label htmlFor="linkedin_username" className="block text-sm font-medium text-gray-700">
                      LinkedIn Username
                    </label>
                    <input
                      type="text"
                      id="linkedin_username"
                      name="linkedin_username"
                      value={formData.linkedin_username}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {showPrivacySettings && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Impostazioni Privacy</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="profile_visibility" className="block text-sm font-medium text-gray-700">
                      Visibilità Profilo
                    </label>
                    <select
                      id="profile_visibility"
                      name="profile_visibility"
                      value={formData.profile_visibility}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="public">Pubblico</option>
                      <option value="followers_only">Solo Follower</option>
                      <option value="private">Privato</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="activity_visibility" className="block text-sm font-medium text-gray-700">
                      Visibilità Attività
                    </label>
                    <select
                      id="activity_visibility"
                      name="activity_visibility"
                      value={formData.activity_visibility}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="public">Pubblico</option>
                      <option value="followers_only">Solo Follower</option>
                      <option value="private">Privato</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="email_visibility" className="block text-sm font-medium text-gray-700">
                      Visibilità Email
                    </label>
                    <select
                      id="email_visibility"
                      name="email_visibility"
                      value={formData.email_visibility}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="private">Privato</option>
                      <option value="followers_only">Solo Follower</option>
                      <option value="public">Pubblico</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="allow_follow"
                      name="allow_follow"
                      type="checkbox"
                      checked={formData.allow_follow}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allow_follow" className="ml-2 block text-sm text-gray-900">
                      Permetti ad altri utenti di seguirmi
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Email (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                L'email non può essere modificata
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isUpdating}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <LoadingSpinner size="xs" color="white" className="mr-2" />
                    Salvataggio...
                  </>
                ) : (
                  'Salva Modifiche'
                )}
              </button>
            </div>
          </form>
        ) : (
          <ProfileDisplayView user={user} />
        )}
      </div>
    </div>
  );
};

/**
 * Profile Display View (Read-only)
 */
const ProfileDisplayView: React.FC<{ user: UserProfile }> = ({ user }) => (
  <div className="space-y-6">
    {/* Avatar and Basic Info */}
    <div className="flex items-center space-x-6">
      <div className="shrink-0">
        <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-medium text-gray-600">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-lg font-medium text-gray-900">
          {user.name || user.email.split('@')[0]}
        </h4>
        <p className="text-sm text-gray-500">{user.email}</p>
        {user.location && (
          <p className="text-sm text-gray-500 flex items-center mt-1">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {user.location}
          </p>
        )}
      </div>
    </div>

    {/* Bio */}
    {user.bio && (
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-2">Bio</h5>
        <p className="text-sm text-gray-900">{user.bio}</p>
      </div>
    )}

    {/* Interests */}
    {user.interests && user.interests.length > 0 && (
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-2">Interessi</h5>
        <div className="flex flex-wrap gap-2">
          {user.interests.map((interest, index) => (
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

    {/* Social Links */}
    <div className="space-y-2">
      {user.website_url && (
        <a
          href={user.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-blue-600 hover:text-blue-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Sito web
        </a>
      )}
      
      {user.github_username && (
        <a
          href={`https://github.com/${user.github_username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-gray-600 hover:text-gray-500"
        >
          GitHub: @{user.github_username}
        </a>
      )}
      
      {user.twitter_username && (
        <a
          href={`https://twitter.com/${user.twitter_username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-gray-600 hover:text-gray-500"
        >
          Twitter: @{user.twitter_username}
        </a>
      )}
      
      {user.linkedin_username && (
        <a
          href={`https://linkedin.com/in/${user.linkedin_username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-gray-600 hover:text-gray-500"
        >
          LinkedIn: {user.linkedin_username}
        </a>
      )}
    </div>

    {/* Profile Stats */}
    <div className="border-t border-gray-200 pt-6">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm font-medium text-gray-500">Reputazione</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">{user.reputation_score}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Follower</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">{user.total_followers}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Seguiti</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">{user.total_following}</dd>
        </div>
      </dl>
    </div>
  </div>
);

/**
 * Edit Icon Component
 */
const EditIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

export default EnhancedUserProfile;