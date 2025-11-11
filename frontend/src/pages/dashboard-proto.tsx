'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const agents = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'CV Intelligence',
      description: 'Analyze resumes and rank candidates automatically',
      href: '/cv-intelligence',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Interview Coordinator',
      description: 'Schedule and manage interview processes',
      href: '/interviews',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed */}
      <div className={`w-64 bg-card border-r border-border flex flex-col fixed h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform z-50`}>
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">Nexus</span>
          </div>
        </div>

        {/* AI Agents Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              AI AGENTS
            </p>
            <div className="space-y-2">
              {agents.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-foreground hover:bg-accent group"
                >
                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <svg className="w-4 h-4 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-border relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">HR Test</p>
              <p className="text-xs text-muted-foreground">HR Department</p>
            </div>
            <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <button
                    onClick={() => router.push('/support')}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-foreground">Create Ticket</span>
                  </button>
                  <button
                    onClick={() => router.push('/support')}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="text-sm text-foreground">My Tickets</span>
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-foreground">Profile Settings</span>
                  </button>
                  <div className="border-t border-border" />
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm text-destructive">Logout</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content - Add left margin to account for fixed sidebar */}
      <div className="flex-1 lg:ml-64 overflow-auto">
        <div className="min-h-screen bg-background">
          {/* Clean Header with Notifications */}
          <div className="border-b border-border bg-card sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-8 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 hover:bg-accent rounded-lg"
                    aria-label="Toggle sidebar"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h1 className="text-4xl font-bold text-foreground mb-2">HR Dashboard</h1>
                    <p className="text-muted-foreground text-lg">
                      Welcome back! Manage your AI-powered recruitment tools
                    </p>
                  </motion.div>
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {/* Notification Badge */}
                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowNotifications(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
                        >
                          <div className="p-4 border-b border-border">
                            <h3 className="font-semibold text-foreground">Notifications</h3>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {[
                              { title: 'New batch created', detail: 'Sr. AI Developer - 5 candidates', time: '2 hours ago' },
                              { title: 'Interview scheduled', detail: 'John Smith - Technical Round', time: '4 hours ago' },
                              { title: 'CV processed', detail: 'Backend Engineer position - 8 matches', time: '1 day ago' },
                            ].map((notification, index) => (
                              <div key={index} className="p-4 hover:bg-accent transition-colors border-b border-border last:border-0">
                                <p className="font-medium text-foreground text-sm">{notification.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{notification.detail}</p>
                                <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                              </div>
                            ))}
                          </div>
                          <div className="p-3 border-t border-border text-center">
                            <button className="text-sm text-primary hover:opacity-80">View all notifications</button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                {
                  label: 'Active Batches',
                  value: '12',
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  color: 'bg-primary/10 text-primary'
                },
                {
                  label: 'Total Candidates',
                  value: '847',
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  color: 'bg-primary/20 text-primary'
                },
                {
                  label: 'Scheduled Interviews',
                  value: '23',
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  color: 'bg-primary/10 text-primary'
                },
                {
                  label: 'Open Positions',
                  value: '8',
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  color: 'bg-primary/10 text-primary'
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* AI Agents Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">AI-Powered Tools</h2>
              <p className="text-muted-foreground">Launch intelligent agents to automate your recruitment workflow</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  onClick={() => router.push(agent.href)}
                  className="bg-card border-2 border-border rounded-2xl p-8 hover:border-primary hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                >
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="flex items-start gap-6 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                        {agent.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {agent.title}
                        </h3>
                        <p className="text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                        <span>Launch Agent</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        AI Powered
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
