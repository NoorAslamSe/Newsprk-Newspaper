"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, UserX, Image as ImageIcon } from "lucide-react";
import { MediaSelectionModal, type MediaItem } from "@/components/admin/MediaSelectionModal";

type UserProfile = {
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  avatarUrl?: string | null;
};

async function fetchProfile() {
  const res = await fetch("/api/users/me");
  if (!res.ok) throw new Error("Failed to load profile");
  return (await res.json()) as { item: UserProfile };
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const initial = data?.item;
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setAvatarUrl(initial.avatarUrl || "");
    }
  }, [initial]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      return json;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  return (
    <div className="grid gap-6 px-4 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold">User Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your personal account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identity</CardTitle>
          <CardDescription>Update your public display name and avatar</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[120px_1fr]">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="size-24 ring-2 ring-primary/10">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setIsMediaModalOpen(true)}>
              <ImageIcon className="w-3 h-3 mr-2" />
              Change Avatar
            </Button>
            {avatarUrl && (
              <Button variant="ghost" size="sm" className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setAvatarUrl("")}>
                Remove
              </Button>
            )}
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Email <span className="text-xs text-muted-foreground">(Read-only)</span></Label>
              <Input value={initial?.email ?? ""} disabled className="bg-muted/50 cursor-not-allowed" />
            </div>
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label>Custom Avatar URL <span className="text-xs text-muted-foreground">(Optional override)</span></Label>
              <div className="flex items-center gap-2">
                <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} disabled={isLoading} placeholder="https://..." />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Status & Roles</CardTitle>
          <CardDescription>Your current system access level</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {isLoading ? (
                <span className="text-sm text-muted-foreground">Loading...</span>
              ) : initial?.roles?.map((role) => (
                <Badge key={role} variant="secondary" className="capitalize">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <div className="mt-1">
              {isLoading ? null : initial?.isActive ? (
                <Badge variant="default">
                  <UserCheck className="mr-1 h-3 w-3" /> Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <UserX className="mr-1 h-3 w-3" /> Inactive
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || (name === initial?.name && avatarUrl === (initial?.avatarUrl || ""))}>
          {saveMutation.isPending ? "Saving…" : "Save changes"}
        </Button>
        {saveMutation.error ? (
          <span className="text-sm text-destructive">{(saveMutation.error as Error).message}</span>
        ) : null}
      </div>

      <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        filterType="image"
        multiSelect={false}
        title="Select Avatar"
        description="Choose an image from your library to set as your profile avatar"
        onMediaSelect={(media) => {
          if (!Array.isArray(media) && media.url) {
            setAvatarUrl(media.url);
          }
        }}
      />
    </div>
  );
}
