import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  Mail,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  Circle,
  Search,
  Loader2,
  Save,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { HealthProblemType, Question, FieldType, FieldDependency } from "@/types";

const fieldTypeIcons: Record<FieldType, typeof Type> = {
  text: Type,
  textarea: AlignLeft,
  email: Mail,
  number: Hash,
  date: Calendar,
  select: ChevronDown,
  multiselect: CheckSquare,
  radio: Circle,
  checkbox: CheckSquare,
  autocomplete: Search,
  file: Type,
};

const fieldTypeLabels: Record<FieldType, string> = {
  text: "Text Input",
  textarea: "Text Area",
  email: "Email",
  number: "Number",
  date: "Date",
  select: "Single Select",
  multiselect: "Multi Select",
  radio: "Radio Buttons",
  checkbox: "Checkbox",
  autocomplete: "Autocomplete",
  file: "File Upload",
};

const typeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").regex(/^[a-z_]+$/, "Code must be lowercase letters and underscores only"),
  description: z.string().optional(),
  color: z.string().default("#3B82F6"),
  icon: z.string().default("clipboard-list"),
});

type TypeFormData = z.infer<typeof typeSchema>;

const questionSchema = z.object({
  label: z.string().min(1, "Label is required"),
  field_type: z.string(),
  placeholder: z.string().optional(),
  help_text: z.string().optional(),
  is_required: z.boolean().default(false),
  options: z.string().optional(),
  section: z.string().optional(),
  has_conditional_required: z.boolean().default(false),
  dependency_field: z.string().optional(),
  dependency_operator: z.string().optional(),
  dependency_value: z.string().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function FormBuilderPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const editId = params.get("id");
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isFormLoaded, setIsFormLoaded] = useState(false);

  const { data: existingType, isLoading: typeLoading } = useQuery<HealthProblemType>({
    queryKey: [`/api/health-problems/types/${editId}/`],
    enabled: !!editId,
  });

  const typeForm = useForm<TypeFormData>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      color: "#3B82F6",
      icon: "clipboard-list",
    },
  });

  const questionForm = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      label: "",
      field_type: "text",
      placeholder: "",
      help_text: "",
      is_required: false,
      options: "",
      section: "",
      has_conditional_required: false,
      dependency_field: "",
      dependency_operator: "equals",
      dependency_value: "",
    },
  });

  useEffect(() => {
    if (existingType && !isFormLoaded) {
      typeForm.reset({
        name: existingType.name,
        code: existingType.code,
        description: existingType.description || "",
        color: existingType.color || "#3B82F6",
        icon: existingType.icon || "clipboard-list",
      });
      if (existingType.question_schema?.questions) {
        setQuestions(existingType.question_schema.questions);
      }
      setIsFormLoaded(true);
    }
  }, [existingType, isFormLoaded, typeForm]);

  const createTypeMutation = useMutation({
    mutationFn: async (data: TypeFormData) => {
      const payload = {
        ...data,
        question_schema: { questions },
      };
      const res = await apiRequest("POST", "/api/health-problems/types/", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-problems/types/"] });
      toast({
        title: "Health problem type created",
        description: "The type and form have been saved successfully.",
      });
      navigate("/health-problems");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create health problem type",
        variant: "destructive",
      });
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async (data: TypeFormData) => {
      const payload = {
        ...data,
        question_schema: { questions },
      };
      const res = await apiRequest("PUT", `/api/health-problems/types/${editId}/`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-problems/types/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-problems/types", editId] });
      toast({
        title: "Health problem type updated",
        description: "The type and form have been updated successfully.",
      });
      navigate("/health-problems");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update health problem type",
        variant: "destructive",
      });
    },
  });

  const addQuestion = (data: QuestionFormData) => {
    const options = data.options
      ? data.options.split(",").map((opt) => ({
          value: opt.trim().toLowerCase().replace(/\s+/g, "_"),
          label: opt.trim(),
        }))
      : undefined;

    let conditionallyRequired: FieldDependency | undefined;
    if (data.has_conditional_required && data.dependency_field) {
      conditionallyRequired = {
        field_id: data.dependency_field,
        operator: data.dependency_operator as FieldDependency['operator'] || 'is_truthy',
        value: data.dependency_value || undefined,
      };
    }

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      label: data.label,
      type: data.field_type as FieldType,
      required: data.is_required,
      placeholder: data.placeholder,
      help_text: data.help_text,
      options,
      order: questions.length + 1,
      section: data.section,
      conditionally_required: conditionallyRequired,
    };

    setQuestions([...questions, newQuestion]);
    questionForm.reset();
    setShowQuestionForm(false);
    toast({
      title: "Question added",
      description: "The question has been added to the form.",
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const onSubmit = (data: TypeFormData) => {
    if (questions.length === 0) {
      toast({
        title: "No questions",
        description: "Please add at least one question to the form.",
        variant: "destructive",
      });
      return;
    }
    if (editId) {
      updateTypeMutation.mutate(data);
    } else {
      createTypeMutation.mutate(data);
    }
  };

  const colorOptions = [
    "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280",
  ];

  const isPending = createTypeMutation.isPending || updateTypeMutation.isPending;

  const watchHasConditional = questionForm.watch("has_conditional_required");
  const watchFieldType = questionForm.watch("field_type");

  if (editId && typeLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[600px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/health-problems">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            {editId ? "Edit Health Problem Type" : "New Health Problem Type"}
          </h1>
          <p className="text-muted-foreground">Define the form structure for this health problem</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Type Details</CardTitle>
              <CardDescription>Basic information about this health problem type</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...typeForm}>
                <form className="space-y-4">
                  <FormField
                    control={typeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Diabetes Type 2" data-testid="input-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={typeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="diabetes_t2" 
                            data-testid="input-code" 
                            disabled={!!editId}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={typeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Description of this health problem type..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={typeForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <div className="flex gap-2 flex-wrap">
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`h-8 w-8 rounded-md border-2 transition-all ${
                                field.value === color ? "border-foreground scale-110" : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Question</CardTitle>
              <CardDescription>Define form fields for data collection</CardDescription>
            </CardHeader>
            <CardContent>
              {!showQuestionForm ? (
                <Button
                  onClick={() => setShowQuestionForm(true)}
                  className="w-full"
                  variant="outline"
                  data-testid="button-add-question"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              ) : (
                <Form {...questionForm}>
                  <form onSubmit={questionForm.handleSubmit(addQuestion)} className="space-y-4">
                    <FormField
                      control={questionForm.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Label *</FormLabel>
                          <FormControl>
                            <Input placeholder="Blood glucose level" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={questionForm.control}
                      name="field_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(fieldTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {["select", "multiselect", "radio", "autocomplete"].includes(watchFieldType) && (
                      <FormField
                        control={questionForm.control}
                        name="options"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Options (comma-separated)</FormLabel>
                            <FormControl>
                              <Input placeholder="Yes, No, Maybe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={questionForm.control}
                      name="placeholder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Placeholder</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter value..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={questionForm.control}
                      name="is_required"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <FormLabel>Always Required</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              This field is always mandatory
                            </p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={questionForm.control}
                      name="has_conditional_required"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <FormLabel>Conditionally Required</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Required based on another field
                            </p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {watchHasConditional && questions.length > 0 && (
                      <div className="space-y-3 rounded-lg border p-3 bg-muted/50">
                        <p className="text-sm font-medium">Dependency Settings</p>
                        <FormField
                          control={questionForm.control}
                          name="dependency_field"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>When this field</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select field" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {questions.map((q) => (
                                    <SelectItem key={q.id} value={q.id}>
                                      {q.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={questionForm.control}
                          name="dependency_operator"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Condition</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || "equals"}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select condition" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="is_truthy">Is checked / has value</SelectItem>
                                  <SelectItem value="is_falsy">Is not checked / empty</SelectItem>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not_equals">Does not equal</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {["equals", "not_equals", "contains"].includes(questionForm.watch("dependency_operator") || "") && (
                          <FormField
                            control={questionForm.control}
                            name="dependency_value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Value</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter expected value" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}
                    {watchHasConditional && questions.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Add at least one question first to set up dependencies.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowQuestionForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1">
                        Add
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="min-h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Form Preview</CardTitle>
                  <CardDescription>
                    {questions.length} question{questions.length !== 1 ? "s" : ""} added
                  </CardDescription>
                </div>
                <Button
                  onClick={typeForm.handleSubmit(onSubmit)}
                  disabled={isPending}
                  data-testid="button-save"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {editId ? "Update Type" : "Save Type"}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Type className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No questions yet</p>
                  <p className="text-sm">Add questions using the form on the left</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => {
                    const Icon = fieldTypeIcons[question.type] || Type;
                    const dependsOnField = question.conditionally_required
                      ? questions.find((q) => q.id === question.conditionally_required?.field_id)
                      : null;
                    return (
                      <div
                        key={question.id}
                        className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                        data-testid={`question-item-${question.id}`}
                      >
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GripVertical className="h-4 w-4 cursor-move" />
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{question.label}</span>
                            {question.required && (
                              <Badge variant="destructive" size="sm">Required</Badge>
                            )}
                            {question.conditionally_required && (
                              <Badge variant="outline" size="sm" className="gap-1">
                                <Link2 className="h-3 w-3" />
                                Required if {dependsOnField?.label || 'field'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Type: {fieldTypeLabels[question.type]}
                            {question.options && ` (${question.options.length} options)`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(question.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
