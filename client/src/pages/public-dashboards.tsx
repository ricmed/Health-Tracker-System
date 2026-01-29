import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { LayoutDashboard, ArrowRight, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { PublicDashboardGroup } from '@/types';

export default function PublicDashboardsPage() {
  const { data: groups, isLoading } = useQuery<PublicDashboardGroup[]>({
    queryKey: ['/api/dashboards/dashboards/public/'],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-public-dashboards-title">
            Public Dashboards
          </h1>
          <p className="text-muted-foreground">
            Explore public health dashboards and reports
          </p>
        </div>
      </div>

      {!groups?.length ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <LayoutDashboard className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No public dashboards available</h3>
            <p className="text-muted-foreground">
              Public dashboards will appear here when they are created and published
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groups.map(group => (
            <div key={group.health_problem_type_id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: group.health_problem_type_color }}
                />
                <h2 className="text-xl font-semibold">{group.health_problem_type_name}</h2>
                <Badge variant="secondary">
                  {group.dashboards.length} dashboard{group.dashboards.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.dashboards.map(dashboard => (
                  <Card 
                    key={dashboard.id} 
                    className="hover-elevate"
                    data-testid={`card-public-dashboard-${dashboard.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {dashboard.logo && (
                          <img 
                            src={dashboard.logo} 
                            alt="" 
                            className="h-6 w-auto"
                          />
                        )}
                        <CardTitle className="text-base">{dashboard.name}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {dashboard.description || 'No description available'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {dashboard.panel_count || 0} visualization{(dashboard.panel_count || 0) !== 1 ? 's' : ''}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/reports/${dashboard.id}`}>
                            View
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
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
