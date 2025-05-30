'use client';

import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { DonationButton } from '@/shared/components/DonationButton';

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

      {/* Score Profile Example Section */}
      <section className="py-24 bg-white" id="score-example">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 md:order-1"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-50 rounded-2xl blur-2xl opacity-30" />
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <Image
                    src="/images/SjoelifyScoreExample.png"
                    alt="Sjoelify Score Profiel Voorbeeld"
                    width={600}
                    height={800}
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    priority
                  />
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 md:order-2"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                {t.home.scoreExample.title}
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  {t.home.scoreExample.description}
                </p>
                <p>
                  {t.home.scoreExample.featuresIntro}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t.home.scoreExample.features.averageScore}</li>
                  <li>{t.home.scoreExample.features.bestPerformance}</li>
                  <li>{t.home.scoreExample.features.scoreHistory}</li>
                  <li>{t.home.scoreExample.features.gamesPlayed}</li>
                </ul>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  {t.home.scoreExample.createProfile}
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href="https://sjoelify.com/players/mL3KRDjiDrg31GXdwIrW3Ig18I43"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-medium"
                >
                  {t.home.scoreExample.viewExample} →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Articles/Info Section */}
      <section className="py-24 bg-gray-50" id="articles">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t.home.articles.title}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t.home.articles.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/info/sjoelen-regels" className="group block h-full">
                <div className="bg-gray-50 rounded-2xl p-8 h-full hover:bg-gray-100 transition-all hover:shadow-lg group-hover:scale-[1.02]">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {t.home.articles.rules.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t.home.articles.rules.description}
                  </p>
                  <span className="text-primary-600 font-medium group-hover:underline">
                    {t.home.articles.rules.readMore} →
                  </span>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link href="/info/sjoelen-puntentelling" className="group block h-full">
                <div className="bg-gray-50 rounded-2xl p-8 h-full hover:bg-gray-100 transition-all hover:shadow-lg group-hover:scale-[1.02]">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                    <span className="text-2xl">🧮</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {t.home.articles.scoring.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t.home.articles.scoring.description}
                  </p>
                  <span className="text-primary-600 font-medium group-hover:underline">
                    {t.home.articles.scoring.readMore} →
                  </span>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/info/hoe-het-begon" className="group block h-full">
                <div className="bg-gray-50 rounded-2xl p-8 h-full hover:bg-gray-100 transition-all hover:shadow-lg group-hover:scale-[1.02]">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                    <span className="text-2xl">💙</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {t.home.articles.ourStory.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t.home.articles.ourStory.description}
                  </p>
                  <span className="text-primary-600 font-medium group-hover:underline">
                    {t.home.articles.ourStory.readMore} →
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 bg-white" id="our-story">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                {t.home.ourStory.title}
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  {t.home.ourStory.intro}
                </p>
                <p>
                  {t.home.ourStory.idea}
                </p>
                <p>
                  {t.home.ourStory.growth}
                </p>
              </div>
              <Link
                href="/info/hoe-het-begon"
                className="inline-flex items-center mt-6 px-6 py-3 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-medium"
              >
                {t.home.ourStory.readFullStory} →
              </Link>
              
              {/* Subtle donation option */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Vind je Sjoelify leuk? We maken het met liefde en houden het gratis voor iedereen.
                </p>
                <DonationButton variant="small" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900">{t.home.ourStory.familyName}</h3>
                    <p className="text-gray-600">{t.home.ourStory.familyTagline}</p>
                  </div>
                </div>
                <blockquote className="text-gray-700 italic">
                  "{t.home.ourStory.quote}"
                </blockquote>
                <cite className="block mt-4 text-sm text-gray-600 not-italic">
                  - {t.home.ourStory.quoteAuthor}
                </cite>
              </div>
              
              {/* Decorative element */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary-100 rounded-full opacity-20 blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-24 bg-white" id="leaderboard">
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
              <span className="px-3 bg-white text-lg font-medium text-gray-900">
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

      {/* FAQ Section for SEO */}
      <section className="py-24 bg-white" id="faq">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t.home.faq.title}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t.home.faq.subtitle}
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.home.faq.questions.whatIsSjoelify.question}
                </h3>
                <p className="text-gray-600">
                  {t.home.faq.questions.whatIsSjoelify.answer}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-gray-50 rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.home.faq.questions.howScoring.question}
                </h3>
                <p className="text-gray-600">
                  {t.home.faq.questions.howScoring.answer}
                  <Link href="/info/sjoelen-puntentelling" className="text-primary-600 hover:underline ml-1">
                    {t.home.faq.questions.howScoring.linkText} →
                  </Link>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.home.faq.questions.isFree.question}
                </h3>
                <p className="text-gray-600">
                  {t.home.faq.questions.isFree.answer}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.home.faq.questions.needAccount.question}
                </h3>
                <p className="text-gray-600">
                  {t.home.faq.questions.needAccount.answer}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.home.faq.questions.allDevices.question}
                </h3>
                <p className="text-gray-600">
                  {t.home.faq.questions.allDevices.answer}
                </p>
              </motion.div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                {t.home.faq.moreQuestions}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/info/sjoelen-regels"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t.home.faq.links.rules} →
                </Link>
                <Link
                  href="/info/hoe-het-begon"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t.home.faq.links.story} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900" id="footer">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Sjoelify</h3>
              <p className="text-gray-400 text-sm">
                {t.home.subtitle}
              </p>
              <Link 
                href="/info/hoe-het-begon" 
                className="text-primary-400 hover:text-primary-300 text-sm inline-block mt-2"
              >
                {t.home.articles.ourStory.title} →
              </Link>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">{t.home.footer.quickStart}</h3>
              <ul className="space-y-2 text-sm">
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
              <h3 className="text-white text-lg font-semibold mb-4">{t.home.footer.information}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/info/sjoelen-regels" className="text-gray-400 hover:text-white transition-colors">
                    {t.home.articles.rules.title}
                  </Link>
                </li>
                <li>
                  <Link href="/info/sjoelen-puntentelling" className="text-gray-400 hover:text-white transition-colors">
                    {t.home.articles.scoring.title}
                  </Link>
                </li>
                <li>
                  <Link href="/info/hoe-het-begon" className="text-gray-400 hover:text-white transition-colors">
                    {t.home.articles.ourStory.title}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">{t.home.footer.contact}</h3>
              <ul className="space-y-2 text-sm">
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
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} Sjoelify. {t.home.footer.madeWith} ❤️ {t.home.footer.by} {t.home.footer.byFamily}
            </p>
            <div className="mt-3 text-center">
              <a 
                href="https://www.paypal.com/donate/?hosted_button_id=UEE7BDUYN7AUS"
                target="_blank"
                rel="noopener noreferrer" 
                className="text-amber-400 hover:text-amber-300 text-sm inline-flex items-center gap-1"
              >
                ☕ Steun ons werk
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 