import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Plus, Search, MoreHorizontal, Shield, UserCheck, UserX, Settings, Users, FileText, LayoutDashboard, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, HealthProblemType } from "@/types";

interface CreateUserForm {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  password_confirm: string;
  is_staff: boolean;
  can_manage_patients: boolean;
  can_manage_reports: boolean;
  can_create_dashboards: boolean;
  health_problem_permission_ids: number[];
}

interface EditUserForm {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_staff: boolean;
  can_manage_patients: boolean;
  can_manage_reports: boolean;
  can_create_dashboards: boolean;
}

const initialFormState: CreateUserForm = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  password: "",
  password_confirm: "",
  is_staff: false,
  can_manage_patients: false,
  can_manage_reports: false,
  can_create_dashboards: false,
  health_problem_permission_ids: [],
};

const initialEditFormState: EditUserForm = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  is_staff: false,
  can_manage_patients: false,
  can_manage_reports: false,
  can_create_dashboards: false,
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>(initialFormState);
  const [editForm, setEditForm] = useState<EditUserForm>(initialEditFormState);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/auth/users/"],
    enabled: !!currentUser,
  });

  const { data: healthProblemTypes } = useQuery<HealthProblemType[]>({
    queryKey: ["/api/health-problems/types/"],
    enabled: !!currentUser,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      const res = await apiRequest("POST", "/api/auth/users/", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users/"] });
      setShowCreateDialog(false);
      setCreateForm(initialFormState);
      toast({
        title: "User created",
        description: "New user has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating user",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/auth/users/${userId}/toggle_active/`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users/"] });
      toast({
        title: "User updated",
        description: "User status has been updated.",
      });
    },
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
      setShowPermissionsDialog(false);
      toast({
        title: "Permissions updated",
        description: "User health problem permissions have been updated.",
      });
    },
  });

  const updateUserPermissionsMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/auth/users/${userId}/`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users/"] });
      toast({
        title: "User updated",
        description: "User permissions have been updated.",
      });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: EditUserForm }) => {
      const res = await apiRequest("PATCH", `/api/auth/users/${userId}/`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users/"] });
      setShowEditDialog(false);
      setEditForm(initialEditFormState);
      setEditingUserId(null);
      toast({
        title: "User updated",
        description: "User details have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating user",
        description: error.message || "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const openPermissionsDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedPermissions(user.health_problem_permissions?.map((hp) => hp.id) || []);
    setShowPermissionsDialog(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || "",
      is_staff: user.is_staff,
      can_manage_patients: user.can_manage_patients,
      can_manage_reports: user.can_manage_reports,
      can_create_dashboards: user.can_create_dashboards,
    });
    setShowEditDialog(true);
  };

  const handleEditUser = () => {
    if (!editForm.email || !editForm.first_name || !editForm.last_name) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (editingUserId) {
      editUserMutation.mutate({ userId: editingUserId, data: editForm });
    }
  };

  const togglePermission = (typeId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const toggleCreateFormHealthProblem = (typeId: number) => {
    setCreateForm((prev) => ({
      ...prev,
      health_problem_permission_ids: prev.health_problem_permission_ids.includes(typeId)
        ? prev.health_problem_permission_ids.filter((id) => id !== typeId)
        : [...prev.health_problem_permission_ids, typeId],
    }));
  };

  const savePermissions = () => {
    if (selectedUser) {
      assignPermissionsMutation.mutate({
        userId: selectedUser.id,
        healthProblemIds: selectedPermissions,
      });
    }
  };

  const handleCreateUser = () => {
    if (!createForm.email || !createForm.first_name || !createForm.last_name || !createForm.password) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (createForm.password !== createForm.password_confirm) {
      toast({
        title: "Validation error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (createForm.password.length < 8) {
      toast({
        title: "Validation error",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const filteredUsers = users?.filter((user) =>
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-user">
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No users found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {user.first_name[0]}{user.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            {user.phone && (
                              <p className="text-sm text-muted-foreground">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.is_staff ? (
                          <Badge variant="default" size="sm">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.can_manage_patients && (
                            <Badge variant="outline" size="sm" title="Can manage patients">
                              <Users className="h-3 w-3" />
                            </Badge>
                          )}
                          {user.can_manage_reports && (
                            <Badge variant="outline" size="sm" title="Can manage reports">
                              <FileText className="h-3 w-3" />
                            </Badge>
                          )}
                          {user.can_create_dashboards && (
                            <Badge variant="outline" size="sm" title="Can create dashboards">
                              <LayoutDashboard className="h-3 w-3" />
                            </Badge>
                          )}
                          {user.health_problem_permissions && user.health_problem_permissions.length > 0 && (
                            <Badge variant="outline" size="sm">
                              {user.health_problem_permissions.length} health issue{user.health_problem_permissions.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {!user.can_manage_patients && !user.can_manage_reports && !user.can_create_dashboards && 
                           (!user.health_problem_permissions || user.health_problem_permissions.length === 0) && (
                            <span className="text-sm text-muted-foreground">No permissions</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"} size="sm">
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${user.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(user)} data-testid={`button-edit-${user.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPermissionsDialog(user)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleActiveMutation.mutate(user.id)}>
                              {user.is_active ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system and configure their permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={createForm.first_name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={createForm.last_name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@example.com"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  data-testid="input-phone"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm Password *</Label>
                <Input
                  id="password_confirm"
                  type="password"
                  value={createForm.password_confirm}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password_confirm: e.target.value }))}
                  placeholder="Repeat password"
                  data-testid="input-password-confirm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">User Permissions</Label>
              
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Administrator</p>
                    <p className="text-sm text-muted-foreground">Full access to all system features</p>
                  </div>
                </div>
                <Switch
                  checked={createForm.is_staff}
                  onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, is_staff: checked }))}
                  data-testid="switch-is-admin"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Patients</p>
                    <p className="text-sm text-muted-foreground">Create, edit, and delete patient records</p>
                  </div>
                </div>
                <Switch
                  checked={createForm.can_manage_patients}
                  onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, can_manage_patients: checked }))}
                  data-testid="switch-manage-patients"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Reports</p>
                    <p className="text-sm text-muted-foreground">Create, edit, and delete reports</p>
                  </div>
                </div>
                <Switch
                  checked={createForm.can_manage_reports}
                  onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, can_manage_reports: checked }))}
                  data-testid="switch-manage-reports"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Create Dashboards</p>
                    <p className="text-sm text-muted-foreground">Create new dashboards and visualizations</p>
                  </div>
                </div>
                <Switch
                  checked={createForm.can_create_dashboards}
                  onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, can_create_dashboards: checked }))}
                  data-testid="switch-create-dashboards"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Health Issue Permissions</Label>
              <p className="text-sm text-muted-foreground">Select which health issue types this user can register</p>
              
              {healthProblemTypes && healthProblemTypes.length > 0 ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {healthProblemTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center space-x-3 rounded-lg border p-3"
                    >
                      <Checkbox
                        id={`create-hp-${type.id}`}
                        checked={createForm.health_problem_permission_ids.includes(type.id)}
                        onCheckedChange={() => toggleCreateFormHealthProblem(type.id)}
                        data-testid={`checkbox-hp-${type.id}`}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <label htmlFor={`create-hp-${type.id}`} className="font-medium cursor-pointer">
                          {type.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No health problem types available
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              data-testid="button-save-user"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Configure permissions for {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label className="text-base font-semibold">System Permissions</Label>
              
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Patients</p>
                  </div>
                </div>
                <Switch
                  checked={selectedUser?.can_manage_patients || false}
                  onCheckedChange={(checked) => {
                    if (selectedUser) {
                      updateUserPermissionsMutation.mutate({
                        userId: selectedUser.id,
                        data: { can_manage_patients: checked }
                      });
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Reports</p>
                  </div>
                </div>
                <Switch
                  checked={selectedUser?.can_manage_reports || false}
                  onCheckedChange={(checked) => {
                    if (selectedUser) {
                      updateUserPermissionsMutation.mutate({
                        userId: selectedUser.id,
                        data: { can_manage_reports: checked }
                      });
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Create Dashboards</p>
                  </div>
                </div>
                <Switch
                  checked={selectedUser?.can_create_dashboards || false}
                  onCheckedChange={(checked) => {
                    if (selectedUser) {
                      updateUserPermissionsMutation.mutate({
                        userId: selectedUser.id,
                        data: { can_create_dashboards: checked }
                      });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Health Issue Permissions</Label>
              {healthProblemTypes?.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center space-x-3 rounded-lg border p-3"
                >
                  <Checkbox
                    id={`hp-${type.id}`}
                    checked={selectedPermissions.includes(type.id)}
                    onCheckedChange={() => togglePermission(type.id)}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <label htmlFor={`hp-${type.id}`} className="font-medium cursor-pointer">
                      {type.name}
                    </label>
                  </div>
                </div>
              ))}
              {(!healthProblemTypes || healthProblemTypes.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No health problem types available
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={savePermissions}
              disabled={assignPermissionsMutation.isPending}
            >
              Save Health Issue Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name *</Label>
                <Input
                  id="edit_first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                  data-testid="input-edit-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name *</Label>
                <Input
                  id="edit_last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                  data-testid="input-edit-last-name"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@example.com"
                  data-testid="input-edit-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  data-testid="input-edit-phone"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">User Permissions</Label>
              
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Administrator</p>
                    <p className="text-sm text-muted-foreground">Full access to all system features</p>
                  </div>
                </div>
                <Switch
                  checked={editForm.is_staff}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_staff: checked }))}
                  data-testid="switch-edit-is-admin"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Patients</p>
                    <p className="text-sm text-muted-foreground">Create, edit, and delete patient records</p>
                  </div>
                </div>
                <Switch
                  checked={editForm.can_manage_patients}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, can_manage_patients: checked }))}
                  data-testid="switch-edit-manage-patients"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Reports</p>
                    <p className="text-sm text-muted-foreground">Create, edit, and delete reports</p>
                  </div>
                </div>
                <Switch
                  checked={editForm.can_manage_reports}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, can_manage_reports: checked }))}
                  data-testid="switch-edit-manage-reports"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Create Dashboards</p>
                    <p className="text-sm text-muted-foreground">Create new dashboards and visualizations</p>
                  </div>
                </div>
                <Switch
                  checked={editForm.can_create_dashboards}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, can_create_dashboards: checked }))}
                  data-testid="switch-edit-create-dashboards"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="button-cancel-edit-user">
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={editUserMutation.isPending}
              data-testid="button-save-edit-user"
            >
              {editUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
