import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Calendar, FileText, HardDrive, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import FileTypeFilter from '@/components/FileTypeFilter';

export type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';
export type FilterOption = 'all' | 'recent' | 'large' | 'documents' | 'images' | 'archives';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterBy: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
  fileTypeExtensions?: string[];
  onExtensionsChange?: (extensions: string[]) => void;
}

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'name-asc', label: 'Name A-Z', icon: <ArrowUp className="h-3 w-3" /> },
  { value: 'name-desc', label: 'Name Z-A', icon: <ArrowDown className="h-3 w-3" /> },
  { value: 'date-desc', label: 'Newest First', icon: <ArrowDown className="h-3 w-3" /> },
  { value: 'date-asc', label: 'Oldest First', icon: <ArrowUp className="h-3 w-3" /> },
  { value: 'size-desc', label: 'Largest First', icon: <ArrowDown className="h-3 w-3" /> },
  { value: 'size-asc', label: 'Smallest First', icon: <ArrowUp className="h-3 w-3" /> },
];

const filterOptions: { value: FilterOption; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Items', icon: <FileText className="h-3 w-3" /> },
  { value: 'recent', label: 'Recent (7 days)', icon: <Calendar className="h-3 w-3" /> },
  { value: 'large', label: 'Large (>10MB)', icon: <HardDrive className="h-3 w-3" /> },
  { value: 'documents', label: 'Documents', icon: <FileText className="h-3 w-3" /> },
  { value: 'images', label: 'Images', icon: <FileText className="h-3 w-3" /> },
  { value: 'archives', label: 'Archives', icon: <FileText className="h-3 w-3" /> },
];

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  placeholder = "Search...",
  showFilters = true,
  className = "",
  fileTypeExtensions = [],
  onExtensionsChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterBy !== 'all') count++;
    if (sortBy !== 'date-desc') count++; // Default sort
    if (fileTypeExtensions.length > 0) count++;
    return count;
  }, [filterBy, sortBy, fileTypeExtensions]);

  const currentSort = sortOptions.find(option => option.value === sortBy);
  const currentFilter = filterOptions.find(option => option.value === filterBy);

  return (
    <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
          <Search className="h-4 w-4" />
        </div>
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input pl-10 pr-4"
        />
      </div>

      {/* Filters and Sort */}
      {showFilters && (
        <div className="flex gap-2 items-center flex-shrink-0">
          {/* Quick Filter Badges */}
          <div className="hidden lg:flex gap-1">
            {filterOptions.slice(0, 4).map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`filter-badge ${filterBy === option.value ? 'active' : ''}`}
              >
                {option.icon}
                <span className="ml-1 hidden xl:inline">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="btn-glass">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{currentSort?.label}</span>
                <span className="sm:hidden">Sort</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">Sort By</div>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                      sortBy === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter Dropdown */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="btn-glass relative">
                <SlidersHorizontal className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Filter</span>
                <span className="sm:hidden">Filter</span>
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Filters</div>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onFilterChange('all');
                        onSortChange('date-desc');
                        onExtensionsChange?.([]);
                      }}
                      className="text-xs h-6 px-2"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Type</div>
                    <div className="grid grid-cols-2 gap-1">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => onFilterChange(option.value)}
                          className={`filter-badge text-left justify-start ${
                            filterBy === option.value ? 'active' : ''
                          }`}
                        >
                          {option.icon}
                          <span className="ml-1 text-xs">{option.label.replace(' (7 days)', '').replace(' (>10MB)', '')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {onExtensionsChange && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">File Extensions</div>
                      <FileTypeFilter
                        selectedExtensions={fileTypeExtensions}
                        onExtensionsChange={onExtensionsChange}
                        className="space-y-3"
                      />
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;