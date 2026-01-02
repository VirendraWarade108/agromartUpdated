import React, { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChange?: (query: string) => void;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  suggestions?: string[];
  recentSearches?: string[];
  isLoading?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'hero';
  showButton?: boolean;
}

/**
 * SearchBar Component
 * Advanced search bar with suggestions, recent searches, and auto-complete
 */
export default function SearchBar({
  placeholder = 'Search for products...',
  onSearch,
  onChange,
  autoFocus = false,
  showSuggestions = true,
  suggestions = [],
  recentSearches = [],
  isLoading = false,
  className = '',
  variant = 'default',
  showButton = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Handle input change
   */
  const handleChange = (value: string) => {
    setQuery(value);
    onChange?.(value);
    
    // Show dropdown if there's input and suggestions/recent searches
    if (value.trim() !== '' || recentSearches.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  /**
   * Handle search submission
   */
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    
    if (finalQuery.trim() === '') return;
    
    // Call search callback
    onSearch?.(finalQuery);
    
    // Save to recent searches (in real app, this would be in localStorage)
    saveRecentSearch(finalQuery);
    
    // Hide dropdown
    setShowDropdown(false);
    
    // Blur input
    inputRef.current?.blur();
  };

  /**
   * Handle clear
   */
  const handleClear = () => {
    setQuery('');
    onChange?.('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  /**
   * Save recent search to localStorage
   */
  const saveRecentSearch = (search: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [search, ...recent.filter((s: string) => s !== search)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  /**
   * Handle click outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      handleClear();
      setShowDropdown(false);
    }
  };

  // Variant styles
  const variantStyles = {
    default: 'h-12 text-base',
    compact: 'h-10 text-sm',
    hero: 'h-14 text-lg',
  };

  const containerStyles = {
    default: 'max-w-2xl',
    compact: 'max-w-md',
    hero: 'max-w-3xl',
  };

  return (
    <div className={`relative ${containerStyles[variant]} ${className}`}>
      {/* Search Input */}
      <div className="relative group">
        {/* Glow effect for hero variant */}
        {variant === 'hero' && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-60"></div>
        )}
        
        <div className={`relative flex items-center bg-white rounded-xl ${variant === 'hero' ? 'rounded-2xl' : ''} border-2 border-gray-200 focus-within:border-green-400 overflow-hidden shadow-lg transition-all`}>
          {/* Search Icon */}
          <Search className={`absolute left-4 ${variant === 'hero' ? 'w-6 h-6' : 'w-5 h-5'} text-gray-500`} />
          
          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (query.trim() !== '' || recentSearches.length > 0) {
                setShowDropdown(true);
              }
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`w-full ${variant === 'hero' ? 'pl-16 pr-32' : 'pl-12 pr-24'} ${variantStyles[variant]} bg-white text-gray-900 placeholder-gray-500 focus:outline-none font-medium`}
          />
          
          {/* Loading / Clear Button */}
          <div className="absolute right-2 flex items-center gap-2">
            {isLoading ? (
              <div className="px-3">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : query && (
              <button
                onClick={handleClear}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
            
            {/* Search Button */}
            {showButton && (
              <button
                onClick={() => handleSearch()}
                className={`${variant === 'hero' ? 'px-6 py-3' : 'px-4 py-2'} bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all shadow-lg`}
                type="button"
              >
                {variant === 'hero' ? 'Search' : <Search className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && showDropdown && (isFocused || query) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-2xl z-50 max-h-96 overflow-y-auto"
        >
          {/* Recent Searches */}
          {query === '' && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-gray-600 font-bold text-sm mb-3">
                <Clock className="w-4 h-4" />
                Recent Searches
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors font-semibold text-gray-900"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {query && suggestions.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-gray-600 font-bold text-sm mb-3">
                <TrendingUp className="w-4 h-4" />
                Suggestions
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors font-semibold text-gray-900 flex items-center justify-between group"
                  >
                    <span>{suggestion}</span>
                    <Search className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {query && suggestions.length === 0 && !isLoading && (
            <div className="p-8 text-center">
              <p className="text-gray-500 font-semibold mb-2">No suggestions found</p>
              <p className="text-gray-400 text-sm">Try searching for seeds, fertilizers, or equipment</p>
            </div>
          )}

          {/* Quick Links */}
          {query === '' && recentSearches.length === 0 && (
            <div className="p-4">
              <div className="text-gray-600 font-bold text-sm mb-3">Popular Categories</div>
              <div className="grid grid-cols-2 gap-2">
                {['Seeds', 'Fertilizers', 'Equipment', 'Pesticides'].map((category) => (
                  <Link
                    key={category}
                    href={`/categories/${category.toLowerCase()}`}
                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-semibold text-gray-900 text-center transition-colors"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact Search Bar - For headers/navigation
 */
export function CompactSearchBar({
  onSearch,
  placeholder = 'Search...',
}: {
  onSearch?: (query: string) => void;
  placeholder?: string;
}) {
  return (
    <SearchBar
      variant="compact"
      placeholder={placeholder}
      onSearch={onSearch}
      showButton={false}
    />
  );
}

/**
 * Hero Search Bar - For landing pages
 */
export function HeroSearchBar({
  onSearch,
  placeholder = 'Search for seeds, fertilizers, equipment...',
  suggestions = [],
}: {
  onSearch?: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  return (
    <SearchBar
      variant="hero"
      placeholder={placeholder}
      onSearch={onSearch}
      suggestions={suggestions}
      showSuggestions={true}
      autoFocus={false}
    />
  );
}