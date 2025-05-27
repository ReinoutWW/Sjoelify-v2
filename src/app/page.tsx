'use client';

import { useAuth } from '@/lib/context/auth-context';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ChartBarIcon, UserGroupIcon, TrophyIcon, ClockIcon, UserPlusIcon, PencilSquareIcon, ChartPieIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const features = [
  {
    title: 'Track Your Progress',
    description: 'Keep detailed records of all your Sjoelen games, scores, and achievements. Watch your skills improve over time.',
    icon: ChartBarIcon,
  },
  {
    title: 'Compete with Friends',
    description: 'Create game sessions, invite friends, and compete in real-time. See who can get the highest score!',
    icon: UserGroupIcon,
  },
  {
    title: 'Advanced Statistics',
    description: 'Dive deep into your performance with detailed analytics, trends, and insights to improve your game.',
    icon: TrophyIcon,
  },
  {
    title: 'Quick Scoring',
    description: 'Effortlessly record scores with our intuitive interface. Focus on the game, not the paperwork.',
    icon: ClockIcon,
  },
];

const testimonials = [
  {
    name: 'Lisa van der Berg',
    role: 'Amateur Sjoeler',
    content: 'Sjoelify has transformed how I track my games. The statistics are incredibly helpful for improving my technique.',
  },
  {
    name: 'Jan de Vries',
    role: 'Club Champion',
    content: 'As a competitive player, having detailed statistics and game history is invaluable. Sjoelify makes it so easy!',
  },
  {
    name: 'Emma Bakker',
    role: 'Sjoelen Enthusiast',
    content: 'The best thing about Sjoelify is how it brings our sjoelen community together. We use it for all our tournaments.',
  },
];

const steps = [
  {
    title: 'Create an Account',
    description: 'Sign up in seconds and get immediate access to all features.',
    icon: UserPlusIcon,
  },
  {
    title: 'Start a Game Session',
    description: 'Create a new game and invite your friends to join.',
    icon: UserGroupIcon,
  },
  {
    title: 'Record Your Scores',
    description: 'Easily input scores after each round with our intuitive interface.',
    icon: PencilSquareIcon,
  },
  {
    title: 'Track Progress',
    description: 'View detailed statistics and see your improvement over time.',
    icon: ChartPieIcon,
  },
];

export default function Home() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Modern Scoring for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                Dutch Shuffleboard
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Track your Sjoelen games, compete with friends, and improve your
              skills with our modern scoring system.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Get Started
                <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
              </Link>
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Sign In
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
              Everything you need to track your games
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple, powerful tools to improve your Sjoelen experience
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
              How Sjoelify Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get started in minutes with these simple steps
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
                Start Your Journey
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
              Loved by Sjoelen players
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Here's what our community has to say
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

      {/* Footer */}
      <footer className="bg-gray-900" id="footer">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Sjoelify</h3>
              <p className="text-gray-400 text-sm">
                Modern scoring system for Dutch shuffleboard enthusiasts.
              </p>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/auth/sign-up" className="text-gray-400 hover:text-white transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-in" className="text-gray-400 hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:info@sjoelify.com" className="text-gray-400 hover:text-white transition-colors">
                    info@sjoelify.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} Sjoelify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 