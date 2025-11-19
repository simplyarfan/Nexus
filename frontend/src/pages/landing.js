import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Users, BarChart3, Sparkles } from 'lucide-react';
import Aurora from '../components/reactbits/Aurora';
import BlurText from '../components/reactbits/BlurText';
import SplitText from '../components/reactbits/SplitText';
import { StaggeredMenu } from '../components/reactbits/StaggeredMenu';
import GradientText from '../components/text/GradientText';
import ClientOnly from '../components/shared/ClientOnly';

export default function LandingPage() {
  const [isLoading] = useState(false);

  return (
    <>
      <Head>
        <title>Nexus - AI Agents That Actually Work for Your Business</title>
        <meta
          name="description"
          content="Stop hiring expensive consultants. Get specialized AI agents for HR, Finance, and Sales that work 24/7 and never ask for a raise."
        />
      </Head>

      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        {/* Aurora Background - Beautiful gradient waves */}
        <div className="fixed inset-0 z-0">
          <Aurora
            colorStops={['#ef4444', '#f97316', '#eab308']}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>

        {/* StaggeredMenu Navigation */}
        <ClientOnly>
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
        </ClientOnly>

        {/* Loading Transition */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="fixed inset-0 bg-black z-40 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20">
            <div className="max-w-6xl mx-auto px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="inline-flex items-center space-x-2 bg-card/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-8 shadow-lg">
                  <div className="w-4 h-4 bg-gradient-to-br from-orange-600 to-red-600 rounded-sm transform rotate-45 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-200">
                    AI Agents That Actually Work
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[0.85] tracking-tight"
              >
                <SplitText
                  text="Stop hiring expensive"
                  className="text-white text-5xl md:text-7xl lg:text-8xl"
                  delay={50}
                />
                <br />
                <GradientText
                  colors={['#ef4444', '#f97316', '#eab308', '#ef4444']}
                  animationSpeed={6}
                  className="text-5xl md:text-7xl lg:text-8xl"
                >
                  consultants
                </GradientText>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl md:text-2xl text-border mb-6 max-w-3xl mx-auto leading-relaxed font-medium"
              >
                Get specialized AI agents for HR, Finance, and Sales that work 24/7 and never ask
                for a raise.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto italic"
              >
                &quot;Wait, you fired the whole consulting team?&quot; - Your CFO, probably
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex justify-center mb-20"
              >
                <Link href="/auth/login">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 overflow-hidden">
                    <span className="relative z-10">Try today</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </Link>
              </motion.div>

              {/* Question Card */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-card/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 hover:border-orange-500/50 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Question: &quot;Why would I even use Nexus?&quot;
                    </span>
                  </div>

                  <div className="text-left space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Tired of waiting weeks for basic tasks?
                    </h3>
                    <div className="space-y-3">
                      {[
                        '"We need CV analysis for 50 candidates" [Weeks of manual work]',
                        '"Can you audit our Q3 expenses?" [Days of spreadsheet hell]',
                        '"Help us optimize our sales funnel" [Months of trial and error]',
                      ].map((scenario, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span className="text-border font-medium">{scenario}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/30">
                      <p className="text-sm text-orange-300 font-medium">
                        <span className="text-orange-400 font-bold">With Nexus:</span> Get the same
                        results instantly with our AI agents. They work 24/7 and never complain.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* AI Agents Showcase */}
          <section className="py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="text-center mb-20">
                <div className="inline-block text-orange-500 text-sm font-bold mb-4 uppercase tracking-wider">
                  Unfair Advantage Mode
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
                  Stop pretending you know everything.
                  <br />
                  <GradientText
                    colors={['#fbbf24', '#ef4444', '#ec4899']}
                    className="text-4xl md:text-6xl"
                  >
                    Start actually knowing everything.
                  </GradientText>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {[
                  {
                    title: 'HR Department',
                    subtitle: 'CV Intelligence + Interview Coordinator',
                    description:
                      'Analyze 100 CVs in seconds. Find the perfect candidates. Schedule interviews automatically. What used to take weeks now takes minutes.',
                    icon: Users,
                    color: 'from-orange-400 to-red-600',
                    benefit: 'Instant candidate screening',
                  },
                  {
                    title: 'Finance Department',
                    subtitle: 'Invoice Processor + Expense Auditor',
                    description:
                      'Process invoices instantly. Audit expenses automatically. Catch fraud before it happens. Your CFO will think you hired a team of 10.',
                    icon: BarChart3,
                    color: 'from-red-400 to-pink-600',
                    benefit: 'Automated fraud detection',
                  },
                  {
                    title: 'Sales & Marketing',
                    subtitle: 'Lead Generator + Campaign Optimizer',
                    description:
                      'Generate qualified leads 24/7. Optimize campaigns in real-time. Turn your marketing budget into a revenue machine.',
                    icon: Brain,
                    color: 'from-yellow-400 to-orange-600',
                    benefit: '24/7 lead generation',
                  },
                ].map((useCase, index) => (
                  <motion.div
                    key={useCase.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    whileHover={{
                      scale: 1.05,
                      y: -10,
                      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                    }}
                    className="group bg-card/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-card/10 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 ease-out cursor-pointer"
                  >
                    <div className="mb-4">
                      <useCase.icon className="w-12 h-12 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{useCase.title}</h3>
                    <div
                      className={`text-sm font-semibold bg-gradient-to-r ${useCase.color} bg-clip-text text-transparent mb-3`}
                    >
                      {useCase.subtitle}
                    </div>
                    <div className="text-muted-foreground text-sm leading-relaxed mb-4">
                      <BlurText text={useCase.description} delay={50} />
                    </div>
                    <div className="text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full inline-block">
                      {useCase.benefit}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-muted-foreground text-lg font-medium">
                  Join 10,000+ professionals who stopped playing fair
                </p>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-32 relative">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="inline-block text-orange-500 text-sm font-bold mb-4 uppercase tracking-wider">
                  Ready to Transform Your Business?
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                  Your departments are waiting for
                  <br />
                  <GradientText
                    colors={['#ef4444', '#f97316', '#eab308']}
                    className="text-4xl md:text-6xl"
                  >
                    their AI agents.
                  </GradientText>
                </h2>
                <p className="text-xl text-muted-foreground mb-8 font-medium">
                  Stop waiting weeks for work AI can do in minutes.
                </p>

                <div className="bg-card/5 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div>
                      <h4 className="font-bold text-red-500 mb-3">Without Nexus:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Hiring external consultants</li>
                        <li>• Waiting weeks for audits</li>
                        <li>• Manual CV screening forever</li>
                        <li>• Slow agencies with delays</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-primary mb-3">With Nexus:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• AI agents working 24/7</li>
                        <li>• Instant fraud detection</li>
                        <li>• 100 CVs in seconds</li>
                        <li>• Automated optimization</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Link href="/auth/login">
                  <button className="group relative bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white font-bold px-16 py-6 rounded-2xl text-2xl hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 hover:-translate-y-1 transition-all duration-500 ease-out mb-4 overflow-hidden">
                    <span className="relative z-10">Try today</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </Link>

                <p className="text-sm text-muted-foreground">
                  Setup takes 5 minutes. Your first AI agent can be working today.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 bg-black border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-card rounded-sm transform rotate-45"></div>
                  </div>
                  <span className="text-lg font-bold text-white">Nexus</span>
                </div>

                <div className="text-sm text-muted-foreground">
                  © 2025 Nexus. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
