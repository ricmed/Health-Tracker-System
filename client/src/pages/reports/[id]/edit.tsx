import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link, useLocation } from 'wouter';
import { 
  ArrowLeft, Plus, Save, Trash2, GripVertical, 
  BarChart3, LineChart, PieChart, Table2, Hash, Map, 
  FileText, Filter, Image, User, Activity, ClipboardList, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Dashboard, DashboardPanel, DashboardFilter, DashboardTextBlock, ChartType, FilterType, TextBlockType, AggregationType } from '@/types';

interface FieldOption {
  value: string;
  label: string;
  type: string;
  category: string;
  options?: { value: string; label: string }[];
}

interface AvailableFields {
  patient_fields: FieldOption[];
  health_problem_fields: FieldOption[];
  form_fields: FieldOption[];
  time_groupings: FieldOption[];
}

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: typeof BarChart3 }[] = [
  { value: 'bar_vertical', label: 'Vertical Bar', icon: BarChart3 },
  { value: 'bar_horizontal', label: 'Horizontal Bar', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'area', label: 'Area Chart', icon: LineChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'donut', label: 'Donut Chart', icon: PieChart },
  { value: 'metric', label: 'Single Metric', icon: Hash },
  { value: 'table', label: 'Data Table', icon: Table2 },
  { value: 'choropleth', label: 'Map (Brazil)', icon: Map },
  { value: 'scatter', label: 'Scatter Plot', icon: BarChart3 },
  { value: 'timeline', label: 'Timeline', icon: LineChart },
];


const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'distinct', label: 'Distinct Count' },
];

const FILTER_TYPE_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'select', label: 'Single Select' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'date', label: 'Date' },
  { value: 'date_range', label: 'Date Range' },
  { value: 'text', label: 'Text Search' },
];


const TEXT_BLOCK_TYPE_OPTIONS: { value: TextBlockType; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'description', label: 'Description' },
  { value: 'note', label: 'Note' },
  { value: 'source', label: 'Data Source' },
  { value: 'methodology', label: 'Methodology' },
];

export default function DashboardEditPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const dashboardId = params.id;
  const { toast } = useToast();

  const [panelDialogOpen, setPanelDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [textBlockDialogOpen, setTextBlockDialogOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Partial<DashboardPanel> | null>(null);
  const [editingFilter, setEditingFilter] = useState<Partial<DashboardFilter> | null>(null);
  const [editingTextBlock, setEditingTextBlock] = useState<Partial<DashboardTextBlock> | null>(null);

  const { data: dashboard, isLoading } = useQuery<Dashboard>({
    queryKey: ['/api/dashboards/dashboards', dashboardId],
  });

  const { data: availableFields } = useQuery<AvailableFields>({
    queryKey: ['/api/dashboards/available-fields/', dashboard?.health_problem_type?.id],
    queryFn: async () => {
      if (!dashboard?.health_problem_type?.id) return null;
      const res = await fetch(`/api/dashboards/available-fields/?health_problem_type=${dashboard.health_problem_type.id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch fields');
      return res.json();
    },
    enabled: !!dashboard?.health_problem_type?.id,
  });

  const allGroupByFields = useMemo(() => {
    if (!availableFields) return [];
    return [
      ...availableFields.patient_fields,
      ...availableFields.health_problem_fields,
      ...availableFields.form_fields,
      ...availableFields.time_groupings,
    ];
  }, [availableFields]);

  const getFieldLabel = (fieldValue: string | undefined): string => {
    if (!fieldValue) return 'Not set';
    const field = allGroupByFields.find(f => f.value === fieldValue);
    return field?.label || fieldValue;
  };

  const updateDashboardMutation = useMutation({
    mutationFn: (data: Partial<Dashboard>) =>
      apiRequest('PATCH', `/api/dashboards/dashboards/${dashboardId}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards', dashboardId] });
      toast({ title: 'Dashboard updated' });
    },
  });

  const addPanelMutation = useMutation({
    mutationFn: (data: Partial<DashboardPanel>) =>
      apiRequest('POST', `/api/dashboards/dashboards/${dashboardId}/add_panel/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards', dashboardId] });
      setPanelDialogOpen(false);
      setEditingPanel(null);
      toast({ title: 'Panel added' });
    },
  });

  const updatePanelMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<DashboardPanel> & { id: number }) =>
      apiRequest('PATCH', `/api/dashboards/panels/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards', dashboardId] });
      setPanelDialogOpen(false);
      setEditingPanel(null);
      toast({ title: 'Panel updated' });
    },
  });

  const deletePanelMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/dashboards/panels/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards', dashboardId] });
      toast({ title: 'Panel deleted' });
    },
  });

  const addFilterMutation = useMutation({
    mutationFn: (data: Partial<DashboardFilter>) =>
      apiRequest('POST', `/api/dashboards/dashboards/${dashboardId}/add_filter/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards', dashboardId] });
      setFilterDialogOpen(false);
      setEditingFilter(null);
      toast({ title: 'Filter added' });
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/dashboards/filters/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards', dashboardId] });
      toast({ title: 'Filter deleted' });
    },
  });

  const addTextBlockMutation = useMutation({
    mutationFn: (data: Partial<DashboardTextBlock>) =>
      apiRequest('POST', `/api/dashboards/dashboards/${dashboardId}/add_text_block/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards', dashboardId] });
      setTextBlockDialogOpen(false);
      setEditingTextBlock(null);
      toast({ title: 'Text block added' });
    },
  });

  const deleteTextBlockMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/dashboards/text-blocks/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards', dashboardId] });
      toast({ title: 'Text block deleted' });
    },
  });

  const handleSavePanel = () => {
    if (!editingPanel) return;
    
    if (editingPanel.id) {
      updatePanelMutation.mutate(editingPanel as DashboardPanel);
    } else {
      addPanelMutation.mutate(editingPanel);
    }
  };

  const handleSaveFilter = () => {
    if (!editingFilter) return;
    addFilterMutation.mutate(editingFilter);
  };

  const handleSaveTextBlock = () => {
    if (!editingTextBlock) return;
    addTextBlockMutation.mutate(editingTextBlock);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateDashboardMutation.mutate({ logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
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
            <Link href={`/reports/${dashboardId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-edit-title">
              Edit Dashboard: {dashboard.name}
            </h1>
            <p className="text-muted-foreground">Configure panels, filters, and content</p>
          </div>
        </div>
        <Button asChild data-testid="button-view-dashboard">
          <Link href={`/reports/${dashboardId}`}>
            View Dashboard
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          <TabsTrigger value="panels" data-testid="tab-panels">Panels ({dashboard.panels?.length || 0})</TabsTrigger>
          <TabsTrigger value="filters" data-testid="tab-filters">Filters ({dashboard.filters?.length || 0})</TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">Text Content ({dashboard.text_blocks?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Dashboard Name</Label>
                  <Input
                    value={dashboard.name}
                    onChange={(e) => updateDashboardMutation.mutate({ name: e.target.value })}
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-2">
                    {dashboard.logo && (
                      <img src={dashboard.logo} alt="Logo" className="h-10 w-auto" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      data-testid="input-logo"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={dashboard.description}
                  onChange={(e) => updateDashboardMutation.mutate({ description: e.target.value })}
                  data-testid="input-description"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Public Dashboard</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this dashboard accessible without login
                  </p>
                </div>
                <Switch
                  checked={dashboard.is_public}
                  onCheckedChange={(checked) => updateDashboardMutation.mutate({ is_public: checked })}
                  data-testid="switch-public"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="panels" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chart Panels</h2>
            <Dialog open={panelDialogOpen} onOpenChange={setPanelDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingPanel({ 
                    chart_type: 'bar_vertical', 
                    aggregation: 'count',
                    group_by: 'status',
                    show_legend: true,
                    show_values: true,
                    show_grid: true,
                    order: (dashboard.panels?.length || 0) + 1
                  })}
                  data-testid="button-add-panel"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Panel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPanel?.id ? 'Edit Panel' : 'Add Panel'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Panel Title</Label>
                      <Input
                        value={editingPanel?.title || ''}
                        onChange={(e) => setEditingPanel(p => ({ ...p, title: e.target.value }))}
                        placeholder="Enter panel title"
                        data-testid="input-panel-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chart Type</Label>
                      <Select
                        value={editingPanel?.chart_type}
                        onValueChange={(value) => setEditingPanel(p => ({ ...p, chart_type: value as ChartType }))}
                      >
                        <SelectTrigger data-testid="select-chart-type">
                          <SelectValue placeholder="Select chart type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHART_TYPE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2">
                                <opt.icon className="w-4 h-4" />
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>X-Axis Field (Group By)</Label>
                      <Select
                        value={editingPanel?.group_by}
                        onValueChange={(value) => setEditingPanel(p => ({ ...p, group_by: value }))}
                      >
                        <SelectTrigger data-testid="select-group-by">
                          <SelectValue placeholder="Select field for X-axis" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {availableFields ? (
                            <>
                              {availableFields.patient_fields.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel className="flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Patient Fields
                                  </SelectLabel>
                                  {availableFields.patient_fields.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                              {availableFields.health_problem_fields.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel className="flex items-center gap-2">
                                    <Activity className="w-3 h-3" />
                                    Health Problem Fields
                                  </SelectLabel>
                                  {availableFields.health_problem_fields.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                              {availableFields.form_fields.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel className="flex items-center gap-2">
                                    <ClipboardList className="w-3 h-3" />
                                    Form Fields
                                  </SelectLabel>
                                  {availableFields.form_fields.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                              {availableFields.time_groupings.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel className="flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Time Groupings
                                  </SelectLabel>
                                  {availableFields.time_groupings.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                            </>
                          ) : (
                            <SelectItem value="status">Status</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Y-Axis (Aggregation)</Label>
                      <Select
                        value={editingPanel?.aggregation}
                        onValueChange={(value) => setEditingPanel(p => ({ ...p, aggregation: value as AggregationType }))}
                      >
                        <SelectTrigger data-testid="select-aggregation">
                          <SelectValue placeholder="Select aggregation" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGGREGATION_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>X-Axis Label</Label>
                      <Input
                        value={editingPanel?.x_axis_label || ''}
                        onChange={(e) => setEditingPanel(p => ({ ...p, x_axis_label: e.target.value }))}
                        placeholder="e.g., Category"
                        data-testid="input-x-axis-label"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y-Axis Label</Label>
                      <Input
                        value={editingPanel?.y_axis_label || ''}
                        onChange={(e) => setEditingPanel(p => ({ ...p, y_axis_label: e.target.value }))}
                        placeholder="e.g., Count"
                        data-testid="input-y-axis-label"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingPanel?.show_legend}
                        onCheckedChange={(checked) => setEditingPanel(p => ({ ...p, show_legend: checked }))}
                      />
                      <Label>Show Legend</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingPanel?.show_values}
                        onCheckedChange={(checked) => setEditingPanel(p => ({ ...p, show_values: checked }))}
                      />
                      <Label>Show Values</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingPanel?.show_grid}
                        onCheckedChange={(checked) => setEditingPanel(p => ({ ...p, show_grid: checked }))}
                      />
                      <Label>Show Grid</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPanelDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSavePanel}
                    disabled={addPanelMutation.isPending || updatePanelMutation.isPending}
                    data-testid="button-save-panel"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Panel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboard.panels?.map(panel => (
              <Card key={panel.id} className="relative" data-testid={`card-panel-${panel.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                      <CardTitle className="text-sm">{panel.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingPanel(panel);
                          setPanelDialogOpen(true);
                        }}
                        data-testid={`button-edit-panel-${panel.id}`}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePanelMutation.mutate(panel.id)}
                        data-testid={`button-delete-panel-${panel.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Type: {CHART_TYPE_OPTIONS.find(c => c.value === panel.chart_type)?.label}</p>
                    <p>X-Axis: {getFieldLabel(panel.group_by)}</p>
                    <p>Y-Axis: {AGGREGATION_OPTIONS.find(a => a.value === panel.aggregation)?.label || panel.aggregation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dashboard Filters</h2>
            <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingFilter({ 
                    filter_type: 'select',
                    order: (dashboard.filters?.length || 0) + 1,
                    is_visible: true
                  })}
                  data-testid="button-add-filter"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Filter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Filter</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Filter Name (internal)</Label>
                    <Input
                      value={editingFilter?.name || ''}
                      onChange={(e) => setEditingFilter(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., status_filter"
                      data-testid="input-filter-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Filter Label (display)</Label>
                    <Input
                      value={editingFilter?.label || ''}
                      onChange={(e) => setEditingFilter(f => ({ ...f, label: e.target.value }))}
                      placeholder="e.g., Status"
                      data-testid="input-filter-label"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Filter Type</Label>
                      <Select
                        value={editingFilter?.filter_type}
                        onValueChange={(value) => setEditingFilter(f => ({ ...f, filter_type: value as FilterType }))}
                      >
                        <SelectTrigger data-testid="select-filter-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {FILTER_TYPE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Field Path</Label>
                      <Select
                        value={editingFilter?.field_path}
                        onValueChange={(value) => setEditingFilter(f => ({ ...f, field_path: value }))}
                      >
                        <SelectTrigger data-testid="select-field-path">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {availableFields ? (
                            <>
                              {availableFields.patient_fields.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>Patient Fields</SelectLabel>
                                  {availableFields.patient_fields.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                              {availableFields.health_problem_fields.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>Health Problem Fields</SelectLabel>
                                  {availableFields.health_problem_fields.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                              {availableFields.form_fields.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>Form Fields</SelectLabel>
                                  {availableFields.form_fields.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                            </>
                          ) : (
                            <>
                              <SelectItem value="status">Status</SelectItem>
                              <SelectItem value="severity">Severity</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveFilter}
                    disabled={addFilterMutation.isPending}
                    data-testid="button-save-filter"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Filter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboard.filters?.map(filter => (
              <Card key={filter.id} data-testid={`card-filter-${filter.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      {filter.label}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFilterMutation.mutate(filter.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p>Type: {filter.filter_type}</p>
                    <p>Field: {filter.field_path}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Text Content</h2>
            <Dialog open={textBlockDialogOpen} onOpenChange={setTextBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingTextBlock({ 
                    block_type: 'description',
                    order: (dashboard.text_blocks?.length || 0) + 1,
                    is_visible: true
                  })}
                  data-testid="button-add-text-block"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Text Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Text Block</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Block Type</Label>
                    <Select
                      value={editingTextBlock?.block_type}
                      onValueChange={(value) => setEditingTextBlock(t => ({ ...t, block_type: value as TextBlockType }))}
                    >
                      <SelectTrigger data-testid="select-block-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEXT_BLOCK_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title (optional)</Label>
                    <Input
                      value={editingTextBlock?.title || ''}
                      onChange={(e) => setEditingTextBlock(t => ({ ...t, title: e.target.value }))}
                      placeholder="Enter title"
                      data-testid="input-block-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={editingTextBlock?.content || ''}
                      onChange={(e) => setEditingTextBlock(t => ({ ...t, content: e.target.value }))}
                      placeholder="Enter content"
                      rows={5}
                      data-testid="input-block-content"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTextBlockDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveTextBlock}
                    disabled={addTextBlockMutation.isPending}
                    data-testid="button-save-text-block"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Text Block
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {dashboard.text_blocks?.map(block => (
              <Card key={block.id} data-testid={`card-text-block-${block.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {block.title || block.block_type}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTextBlockMutation.mutate(block.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {block.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
