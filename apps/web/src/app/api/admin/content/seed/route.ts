import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

// Seed data for different categories of problems
const SEED_PROBLEMS = {
  environmental: [
    {
      title: "Urban Air Quality Monitoring",
      description: "Develop a comprehensive air quality monitoring system for urban areas that can track pollutants in real-time and provide actionable insights to city planners and residents. The system should integrate multiple sensor types, weather data, and traffic patterns to create accurate pollution maps and predictions.",
      tags: ["environment", "monitoring", "urban-planning", "sensors"]
    },
    {
      title: "Plastic Waste in Ocean Ecosystems",
      description: "Create an innovative solution to address plastic pollution in marine environments. This could involve developing biodegradable alternatives, improving recycling processes, or designing systems to collect existing plastic waste from oceans while minimizing impact on marine life.",
      tags: ["ocean", "plastic", "sustainability", "marine-life"]
    },
    {
      title: "Carbon Footprint Reduction for Small Businesses",
      description: "Design a practical framework that helps small and medium enterprises reduce their carbon footprint through energy efficiency, sustainable practices, and carbon offset programs. The solution should be cost-effective and easy to implement.",
      tags: ["carbon", "business", "sustainability", "energy"]
    },
    {
      title: "Sustainable Agriculture in Arid Regions",
      description: "Develop farming techniques and technologies that enable sustainable agriculture in water-scarce regions. Focus on drought-resistant crops, efficient irrigation systems, and soil conservation methods that can increase food security in challenging climates.",
      tags: ["agriculture", "water", "drought", "food-security"]
    }
  ],
  technology: [
    {
      title: "Cybersecurity for IoT Devices",
      description: "Address the growing security vulnerabilities in Internet of Things devices by developing robust security protocols, automatic update systems, and user-friendly security management tools for both consumers and businesses.",
      tags: ["cybersecurity", "iot", "privacy", "networking"]
    },
    {
      title: "Accessible Technology for Disabilities",
      description: "Create innovative technological solutions that improve accessibility for people with various disabilities. This could include advanced screen readers, gesture-based interfaces, or AI-powered assistance tools that adapt to individual needs.",
      tags: ["accessibility", "disabilities", "ai", "interface"]
    },
    {
      title: "Quantum Computing Applications in Healthcare",
      description: "Explore practical applications of quantum computing in healthcare, including drug discovery, genetic analysis, and complex medical simulations. Develop algorithms and systems that can leverage quantum advantages for medical research.",
      tags: ["quantum", "healthcare", "research", "algorithms"]
    },
    {
      title: "Blockchain for Supply Chain Transparency",
      description: "Implement blockchain technology to create transparent, traceable supply chains that help consumers verify product origins, ensure ethical sourcing, and reduce fraud in global trade networks.",
      tags: ["blockchain", "supply-chain", "transparency", "trade"]
    }
  ],
  social: [
    {
      title: "Digital Divide in Rural Communities",
      description: "Bridge the digital divide by developing cost-effective solutions to bring high-speed internet and digital literacy programs to underserved rural communities. Focus on sustainable infrastructure and community-driven implementation.",
      tags: ["digital-divide", "rural", "internet", "education"]
    },
    {
      title: "Mental Health Support Systems",
      description: "Create comprehensive mental health support systems that combine technology, community resources, and professional care to provide accessible mental health services, especially for underserved populations and young people.",
      tags: ["mental-health", "support", "community", "technology"]
    },
    {
      title: "Affordable Housing Solutions",
      description: "Develop innovative approaches to create affordable, sustainable housing that addresses the housing crisis in urban areas. Consider modular construction, community land trusts, and alternative financing models.",
      tags: ["housing", "affordability", "urban", "sustainability"]
    },
    {
      title: "Education Equity in Underserved Communities",
      description: "Design educational programs and technologies that ensure equal access to quality education for children in underserved communities, addressing resource gaps, teacher shortages, and infrastructure challenges.",
      tags: ["education", "equity", "communities", "resources"]
    }
  ],
  health: [
    {
      title: "Telemedicine for Remote Areas",
      description: "Develop comprehensive telemedicine solutions that can provide quality healthcare services to remote and underserved areas, including diagnostic tools, specialist consultations, and emergency care coordination.",
      tags: ["telemedicine", "remote", "healthcare", "diagnostics"]
    },
    {
      title: "Personalized Medicine Through AI",
      description: "Create AI-driven systems that can analyze genetic, lifestyle, and medical history data to provide personalized treatment recommendations and preventive care strategies for individual patients.",
      tags: ["ai", "personalized-medicine", "genetics", "prevention"]
    },
    {
      title: "Healthcare Data Interoperability",
      description: "Solve the challenge of healthcare data silos by creating interoperable systems that allow secure sharing of medical records between providers while maintaining patient privacy and data security.",
      tags: ["healthcare", "data", "interoperability", "privacy"]
    },
    {
      title: "Wearable Health Monitoring for Chronic Diseases",
      description: "Develop advanced wearable technologies that can continuously monitor patients with chronic diseases, providing early warning systems and real-time health insights to improve disease management.",
      tags: ["wearables", "chronic-disease", "monitoring", "prevention"]
    }
  ],
  economic: [
    {
      title: "Financial Inclusion for Unbanked Populations",
      description: "Create financial services and technologies that provide banking, credit, and investment opportunities to unbanked and underbanked populations, focusing on mobile solutions and alternative credit scoring.",
      tags: ["financial-inclusion", "banking", "mobile", "credit"]
    },
    {
      title: "Circular Economy Business Models",
      description: "Develop business models that promote circular economy principles, focusing on waste reduction, resource reuse, and sustainable production cycles that benefit both environment and economy.",
      tags: ["circular-economy", "business-models", "sustainability", "waste"]
    },
    {
      title: "Skills-Based Job Matching Platform",
      description: "Create an intelligent job matching platform that connects workers with opportunities based on skills rather than traditional qualifications, helping address unemployment and skills mismatches in the job market.",
      tags: ["employment", "skills", "job-matching", "career"]
    },
    {
      title: "Microfinance Technology Solutions",
      description: "Develop technology platforms that make microfinance more efficient, transparent, and accessible, enabling small loans and financial services for entrepreneurs in developing economies.",
      tags: ["microfinance", "entrepreneurship", "technology", "development"]
    }
  ]
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, categories = [], force_reseed = false } = body;

    if (action !== 'seed_problems') {
      return NextResponse.json(
        { error: 'Invalid action. Use "seed_problems"' },
        { status: 400 }
      );
    }

    // Get available categories
    const { data: availableCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true);

    if (categoriesError) {
      throw categoriesError;
    }

    if (!availableCategories || availableCategories.length === 0) {
      return NextResponse.json(
        { error: 'No active categories found. Please create categories first.' },
        { status: 400 }
      );
    }

    // Create category mapping
    const categoryMap = new Map(
      availableCategories.map(cat => [cat.name.toLowerCase().replace(/\s+/g, '-'), cat.id])
    );

    // If no specific categories requested, seed all available categories
    const categoriesToSeed = categories.length > 0 ? categories : Object.keys(SEED_PROBLEMS);

    let totalCreated = 0;
    let totalSkipped = 0;
    const results: Array<{
      category: string;
      created: number;
      skipped: number;
      problems: Array<{ id: string; title: string }>;
    }> = [];

    for (const categoryKey of categoriesToSeed) {
      if (!SEED_PROBLEMS[categoryKey as keyof typeof SEED_PROBLEMS]) {
        continue;
      }

      const problems = SEED_PROBLEMS[categoryKey as keyof typeof SEED_PROBLEMS];
      
      // Find matching category in database
      let categoryId = categoryMap.get(categoryKey);
      if (!categoryId) {
        // Try to find by partial name match
        const matchingCategory = availableCategories.find(cat => 
          cat.name.toLowerCase().includes(categoryKey) || 
          categoryKey.includes(cat.name.toLowerCase())
        );
        categoryId = matchingCategory?.id;
      }

      if (!categoryId) {
        console.warn(`No matching category found for ${categoryKey}`);
        continue;
      }

      const categoryResults = {
        category: categoryKey,
        created: 0,
        skipped: 0,
        problems: [] as Array<{ id: string; title: string }>
      };

      for (const problemData of problems) {
        try {
          // Check if problem already exists (unless force reseed)
          if (!force_reseed) {
            const { data: existingProblem } = await supabase
              .from('problems')
              .select('id')
              .ilike('title', problemData.title)
              .single();

            if (existingProblem) {
              categoryResults.skipped++;
              continue;
            }
          }

          // Create the problem
          const { data: newProblem, error: problemError } = await supabase
            .from('problems')
            .insert({
              title: problemData.title,
              description: problemData.description,
              proposer_id: user.id,
              category_id: categoryId,
              moderation_status: 'approved',
              status: 'open',
              is_featured: false,
              vote_count: Math.floor(Math.random() * 20) + 5, // Random initial votes for variety
              created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
            })
            .select('id, title')
            .single();

          if (problemError) {
            console.error(`Error creating problem "${problemData.title}":`, problemError);
            continue;
          }

          // Calculate and store quality metrics
          await calculateAndStoreQualityMetrics(supabase, newProblem.id, problemData);

          // Add to featured content occasionally (20% chance)
          if (Math.random() < 0.2) {
            await supabase
              .from('featured_content')
              .insert({
                problem_id: newProblem.id,
                featured_by: user.id,
                title: problemData.title,
                description: `Featured: ${problemData.description.substring(0, 100)}...`,
                display_order: Math.floor(Math.random() * 10),
                is_active: true,
                start_date: new Date().toISOString(),
                tags: problemData.tags
              });

            await supabase
              .from('problems')
              .update({ is_featured: true })
              .eq('id', newProblem.id);
          }

          categoryResults.created++;
          categoryResults.problems.push({
            id: newProblem.id,
            title: newProblem.title
          });

        } catch (error) {
          console.error(`Error seeding problem "${problemData.title}":`, error);
          continue;
        }
      }

      totalCreated += categoryResults.created;
      totalSkipped += categoryResults.skipped;
      results.push(categoryResults);
    }

    // Create initial content collections
    await createInitialCollections(supabase, user.id);

    return NextResponse.json({
      success: true,
      data: {
        total_created: totalCreated,
        total_skipped: totalSkipped,
        categories_seeded: results.length,
        results: results
      },
      message: `Successfully seeded ${totalCreated} problems across ${results.length} categories`
    });

  } catch (error) {
    console.error('Error seeding content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get seeding status and available seed data
    const availableCategories = Object.keys(SEED_PROBLEMS);
    const seedData = Object.entries(SEED_PROBLEMS).map(([category, problems]) => ({
      category,
      problem_count: problems.length,
      sample_titles: problems.slice(0, 3).map(p => p.title)
    }));

    // Check current database state
    const { data: currentProblems, error: problemsError } = await supabase
      .from('problems')
      .select('category_id, categories(name)')
      .eq('moderation_status', 'approved');

    if (problemsError) {
      throw problemsError;
    }

    const currentStats = (currentProblems || []).reduce((acc, problem) => {
      const categoryName = problem.categories?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        available_seed_categories: availableCategories,
        seed_data: seedData,
        current_problem_stats: currentStats,
        total_seed_problems: Object.values(SEED_PROBLEMS).reduce((sum, problems) => sum + problems.length, 0)
      }
    });

  } catch (error) {
    console.error('Error getting seed info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate quality metrics for seeded content
async function calculateAndStoreQualityMetrics(supabase: any, problemId: string, problemData: any) {
  try {
    const titleLength = problemData.title.length;
    const descriptionLength = problemData.description.length;
    const wordCount = (problemData.title + ' ' + problemData.description).split(/\s+/).length;
    const sentences = problemData.description.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    
    // Calculate scores (seed data should have high quality)
    const completenessScore = Math.min(
      (titleLength >= 20 ? 30 : titleLength >= 10 ? 20 : 10) +
      (descriptionLength >= 200 ? 50 : descriptionLength >= 100 ? 35 : 20) +
      20, // Has category
      100
    );
    
    const readabilityScore = Math.min(50 + 25 + 25, 100); // Good readability for seed data
    const engagementScore = Math.floor(Math.random() * 40) + 40; // Random but decent engagement
    const uniquenessScore = 95; // Seed data should be unique
    const spamProbability = 0.05; // Very low spam probability
    
    const qualityScore = Math.round(
      (completenessScore * 0.25) +
      (readabilityScore * 0.20) +
      (engagementScore * 0.25) +
      (uniquenessScore * 0.20) +
      ((100 - spamProbability * 100) * 0.10)
    );

    await supabase
      .from('content_quality_metrics')
      .insert({
        problem_id: problemId,
        quality_score: qualityScore,
        readability_score: readabilityScore,
        engagement_score: engagementScore,
        completeness_score: completenessScore,
        uniqueness_score: uniquenessScore,
        spam_probability: spamProbability,
        calculated_at: new Date().toISOString()
      });

    await supabase
      .from('problems')
      .update({ quality_score: qualityScore })
      .eq('id', problemId);

  } catch (error) {
    console.error('Error calculating quality metrics:', error);
  }
}

// Helper function to create initial content collections
async function createInitialCollections(supabase: any, adminUserId: string) {
  try {
    const collections = [
      {
        name: "Featured Problems",
        description: "High-quality problems selected by our editorial team"
      },
      {
        name: "New & Trending", 
        description: "Recently submitted problems gaining community attention"
      },
      {
        name: "Community Favorites",
        description: "Most voted and discussed problems in our community"
      },
      {
        name: "Environmental Solutions",
        description: "Problems focused on environmental sustainability and climate action"
      },
      {
        name: "Technology Innovation",
        description: "Cutting-edge technology challenges and opportunities"
      }
    ];

    for (const collection of collections) {
      // Check if collection already exists
      const { data: existing } = await supabase
        .from('content_collections')
        .select('id')
        .eq('name', collection.name)
        .single();

      if (!existing) {
        await supabase
          .from('content_collections')
          .insert({
            name: collection.name,
            description: collection.description,
            created_by: adminUserId,
            is_active: true,
            is_featured: true
          });
      }
    }
  } catch (error) {
    console.error('Error creating initial collections:', error);
  }
}