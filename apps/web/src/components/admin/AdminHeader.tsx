'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  user: any; // Using any for now to match your auth hook's user type
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button would go here */}
      
      <div className="flex flex-1 items-center justify-between">
        {/* Breadcrumb / Title area */}
        <div className="flex items-center">
          <Link 
            href="/"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftOnRectangleIcon className="mr-2 h-4 w-4" />
            Torna al sito
          </Link>
        </div>

        {/* Profile dropdown */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="sr-only">Apri menu utente</span>
              
              {user?.avatar_url ? (
                <Image
                  className="h-8 w-8 rounded-full bg-gray-50"
                  src={user.avatar_url}
                  alt={user?.name || 'Admin'}
                  width={32}
                  height={32}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              )}
              
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  {user?.name || 'Admin'}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Menu.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-64 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    Amministratore
                  </p>
                </div>
                
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/admin/settings"
                      className={cn(
                        active ? 'bg-gray-50' : '',
                        'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      Impostazioni Admin
                    </Link>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/"
                      className={cn(
                        active ? 'bg-gray-50' : '',
                        'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      Visualizza Sito
                    </Link>
                  )}
                </Menu.Item>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleSignOut}
                      className={cn(
                        active ? 'bg-gray-50' : '',
                        'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      Esci
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
}