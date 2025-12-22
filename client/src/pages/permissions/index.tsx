import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Save, Users, Activity } from "lucide-react";
import { useLocation } from "wouter";
import type { User, HealthProblemType } from "@/types";

export default function PermissionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [pendingChanges, setPendingChanges] = useState<Record<number, number[]>>({});

  useEffect(() => {
    if (!authLoading && (!user || !user.is_staff)) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/auth/users/"],
    enabled: !!user?.is_staff,
  });

  const { data: healthProblemTypes, isLoading: typesLoading } = useQuery<HealthProblemType[]>({
    queryKey: ["/api/health-problems/types/"],
    enabled: !!user?.is_staff,
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: async ({ userId, healthProblemIds }: { userId: number; healthProblemIds: number[] }) => {
      const res = await apiRequest("POST", `/api/auth/users/${userId}/assign_health_problems/`, {
        health_problem_ids: healthProblemIds,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users/"] });
    },
  });

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!user?.is_staff) {
    return null;
  }

  const isLoading = usersLoading || typesLoading;

  const getUserPermissions = (userId: number): number[] => {
    if (pendingChanges[userId]) {
      return pendingChanges[userId];
    }
    const foundUser = users?.find((u) => u.id === userId);
    return foundUser?.health_problem_permissions?.map((hp) => hp.id) || [];
  };

  const togglePermission = (userId: number, typeId: number) => {
    const currentPermissions = getUserPermissions(userId);
    const newPermissions = currentPermissions.includes(typeId)
      ? currentPermissions.filter((id) => id !== typeId)
      : [...currentPermissions, typeId];
    
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: newPermissions,
    }));
  };

  const hasChanges = (userId: number): boolean => {
    if (!pendingChanges[userId]) return false;
    const originalUser = users?.find((u) => u.id === userId);
    const original = originalUser?.health_problem_permissions?.map((hp) => hp.id) || [];
    const pending = pendingChanges[userId];
    if (original.length !== pending.length) return true;
    return !original.every((id) => pending.includes(id));
  };

  const saveUserPermissions = async (userId: number) => {
    const permissions = getUserPermissions(userId);
    await assignPermissionsMutation.mutateAsync({ userId, healthProblemIds: permissions });
    setPendingChanges((prev) => {
      const newChanges = { ...prev };
      delete newChanges[userId];
      return newChanges;
    });
    toast({
      title: "Permissions updated",
      description: "User permissions have been saved successfully.",
    });
  };

  const saveAllChanges = async () => {
    const userIds = Object.keys(pendingChanges).map(Number);
    for (const userId of userIds) {
      if (hasChanges(userId)) {
        await saveUserPermissions(userId);
      }
    }
  };

  const hasPendingChanges = Object.keys(pendingChanges).some((userId) => hasChanges(Number(userId)));

  const nonAdminUsers = users?.filter((u) => !u.is_staff) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Permissions Matrix</h1>
          <p className="text-muted-foreground">Manage which health problem types each user can register</p>
        </div>
        {hasPendingChanges && (
          <Button 
            onClick={saveAllChanges} 
            disabled={assignPermissionsMutation.isPending}
            data-testid="button-save-all"
          >
            <Save className="mr-2 h-4 w-4" />
            Save All Changes
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{nonAdminUsers.length}</p>
                <p className="text-sm text-muted-foreground">Regular Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{healthProblemTypes?.filter((t) => t.is_active).length || 0}</p>
                <p className="text-sm text-muted-foreground">Active Health Problem Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users?.filter((u) => u.is_staff).length || 0}</p>
                <p className="text-sm text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
          <CardDescription>
            Administrators have full access to all health problem types. Configure permissions for regular users below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : nonAdminUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No regular users found</p>
              <p className="text-sm">All users are administrators with full access</p>
            </div>
          ) : (
            <div className="space-y-6">
              {nonAdminUsers.map((u) => (
                <div 
                  key={u.id} 
                  className="rounded-lg border p-4 space-y-4"
                  data-testid={`card-user-${u.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!u.is_active && (
                        <Badge variant="secondary" size="sm">Inactive</Badge>
                      )}
                      {hasChanges(u.id) && (
                        <Button 
                          size="sm" 
                          onClick={() => saveUserPermissions(u.id)}
                          disabled={assignPermissionsMutation.isPending}
                          data-testid={`button-save-${u.id}`}
                        >
                          <Save className="mr-1 h-3 w-3" />
                          Save
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {healthProblemTypes?.filter((t) => t.is_active).map((type) => {
                      const isChecked = getUserPermissions(u.id).includes(type.id);
                      return (
                        <div
                          key={type.id}
                          className="flex items-center gap-2 rounded-md border p-2"
                        >
                          <Checkbox
                            id={`perm-${u.id}-${type.id}`}
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(u.id, type.id)}
                            data-testid={`checkbox-${u.id}-${type.id}`}
                          />
                          <div
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: type.color }}
                          />
                          <label
                            htmlFor={`perm-${u.id}-${type.id}`}
                            className="text-sm cursor-pointer truncate"
                          >
                            {type.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  
                  {(!healthProblemTypes || healthProblemTypes.filter((t) => t.is_active).length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No active health problem types available
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
