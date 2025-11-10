

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';

export default function UserManagement() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState>({});

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    department: '',
    job_title: '',
    role: 'user',
  });

  // Mock data - replace with API call
  const users = [
    { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 'admin', department: 'IT', job_title: 'Developer', status: 'active' },
    { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', role: 'user', department: 'Human Resources', job_title: 'HR Manager', status: 'active' },
    { id: 3, first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com', role: 'user', department: 'Finance', job_title: 'Accountant', status: 'active' },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      department: user.department || '',
      job_title: user.job_title || '',
      role: user.role,
    });
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/superadmin')}
                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
            </div>
          </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-500/90 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-muted-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-gray-100/50">
                
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-600">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-medium mb-1">No users found</p>
                        <p className="text-sm">Try adjusting your filters or search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-green-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'superadmin'
                            ? 'bg-red-500/10 text-red-600'
                            : user.role === 'admin'
                              ? 'bg-green-50 text-green-900'
                              : 'bg-green-500/10 text-green-600'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.department || 'Not assigned'}</span>
                        {user.job_title && (
                          <span className="text-xs text-gray-600">{user.job_title}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Add New User</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
                      <input
                        type="text"
                        required
                        className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent ${errors.first_name ? 'border-destructive' : 'border-gray-200'}`}
                      />
                      {errors.first_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                      )}
                    </div>
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
                      <input
                        type="text"
                        required
                        className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent ${errors.last_name ? 'border-destructive' : 'border-gray-200'}`}
                      />
                      {errors.last_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                      )}
                    </div>
                  </div>
                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent ${errors.email ? 'border-destructive' : 'border-gray-200'}`}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent pr-10 ${errors.password ? 'border-destructive' : 'border-gray-200'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                    )}
                  </div>
                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Department</label>
                    <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="">Select Department</option>
                      <option value="IT">IT</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                    </select>
                  </div>
                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Job Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Role</label>
                    <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2.5 text-gray-900 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-500/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      
        {showDeleteModal && selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Delete User</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong className="text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2.5 text-gray-900 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-500/90 transition-colors font-medium"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
