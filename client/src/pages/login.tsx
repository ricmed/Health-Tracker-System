import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { ClipboardList, Loader2, Globe, LayoutDashboard, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PublicDashboardGroup } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: publicDashboards, isLoading: dashboardsLoading } = useQuery<PublicDashboardGroup[]>({
    queryKey: ["/api/dashboards/dashboards/public/"],
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalDashboards = publicDashboards?.reduce((acc, group) => acc + group.dashboards.length, 0) || 0;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-80 flex-col border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Health System</span>
              <span className="text-xs text-muted-foreground">Monitoring</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">Public Dashboards</span>
            {totalDashboards > 0 && (
              <Badge variant="secondary" size="sm" className="ml-auto">
                {totalDashboards}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {dashboardsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : publicDashboards && publicDashboards.length > 0 ? (
              publicDashboards.map((group) => (
                <div key={group.health_problem_type_id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: group.health_problem_type_color }}
                    />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {group.health_problem_type_name}
                    </span>
                  </div>
                  {group.dashboards.map((dashboard) => (
                    <Link
                      key={dashboard.id}
                      href={`/reports/${dashboard.id}`}
                      className="block"
                    >
                      <div
                        className="flex items-center gap-3 rounded-lg border p-3 hover-elevate cursor-pointer"
                        data-testid={`link-public-dashboard-${dashboard.id}`}
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{dashboard.name}</p>
                          {dashboard.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {dashboard.description}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <LayoutDashboard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No public dashboards available
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-end p-4 border-b lg:border-b-0">
          <ThemeToggle />
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-semibold">Health Monitoring System</CardTitle>
                <CardDescription>Sign in to manage health records</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="admin@health.com"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              data-testid="input-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-login"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <p>Demo credentials:</p>
                  <p>Email: admin@health.com | Password: admin123</p>
                </div>
              </CardContent>
            </Card>

            <div className="lg:hidden">
              {totalDashboards > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">Public Dashboards</CardTitle>
                      <Badge variant="secondary" size="sm" className="ml-auto">
                        {totalDashboards}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {publicDashboards?.slice(0, 3).flatMap(group =>
                      group.dashboards.slice(0, 2).map(dashboard => (
                        <Link
                          key={dashboard.id}
                          href={`/reports/${dashboard.id}`}
                          className="block"
                        >
                          <div className="flex items-center gap-3 rounded-lg border p-3 hover-elevate">
                            <div
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: group.health_problem_type_color }}
                            />
                            <span className="text-sm truncate flex-1">{dashboard.name}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
