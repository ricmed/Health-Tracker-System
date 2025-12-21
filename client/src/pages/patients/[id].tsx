import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Edit,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  ClipboardList,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, PatientHealthProblem, HealthProblemType } from "@/types";

export default function PatientDetailPage() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddProblemDialog, setShowAddProblemDialog] = useState(false);
  const [selectedProblemType, setSelectedProblemType] = useState<string>("");

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients/patients", patientId],
  });

  const { data: healthProblems } = useQuery<PatientHealthProblem[]>({
    queryKey: ["/api/health-problems/patient-problems/", { patient: patientId }],
    enabled: !!patientId,
  });

  const { data: healthProblemTypes } = useQuery<HealthProblemType[]>({
    queryKey: ["/api/health-problems/types/permitted/"],
  });

  const addProblemMutation = useMutation({
    mutationFn: async (typeId: number) => {
      const res = await apiRequest("POST", "/api/health-problems/patient-problems/", {
        patient: parseInt(patientId || "0"),
        health_problem_type: typeId,
        status: "active",
        severity: "medium",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-problems/patient-problems/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/patients"] });
      setShowAddProblemDialog(false);
      setSelectedProblemType("");
      toast({
        title: "Health problem registered",
        description: "The health problem has been added to this patient.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register health problem",
        variant: "destructive",
      });
    },
  });

  const genderLabels: Record<string, string> = {
    M: "Male",
    F: "Female",
    O: "Other",
    U: "Not specified",
  };

  const statusColors: Record<string, string> = {
    active: "bg-red-500",
    monitoring: "bg-yellow-500",
    resolved: "bg-green-500",
    chronic: "bg-purple-500",
  };

  const severityColors: Record<string, string> = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-orange-600",
    critical: "text-red-600",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient not found</p>
        <Button asChild variant="link">
          <Link href="/patients">Back to patients</Link>
        </Button>
      </div>
    );
  }

  const primaryAddress = patient.addresses?.find((a) => a.is_primary);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-patient-name">
              {patient.full_name}
            </h1>
            <p className="text-muted-foreground">{patient.document_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddProblemDialog} onOpenChange={setShowAddProblemDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-problem">
                <Plus className="mr-2 h-4 w-4" />
                Add Health Problem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register Health Problem</DialogTitle>
                <DialogDescription>
                  Select a health problem type to register for this patient
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={selectedProblemType} onValueChange={setSelectedProblemType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select health problem type" />
                  </SelectTrigger>
                  <SelectContent>
                    {healthProblemTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddProblemDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addProblemMutation.mutate(parseInt(selectedProblemType))}
                  disabled={!selectedProblemType || addProblemMutation.isPending}
                >
                  Register
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" asChild>
            <Link href={`/patients/${patientId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-semibold">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{patient.age} years old ({patient.date_of_birth})</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{genderLabels[patient.gender]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
              {primaryAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {primaryAddress.street}, {primaryAddress.number}
                    <br />
                    {primaryAddress.city}, {primaryAddress.state}
                  </span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={patient.is_active ? "default" : "secondary"}>
                {patient.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <Tabs defaultValue="health-problems" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="health-problems">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Health Problems
                </TabsTrigger>
                <TabsTrigger value="history">
                  <Activity className="mr-2 h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="health-problems" className="mt-0">
                {!healthProblems || healthProblems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No health problems registered</p>
                    <Button
                      variant="link"
                      onClick={() => setShowAddProblemDialog(true)}
                    >
                      Register first health problem
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {healthProblems.map((problem) => (
                      <div
                        key={problem.id}
                        className="flex items-start gap-4 p-4 rounded-lg border"
                        data-testid={`problem-item-${problem.id}`}
                      >
                        <div
                          className={`h-3 w-3 rounded-full mt-1 ${statusColors[problem.status]}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{problem.health_problem_type_name}</span>
                            <Badge variant="outline" size="sm">
                              {problem.status}
                            </Badge>
                            <span className={`text-sm ${severityColors[problem.severity]}`}>
                              {problem.severity} severity
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Registered on {new Date(problem.created_at).toLocaleDateString()}
                            {problem.registered_by_name && ` by ${problem.registered_by_name}`}
                          </p>
                          {problem.notes && (
                            <p className="text-sm mt-2">{problem.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="history" className="mt-0">
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Patient history will be displayed here</p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
