import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  DEFAULT_PERMISSIONS,
  type Role,
  type Permission,
} from "@/lib/roles-and-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, ArrowLeft, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminRoles() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    } else {
      loadRoles();
    }
  }, [isAdmin, navigate]);

  const loadRoles = () => {
    const allRoles = getAllRoles();
    setRoles(allRoles);
  };

  const handleCreateRole = () => {
    if (!formData.name.trim() || selectedPermissions.size === 0) {
      toast.error("Role name and at least one permission required");
      return;
    }

    const newRole = createRole({
      name: formData.name,
      description: formData.description,
      permissions: Array.from(selectedPermissions),
    });

    setRoles(getAllRoles());
    setFormData({ name: "", description: "" });
    setSelectedPermissions(new Set());
    setShowNewRoleModal(false);
    toast.success("Role created successfully");
  };

  const handleUpdateRole = () => {
    if (!editingRole || !formData.name.trim() || selectedPermissions.size === 0) {
      toast.error("Role name and at least one permission required");
      return;
    }

    updateRole(editingRole.id, {
      name: formData.name,
      description: formData.description,
      permissions: Array.from(selectedPermissions),
    });

    setRoles(getAllRoles());
    setEditingRole(null);
    setFormData({ name: "", description: "" });
    setSelectedPermissions(new Set());
    toast.success("Role updated successfully");
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      deleteRole(roleId);
      setRoles(getAllRoles());
      toast.success("Role deleted successfully");
    }
  };

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description });
    setSelectedPermissions(new Set(role.permissions));
  };

  const togglePermission = (permissionId: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissions(newSet);
  };

  const modules = [...new Set(DEFAULT_PERMISSIONS.map(p => p.module))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Roles Management</h1>
                <p className="text-sm text-muted-foreground">Create and manage user roles with custom permissions</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingRole(null);
                setFormData({ name: "", description: "" });
                setSelectedPermissions(new Set());
                setShowNewRoleModal(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Role
            </Button>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4">
          {roles.map((role) => (
            <div key={role.id} className="border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{role.name}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  {!role.isCustom && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2 inline-block">System Role</span>}
                </div>
                <div className="flex gap-2">
                  {role.isCustom && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(role)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-foreground mb-2">Permissions ({role.permissions.length})</p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permId) => {
                    const perm = DEFAULT_PERMISSIONS.find(p => p.id === permId);
                    return perm ? (
                      <span key={permId} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                        {perm.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      {(showNewRoleModal || editingRole) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingRole ? "Edit Role" : "Create New Role"}
              </h2>
              <button
                onClick={() => {
                  setShowNewRoleModal(false);
                  setEditingRole(null);
                  setFormData({ name: "", description: "" });
                  setSelectedPermissions(new Set());
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Quality Assurance"
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this role's purpose"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-4">
                  Permissions (Select at least one)
                </label>

                {modules.map((module) => {
                  const modulePerms = DEFAULT_PERMISSIONS.filter(p => p.module === module);
                  return (
                    <div key={module} className="mb-6">
                      <h4 className="text-sm font-semibold text-foreground mb-3 capitalize">{module}</h4>
                      <div className="grid gap-2 pl-4">
                        {modulePerms.map((perm) => (
                          <label key={perm.id} className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="w-4 h-4 rounded border-input"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{perm.name}</p>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewRoleModal(false);
                    setEditingRole(null);
                    setFormData({ name: "", description: "" });
                    setSelectedPermissions(new Set());
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingRole ? handleUpdateRole : handleCreateRole}
                  className="flex-1 gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
