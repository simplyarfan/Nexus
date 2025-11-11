import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Dashboard() {
  const router = useRouter();
  
  const stats = [
    { label: 'Active Batches', value: '12', icon: '📊' },
    { label: 'Total Candidates', value: '847', icon: '👥' },
    { label: 'Scheduled Interviews', value: '23', icon: '📅' },
    { label: 'Open Positions', value: '8', icon: '💼' },
  ];

  const agents = [
    {
      title: 'CV Intelligence',
      description: 'Analyze resumes and rank candidates automatically',
      href: '/cv-intelligence',
      icon: '💡',
    },
    {
      title: 'Interview Coordinator',
      description: 'Schedule and manage interview processes',
      href: '/interview-coordinator',
      icon: '📅',
    },
  ];

  return (
    <>
      <Head>
        <title>HR Dashboard - Nexus</title>
      </Head>
      
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-3">HR Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back! Manage your AI-powered recruitment tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{stat.icon}</div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-muted-foreground text-sm">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">AI-Powered Tools</h2>
            <p className="text-muted-foreground mb-8">
              Launch intelligent agents to automate your recruitment workflow
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.href}
                  className="bg-card border border-border rounded-xl p-8 hover:border-primary transition-all cursor-pointer"
                  onClick={() => router.push(agent.href)}
                >
                  <div className="flex items-start gap-6">
                    <div className="text-5xl">{agent.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {agent.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">{agent.description}</p>
                      <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                        Launch Agent →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
