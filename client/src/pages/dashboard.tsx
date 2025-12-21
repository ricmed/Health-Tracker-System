import { useQuery } from "@tanstack/react-query";
import { Users, ClipboardList, Activity, TrendingUp, Plus } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PatientListItem, HealthProblemType } from "@/types";

export default function DashboardPage() {
  const { data: patients, isLoading: patientsLoading } = useQuery<PatientListItem[]>({
    queryKey: ["/api/patients/patients/"],
  });

  const { data: healthProblemTypes, isLoading: typesLoading } = useQuery<HealthProblemType[]>({
    queryKey: ["/api/health-problems/types/"],
  });

  const totalPatients = patients?.length || 0;
  const activePatients = patients?.filter(p => p.is_active).length || 0;
  const totalHealthProblems = patients?.reduce((acc, p) => acc + p.health_problems_count, 0) || 0;
  const activeTypes = healthProblemTypes?.filter(t => t.is_active).length || 0;

  const recentPatients = patients?.slice(0, 5) || [];

  const stats = [
    {
      title: "Total Patients",
      value: totalPatients,
      icon: Users,
      description: "Registered patients",
      color: "text-blue-500",
    },
    {
      title: "Active Patients",
      value: activePatients,
      icon: Activity,
      description: "Currently active",
      color: "text-green-500",
    },
    {
      title: "Health Problems",
      value: totalHealthProblems,
      icon: ClipboardList,
      description: "Total registrations",
      color: "text-purple-500",
    },
    {
      title: "Problem Types",
      value: activeTypes,
      icon: TrendingUp,
      description: "Active categories",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground">Overview of health monitoring system</p>
        </div>
        <div className="flex gap-2">
          <Button asChild data-testid="button-new-patient">
            <Link href="/patients/new">
              <Plus className="mr-2 h-4 w-4" />
              New Patient
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {patientsLoading || typesLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>Latest patient registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No patients registered yet</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/patients/new">Register first patient</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    className="flex items-center justify-between p-3 rounded-md hover-elevate cursor-pointer"
                    data-testid={`patient-item-${patient.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{patient.full_name}</p>
                        <p className="text-sm text-muted-foreground">{patient.document_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {patient.health_problems_count > 0 && (
                        <Badge variant="secondary" size="sm">
                          {patient.health_problems_count} problem{patient.health_problems_count !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Problem Types</CardTitle>
            <CardDescription>Available problem categories</CardDescription>
          </CardHeader>
          <CardContent>
            {typesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !healthProblemTypes || healthProblemTypes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ClipboardList className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No health problem types defined</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/form-builder">Create first type</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {healthProblemTypes.slice(0, 5).map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    data-testid={`health-type-item-${type.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {type.questions_count} question{type.questions_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" size="sm">
                      {type.patients_count} patient{type.patients_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
