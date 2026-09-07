import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { hasAnyRole } from "@/lib/auth/rbac";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const roles = (session.user.roles ?? []) as string[];
  if (!(await hasAnyRole(roles, ["super_admin", "admin"]))) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
