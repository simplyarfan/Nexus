// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => require('next-router-mock'));

// Mock environment variables
// IMPORTANT: Use environment variable for API URL - no hardcoded localhost
// Set NEXT_PUBLIC_API_URL in your test environment configuration
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
