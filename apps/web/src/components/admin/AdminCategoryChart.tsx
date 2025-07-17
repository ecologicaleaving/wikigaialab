'use client';

interface Category {
  id: string;
  name: string;
  problems_count: number;
  icon_name: string;
  color_hex: string;
}

interface AdminCategoryChartProps {
  categories: Category[];
  totalProblems: number;
}

export function AdminCategoryChart({ categories, totalProblems }: AdminCategoryChartProps) {
  // Calculate percentages and prepare chart data
  const chartData = categories.map(category => ({
    ...category,
    percentage: totalProblems > 0 ? Math.round((category.problems_count / totalProblems) * 100) : 0
  })).sort((a, b) => b.problems_count - a.problems_count);

  const maxCount = Math.max(...chartData.map(c => c.problems_count));

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Distribuzione per Categoria
        </h3>

        <div className="space-y-4">
          {chartData.map((category) => (
            <div key={category.id} className="flex items-center">
              <div className="flex-shrink-0 w-20">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color_hex }}
                  aria-hidden="true"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {category.name}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{category.problems_count}</span>
                    <span>({category.percentage}%)</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: category.color_hex,
                      width: `${maxCount > 0 ? (category.problems_count / maxCount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {chartData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Nessuna categoria con problemi</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Totale problemi:</span>
            <span className="font-medium text-gray-900">{totalProblems}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Categorie attive:</span>
            <span className="font-medium text-gray-900">{categories.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}