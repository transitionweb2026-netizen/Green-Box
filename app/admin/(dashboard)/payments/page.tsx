import { Wallet } from "lucide-react";
import { adminListPaymentMethods } from "@/lib/services/payments";
import { PaymentMethodForm } from "@/components/admin/payment-method-form";

export default async function AdminPaymentsPage() {
  const methods = await adminListPaymentMethods();

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">طرق الدفع</h1>
          <p className="mt-0.5 text-sm text-muted">
            فودافون كاش وإنستاباي تحويل يدوي حاليًا -- بيانات الحساب هنا تُعرض للعميل عند الدفع فقط.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {methods.map((method) => (
          <PaymentMethodForm key={method.id} method={method} />
        ))}
      </div>
    </div>
  );
}
