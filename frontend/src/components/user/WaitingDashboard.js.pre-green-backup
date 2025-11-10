import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import {
  Clock,
  Brain,
  Sparkles,
  Settings,
  User,
  LogOut,
  Menu,
  Search,
  Bell,
  Plus,
  MessageSquare,
  ChevronUp,
  Gamepad2,
  Dice1,
  Target,
  Puzzle,
  Zap,
  Trophy,
} from 'lucide-react';

const WaitingDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const quickActions = [
    { name: 'Create Ticket', icon: Plus, route: '/support/create-ticket' },
    { name: 'My Tickets', icon: MessageSquare, route: '/support/my-tickets' },
    { name: 'Profile Settings', icon: User, route: '/profile' },
  ];

  // Fun mini-games for waiting users
  const miniGames = [
    {
      id: 'memory',
      name: 'Memory Game',
      description: 'Test your memory with card matching',
      icon: Brain,
      color: 'from-blue-500 to-indigo-600',
      action: () => setCurrentGame('memory'),
    },
    {
      id: 'reaction',
      name: 'Reaction Time',
      description: 'How fast are your reflexes?',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600',
      action: () => setCurrentGame('reaction'),
    },
    {
      id: 'puzzle',
      name: 'Number Puzzle',
      description: 'Solve the sliding number puzzle',
      icon: Puzzle,
      color: 'from-green-500 to-emerald-600',
      action: () => setCurrentGame('puzzle'),
    },
  ];

  const [currentGame, setCurrentGame] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [reactionTimer, setReactionTimer] = useState('WAIT...');
  const [reactionGreen, setReactionGreen] = useState(false);
  const [reactionScore, setReactionScore] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">Nexus</span>
          </div>
        </div>

        <nav className="mt-6 px-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Status
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">Your account is being reviewed</p>
              </div>
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="relative">
            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                {quickActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={() => {
                      router.push(action.route);
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <action.icon className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-sm font-medium">{action.name}</span>
                  </button>
                ))}
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    handleLogout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}

            {/* User Profile Button */}
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">Pending Assignment</p>
              </div>
              <ChevronUp
                className={`w-4 h-4 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Waiting for Assignment</h1>
                <p className="text-sm text-gray-500">
                  Welcome, {user?.first_name} {user?.last_name}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6 pb-20">
          {/* Welcome section */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Nexus AI Platform!</h2>
                <p className="text-orange-100">
                  Your account is being reviewed. You&apos;ll be assigned to a department soon.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Clock className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Under Review</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Our admin team is reviewing your account and will assign you to the appropriate
                  department based on your role and responsibilities.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>What happens next?</strong> Once assigned, you&apos;ll have access to
                    your department&apos;s AI agents and tools.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fun Mini-Games Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Play While You Wait</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Trophy className="w-4 h-4 mr-1" />
                <span>Pass the time with fun games!</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {miniGames.map((game) => (
                <div
                  key={game.id}
                  onClick={game.action}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group hover:scale-105"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${game.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <game.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{game.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{game.description}</p>
                      <div className="flex items-center text-orange-600 text-sm font-medium group-hover:text-orange-700">
                        <span>Play Now</span>
                        <Gamepad2 className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Modal */}
          {currentGame && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {miniGames.find((g) => g.id === currentGame)?.name}
                  </h3>
                  <button
                    onClick={() => setCurrentGame(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-400 rotate-45" />
                  </button>
                </div>

                <div className="text-center py-8">
                  {currentGame === 'memory' && (
                    <div>
                      <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Match the pairs of cards by remembering their positions!
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
                          >
                            <span className="text-blue-600 font-bold">?</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentGame === 'reaction' && (
                    <div>
                      <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        {!gameStarted
                          ? 'Click START to begin!'
                          : 'Click as fast as you can when the circle turns green!'}
                      </p>
                      {reactionScore !== null && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-green-700 font-bold">Your time: {reactionScore}ms</p>
                        </div>
                      )}
                      <div
                        onClick={() => {
                          if (gameStarted && reactionGreen) {
                            const time = Date.now() - reactionTimer;
                            setReactionScore(time);
                            setGameStarted(false);
                            setReactionGreen(false);
                          }
                        }}
                        className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center cursor-pointer transition-all ${
                          !gameStarted
                            ? 'bg-gray-200'
                            : reactionGreen
                              ? 'bg-green-400'
                              : 'bg-red-400'
                        }`}
                      >
                        <span
                          className={`font-bold ${
                            !gameStarted
                              ? 'text-gray-600'
                              : reactionGreen
                                ? 'text-green-900'
                                : 'text-red-900'
                          }`}
                        >
                          {!gameStarted ? 'READY' : reactionGreen ? 'CLICK!' : 'WAIT...'}
                        </span>
                      </div>
                    </div>
                  )}

                  {currentGame === 'puzzle' && (
                    <div>
                      <Puzzle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Arrange the numbers from 1 to 8 in order!
                      </p>
                      <div className="grid grid-cols-3 gap-1 max-w-32 mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8, ''].map((num, i) => (
                          <div
                            key={i}
                            className={`w-10 h-10 ${num ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-50'} rounded border flex items-center justify-center cursor-pointer transition-colors`}
                          >
                            <span className="text-green-600 font-bold">{num}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setCurrentGame(null);
                      setGameStarted(false);
                      setReactionScore(null);
                      setReactionGreen(false);
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  {currentGame === 'reaction' && !gameStarted && (
                    <button
                      onClick={() => {
                        setGameStarted(true);
                        setReactionScore(null);
                        const delay = Math.random() * 3000 + 1000; // 1-4 seconds
                        setTimeout(() => {
                          setReactionGreen(true);
                          setReactionTimer(Date.now());
                        }, delay);
                      }}
                      className="px-4 py-2 text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors"
                    >
                      Start Game
                    </button>
                  )}
                  {currentGame !== 'reaction' && (
                    <button className="px-4 py-2 text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors opacity-50 cursor-not-allowed">
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingDashboard;
