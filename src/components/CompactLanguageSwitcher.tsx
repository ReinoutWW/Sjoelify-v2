'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useLocale } from '@/lib/context/locale-context';
import { languages } from '@/lib/i18n/config';
import { Locale } from '@/lib/i18n/config';

export function CompactLanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const handleLanguageChange = (e: React.MouseEvent, lang: Locale) => {
    e.preventDefault();
    e.stopPropagation();
    setLocale(lang);
  };

  return (
    <Menu as="div" className="relative inline-flex items-center">
      <Menu.Button className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-200 group">
        <span className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
          {locale}
        </span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-3 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
          <div className="py-1">
            {(Object.keys(languages) as Locale[]).map((lang) => (
              <Menu.Item key={lang}>
                {({ active }: { active: boolean }) => (
                  <button
                    onClick={(e) => handleLanguageChange(e, lang)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleLanguageChange(e as any, lang);
                    }}
                    className={`${
                      active ? 'bg-gray-50' : ''
                    } ${
                      locale === lang ? 'bg-primary-50' : ''
                    } group flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors duration-150`}
                  >
                    <span className="text-lg leading-none">{languages[lang].flag}</span>
                    <span className={`font-medium ${locale === lang ? 'text-primary-700' : 'text-gray-700'}`}>
                      {languages[lang].name}
                    </span>
                    {locale === lang && (
                      <svg className="ml-auto h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 