import { redirect } from "next/navigation";

/** Payment options are configured at the organization level. */
export default function NewPaymentOptionPage() {
  redirect("/organization?tab=Payment%20Options");
}
