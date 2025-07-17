'use client';

import React, { useState } from 'react';
import { useUserProfile } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/**
 * User Profile Component
 * Displays and allows editing of user profile information
 */
export const UserProfile: React.FC = () => {
  const { user, isUpdating, updateError, updateProfile, clearUpdateError } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    avatar_url: user?.avatar_url || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      avatar_url: user?.avatar_url || '',
    });
    setIsEditing(false);
    clearUpdateError();
  };

  const handleEdit = () => {
    setIsEditing(true);
    clearUpdateError();
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
            Profilo Utente
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
                  onClick={clearUpdateError}
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
                      {formData.name.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
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

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Il tuo nome"
              />
            </div>

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
          <div className="space-y-6">
            {/* Avatar Section */}
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
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {user.name || user.email.split('@')[0]}
                </h4>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.name || 'Non specificato'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Membro dal</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('it-IT')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ultimo accesso</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.last_login_at).toLocaleDateString('it-IT')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Voti espressi</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.total_votes_cast}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Problemi proposti</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.total_problems_proposed}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ruolo</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.is_admin ? 'Amministratore' : 'Utente'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Abbonamento</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.subscription_status === 'active' ? 'Attivo' : 'Gratuito'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

export default UserProfile;