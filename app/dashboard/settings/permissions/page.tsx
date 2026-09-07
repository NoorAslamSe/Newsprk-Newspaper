"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Shield, ShieldAlert, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PERMISSION_MODULES = {
  "Users": [
    { key: "users.manage", label: "Manage User Directory" },
    { key: "users.invite", label: "Invite New Users" },
    { key: "users.roles", label: "Assign User Roles" },
  ],
  "Articles": [
    { key: "articles.view", label: "View All Articles" },
    { key: "articles.create", label: "Create & Edit Drafts" },
    { key: "articles.publish", label: "Publish Articles Live" },
  ],
  "Media Library": [
    { key: "media.view", label: "Browse Global Media" },
    { key: "media.upload", label: "Upload & Delete Files" },
  ],
  "Advertising": [
    { key: "ads.view", label: "View Ad Injections" },
    { key: "adsmanager.manage", label: "Manage Global Ad Settings" },
  ],
  "API Access": [
    { key: "api.tokens", label: "Manage Secret API Keys" },
  ],
  "System Config": [
    { key: "templates.manage", label: "Edit Site Templates" },
    { key: "settings.manage", label: "Modify Global Settings" },
  ]
};

const MANAGED_ROLES = ["editor", "author"];

interface RolePolicy {
  roleName: string;
  permissions: string[];
}

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [matrix, setMatrix] = useState<Record<string, string[]>>({
    editor: [],
    author: []
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["permissions-matrix"],
    queryFn: async () => {
      const res = await fetch("/api/settings/permissions");
      if (!res.ok) throw new Error("Could not fetch permissions.");
      return res.json();
    }
  });

  useEffect(() => {
    if (data?.items) {
      const initialMap: Record<string, string[]> = { editor: [], author: [] };
      data.items.forEach((p: RolePolicy) => {
        if (MANAGED_ROLES.includes(p.roleName)) {
           initialMap[p.roleName] = p.permissions;
        }
      });
      setMatrix(initialMap);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = MANAGED_ROLES.map(roleName => ({
        roleName,
        permissions: matrix[roleName] || []
      }));
      const res = await fetch("/api/settings/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save Role Policies.");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Permissions updated securely! System cache cleared.");
      queryClient.invalidateQueries({ queryKey: ["permissions-matrix"] });
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleToggle = (role: string, permKey: string, checked: boolean) => {
    setMatrix(prev => {
      const perms = prev[role] || [];
      return {
        ...prev,
        [role]: checked ? [...perms, permKey] : perms.filter(p => p !== permKey)
      };
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Matrix...</div>;
  if (error) return <div className="p-8 text-center text-destructive">Failed to load permissions list. You may not have access.</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
           <ShieldAlert className="w-5 h-5 text-primary" /> Role Access Policies
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Strictly define precisely what features each non-admin role is authorized to utilize globally.
        </p>
      </div>

      <Alert className="bg-primary/5 text-primary border-primary/20">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Immutable Guardian</AlertTitle>
        <AlertDescription>
          The <strong>Admin</strong> role is a hidden master scope and implicitly owns all permissions below. It therefore cannot be downgraded here.
        </AlertDescription>
      </Alert>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 font-semibold w-1/2">Module Feature</th>
                {MANAGED_ROLES.map(r => (
                  <th key={r} className="p-4 font-semibold text-center capitalize">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSION_MODULES).map(([moduleName, features]) => (
                 <React.Fragment key={moduleName}>
                    <tr className="bg-muted/20">
                       <td colSpan={MANAGED_ROLES.length + 1} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                         {moduleName}
                       </td>
                    </tr>
                    {features.map(feat => (
                       <tr key={feat.key} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-foreground">{feat.label}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{feat.key}</div>
                          </td>
                          {MANAGED_ROLES.map(role => (
                            <td key={role} className="p-4 text-center">
                              <Checkbox 
                                id={`${role}-${feat.key}`}
                                checked={(matrix[role] || []).includes(feat.key)}
                                onCheckedChange={(val) => handleToggle(role, feat.key, !!val)}
                                className="scale-110"
                              />
                            </td>
                          ))}
                       </tr>
                    ))}
                 </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-4">
         <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="shadow-lg hover:shadow-xl px-8 h-10 transition-all">
           {saveMutation.isPending ? "Validating & Securing..." : "Enforce Role Policies globally"}
         </Button>
      </div>
    </div>
  );
}
