'use client';

import React, { Suspense } from 'react';
import ArtisanalProblemsView from '../../components/problems/ArtisanalProblemsView';

export default function ProblemsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛠️</div>
          <div className="text-lg text-orange-700">Preparando le storie della bottega...</div>
        </div>
      </div>
    }>
      <ArtisanalProblemsView />
    </Suspense>
  );
}