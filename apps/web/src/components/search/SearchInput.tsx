'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Clock, Tag, User, Lightbulb } from 'lucide-react';
import { useSearchSuggestions, SearchSuggestion } from '../../hooks/useSearchSuggestions';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onSuggestionSelect,
  placeholder = "Cerca problemi...",
  disabled = false,
  showSuggestions = true,
  maxSuggestions = 5,
  className = "",
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    suggestions,
    suggestionsByType,
    loading: suggestionsLoading,
    updateQuery,
    clearSuggestions,
  } = useSearchSuggestions({
    maxSuggestions,
    suggestionType: 'mixed',
  });

  // Update suggestions when value changes
  useEffect(() => {
    if (showSuggestions) {
      updateQuery(value);
    }
  }, [value, showSuggestions, updateQuery]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    setIsFocused(false);
    clearSuggestions();
    setSelectedIndex(-1);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setIsFocused(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'title':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'category':
        return <Tag className="w-4 h-4 text-green-500" />;
      case 'proposer':
        return <User className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get suggestion type label
  const getSuggestionTypeLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'title':
        return 'Problema';
      case 'category':
        return 'Categoria';
      case 'proposer':
        return 'Proposto da';
      default:
        return '';
    }
  };

  const showSuggestionsDropdown = showSuggestions && 
                                  isFocused && 
                                  suggestions.length > 0 && 
                                  value.length >= 2;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-4"
        />
        
        {/* Loading indicator */}
        {suggestionsLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          {/* Group suggestions by type for better UX */}
          {suggestionsByType.titles.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                Problemi
              </div>
              {suggestionsByType.titles.map((suggestion, index) => {
                const globalIndex = suggestions.findIndex(s => s === suggestion);
                return (
                  <SuggestionItem
                    key={`title-${index}`}
                    suggestion={suggestion}
                    isSelected={selectedIndex === globalIndex}
                    onClick={() => handleSuggestionClick(suggestion)}
                    icon={getSuggestionIcon(suggestion.type)}
                  />
                );
              })}
            </div>
          )}

          {suggestionsByType.categories.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                Categorie
              </div>
              {suggestionsByType.categories.map((suggestion, index) => {
                const globalIndex = suggestions.findIndex(s => s === suggestion);
                return (
                  <SuggestionItem
                    key={`category-${index}`}
                    suggestion={suggestion}
                    isSelected={selectedIndex === globalIndex}
                    onClick={() => handleSuggestionClick(suggestion)}
                    icon={getSuggestionIcon(suggestion.type)}
                  />
                );
              })}
            </div>
          )}

          {suggestionsByType.proposers.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                Propositori
              </div>
              {suggestionsByType.proposers.map((suggestion, index) => {
                const globalIndex = suggestions.findIndex(s => s === suggestion);
                return (
                  <SuggestionItem
                    key={`proposer-${index}`}
                    suggestion={suggestion}
                    isSelected={selectedIndex === globalIndex}
                    onClick={() => handleSuggestionClick(suggestion)}
                    icon={getSuggestionIcon(suggestion.type)}
                  />
                );
              })}
            </div>
          )}

          {/* No suggestions message */}
          {suggestions.length === 0 && !suggestionsLoading && value.length >= 2 && (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              Nessun suggerimento trovato
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SuggestionItemProps {
  suggestion: SearchSuggestion;
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function SuggestionItem({ suggestion, isSelected, onClick, icon }: SuggestionItemProps) {
  return (
    <button
      type="button"
      className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon}
          <span className="text-sm text-gray-900 truncate">
            {suggestion.text}
          </span>
        </div>
        
        {suggestion.count !== undefined && (
          <Badge variant="secondary" size="sm" className="ml-2 flex-shrink-0">
            {suggestion.count}
          </Badge>
        )}
      </div>
    </button>
  );
}