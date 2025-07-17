'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface RelatedProblem {
  id: string;
  title: string;
  vote_count: number;
  category: {
    id: string;
    name: string;
  };
  created_at: string;
}

interface RelatedProblemsProps {
  currentProblemId: string;
  categoryId: string;
  categoryName: string;
  className?: string;
}

export const RelatedProblems: React.FC<RelatedProblemsProps> = ({
  currentProblemId,
  categoryId,
  categoryName,
  className = '',
}) => {
  const [relatedProblems, setRelatedProblems] = useState<RelatedProblem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProblems = async () => {
      try {
        const response = await fetch(
          `/api/problems?category=${categoryId}&limit=6&sortBy=vote_count&sortOrder=desc`
        );
        
        if (response.ok) {
          const data = await response.json();
          // Filter out current problem and limit to 4 results
          const filtered = data.data
            .filter((problem: RelatedProblem) => problem.id !== currentProblemId)
            .slice(0, 4);
          setRelatedProblems(filtered);
        }
      } catch (error) {
        // Silently handle error - related problems are non-critical
      } finally {
        setLoading(false);
      }
    };

    if (categoryId && currentProblemId) {
      fetchRelatedProblems();
    }
  }, [currentProblemId, categoryId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Problemi Correlati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedProblems.length === 0) {
    return null; // Don't show the section if no related problems
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Problemi Correlati</CardTitle>
        <p className="text-sm text-gray-600">
          Altri problemi nella categoria {categoryName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relatedProblems.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}`}
              className="block group"
            >
              <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                    {problem.title}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{problem.vote_count}</span>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {problem.category.name}
                    </Badge>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors ml-2 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        {relatedProblems.length >= 4 && (
          <div className="mt-6 pt-4 border-t">
            <Link href={`/problems?category=${categoryId}`}>
              <Button variant="outline" className="w-full">
                Vedi tutti i problemi in {categoryName}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};