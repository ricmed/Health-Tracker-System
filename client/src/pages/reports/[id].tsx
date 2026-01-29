import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { ArrowLeft, Download, FileSpreadsheet, Image, Settings, RefreshCw } from 'lucide-react';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChartRenderer } from '@/components/dashboard/chart-renderer';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { TextBlockRenderer } from '@/components/dashboard/text-block';
import { apiRequest } from '@/lib/queryClient';
import type { Dashboard, PanelData } from '@/types';

export default function DashboardViewPage() {
  const params = useParams();
  const dashboardId = params.id;
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [panelData, setPanelData] = useState<Record<number, PanelData>>({});

  const { data: dashboard, isLoading } = useQuery<Dashboard>({
    queryKey: ['/api/dashboards/dashboards', dashboardId],
  });

  const fetchDataMutation = useMutation({
    mutationFn: async (filters: Record<string, unknown>) => {
      const cleanFilters: Record<string, unknown> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== '__all__') {
          cleanFilters[key] = value;
        }
      });

      const response = await apiRequest(
        'POST',
        `/api/dashboards/dashboards/${dashboardId}/data/`,
        { filters: cleanFilters }
      );
      return response.json();
    },
    onSuccess: (data) => {
      setPanelData(data);
    },
  });

  const fetchData = useCallback(() => {
    if (dashboardId) {
      fetchDataMutation.mutate(filterValues);
    }
  }, [dashboardId, filterValues]);

  useEffect(() => {
    if (dashboard) {
      const defaults: Record<string, unknown> = {};
      dashboard.filters?.forEach(filter => {
        if (filter.default_value !== null && filter.default_value !== undefined) {
          defaults[filter.name] = filter.default_value;
        }
      });
      setFilterValues(defaults);
    }
  }, [dashboard]);

  useEffect(() => {
    if (dashboard) {
      fetchData();
    }
  }, [dashboard, filterValues]);

  const handleFilterChange = (name: string, value: unknown) => {
    setFilterValues(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    const defaults: Record<string, unknown> = {};
    dashboard?.filters?.forEach(filter => {
      if (filter.default_value !== null && filter.default_value !== undefined) {
        defaults[filter.name] = filter.default_value;
      }
    });
    setFilterValues(defaults);
  };

  const exportCSV = useCallback(() => {
    if (!dashboard || !panelData) return;

    let csvContent = '';
    Object.entries(panelData).forEach(([panelId, data]) => {
      const panel = dashboard.panels.find(p => p.id === parseInt(panelId));
      if (!panel) return;

      csvContent += `\n${panel.title}\n`;
      
      if (data.type === 'grouped' || data.type === 'time_series') {
        csvContent += 'Label,Value\n';
        data.labels?.forEach((label, idx) => {
          csvContent += `"${label}",${data.values?.[idx] || 0}\n`;
        });
      } else if (data.type === 'metric') {
        csvContent += `Value,${data.value}\n`;
      } else if (data.type === 'table' && Array.isArray(data.data)) {
        const headers = Object.keys(data.data[0] || {});
        csvContent += headers.join(',') + '\n';
        data.data.forEach(row => {
          csvContent += headers.map(h => `"${row[h] || ''}"`).join(',') + '\n';
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${dashboard.name.replace(/\s+/g, '_')}_export.csv`);
  }, [dashboard, panelData]);

  const sortedPanels = useMemo(() => {
    if (!dashboard?.panels) return [];
    return [...dashboard.panels]
      .filter(p => p.is_visible)
      .sort((a, b) => a.order - b.order);
  }, [dashboard?.panels]);

  const sortedTextBlocks = useMemo(() => {
    if (!dashboard?.text_blocks) return [];
    return [...dashboard.text_blocks]
      .filter(b => b.is_visible)
      .sort((a, b) => a.order - b.order);
  }, [dashboard?.text_blocks]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Dashboard not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {dashboard.logo && (
                <img 
                  src={dashboard.logo} 
                  alt="Logo" 
                  className="h-8 w-auto"
                  data-testid="img-dashboard-logo"
                />
              )}
              <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
                {dashboard.name}
              </h1>
              <Badge 
                variant="outline"
                style={{ borderColor: dashboard.health_problem_type_color }}
              >
                {dashboard.health_problem_type_name}
              </Badge>
              {dashboard.is_public && (
                <Badge variant="secondary">Public</Badge>
              )}
            </div>
            {dashboard.description && (
              <p className="text-muted-foreground mt-1">{dashboard.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={fetchDataMutation.isPending}
            data-testid="button-refresh-data"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${fetchDataMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Image className="w-4 h-4 mr-2" />
                Export as PNG (use chart menu)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reports/${dashboardId}/edit`}>
              <Settings className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {sortedTextBlocks.filter(b => b.block_type === 'header').map(block => (
        <TextBlockRenderer key={block.id} block={block} />
      ))}

      {dashboard.filters && dashboard.filters.length > 0 && (
        <FilterBar
          filters={dashboard.filters}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          healthProblemTypeId={dashboard.health_problem_type}
        />
      )}

      {sortedTextBlocks.filter(b => ['description', 'methodology'].includes(b.block_type)).map(block => (
        <TextBlockRenderer key={block.id} block={block} />
      ))}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedPanels.filter(p => p.chart_type === 'metric').map(panel => (
          <ChartRenderer
            key={panel.id}
            panel={panel}
            data={panelData[panel.id] || { type: 'metric', title: panel.title, value: 0 }}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sortedPanels.filter(p => p.chart_type !== 'metric' && p.chart_type !== 'table').map(panel => (
          <ChartRenderer
            key={panel.id}
            panel={panel}
            data={panelData[panel.id] || { type: 'grouped', title: panel.title, labels: [], values: [] }}
          />
        ))}
      </div>

      {sortedPanels.filter(p => p.chart_type === 'table').map(panel => (
        <ChartRenderer
          key={panel.id}
          panel={panel}
          data={panelData[panel.id] || { type: 'table', title: panel.title, data: [] }}
        />
      ))}

      {sortedTextBlocks.filter(b => ['note', 'source'].includes(b.block_type)).map(block => (
        <TextBlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
