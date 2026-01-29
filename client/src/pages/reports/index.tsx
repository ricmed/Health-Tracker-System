import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Plus, LayoutDashboard, Globe, Lock, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Dashboard, HealthProblemType } from '@/types';

interface DashboardFormData {
  name: string;
  description: string;
  health_problem_type: string;
  is_public: boolean;
}

export default function ReportsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: dashboards, isLoading } = useQuery<Dashboard[]>({
    queryKey: ['/api/dashboards/dashboards/'],
  });

  const { data: healthProblemTypes } = useQuery<HealthProblemType[]>({
    queryKey: ['/api/health-problems/types/'],
  });

  const form = useForm<DashboardFormData>({
    defaultValues: {
      name: '',
      description: '',
      health_problem_type: '',
      is_public: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: DashboardFormData) =>
      apiRequest('POST', '/api/dashboards/dashboards/', {
        ...data,
        health_problem_type: parseInt(data.health_problem_type),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards/'] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: 'Dashboard created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create dashboard', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/dashboards/dashboards/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards/'] });
      toast({ title: 'Dashboard deleted successfully' });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/dashboards/dashboards/${id}/toggle_public/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards/dashboards/'] });
    },
  });

  const onSubmit = (data: DashboardFormData) => {
    createMutation.mutate(data);
  };

  const groupedByHealthProblem = dashboards?.reduce((acc, dashboard) => {
    const key = dashboard.health_problem_type_name;
    if (!acc[key]) {
      acc[key] = {
        name: key,
        color: dashboard.health_problem_type_color,
        dashboards: [],
      };
    }
    acc[key].dashboards.push(dashboard);
    return acc;
  }, {} as Record<string, { name: string; color: string; dashboards: Dashboard[] }>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Dashboards & Reports</h1>
          <p className="text-muted-foreground">Create and manage data visualizations</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-dashboard">
              <Plus className="w-4 h-4 mr-2" />
              New Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Dashboard</DialogTitle>
              <DialogDescription>
                Create a new dashboard to visualize health problem data
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dashboard Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter dashboard name" {...field} data-testid="input-dashboard-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe this dashboard" {...field} data-testid="input-dashboard-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="health_problem_type"
                  rules={{ required: 'Health problem type is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health Problem Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-health-problem-type">
                            <SelectValue placeholder="Select a health problem type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {healthProblemTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Public Dashboard</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Make this dashboard accessible without login
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-public"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-dashboard">
                    {createMutation.isPending ? 'Creating...' : 'Create Dashboard'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !dashboards?.length ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <LayoutDashboard className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No dashboards yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first dashboard to start visualizing health data
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-dashboard">
              <Plus className="w-4 h-4 mr-2" />
              Create Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByHealthProblem || {}).map(([key, group]) => (
            <div key={key} className="space-y-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: group.color }}
                />
                <h2 className="text-lg font-semibold">{group.name}</h2>
                <Badge variant="secondary">{group.dashboards.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.dashboards.map((dashboard) => (
                  <Card key={dashboard.id} className="hover-elevate" data-testid={`card-dashboard-${dashboard.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {dashboard.is_public ? (
                            <Globe className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                          <CardTitle className="text-base">{dashboard.name}</CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-menu-${dashboard.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/reports/${dashboard.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/reports/${dashboard.id}/edit`}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => togglePublicMutation.mutate(dashboard.id)}
                            >
                              {dashboard.is_public ? (
                                <>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Make Private
                                </>
                              ) : (
                                <>
                                  <Globe className="w-4 h-4 mr-2" />
                                  Make Public
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(dashboard.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {dashboard.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{dashboard.panel_count || 0} panels</span>
                        <span>By {dashboard.created_by_name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
