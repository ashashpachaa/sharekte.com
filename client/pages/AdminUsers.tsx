import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import {
  getAllUsers,
  searchUsers,
  updateUserStatus,
  deleteUser,
  addUserNote,
  updateUserDetails,
  createUser,
  updateUserRole,
  type UserAccount,
} from "@/lib/user-management";
import { getRoleByName } from "@/lib/roles-and-permissions";
import { getLoginHistory } from "@/lib/login-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Eye,
  ArrowLeft,
  Plus,
  X,
  Check,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "suspended" | "inactive"
  >("all");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingNote, setEditingNote] = useState("");
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "client" as const,
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    } else {
      refreshUsers();
    }
  }, [isAdmin, navigate]);

  const refreshUsers = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
  };

  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchQuery) {
      result = searchUsers(searchQuery);
    }

    if (filterStatus !== "all") {
      result = result.filter((u) => u.accountStatus === filterStatus);
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [users, searchQuery, filterStatus]);

  const handleSuspendUser = (userId: string) => {
    updateUserStatus(userId, "suspended");
    refreshUsers();
    toast.success("User suspended");
  };

  const handleReactivateUser = (userId: string) => {
    updateUserStatus(userId, "active");
    refreshUsers();
    toast.success("User reactivated");
  };

  const handleDeleteUser = (userId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      deleteUser(userId);
      refreshUsers();
      setShowDetailsModal(false);
      toast.success("User deleted");
    }
  };

  const handleAddNote = (userId: string) => {
    if (editingNote.trim()) {
      addUserNote(userId, editingNote);
      refreshUsers();
      setEditingNote("");
      toast.success("Note added");

      // Update selected user if viewing details
      if (selectedUser?.id === userId) {
        const updated = getAllUsers().find((u) => u.id === userId);
        if (updated) setSelectedUser(updated);
      }
    }
  };

  const handleCreateUser = () => {
    if (!newUserData.name || !newUserData.email) {
      toast.error("Name and email are required");
      return;
    }

    createUser({
      name: newUserData.name,
      email: newUserData.email,
      phone: newUserData.phone,
      company: newUserData.company,
      role: newUserData.role,
    });

    refreshUsers();
    setNewUserData({
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "client",
    });
    setShowNewUserModal(false);
    toast.success("User created");
  };

  const handleEditUserDetail = (
    userId: string,
    field: string,
    value: string,
  ) => {
    updateUserDetails(userId, { [field]: value });
    refreshUsers();

    if (selectedUser?.id === userId) {
      const updated = getAllUsers().find((u) => u.id === userId);
      if (updated) setSelectedUser(updated);
    }
    toast.success("User updated");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Users Management
            </h1>
          </div>
          <Button
            className="bg-primary hover:bg-primary-600 text-white gap-2"
            onClick={() => setShowNewUserModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "active" ? "default" : "outline"}
              onClick={() => setFilterStatus("active")}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === "suspended" ? "default" : "outline"}
              onClick={() => setFilterStatus("suspended")}
            >
              Suspended
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Registered
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.id}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {user.company || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            user.accountStatus === "active"
                              ? "bg-green-100 text-green-700"
                              : user.accountStatus === "suspended"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.accountStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(user.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {user.accountStatus === "active" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspendUser(user.id)}
                            >
                              <Lock className="w-4 h-4 text-orange-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivateUser(user.id)}
                            >
                              <Unlock className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </main>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border/40 sticky top-0 bg-background">
              <h2 className="text-xl font-bold text-foreground">
                User Details
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Account Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold">
                      Name
                    </label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={selectedUser.name}
                        onChange={(e) =>
                          handleEditUserDetail(
                            selectedUser.id,
                            "name",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold">
                      Email
                    </label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={selectedUser.email}
                        onChange={(e) =>
                          handleEditUserDetail(
                            selectedUser.id,
                            "email",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold">
                      Phone
                    </label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={selectedUser.phone || ""}
                        onChange={(e) =>
                          handleEditUserDetail(
                            selectedUser.id,
                            "phone",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold">
                      Company
                    </label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={selectedUser.company || ""}
                        onChange={(e) =>
                          handleEditUserDetail(
                            selectedUser.id,
                            "company",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">User Role</h3>
                <select
                  value={selectedUser.role}
                  onChange={(e) => {
                    updateUserRole(selectedUser.id, e.target.value as any);
                    refreshUsers();
                    const updated = getAllUsers().find(
                      (u) => u.id === selectedUser.id,
                    );
                    if (updated) setSelectedUser(updated);
                    toast.success("Role updated");
                  }}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                  <option value="administrations">Administrations</option>
                  <option value="operations">Operations</option>
                  <option value="accounting">Accounting</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Account Status
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant={
                      selectedUser.accountStatus === "active"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleReactivateUser(selectedUser.id)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Active
                  </Button>
                  <Button
                    variant={
                      selectedUser.accountStatus === "suspended"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleSuspendUser(selectedUser.id)}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                </div>
              </div>

              {/* Login History */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Recent Login History
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {getLoginHistory(selectedUser.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No login history
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getLoginHistory(selectedUser.id)
                        .slice()
                        .reverse()
                        .slice(0, 10)
                        .map((login) => (
                          <div
                            key={login.id}
                            className="text-xs border-l-2 border-primary pl-3 py-1"
                          >
                            <p className="font-semibold text-foreground">
                              {login.device}
                            </p>
                            <p className="text-muted-foreground">
                              IP: {login.ipAddress}
                            </p>
                            <p className="text-muted-foreground">
                              {new Date(login.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Orders and Invoices */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Orders & Invoices
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Orders</p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedUser.orders.length}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Invoices
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedUser.invoices.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Internal Notes
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 max-h-32 overflow-y-auto min-h-20">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {selectedUser.notes || "No notes yet"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a note..."
                    value={editingNote}
                    onChange={(e) => setEditingNote(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddNote(selectedUser.id)}
                    disabled={!editingNote.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <h3 className="font-semibold text-destructive text-sm">
                  Danger Zone
                </h3>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border/40">
              <h2 className="text-xl font-bold text-foreground">
                Add New User
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewUserModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">
                  Name *
                </label>
                <Input
                  placeholder="John Doe"
                  value={newUserData.name}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">
                  Email *
                </label>
                <Input
                  placeholder="john@example.com"
                  value={newUserData.email}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">
                  Phone
                </label>
                <Input
                  placeholder="+1 234 567 8900"
                  value={newUserData.phone}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">
                  Company
                </label>
                <Input
                  placeholder="Company Name"
                  value={newUserData.company}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, company: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">
                  Role *
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) =>
                    setNewUserData({
                      ...newUserData,
                      role: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                  <option value="administrations">Administrations</option>
                  <option value="operations">Operations</option>
                  <option value="accounting">Accounting</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewUserModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary-600 text-white"
                  onClick={handleCreateUser}
                >
                  Create User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
