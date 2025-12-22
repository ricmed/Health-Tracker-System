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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { Patient, PatientHealthProblem, HealthProblemType, Question } from "@/types";

export default function PatientDetailPage() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddProblemDialog, setShowAddProblemDialog] = useState(false);
  const [selectedProblemType, setSelectedProblemType] = useState<string>("");
  const [formAnswers, setFormAnswers] = useState<Record<string, unknown>>({});

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients/patients", patientId],
  });

  const { data: healthProblems } = useQuery<PatientHealthProblem[]>({
    queryKey: ["/api/health-problems/patient-problems/", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/health-problems/patient-problems/?patient=${patientId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch health problems");
      return res.json();
    },
    enabled: !!patientId,
  });

  const { data: healthProblemTypes } = useQuery<HealthProblemType[]>({
    queryKey: ["/api/health-problems/types/permitted/"],
  });

  const selectedType = healthProblemTypes?.find(
    (t) => t.id.toString() === selectedProblemType
  );
  const questions = selectedType?.question_schema?.questions || [];

  const handleSelectProblemType = (value: string) => {
    setSelectedProblemType(value);
    setFormAnswers({});
  };

  const handleAnswerChange = (questionId: string, value: unknown) => {
    setFormAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const addProblemMutation = useMutation({
    mutationFn: async () => {
      const typeId = parseInt(selectedProblemType);
      const res = await apiRequest("POST", "/api/health-problems/patient-problems/", {
        patient: parseInt(patientId || "0"),
        health_problem_type: typeId,
        status: "active",
        severity: "medium",
      });
      const patientHealthProblem = await res.json();

      if (Object.keys(formAnswers).length > 0) {
        await apiRequest(
          "POST",
          `/api/health-problems/patient-problems/${patientHealthProblem.id}/add_response/`,
          { answers: formAnswers }
        );
      }

      return patientHealthProblem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-problems/patient-problems/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/patients"] });
      setShowAddProblemDialog(false);
      setSelectedProblemType("");
      setFormAnswers({});
      toast({
        title: "Health problem registered",
        description: "The health problem and form data have been saved.",
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

  const renderQuestionField = (question: Question) => {
    const value = formAnswers[question.id];
    const today = new Date().toISOString().split("T")[0];

    switch (question.type) {
      case "text":
      case "email":
        return (
          <Input
            type={question.type}
            placeholder={question.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            maxLength={question.validation?.max_length}
            data-testid={`input-${question.id}`}
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={question.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            maxLength={question.validation?.max_length}
            data-testid={`textarea-${question.id}`}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={question.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            min={question.validation?.allow_negative === false ? 0 : question.validation?.min}
            max={question.validation?.max}
            data-testid={`input-${question.id}`}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            max={question.validation?.use_current_date_as_max ? today : question.validation?.max_date}
            min={question.validation?.min_date}
            data-testid={`input-${question.id}`}
          />
        );
      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(v) => handleAnswerChange(question.id, v)}
          >
            <SelectTrigger data-testid={`select-${question.id}`}>
              <SelectValue placeholder={question.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {question.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => handleAnswerChange(question.id, checked)}
              data-testid={`checkbox-${question.id}`}
            />
            <span className="text-sm">{question.placeholder || "Yes"}</span>
          </div>
        );
      case "multiselect":
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            {question.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedValues.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleAnswerChange(question.id, [...selectedValues, opt.value]);
                    } else {
                      handleAnswerChange(question.id, selectedValues.filter((v) => v !== opt.value));
                    }
                  }}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      default:
        return (
          <Input
            placeholder={question.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
        );
    }
  };

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
      <div className="flex items-center justify-between flex-wrap gap-4">
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
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showAddProblemDialog} onOpenChange={(open) => {
            setShowAddProblemDialog(open);
            if (!open) {
              setSelectedProblemType("");
              setFormAnswers({});
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-problem">
                <Plus className="mr-2 h-4 w-4" />
                Add Health Problem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Register Health Problem</DialogTitle>
                <DialogDescription>
                  Select a health problem type and fill in the required data
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 py-4 pr-4">
                  <div>
                    <label className="text-sm font-medium">Health Problem Type *</label>
                    <Select value={selectedProblemType} onValueChange={handleSelectProblemType}>
                      <SelectTrigger className="mt-1" data-testid="select-problem-type">
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

                  {selectedType && questions.length > 0 && (
                    <div className="space-y-4 rounded-lg border p-4 mt-4">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: selectedType.color }}
                        />
                        {selectedType.name} - Registration Form
                      </p>
                      <Separator />
                      <div className="grid gap-4 md:grid-cols-2">
                        {questions.map((question) => (
                          <div
                            key={question.id}
                            className={question.type === "textarea" ? "md:col-span-2" : ""}
                          >
                            <label className="text-sm font-medium">
                              {question.label}
                              {question.required && <span className="text-destructive ml-1">*</span>}
                            </label>
                            {question.help_text && (
                              <p className="text-xs text-muted-foreground mb-1">{question.help_text}</p>
                            )}
                            <div className="mt-1">
                              {renderQuestionField(question)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedType && questions.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4">
                      This health problem type has no form questions configured.
                    </p>
                  )}
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAddProblemDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addProblemMutation.mutate()}
                  disabled={!selectedProblemType || addProblemMutation.isPending}
                  data-testid="button-register-problem"
                >
                  {addProblemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Register Health Problem"
                  )}
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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
