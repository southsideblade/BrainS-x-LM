'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, PlusCircle, Network, Home } from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '홈', icon: Home },
    { href: '/note/new', label: '새 노트', icon: PlusCircle },
    { href: '/notes', label: '내 노트', icon: Brain },
    { href: '/graph', label: '사고 그래프', icon: Network },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-brain-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-brain-primary to-brain-secondary bg-clip-text text-transparent">
              BrainS(x)LM
            </span>
          </Link>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200',
                    isActive
                      ? 'bg-brain-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
