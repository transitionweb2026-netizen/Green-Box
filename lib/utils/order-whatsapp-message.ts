import type { OrderAddressSnapshot, OrderDetail, OrderSlotSnapshot } from "@/lib/services/orders";
import { formatPrice, pickLocalized } from "@/lib/i18n/localized";

/**
 * Plain-text order summary for the customer to send to the store's
 * WhatsApp number after checkout. There is no WhatsApp Business API
 * integration here -- no automatic server-side send is possible without
 * Meta business-verified credentials this project doesn't have -- so this
 * only builds the message text for a wa.me link (see lib/utils/whatsapp.ts)
 * that the customer taps to send themselves.
 */
export function buildOrderWhatsAppMessage(order: OrderDetail, locale: string): string {
  const address = order.address_snapshot as unknown as OrderAddressSnapshot;
  const slot = order.delivery_slot_snapshot as unknown as OrderSlotSnapshot;
  const isAr = locale !== "en";

  const itemLines = order.order_items
    .map((item) => {
      const name = pickLocalized(item.product_name_ar, item.product_name_en, locale);
      return `- ${name} x${item.quantity} — ${formatPrice(item.line_total, locale)}`;
    })
    .join("\n");

  const deliveryDate = new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const slotLabel = pickLocalized(slot.label_ar, slot.label_en, locale);

  if (isAr) {
    return [
      `طلب جديد من جرين بوكس`,
      `رقم الطلب: ${order.order_number}`,
      ``,
      itemLines,
      ``,
      `الإجمالي: ${formatPrice(order.total, locale)}`,
      ``,
      `العنوان: ${address.detailed_address}، ${address.area}، ${address.city}`,
      `التوصيل: ${deliveryDate} — ${slotLabel} (${slot.start_time}-${slot.end_time})`,
      `الاسم: ${address.recipient_name} — ${address.phone}`,
    ].join("\n");
  }

  return [
    `New Green Box order`,
    `Order number: ${order.order_number}`,
    ``,
    itemLines,
    ``,
    `Total: ${formatPrice(order.total, locale)}`,
    ``,
    `Address: ${address.detailed_address}, ${address.area}, ${address.city}`,
    `Delivery: ${deliveryDate} — ${slotLabel} (${slot.start_time}-${slot.end_time})`,
    `Name: ${address.recipient_name} — ${address.phone}`,
  ].join("\n");
}
