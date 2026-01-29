import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { DashboardPanel, PanelData } from '@/types';
import { CHART_COLORS, SEVERITY_COLORS, STATUS_COLORS, STATE_CODE_MAP } from '@/data/brazil-states';
import { STATE_COORDINATES } from '@/data/brazil-geojson';

interface ChartRendererProps {
  panel: DashboardPanel;
  data: PanelData;
  onExportCSV?: () => void;
  onExportPNG?: () => void;
}

export function ChartRenderer({ panel, data }: ChartRendererProps) {
  const colors = panel.color_scheme?.length > 0 ? panel.color_scheme : CHART_COLORS;

  const plotLayout = useMemo(() => ({
    autosize: true,
    margin: { l: 50, r: 30, t: 40, b: 50 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'Inter, sans-serif', color: 'hsl(var(--foreground))' },
    showlegend: panel.show_legend,
    xaxis: {
      title: panel.x_axis_label || undefined,
      showgrid: panel.show_grid,
      gridcolor: 'hsl(var(--border))',
    },
    yaxis: {
      title: panel.y_axis_label || undefined,
      showgrid: panel.show_grid,
      gridcolor: 'hsl(var(--border))',
    },
    legend: {
      orientation: 'h' as const,
      y: -0.2,
    },
  }), [panel]);

  const plotConfig = useMemo(() => ({
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'] as never[],
    toImageButtonOptions: {
      format: 'png' as const,
      filename: panel.title.replace(/\s+/g, '_'),
      height: 600,
      width: 800,
      scale: 2,
    },
  }), [panel.title]);

  if (data.type === 'metric') {
    return (
      <Card className="h-full" data-testid={`panel-metric-${panel.id}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {panel.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold" data-testid="metric-value">
            {data.value?.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.type === 'table' && Array.isArray(data.data)) {
    return (
      <Card className="h-full overflow-auto" data-testid={`panel-table-${panel.id}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{panel.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Onset Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.slice(0, 20).map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.patient_name as string}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      style={{ borderColor: STATUS_COLORS[row.status as string] || '#666' }}
                    >
                      {row.status as string}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      style={{ borderColor: SEVERITY_COLORS[row.severity as string] || '#666' }}
                    >
                      {row.severity as string}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.onset_date as string || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (data.type === 'choropleth' && data.data && !Array.isArray(data.data)) {
    const locations = Object.keys(data.data);
    const values = Object.values(data.data) as number[];
    const maxValue = Math.max(...values, 1);
    
    const lats: number[] = [];
    const lons: number[] = [];
    const texts: string[] = [];
    const sizes: number[] = [];
    const stateValues: number[] = [];
    
    locations.forEach((loc, idx) => {
      const coords = STATE_COORDINATES[loc];
      if (coords) {
        lons.push(coords[0]);
        lats.push(coords[1]);
        const stateName = STATE_CODE_MAP[loc] || loc;
        texts.push(`${stateName}: ${values[idx]}`);
        sizes.push(Math.max(10, (values[idx] / maxValue) * 50));
        stateValues.push(values[idx]);
      }
    });

    return (
      <Card className="h-full" data-testid={`panel-choropleth-${panel.id}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{panel.title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <Plot
            data={[
              {
                type: 'scattergeo',
                mode: 'markers',
                lat: lats,
                lon: lons,
                text: texts,
                hoverinfo: 'text',
                marker: {
                  size: sizes,
                  color: stateValues,
                  colorscale: 'Blues',
                  cmin: 0,
                  cmax: maxValue,
                  showscale: true,
                  colorbar: {
                    title: 'Cases',
                    thickness: 15,
                  },
                  line: {
                    color: 'white',
                    width: 1,
                  },
                },
              } as Plotly.Data,
            ]}
            layout={{
              autosize: true,
              margin: { l: 0, r: 0, t: 10, b: 0 },
              paper_bgcolor: 'transparent',
              geo: {
                scope: 'south america',
                resolution: 50,
                showland: true,
                landcolor: 'hsl(var(--muted))',
                showocean: true,
                oceancolor: 'hsl(var(--background))',
                showcountries: true,
                countrycolor: 'hsl(var(--border))',
                showsubunits: true,
                subunitcolor: 'hsl(var(--border))',
                center: { lat: -14, lon: -55 },
                projection: {
                  scale: 2.5,
                },
              },
              showlegend: false,
            }}
            config={plotConfig}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        </CardContent>
      </Card>
    );
  }

  if (!data.labels || !data.values) {
    return (
      <Card className="h-full" data-testid={`panel-empty-${panel.id}`}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{panel.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  const getPlotData = () => {
    const { labels, values: dataValues } = data;
    
    switch (panel.chart_type) {
      case 'bar_vertical':
        return [{
          type: 'bar' as const,
          x: labels,
          y: dataValues,
          marker: { color: colors },
          text: panel.show_values ? dataValues.map(String) : undefined,
          textposition: 'outside' as const,
          hovertemplate: '%{x}: %{y}<extra></extra>',
        }];

      case 'bar_horizontal':
        return [{
          type: 'bar' as const,
          y: labels,
          x: dataValues,
          orientation: 'h' as const,
          marker: { color: colors },
          text: panel.show_values ? dataValues.map(String) : undefined,
          textposition: 'outside' as const,
          hovertemplate: '%{y}: %{x}<extra></extra>',
        }];

      case 'line':
      case 'timeline':
        return [{
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          x: labels,
          y: dataValues,
          line: { color: colors[0], width: 2 },
          marker: { size: 6 },
          hovertemplate: '%{x}: %{y}<extra></extra>',
        }];

      case 'area':
        return [{
          type: 'scatter' as const,
          mode: 'lines' as const,
          fill: 'tozeroy' as const,
          x: labels,
          y: dataValues,
          line: { color: colors[0] },
          fillcolor: `${colors[0]}40`,
          hovertemplate: '%{x}: %{y}<extra></extra>',
        }];

      case 'pie':
        return [{
          type: 'pie' as const,
          labels: labels,
          values: dataValues,
          marker: { colors },
          textinfo: panel.show_values ? 'label+percent' : 'label',
          hovertemplate: '%{label}: %{value} (%{percent})<extra></extra>',
        }];

      case 'donut':
        return [{
          type: 'pie' as const,
          labels: labels,
          values: dataValues,
          hole: 0.4,
          marker: { colors },
          textinfo: panel.show_values ? 'label+percent' : 'label',
          hovertemplate: '%{label}: %{value} (%{percent})<extra></extra>',
        }];

      case 'scatter':
        return [{
          type: 'scatter' as const,
          mode: 'markers' as const,
          x: labels,
          y: dataValues,
          marker: { 
            color: colors[0], 
            size: 10,
            line: { width: 1, color: 'white' }
          },
          hovertemplate: '%{x}: %{y}<extra></extra>',
        }];

      default:
        return [{
          type: 'bar' as const,
          x: labels,
          y: dataValues,
          marker: { color: colors },
        }];
    }
  };

  const isPieChart = panel.chart_type === 'pie' || panel.chart_type === 'donut';
  const layout = isPieChart 
    ? { ...plotLayout, xaxis: undefined, yaxis: undefined }
    : plotLayout;

  return (
    <Card className="h-full" data-testid={`panel-chart-${panel.id}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{panel.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <Plot
          data={getPlotData()}
          layout={layout}
          config={plotConfig}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </CardContent>
    </Card>
  );
}
