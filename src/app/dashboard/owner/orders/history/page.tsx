import { redirect } from "next/navigation";

export default function LegacyHistoryRedirect() {
  redirect("/dashboard/owner/history");
}
