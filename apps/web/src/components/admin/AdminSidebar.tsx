'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  FlagIcon, 
  RectangleStackIcon, 
  TagIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: HomeIcon,
    current: false,
  },
  {
    name: 'Moderazione',
    href: '/admin/moderation',
    icon: FlagIcon,
    current: false,
  },
  {
    name: 'Contenuti in Evidenza',
    href: '/admin/featured',
    icon: RectangleStackIcon,
    current: false,
  },
  {
    name: 'Gestione Categorie',
    href: '/admin/categories',
    icon: TagIcon,
    current: false,
  },
  {
    name: 'Utenti',
    href: '/admin/users',
    icon: UsersIcon,
    current: false,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    current: false,
  },
  {
    name: 'Impostazioni',
    href: '/admin/settings',
    icon: CogIcon,
    current: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm">
        <div className="flex h-16 shrink-0 items-center border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            Admin Panel
          </h1>
        </div>
        
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin' && pathname.startsWith(item.href));
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700',
                          'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700',
                            'h-6 w-6 shrink-0 transition-colors'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}