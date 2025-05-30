'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useLocale } from '@/lib/context/locale-context';
import { languages } from '@/lib/i18n/config';
import { Locale } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <span className="mr-1">{languages[locale].flag}</span>
          {languages[locale].name}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {(Object.keys(languages) as Locale[]).map((lang) => (
              <Menu.Item key={lang}>
                {({ active }: { active: boolean }) => (
                  <button
                    onClick={() => setLocale(lang)}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } ${
                      locale === lang ? 'bg-gray-50' : ''
                    } group flex w-full items-center px-4 py-2 text-sm`}
                  >
                    <span className="mr-3">{languages[lang].flag}</span>
                    {languages[lang].name}
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