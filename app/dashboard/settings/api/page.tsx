"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, Plus, AlertCircle, Key, Trash2, CheckSquare } from "lucide-react";
import { createApiTokenAction, listApiTokensAction, revokeApiTokenAction } from "./actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTokenName, setNewTokenName] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [generatedToken, setGeneratedToken] = useState<{ name: string; plainToken: string } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadTokens = async () => {
    setLoading(true);
    const res = await listApiTokensAction();
    if (res.success && res.data) {
      setTokens(res.data);
    } else {
      toast.error("Failed to load API tokens");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) return toast.error("Token name is required");
    setIsCreating(true);
    const res = await createApiTokenAction(newTokenName, isLive);
    if (res.success && res.data) {
      setGeneratedToken({
        name: res.data.name,
        plainToken: res.data.plainToken,
      });
      toast.success("API token created successfully!");
      setNewTokenName("");
      setCreateDialogOpen(false);
      loadTokens();
    } else {
      toast.error(res.error || "Failed to create token");
    }
    setIsCreating(false);
  };

  const handleRevoke = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke immediately the token "${name}"? This will break any integrations using it.`)) {
      const res = await revokeApiTokenAction(id);
      if (res.success) {
        toast.success(`Token "${name}" revoked securely.`);
        loadTokens();
      } else {
        toast.error("Failed to revoke token");
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">API Tokens</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage your secret authentication keys. Use these tokens in the `Authorization: Bearer {"<"}token{">"}` header for Postman or automated integrations.
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-[0_4px_14px_0_rgba(22,163,74,0.39)]">
              <Plus className="mr-2 h-4 w-4" />
              Generate New Token
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-t-4 border-t-green-500">
            <DialogHeader>
              <DialogTitle>Create new API Token</DialogTitle>
              <DialogDescription>
                Tokens allow full access to authenticated endpoints. Keep them secure.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Token Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Postman Staging, Zapier Integration"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="focus-visible:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label>Environment Prefix</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={isLive ? "default" : "outline"}
                    onClick={() => setIsLive(true)}
                    className={isLive ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                  >
                    Live (nv_live_...)
                  </Button>
                  <Button
                    type="button"
                    variant={!isLive ? "default" : "outline"}
                    onClick={() => setIsLive(false)}
                    className={!isLive ? "bg-black hover:bg-gray-800 text-white" : ""}
                  >
                    Test (nv_test_...)
                  </Button>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleCreateToken} 
              disabled={isCreating || !newTokenName.trim()} 
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              {isCreating ? "Generating..." : "Generate Token"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {generatedToken && (
        <Card className="border-green-500 bg-green-50/50 dark:bg-green-950/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
          <CardHeader className="pb-3 border-b border-green-100 dark:border-green-900/50">
            <CardTitle className="text-green-800 dark:text-green-300 flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Token Generated Successfully
            </CardTitle>
            <CardDescription className="text-green-700/80 dark:text-green-400">
              This is the only time your secret token will be shown. Please copy it immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white dark:bg-black border border-green-200 dark:border-green-800 rounded-md p-3 font-mono text-sm break-all font-medium text-black dark:text-white">
                {generatedToken.plainToken}
              </div>
              <Button onClick={() => copyToClipboard(generatedToken.plainToken)} variant="secondary" className="shrink-0 bg-white hover:bg-gray-100 dark:bg-gray-900 shadow border">
                <Copy className="h-4 w-4 mr-2" />
                Copy Secret
              </Button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-red-600 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Warning: If you lose this token, you will need to generate a new one.</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-bold text-black dark:text-white">Token Name</th>
                <th className="px-6 py-4 font-bold text-black dark:text-white">Prefix</th>
                <th className="px-6 py-4 font-bold text-black dark:text-white">Created At</th>
                <th className="px-6 py-4 font-bold text-black dark:text-white">Last Used</th>
                <th className="px-6 py-4 text-right font-bold text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Loading tokens...
                  </td>
                </tr>
              ) : tokens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <Key className="w-8 h-8 opacity-20" />
                    No API tokens found. Generate one to get started.
                  </td>
                </tr>
              ) : (
                tokens.map((token) => (
                  <tr key={token.id} className={`border-b last:border-0 dark:border-gray-800 transition-colors ${token.revoked ? "bg-red-50/50 dark:bg-red-950/10 opacity-75" : "hover:bg-gray-50 dark:hover:bg-gray-900/50"}`}>
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <Key className={`w-4 h-4 ${token.revoked ? 'text-red-400' : 'text-green-500'}`} />
                      <span className={token.revoked ? "line-through text-muted-foreground" : "text-black dark:text-white"}>{token.name}</span>
                      {token.revoked && <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full ml-2">Revoked</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {token.prefix}••••••••
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString() : "Never used"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleRevoke(token.id, token.name)}
                        disabled={token.revoked}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
