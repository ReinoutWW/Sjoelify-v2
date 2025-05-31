'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { UserSettingsService } from '@/features/account/services/user-settings-service';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';
import { GlobeAltIcon, CogIcon, ShieldCheckIcon, UserIcon, BoltIcon, CameraIcon } from '@heroicons/react/24/outline';
import { Menu, Switch } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface SettingsItem {
  label: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  component?: React.ReactNode;
}

interface SettingsSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SettingsItem[];
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [powerUser, setPowerUser] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.uid) {
        try {
          const settings = await UserSettingsService.getUserSettings(user.uid);
          if (settings) {
            setPrivacy(settings.privacy);
            setPowerUser(settings.powerUser || false);
            setAiEnabled(settings.AIEnabled || false);
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
      setLoadingSettings(false);
    };

    loadSettings();
  }, [user?.uid]);

  // Handle privacy change
  const handlePrivacyChange = async (newPrivacy: 'public' | 'friends' | 'private') => {
    if (user?.uid && newPrivacy !== privacy) {
      setPrivacy(newPrivacy);
      try {
        await UserSettingsService.updateSettings(user.uid, { privacy: newPrivacy });
      } catch (error) {
        console.error('Error updating privacy setting:', error);
        // Revert on error
        setPrivacy(privacy);
      }
    }
  };

  // Handle power user change
  const handlePowerUserChange = async (newValue: boolean) => {
    if (user?.uid && newValue !== powerUser) {
      setPowerUser(newValue);
      try {
        await UserSettingsService.updateSettings(user.uid, { powerUser: newValue });
      } catch (error) {
        console.error('Error updating power user setting:', error);
        // Revert on error
        setPowerUser(powerUser);
      }
    }
  };

  // Handle AI enabled change
  const handleAiEnabledChange = async (newValue: boolean) => {
    if (user?.uid && newValue !== aiEnabled) {
      setAiEnabled(newValue);
      try {
        await UserSettingsService.updateSettings(user.uid, { AIEnabled: newValue });
      } catch (error) {
        console.error('Error updating AI enabled setting:', error);
        // Revert on error
        setAiEnabled(aiEnabled);
      }
    }
  };

  if (loading || loadingSettings) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen py-12"
      >
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 rounded-full bg-primary-200"></div>
          <div className="space-y-3">
            <div className="h-4 w-[200px] rounded bg-primary-200"></div>
            <div className="h-4 w-[150px] rounded bg-primary-200"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center justify-center min-h-screen py-12"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{t.auth.pleaseSignIn}</h2>
          <p className="mt-2 text-gray-600">{t.auth.signInToView}</p>
        </div>
      </motion.div>
    );
  }

  const settingsSections: SettingsSection[] = [
    {
      title: t.settings.preferences,
      icon: CogIcon,
      items: [
        {
          label: t.settings.language,
          description: t.settings.languageDescription,
          icon: GlobeAltIcon,
          component: <LanguageSwitcher />,
        },
        {
          label: t.settings.powerUser || 'Power User Mode',
          description: t.settings.powerUserDescription || 'Enable advanced features like auto-enabled quick insert',
          icon: BoltIcon,
          component: (
            <Switch
              checked={powerUser}
              onChange={handlePowerUserChange}
              className={`${
                powerUser ? 'bg-primary-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
            >
              <span className="sr-only">Enable power user mode</span>
              <span
                className={`${
                  powerUser ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          ),
        },
        {
          label: t.settings.aiFeatures || 'AI Features',
          description: t.settings.aiDescription || 'Enable AI-powered features like photo score detection',
          icon: CameraIcon,
          component: (
            <Switch
              checked={aiEnabled}
              onChange={handleAiEnabledChange}
              className={`${
                aiEnabled ? 'bg-primary-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
            >
              <span className="sr-only">Enable AI features</span>
              <span
                className={`${
                  aiEnabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          ),
        },
      ],
    },
    {
      title: t.settings.privacy,
      icon: ShieldCheckIcon,
      items: [
        {
          label: t.settings.profilePrivacy,
          description: t.settings.profilePrivacyDescription,
          component: (
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  {privacy === 'public' ? t.settings.public : privacy === 'friends' ? t.settings.friendsOnly : t.settings.private}
                  <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                </Menu.Button>
              </div>

              <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => handlePrivacyChange('public')}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } ${
                          privacy === 'public' ? 'bg-gray-50' : ''
                        } group flex w-full flex-col items-start px-4 py-3 text-sm`}
                      >
                        <span className="font-medium">{t.settings.public}</span>
                        <span className="text-xs text-gray-500 mt-1">{t.settings.publicDescription}</span>
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => handlePrivacyChange('friends')}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } ${
                          privacy === 'friends' ? 'bg-gray-50' : ''
                        } group flex w-full flex-col items-start px-4 py-3 text-sm`}
                      >
                        <span className="font-medium">{t.settings.friendsOnly}</span>
                        <span className="text-xs text-gray-500 mt-1">{t.settings.friendsOnlyDescription}</span>
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => handlePrivacyChange('private')}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } ${
                          privacy === 'private' ? 'bg-gray-50' : ''
                        } group flex w-full flex-col items-start px-4 py-3 text-sm`}
                      >
                        <span className="font-medium">{t.settings.private}</span>
                        <span className="text-xs text-gray-500 mt-1">{t.settings.privateDescription}</span>
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          ),
        },
      ],
    },
    {
      title: t.settings.account,
      icon: UserIcon,
      items: [
        {
          label: t.profile.displayName,
          description: user.displayName || user.email || '',
        },
        {
          label: t.profile.email,
          description: user.email || '',
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeIn} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                {t.settings.title}
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              {t.settings.general}
            </p>
          </motion.div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {settingsSections.map((section, sectionIdx) => (
              <motion.div
                key={section.title}
                variants={fadeIn}
                className="bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center">
                    <section.icon className="h-5 w-5 text-gray-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {item.icon && <item.icon className="h-5 w-5 text-gray-400 mr-3" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium text-gray-900">{item.label}</h3>
                                {item.label === (t.settings.aiFeatures || 'AI Features') && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    BETA
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </div>
                        </div>
                        {item.component && (
                          <div className="ml-4">
                            {item.component}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <motion.div
            variants={fadeIn}
            className="text-center text-sm text-gray-500 pt-8"
          >
            <p>{t.settings.version} 0.1.0</p>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
} 