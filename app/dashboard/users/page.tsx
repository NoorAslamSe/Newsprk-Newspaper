"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { type ColumnDef } from "@tanstack/react-table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  Shield, 
  ShieldAlert,
  Crown,
  Trash2, 
  Pencil, 
  UserCheck, 
  UserX, 
  MoreHorizontal,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { SortableDataTable, type SortableColumn } from "@/components/ui/SortableDataTable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Role hierarchy config (mirrors backend) ─────────
const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  admin: 50,
  editor: 20,
  author: 10,
};

const ROLE_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  super_admin: { color: "bg-amber-500/10 text-amber-500 border-amber-500/30", icon: <Crown className="w-3 h-3" /> },
  admin: { color: "bg-red-500/10 text-red-500 border-red-500/30", icon: <ShieldAlert className="w-3 h-3" /> },
  editor: { color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: <Shield className="w-3 h-3" /> },
  author: { color: "bg-green-500/10 text-green-500 border-green-500/30", icon: null },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Untouchable root authority — full system control",
  admin: "Full operational control — manages editors & authors",
  editor: "Manages all content — publish & edit posts",
  author: "Limited — creates and manages own posts only",
};

function getMaxRoleLevel(roles: string[]): number {
  if (!roles?.length) return 0;
  return Math.max(...roles.map((r) => ROLE_HIERARCHY[r] ?? 0));
}

/** Returns true if the actor can manage the target (outranks them) */
function canActorManage(actorRoles: string[], targetRoles: string[]): boolean {
  if (targetRoles.includes("super_admin")) return false;
  if (targetRoles.includes("admin") && !actorRoles.includes("super_admin")) return false;
  return getMaxRoleLevel(actorRoles) > getMaxRoleLevel(targetRoles);
}

/** Returns which roles the actor is allowed to assign */
function getAssignableRoles(actorRoles: string[]): string[] {
  const actorLevel = getMaxRoleLevel(actorRoles);
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, level]) => level < actorLevel)
    .map(([role]) => role);
}

type UserRow = {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt?: string;
};

type InvitationRow = {
  _id: string;
  email: string;
  roles: string[];
  invitedBy: { name: string; email: string };
  expiresAt: string;
  createdAt: string;
};

export default function UsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const myRoles = (session?.user?.roles ?? []) as string[];

  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<UserRow | null>(null);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("author");

  // --- QUERIES ---

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      return res.json() as Promise<{ items: UserRow[] }>;
    },
  });

  const { data: invitationsData, isLoading: isLoadingInvites } = useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const res = await fetch("/api/users/invite/pending");
      if (!res.ok) throw new Error("Failed to load invitations");
      return res.json() as Promise<{ items: InvitationRow[] }>;
    },
  });

  // --- MUTATIONS ---

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/users/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete users");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      const res = await fetch("/api/users/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Status updated successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, roles }: { id: string; roles: string[] }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update roles");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Roles updated successfully");
      setRoleDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, roles }: { email: string; roles: string[] }) => {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, roles }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Invite failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation sent successfully!");
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("author");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const revokeInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/users/invite/pending", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to revoke invite");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation revoked.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Roles that the current user is allowed to assign
  const assignableRoles = getAssignableRoles(myRoles);

  // --- COLUMNS ---

  const columns = React.useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-medium flex items-center gap-2">
            {row.original.name}
            {session?.user?.id === row.original._id && (
              <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                You
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email}</span>,
      },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(row.original.roles ?? []).map((role) => {
              const style = ROLE_STYLE[role] || {};
              return (
                <Badge key={role} variant="outline" className={`capitalize text-[10px] font-bold gap-1 ${style.color || ""}`}>
                  {style.icon}
                  {role === "super_admin" ? "Super Admin" : role}
                </Badge>
              );
            })}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"} className="text-[10px] font-black uppercase">
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = session?.user?.id === user._id;
          const canManage = canActorManage(myRoles, user.roles || []);

          // No actions for self or protected users
          if (isSelf || !canManage) {
            if (user.roles?.includes("super_admin") && !isSelf) {
              return (
                <Badge variant="outline" className="text-[9px] font-bold text-amber-500/60 border-amber-500/20">
                  <Crown className="w-3 h-3 mr-1" /> Protected
                </Badge>
              );
            }
            return null;
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setUserToEdit(user); setSelectedRoles(user.roles || []); setRoleDialogOpen(true); }}>
                  <Pencil className="mr-2 h-4 w-4" /> Manage Roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => statusMutation.mutate({ ids: [user._id], isActive: !user.isActive })}>
                  {user.isActive ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                  {user.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive font-bold" onClick={() => { setItemToDelete(user._id); setDeleteDialogOpen(true); }}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [session?.user?.id, myRoles]
  );

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            User Management
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">Manage members and pending system invitations.</p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)} className="shadow-lg hover:shadow-xl transition-all h-11 px-6 font-bold">
          <UserPlus className="mr-2 h-4 w-4" /> Invite New Member
        </Button>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-muted/50 p-1 h-12 inline-flex border border-white/5">
          <TabsTrigger value="members" className="h-10 px-8 data-[state=active]:shadow-sm font-bold flex items-center gap-2">
            Active Members
            <Badge variant="secondary" className="ml-1 bg-background text-[10px]">
              {usersData?.items?.length ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="invites" className="h-10 px-8 data-[state=active]:shadow-sm font-bold flex items-center gap-2">
            Pending Invites
            <Badge variant="secondary" className="ml-1 bg-background text-[10px]">
              {invitationsData?.items?.length ?? 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-8">
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              <SortableDataTable
                columns={columns}
                data={usersData?.items || []}
                loading={isLoadingUsers}
                searchPlaceholder="Filter members by name or email..."
                emptyMessage="No organization members found."
                enableRowSelection
                onBulkDelete={async (rows) => {
                  const ids = rows.map((r) => r._id);
                  deleteMutation.mutate(ids);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="mt-8">
          <Card className="border-white/5 bg-background shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-xl font-black">System Invitations</CardTitle>
              <CardDescription className="font-medium">
                Unclaimed invitations. Token-links expire automatically after 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b-muted">
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest pl-6 py-4">Email Address</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Assigned Roles</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Invited By</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Expiration</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest text-right pr-6 py-4">Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingInvites ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center">
                          <RefreshCcw className="w-8 h-8 animate-spin mx-auto text-primary opacity-50" />
                        </TableCell>
                      </TableRow>
                    ) : invitationsData?.items?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-medium italic">
                          No pending invitations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invitationsData?.items?.map((invite) => (
                        <TableRow key={invite._id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="font-bold pl-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-primary" />
                              </div>
                              {invite.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 flex-wrap">
                              {invite.roles.map((role: string) => {
                                const style = ROLE_STYLE[role] || {};
                                return (
                                  <Badge key={role} variant="outline" className={`capitalize text-[10px] font-bold gap-1 ${style.color || "border-muted-foreground/20"}`}>
                                    {style.icon}
                                    {role === "super_admin" ? "Super Admin" : role}
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {invite.invitedBy?.name || "System"}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                              <Clock className="w-3 h-3 text-red-500" />
                              {new Date(invite.expiresAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive font-bold hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("Revoke this invitation? This link will cease to function immediately.")) {
                                  revokeInviteMutation.mutate(invite._id);
                                }
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Revoke Invite
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog — with role selection */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Invite Member</DialogTitle>
            <DialogDescription className="font-medium">
              Send a magic link to a new member's email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6 border-y border-white/10 my-2">
            <div className="grid gap-2">
              <Label htmlFor="invite-email" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Recipient Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@organization.com"
                className="h-12 bg-muted/30 border-white/5 focus-visible:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Assign Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-12 bg-muted/30 border-white/5">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      <div className="flex items-center gap-2">
                        {ROLE_STYLE[role]?.icon}
                        <span className="font-bold capitalize">{role === "super_admin" ? "Super Admin" : role}</span>
                        <span className="text-xs text-muted-foreground ml-2">— {ROLE_DESCRIPTIONS[role]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl border border-white/5">
              <p className="text-[10px] uppercase font-black text-muted-foreground mb-2 flex items-center gap-2">
                <Shield className="w-3 h-3 text-primary" />
                Governance Note
              </p>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                You can only assign roles below your own privilege level. {myRoles.includes("super_admin")
                  ? "As Super Admin, you can invite Admins, Editors, and Authors."
                  : "As Admin, you can invite Editors and Authors only."}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="font-bold" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="px-8 font-black shadow-lg hover:shadow-primary/20 transition-all"
              onClick={() => inviteMutation.mutate({ email: inviteEmail, roles: [inviteRole] })}
              disabled={!inviteEmail.trim() || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Sending MAGIC LINK..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Roles Dialog — only shows assignable roles */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Escalate Permissions</DialogTitle>
            <DialogDescription className="font-medium">
              Update system roles for {userToEdit?.name || "this user"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-8 border-y border-white/10 my-2">
            <div className="flex flex-col gap-4">
              {assignableRoles.map((role) => {
                const style = ROLE_STYLE[role] || {};
                return (
                  <div key={role} className={`flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-white/5 hover:bg-muted/50 transition-colors`}>
                    <div className="flex flex-col">
                      <Label htmlFor={`role-${role}`} className="capitalize font-black text-sm cursor-pointer flex items-center gap-2">
                        {style.icon}
                        {role === "super_admin" ? "Super Admin" : role}
                      </Label>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {ROLE_DESCRIPTIONS[role] || ""}
                      </span>
                    </div>
                    <Checkbox 
                      id={`role-${role}`} 
                      className="size-5 border-2 border-primary/20"
                      checked={selectedRoles.includes(role)} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles(prev => [...prev, role]);
                        } else {
                          setSelectedRoles(prev => prev.filter(r => r !== role));
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="font-bold" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button
              className="px-8 font-black shadow-lg transition-all"
              onClick={() => {
                if (userToEdit) {
                  roleMutation.mutate({ id: userToEdit._id, roles: selectedRoles });
                }
              }}
              disabled={roleMutation.isPending || selectedRoles.length === 0}
            >
              {roleMutation.isPending ? "Updating Database..." : "Commit Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
               <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-center">Irreversible Action</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-medium">
              Are you absolutely certain? This will permanently erase this account and all associated metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="font-bold border-none bg-muted hover:bg-muted/80">Keep Account</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  deleteMutation.mutate([itemToDelete]);
                  setItemToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black px-8"
            >
              Destroy Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
