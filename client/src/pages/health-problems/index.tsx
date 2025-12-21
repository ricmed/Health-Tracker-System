import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, MoreHorizontal, Edit, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { HealthProblemType } from "@/types";

export default function HealthProblemsPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: healthProblemTypes, isLoading } = useQuery<HealthProblemType[]>({
    queryKey: ["/api/health-problems/types/"],
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/health-problems/types/${id}/toggle_active/`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-problems/types/"] });
      toast({
        title: "Status updated",
        description: "Health problem type status has been updated.",
      });
    },
  });

  const filteredTypes = healthProblemTypes?.filter((type) =>
    type.name.toLowerCase().includes(search.toLowerCase()) ||
    type.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Health Problem Types</h1>
          <p className="text-muted-foreground">Manage health problem categories and forms</p>
        </div>
        <Button asChild data-testid="button-new-type">
          <Link href="/form-builder">
            <Plus className="mr-2 h-4 w-4" />
            New Type
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Types</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search types..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : !filteredTypes || filteredTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No health problem types found</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/form-builder">Create your first type</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTypes.map((type) => (
                <Card key={type.id} className="relative" data-testid={`card-type-${type.id}`}>
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-md"
                    style={{ backgroundColor: type.color }}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <CardTitle className="text-base">{type.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/form-builder?id=${type.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Form
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMutation.mutate(type.id)}>
                            {type.is_active ? (
                              <>
                                <ToggleLeft className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {type.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="outline" size="sm">
                          {type.questions_count} question{type.questions_count !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="secondary" size="sm">
                          {type.patients_count} patient{type.patients_count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <Badge variant={type.is_active ? "default" : "secondary"} size="sm">
                        {type.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
