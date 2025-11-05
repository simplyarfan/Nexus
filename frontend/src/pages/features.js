import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Brain, Users, BarChart3, FileText, Zap, Shield, Globe, TrendingUp } from 'lucide-react';
import StaticDotGrid from '../components/backgrounds/StaticDotGrid';
import { StaggeredMenu } from '../components/reactbits/StaggeredMenu';
import GradientText from '../components/text/GradientText';

export default function Features() {
  return (
    <>
      <Head>
        <title>Features - Nexus AI Platform</title>
        <meta
          name="description"
          content="Discover powerful AI agents for HR, Finance, and Sales automation."
        />
      </Head>

      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        {/* Static Dot Grid Background */}
        <StaticDotGrid dotSize={1} dotColor="#f97316" spacing={40} />

        {/* StaggeredMenu Navigation */}
        <StaggeredMenu
          position="right"
          colors={['#1a1a1a', '#2d2d2d']}
          items={[
            { label: 'Home', link: '/', ariaLabel: 'Go to home page' },
            { label: 'Features', link: '/features', ariaLabel: 'View features' },
            { label: 'About', link: '/about', ariaLabel: 'About us' },
            { label: 'Contact', link: '/contact', ariaLabel: 'Contact us' },
            { label: 'Login', link: '/auth/login', ariaLabel: 'Login to your account' },
            { label: 'Sign Up', link: '/auth/register', ariaLabel: 'Create new account' },
          ]}
          socialItems={[
            { label: 'GitHub', link: 'https://github.com/simplyarfan/simpleAI' },
            { label: 'Twitter', link: 'https://x.com/simplyarfan' },
            { label: 'LinkedIn', link: 'https://www.linkedin.com/in/syedarfan/' },
          ]}
          displaySocials={true}
          displayItemNumbering={true}
          menuButtonColor="#fff"
          openMenuButtonColor="#000"
          changeMenuColorOnOpen={true}
          accentColor="#f97316"
          logoUrl="/images/logo.png"
        />

        {/* Hero */}
        <section className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <GradientText
                  colors={['#ef4444', '#f97316', '#eab308']}
                  className="text-5xl md:text-7xl"
                >
                  Powerful AI Agents
                </GradientText>
                <br />
                <span className="text-white">For Every Department</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Automate workflows, analyze data, and make smarter decisions with AI agents built
                for real business needs.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Brain,
                  title: 'CV Intelligence',
                  description:
                    'Screen 100 CVs in seconds. AI-powered candidate ranking and analysis.',
                  color: 'from-blue-500 to-indigo-600',
                },
                {
                  icon: Users,
                  title: 'Interview Coordinator',
                  description:
                    'Automated interview scheduling with calendar integration and reminders.',
                  color: 'from-purple-500 to-pink-600',
                },
                {
                  icon: FileText,
                  title: 'Invoice Processor',
                  description:
                    'Extract data from invoices instantly. Automated validation and fraud detection.',
                  color: 'from-green-500 to-emerald-600',
                },
                {
                  icon: BarChart3,
                  title: 'Expense Auditor',
                  description:
                    'Real-time expense tracking and anomaly detection for financial compliance.',
                  color: 'from-orange-500 to-red-600',
                },
                {
                  icon: Zap,
                  title: 'Lead Generator',
                  description:
                    '24/7 automated lead discovery and qualification for your sales team.',
                  color: 'from-yellow-500 to-orange-600',
                },
                {
                  icon: TrendingUp,
                  title: 'Campaign Optimizer',
                  description: 'AI-powered campaign analysis and optimization recommendations.',
                  color: 'from-red-500 to-pink-600',
                },
                {
                  icon: Shield,
                  title: 'Security First',
                  description:
                    'Enterprise-grade security with SOC 2 compliance and data encryption.',
                  color: 'from-gray-500 to-gray-700',
                },
                {
                  icon: Globe,
                  title: 'Global Support',
                  description:
                    'Multi-language support and 24/7 customer service across all time zones.',
                  color: 'from-cyan-500 to-blue-600',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{
                    scale: 1.05,
                    y: -10,
                    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                  }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-y border-orange-500/20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
                Join thousands of businesses automating with AI.
              </p>
              <Link href="/auth/register">
                <button className="group relative px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 overflow-hidden">
                  <span className="relative z-10">Start Free Trial</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-black border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm transform rotate-45"></div>
                </div>
                <span className="text-lg font-bold">Nexus</span>
              </div>
              <div className="text-sm text-gray-500">© 2025 Nexus. All rights reserved.</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
