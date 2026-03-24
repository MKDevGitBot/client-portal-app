import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex">
      <Sidebar
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
        }}
      />
      <main className="ml-64 flex-1 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
