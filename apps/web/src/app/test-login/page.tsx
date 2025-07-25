'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnauthenticatedLayout } from '@/components/layout/UnauthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, TestTube } from 'lucide-react';

// Test credentials for Playwright automation
const TEST_USERS = [
  {
    email: 'playwright-test@wikigaialab.com',
    password: 'PlaywrightTest123!',
    username: 'playwright-user',
    role: 'user'
  },
  {
    email: 'admin-test@wikigaialab.com', 
    password: 'AdminTest123!',
    username: 'admin-user',
    role: 'admin'
  },
  {
    email: 'demo-user@wikigaialab.com',
    password: 'DemoUser123!',
    username: 'demo-user', 
    role: 'user'
  }
];

export default function TestLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Find matching test user
      const testUser = TEST_USERS.find(user => 
        user.email === email && user.password === password
      );

      if (!testUser) {
        throw new Error('Invalid test credentials. Please use one of the provided test accounts.');
      }

      // Simulate authentication by setting session data
      // In a real app, this would call your authentication API
      const sessionData = {
        user: {
          id: `test-${testUser.username}`,
          email: testUser.email,
          username: testUser.username,
          role: testUser.role,
          isTestUser: true
        },
        token: `test-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      // Store in localStorage for test purposes
      localStorage.setItem('test-session', JSON.stringify(sessionData));
      localStorage.setItem('auth-token', sessionData.token);

      // Also set a cookie for broader compatibility
      document.cookie = `test-auth=${sessionData.token}; path=/; max-age=86400`;

      setSuccess(`Successfully logged in as ${testUser.username} (${testUser.role})`);
      
      // Redirect based on role
      setTimeout(() => {
        if (testUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = (userIndex: number) => {
    const user = TEST_USERS[userIndex];
    setEmail(user.email);
    setPassword(user.password);
  };

  return (
    <UnauthenticatedLayout title="Test Login - WikiGaiaLab">
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TestTube className="h-6 w-6 text-teal-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Test Login
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Dedicated login page for Playwright automation and testing.
              This page bypasses OAuth for testing purposes.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter test email"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter test password"
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            {/* Test Credentials */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-3">Available Test Accounts:</h3>
              <div className="space-y-2 text-sm">
                {TEST_USERS.map((user, index) => (
                  <div key={user.email} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{user.username}</span>
                      <span className="text-amber-600 ml-2">({user.role})</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillTestCredentials(index)}
                      className="text-xs"
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <h4 className="font-semibold mb-1">For Playwright Automation:</h4>
              <p>Use URL: <code className="bg-white px-1 rounded">/test-login</code></p>
              <p>Fill email and password fields, then click Login button.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnauthenticatedLayout>
  );
}