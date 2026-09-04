import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { STORE_NAME } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata = { title: "Admin login" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const usingDefault = !process.env.ADMIN_PASSWORD;
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="card w-full max-w-sm p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500">{STORE_NAME}</p>
        <h1 className="mt-1 text-2xl font-semibold">Store admin</h1>
        <LoginForm />
        {usingDefault && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            Default password is <code className="font-mono">admin123</code>. Set <code className="font-mono">ADMIN_PASSWORD</code> in <code>.env</code> before going live.
          </p>
        )}
      </div>
    </main>
  );
}
