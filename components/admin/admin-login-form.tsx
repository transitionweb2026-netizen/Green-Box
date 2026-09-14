"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { adminLoginAction, type AdminLoginState } from "@/app/admin/login/actions";

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(adminLoginAction, { status: "idle" } as AdminLoginState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.status === "error" && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
        {!isPending && <LogIn className="h-4 w-4" />}
        {isPending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
      </Button>
    </form>
  );
}
