import type { Payment } from "@/lib/data/payments";
import { LocalizedDate } from "@/components/ui/LocalizedDate";
import { Badge } from "@/components/ui/Badge";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";

interface PaymentHistoryRowProps {
  payment: Payment;
}

export function PaymentHistoryRow({ payment }: PaymentHistoryRowProps): React.ReactElement {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted"><LocalizedDate iso={payment.paidAt} showTime={false} /></span>
      <Badge variant="soft" size="sm">{payment.method === "card" ? "Card" : "Cash"}</Badge>
      <span className="font-medium ml-auto">${(payment.amount / 100).toFixed(2)}</span>
      {payment.receiptUrl && (
        <a
          href={payment.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent/80 transition-colors"
        >
          <ArrowSquareOutIcon size={14} />
        </a>
      )}
    </li>
  );
}
