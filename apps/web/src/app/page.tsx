'use client';

import React, { useEffect } from 'react';
import { Heart, Users, Calendar, ShoppingCart, HelpCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { analytics } from '../lib/analytics';
import { UnauthenticatedLayout } from '../components/layout';
import { config } from '../lib/env';

export default function HomePage() {
  const { user } = useAuth();

  // Handle sharing a problem
  const handleShareProblem = () => {
    window.location.href = '/problems/new';
  };

  // Handle exploring problems
  const handleExplorProblems = () => {
    window.location.href = '/problems';
  };

  // Handle login/signup
  const handleGetStarted = () => {
    window.location.href = user ? '/problems/new' : '/login';
  };

  useEffect(() => {
    // Simple analytics tracking
    if (typeof window !== 'undefined') {
      analytics.initialize(config.NEXT_PUBLIC_GA_MEASUREMENT_ID);
      
      // Track page view
      analytics.trackFunnel('landing_page_view', {
        user_authenticated: !!user,
        referrer: document.referrer
      });
    }
  }, [user]);

  return (
    <UnauthenticatedLayout>
      {/* Hero Section - Simple and Warm */}
      <section className="py-20 px-6 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
            Get Help with Life's Little Problems
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join neighbors who understand exactly what you're going through
          </p>

          {/* Hero Image Placeholder - Will be replaced with real photo */}
          <div className="bg-gradient-to-r from-orange-200 to-amber-200 rounded-3xl p-12 mb-10 mx-auto max-w-2xl">
            <div className="flex items-center justify-center gap-6">
              <Users className="h-16 w-16 text-orange-600" />
              <Heart className="h-20 w-20 text-red-500" />
              <Users className="h-16 w-16 text-orange-600" />
            </div>
            <p className="text-gray-700 mt-4 italic">
              "Real people helping real people"
            </p>
          </div>

          {/* Primary Action */}
          <button 
            onClick={handleShareProblem}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xl px-8 py-4 rounded-xl font-semibold shadow-lg transition-colors duration-200 mb-4"
          >
            Tell Us Your Problem
          </button>
          
          {/* Social Proof */}
          <p className="text-gray-600 text-lg">
            Over 2,000 neighbors helping each other
          </p>
        </div>
      </section>

      {/* Problem Examples Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-900 mb-4">
            Problems We Help With Every Day
          </h2>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            No problem is too small when neighbors care about each other
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Family Logistics */}
            <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8">
              <div className="bg-blue-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-12 w-12 text-blue-700" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-4">
                Family Logistics
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Help organizing family schedules, carpools, and activities. 
                Making life easier for busy parents.
              </p>
            </div>

            {/* Daily Tasks */}
            <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8">
              <div className="bg-green-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-12 w-12 text-green-700" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-4">
                Daily Tasks
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Getting help with shopping, appointments, and errands. 
                Support when you need it most.
              </p>
            </div>

            {/* Community Questions */}
            <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8">
              <div className="bg-purple-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <HelpCircle className="h-12 w-12 text-purple-700" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-4">
                Community Questions
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Finding reliable services, local recommendations, and advice 
                from people who live nearby.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Maximum Simplicity */}
      <section className="py-20 px-6 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-900 mb-4">
            It's As Simple As Asking a Friend
          </h2>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Three simple steps to get the help you need
          </p>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full w-24 h-24 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-orange-700">1</span>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-3">
                  Share Your Problem
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Tell us what you need help with, just like you'd ask a neighbor over the fence. 
                  Use simple words - we're all regular people here.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-gradient-to-br from-pink-100 to-red-100 rounded-full w-24 h-24 flex items-center justify-center flex-shrink-0">
                <Heart className="h-12 w-12 text-red-600" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-3">
                  Others Relate
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Neighbors who have the same problem support you with a heart. 
                  When enough people share the same need, we know it's important.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center flex-shrink-0">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-3">
                  We Help Together
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  When enough people need the same help, we create a solution together. 
                  Real people helping people, not complicated technology.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8">
            Safe Space for Real People
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 bg-gray-50 rounded-2xl">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                No Selling
              </h4>
              <p className="text-gray-700">
                We never sell your information or spam you with ads
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-2xl">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Real Neighbors
              </h4>
              <p className="text-gray-700">
                Real people with real names helping in their community
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-2xl">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Kind Community
              </h4>
              <p className="text-gray-700">
                Respectful guidelines keep our space welcoming for everyone
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-br from-orange-500 to-red-500 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            Join your neighbors and start getting help with everyday challenges
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGetStarted}
              className="bg-white text-orange-600 text-xl px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg"
            >
              Start Getting Help
            </button>
            <button 
              onClick={handleExplorProblems}
              className="border-2 border-white text-white text-xl px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-orange-600 transition-colors duration-200"
            >
              See What Others Are Asking About
            </button>
          </div>
        </div>
      </section>

    </UnauthenticatedLayout>
  );
}