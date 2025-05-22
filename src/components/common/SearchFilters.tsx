import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from './Button';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  articleCount: number;
}

export interface FilterOptions {
  diffTypes: ('addition' | 'deletion' | 'modification')[];
  articleIds: string[];
  authors: string[];
  dateRange?: {
    from: string;
    to: string;
  };
}

export function SearchFilters({ onSearch, onFilterChange, articleCount }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    diffTypes: ['addition', 'deletion', 'modification'],
    articleIds: [],
    authors: [],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const toggleDiffType = (type: 'addition' | 'deletion' | 'modification') => {
    const newDiffTypes = filters.diffTypes.includes(type)
      ? filters.diffTypes.filter(t => t !== type)
      : [...filters.diffTypes, type];
    
    handleFilterChange({ diffTypes: newDiffTypes });
  };

  return (
    <div className="mb-4 space-y-3">
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-2 pl-10 pr-4 w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar artículo, palabra clave o tema..."
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          )}
        </div>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          Buscar
        </Button>
        <Button 
          type="button" 
          variant="outline"
          className={`border ${showFilters ? 'bg-blue-50 border-blue-300' : 'bg-white'} flex items-center`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-1" />
          Filtros
        </Button>
      </form>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filtrar por:</h3>
          
          <div className="space-y-4">
            {/* Diff types */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Tipo de cambios</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleDiffType('addition')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    filters.diffTypes.includes('addition')
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  Adiciones
                </button>
                <button
                  onClick={() => toggleDiffType('deletion')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    filters.diffTypes.includes('deletion')
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  Eliminaciones
                </button>
                <button
                  onClick={() => toggleDiffType('modification')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    filters.diffTypes.includes('modification')
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  Modificaciones
                </button>
              </div>
            </div>
            
            {/* Articles */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Artículos ({articleCount})</h4>
              <div className="text-xs text-gray-500">
                Use la búsqueda para filtrar por artículos específicos
              </div>
            </div>
            
            {/* Date range - simplified for now */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Rango de fechas</h4>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                  onChange={(e) => handleFilterChange({
                    dateRange: {
                      from: e.target.value,
                      to: filters.dateRange?.to || new Date().toISOString().split('T')[0]
                    }
                  })}
                />
                <span className="text-xs self-center">a</span>
                <input 
                  type="date" 
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                  onChange={(e) => handleFilterChange({
                    dateRange: {
                      from: filters.dateRange?.from || '2000-01-01',
                      to: e.target.value
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 