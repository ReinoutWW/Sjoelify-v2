'use client';

import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  TrophyIcon, 
  ClockIcon, 
  UserPlusIcon, 
  PencilSquareIcon, 
  ChartPieIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const features = [
    {
      title: t.home.features.trackProgress.title,
      description: t.home.features.trackProgress.description,
      icon: ChartBarIcon,
    },
    {
      title: t.home.features.competeWithFriends.title,
      description: t.home.features.competeWithFriends.description,
      icon: UserGroupIcon,
    },
    {
      title: t.home.features.advancedStatistics.title,
      description: t.home.features.advancedStatistics.description,
      icon: TrophyIcon,
    },
    {
      title: t.home.features.quickScoring.title,
      description: t.home.features.quickScoring.description,
      icon: ClockIcon,
    },
  ];

  const testimonials = [
    {
      name: t.home.testimonials.testimonial1.name,
      role: t.home.testimonials.testimonial1.role,
      content: t.home.testimonials.testimonial1.content,
    },
    {
      name: t.home.testimonials.testimonial2.name,
      role: t.home.testimonials.testimonial2.role,
      content: t.home.testimonials.testimonial2.content,
    },
    {
      name: t.home.testimonials.testimonial3.name,
      role: t.home.testimonials.testimonial3.role,
      content: t.home.testimonials.testimonial3.content,
    },
  ];

  const steps = [
    {
      title: t.home.howItWorks.createAccount.title,
      description: t.home.howItWorks.createAccount.description,
      icon: UserPlusIcon,
    },
    {
      title: t.home.howItWorks.startGame.title,
      description: t.home.howItWorks.startGame.description,
      icon: UserGroupIcon,
    },
    {
      title: t.home.howItWorks.recordScores.title,
      description: t.home.howItWorks.recordScores.description,
      icon: PencilSquareIcon,
    },
    {
      title: t.home.howItWorks.trackProgress.title,
      description: t.home.howItWorks.trackProgress.description,
      icon: ChartPieIcon,
    },
  ];

  useEffect(() => {
    // Redirect logged-in users to dashboard
    if (!loading && user) {
      redirect('/dashboard');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  // Only show home page content if user is not logged in
  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <div className="absolute inset-0 bg-[length:100%_100%] opacity-[0.015] pointer-events-none animate-subtle-flow"
          style={{
            backgroundImage: `
              radial-gradient(at 100% 50%, rgb(56, 189, 248) 0, transparent 50%),
              radial-gradient(at 0% 100%, rgb(59, 130, 246) 0, transparent 50%),
              radial-gradient(at 100% 0%, rgb(99, 102, 241) 0, transparent 50%)
            `
          }}
        />

        <style jsx global>{`
          @keyframes subtle-flow {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          .animate-subtle-flow {
            animation: subtle-flow 20s ease infinite;
            background-size: 200% 200%;
          }
        `}</style>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                {t.home.hero.title}
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t.home.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0">
              <Link
                href="/auth/sign-up"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                {t.home.hero.cta}
                <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
              </Link>
              <Link
                href="/auth/sign-in"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t.auth.signIn}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative blob */}
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6" aria-hidden="true">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary-200 to-primary-400 opacity-30" style={{
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
          }} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t.home.features.title}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t.home.features.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative p-8 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <div>
                  <feature.icon className="h-8 w-8 text-primary-600 mb-4" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-gray-50" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t.home.howItWorks.title}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t.home.howItWorks.subtitle}
            </p>
          </div>
          
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 hidden lg:block" />
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative h-full"
                >
                  <div className="bg-white p-8 rounded-2xl shadow-sm relative z-10 h-full flex flex-col">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-6">
                      <step.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary-600 rounded-full text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 flex-grow">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                      <ArrowRightIcon className="w-8 h-8 text-primary-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                {t.home.hero.cta}
                <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t.home.testimonials.title}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t.home.testimonials.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 p-8 rounded-2xl shadow-sm"
              >
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white" id="leaderboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              {t.home.leaderboard.title}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t.home.leaderboard.subtitle}
            </p>
            <div className="flex justify-center">
              <Link
                href="/leaderboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                {t.navigation.leaderboard}
                <TrophyIcon className="ml-2 -mr-1 h-5 w-5" />
              </Link>
            </div>
          </motion.div>

          {/* Decorative elements */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-gradient-to-b from-gray-50 to-white text-lg font-medium text-gray-900">
                Features
              </span>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-sm p-8 border border-gray-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                <TrophyIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.home.leaderboard.globalRankings.title}</h3>
              <p className="text-gray-600">
                {t.home.leaderboard.globalRankings.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-8 border border-gray-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.home.leaderboard.performanceTracking.title}</h3>
              <p className="text-gray-600">
                {t.home.leaderboard.performanceTracking.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-8 border border-gray-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                <UserGroupIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.home.leaderboard.communityCompetition.title}</h3>
              <p className="text-gray-600">
                {t.home.leaderboard.communityCompetition.description}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900" id="footer">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Sjoelify</h3>
              <p className="text-gray-400 text-sm">
                {t.home.subtitle}
              </p>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/auth/sign-up" className="text-gray-400 hover:text-white transition-colors">
                    {t.home.hero.cta}
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-in" className="text-gray-400 hover:text-white transition-colors">
                    {t.auth.signIn}
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors">
                    {t.navigation.leaderboard}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="mailto:info@sjoelify.com" 
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                    </svg>
                    info@sjoelify.com
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/ReinoutWW/Sjoelify-v2" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.463 2 11.97c0 4.404 2.865 8.14 6.839 9.458.5.092.682-.216.682-.48 0-.236-.008-.864-.013-1.695-2.782.602-3.369-1.337-3.369-1.337-.454-1.151-1.11-1.458-1.11-1.458-.908-.618.069-.606.069-.606 1.003.07 1.531 1.027 1.531 1.027.892 1.524 2.341 1.084 2.91.828.092-.643.35-1.083.636-1.332-2.22-.251-4.555-1.107-4.555-4.927 0-1.088.39-1.979 1.029-2.675-.103-.252-.446-1.266.098-2.638 0 0 .84-.268 2.75 1.022A9.607 9.607 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.372.202 2.386.1 2.638.64.696 1.028 1.587 1.028 2.675 0 3.83-2.339 4.673-4.566 4.92.359.307.678.915.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.577.688.48 3.97-1.32 6.833-5.054 6.833-9.458C22 6.463 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} Sjoelify. {t.home.footer.madeWith} ❤️ {t.home.footer.by}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 