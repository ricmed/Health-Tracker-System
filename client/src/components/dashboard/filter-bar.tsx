import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { DashboardFilter } from '@/types';

interface FilterBarProps {
  filters: DashboardFilter[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onReset: () => void;
  healthProblemTypeId?: number;
}

export function FilterBar({ filters, values, onChange, onReset, healthProblemTypeId }: FilterBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg" data-testid="filter-bar">
      {filters.filter(f => f.is_visible).map(filter => (
        <FilterInput
          key={filter.id}
          filter={filter}
          value={values[filter.name]}
          onChange={(value) => onChange(filter.name, value)}
          healthProblemTypeId={healthProblemTypeId}
        />
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        data-testid="button-reset-filters"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
    </div>
  );
}

interface FilterInputProps {
  filter: DashboardFilter;
  value: unknown;
  onChange: (value: unknown) => void;
  healthProblemTypeId?: number;
}

function FilterInput({ filter, value, onChange, healthProblemTypeId }: FilterInputProps) {
  const { data: dynamicOptions } = useQuery<{ value: string; label: string }[]>({
    queryKey: ['/api/dashboards/filter-options/', filter.field_path, healthProblemTypeId],
    enabled: filter.options.length === 0 && ['select', 'multiselect'].includes(filter.filter_type),
  });

  const options = filter.options.length > 0 ? filter.options : (dynamicOptions || []);

  switch (filter.filter_type) {
    case 'select':
      return (
        <div className="space-y-1.5 min-w-[150px]" data-testid={`filter-${filter.name}`}>
          <Label className="text-xs">{filter.label}</Label>
          <Select
            value={value as string || ''}
            onValueChange={onChange}
          >
            <SelectTrigger data-testid={`select-trigger-${filter.name}`}>
              <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'date':
      return (
        <div className="space-y-1.5" data-testid={`filter-${filter.name}`}>
          <Label className="text-xs">{filter.label}</Label>
          <Input
            type="date"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            data-testid={`input-date-${filter.name}`}
          />
        </div>
      );

    case 'date_range':
      const rangeValue = (value as { from?: string; to?: string }) || {};
      return (
        <div className="space-y-1.5" data-testid={`filter-${filter.name}`}>
          <Label className="text-xs">{filter.label}</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={rangeValue.from || ''}
              onChange={(e) => onChange({ ...rangeValue, from: e.target.value })}
              placeholder="From"
              data-testid={`input-date-from-${filter.name}`}
            />
            <Input
              type="date"
              value={rangeValue.to || ''}
              onChange={(e) => onChange({ ...rangeValue, to: e.target.value })}
              placeholder="To"
              data-testid={`input-date-to-${filter.name}`}
            />
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="space-y-1.5" data-testid={`filter-${filter.name}`}>
          <Label className="text-xs">{filter.label}</Label>
          <Input
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Search ${filter.label.toLowerCase()}`}
            data-testid={`input-text-${filter.name}`}
          />
        </div>
      );

    default:
      return null;
  }
}
