'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  Vote, 
  User, 
  Tag,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SearchFilters } from '../../hooks/useAdvancedSearch';

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  categories?: Category[];
  proposers?: User[];
  loading?: boolean;
}

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  activeFiltersCount,
  categories = [],
  proposers = [],
  loading = false,
}: AdvancedSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort options configuration
  const sortOptions = [
    { value: 'relevance-desc', label: 'Rilevanza', icon: Search },
    { value: 'vote_count-desc', label: 'Più votati', icon: Vote },
    { value: 'created_at-desc', label: 'Più recenti', icon: Calendar },
    { value: 'created_at-asc', label: 'Più vecchi', icon: Calendar },
    { value: 'trending-desc', label: 'Trending', icon: TrendingUp },
    { value: 'updated_at-desc', label: 'Aggiornati di recente', icon: Calendar },
  ];

  const statusOptions = [
    { value: '', label: 'Tutti gli stati' },
    { value: 'Proposed', label: 'Proposto' },
    { value: 'In Development', label: 'In Sviluppo' },
    { value: 'Completed', label: 'Completato' },
    { value: 'Rejected', label: 'Rifiutato' },
  ];

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    onFiltersChange({
      sortBy: sortBy as SearchFilters['sortBy'],
      sortOrder: sortOrder as SearchFilters['sortOrder'],
    });
  };

  // Get current sort value
  const currentSortValue = `${filters.sortBy}-${filters.sortOrder}`;

  // Active filters display
  const getActiveFilters = () => {
    const active = [];
    
    if (filters.query) {
      active.push({ key: 'query', label: `Ricerca: "${filters.query}"`, value: filters.query });
    }
    if (filters.category) {
      const category = categories.find(c => c.id === filters.category);
      active.push({ 
        key: 'category', 
        label: `Categoria: ${category?.name || 'Sconosciuta'}`, 
        value: filters.category 
      });
    }
    if (filters.status) {
      const status = statusOptions.find(s => s.value === filters.status);
      active.push({ 
        key: 'status', 
        label: `Stato: ${status?.label || filters.status}`, 
        value: filters.status 
      });
    }
    if (filters.proposer) {
      const proposer = proposers.find(p => p.id === filters.proposer);
      active.push({ 
        key: 'proposer', 
        label: `Proposto da: ${proposer?.name || 'Sconosciuto'}`, 
        value: filters.proposer 
      });
    }
    if (filters.minVotes !== undefined) {
      active.push({ 
        key: 'minVotes', 
        label: `Min voti: ${filters.minVotes}`, 
        value: filters.minVotes 
      });
    }
    if (filters.maxVotes !== undefined) {
      active.push({ 
        key: 'maxVotes', 
        label: `Max voti: ${filters.maxVotes}`, 
        value: filters.maxVotes 
      });
    }
    if (filters.dateFrom) {
      active.push({ 
        key: 'dateFrom', 
        label: `Da: ${new Date(filters.dateFrom).toLocaleDateString('it-IT')}`, 
        value: filters.dateFrom 
      });
    }
    if (filters.dateTo) {
      active.push({ 
        key: 'dateTo', 
        label: `A: ${new Date(filters.dateTo).toLocaleDateString('it-IT')}`, 
        value: filters.dateTo 
      });
    }

    return active;
  };

  const activeFilters = getActiveFilters();

  // Remove specific filter
  const removeFilter = (key: string) => {
    const updates: Partial<SearchFilters> = {};
    
    switch (key) {
      case 'query':
        updates.query = '';
        break;
      case 'category':
        updates.category = '';
        break;
      case 'status':
        updates.status = '';
        break;
      case 'proposer':
        updates.proposer = '';
        break;
      case 'minVotes':
        updates.minVotes = undefined;
        break;
      case 'maxVotes':
        updates.maxVotes = undefined;
        break;
      case 'dateFrom':
        updates.dateFrom = '';
        break;
      case 'dateTo':
        updates.dateTo = '';
        break;
    }
    
    onFiltersChange(updates);
  };

  return (
    <Card>
      <CardContent className="p-6">
        {/* Main search and sort row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cerca problemi per titolo o descrizione..."
              value={filters.query}
              onChange={(e) => onFiltersChange({ query: e.target.value })}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Sort selector */}
          <Select value={currentSortValue} onValueChange={handleSortChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Ordina per" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced filters toggle */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtri avanzati
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 'i' : ''} attivo{activeFiltersCount > 1 ? 'i' : ''}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Cancella tutto
              </Button>
            </div>
          )}
        </div>

        {/* Advanced filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category filter */}
              <div>
                <Label htmlFor="category" className="flex items-center gap-1 mb-2">
                  <Tag className="w-3 h-3" />
                  Categoria
                </Label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => onFiltersChange({ category: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte le categorie</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status filter */}
              <div>
                <Label htmlFor="status" className="flex items-center gap-1 mb-2">
                  <Badge className="w-3 h-3" />
                  Stato
                </Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => onFiltersChange({ status: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Proposer filter */}
              {proposers.length > 0 && (
                <div>
                  <Label htmlFor="proposer" className="flex items-center gap-1 mb-2">
                    <User className="w-3 h-3" />
                    Proposto da
                  </Label>
                  <Select 
                    value={filters.proposer} 
                    onValueChange={(value) => onFiltersChange({ proposer: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti i propositori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutti i propositori</SelectItem>
                      {proposers.map((proposer) => (
                        <SelectItem key={proposer.id} value={proposer.id}>
                          {proposer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Vote range filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-votes" className="flex items-center gap-1 mb-2">
                  <Vote className="w-3 h-3" />
                  Voti minimi
                </Label>
                <Input
                  id="min-votes"
                  type="number"
                  min="0"
                  placeholder="es. 10"
                  value={filters.minVotes || ''}
                  onChange={(e) => onFiltersChange({ 
                    minVotes: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="max-votes" className="flex items-center gap-1 mb-2">
                  <Vote className="w-3 h-3" />
                  Voti massimi
                </Label>
                <Input
                  id="max-votes"
                  type="number"
                  min="0"
                  placeholder="es. 100"
                  value={filters.maxVotes || ''}
                  onChange={(e) => onFiltersChange({ 
                    maxVotes: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Date range filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from" className="flex items-center gap-1 mb-2">
                  <Calendar className="w-3 h-3" />
                  Data inizio
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="date-to" className="flex items-center gap-1 mb-2">
                  <Calendar className="w-3 h-3" />
                  Data fine
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {activeFilters.map((filter, index) => (
              <Badge 
                key={`${filter.key}-${index}`} 
                variant="secondary" 
                className="flex items-center gap-1"
              >
                {filter.label}
                <button
                  onClick={() => removeFilter(filter.key)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  disabled={loading}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}