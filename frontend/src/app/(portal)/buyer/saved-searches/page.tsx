import { redirect } from "next/navigation";

export default function BuyerSavedSearchesPage() {
  redirect("/buyer/saved?tab=searches");
}
