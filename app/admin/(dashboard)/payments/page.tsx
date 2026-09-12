import { adminListPaymentMethods } from "@/lib/services/payments";
import { PaymentMethodForm } from "@/components/admin/payment-method-form";

export default async function AdminPaymentsPage() {
  const methods = await adminListPaymentMethods();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">طرق الدفع</h1>
      <p className="mt-1 text-sm text-muted">
        فودافون كاش وإنستاباي تحويل يدوي حاليًا -- بيانات الحساب هنا تُعرض للعميل عند الدفع فقط.
      </p>
      <div className="mt-6 space-y-6">
        {methods.map((method) => (
          <PaymentMethodForm key={method.id} method={method} />
        ))}
      </div>
    </div>
  );
}
