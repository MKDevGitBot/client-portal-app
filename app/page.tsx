import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/ui/login-form";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
