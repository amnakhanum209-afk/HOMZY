import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import RecommendationForm from "@/app/components/RecommendationForm";

export default async function RecommendationsPage() {
  const session = await verifySession();

  // Login required
  if (!session) {
    redirect("/login");
  }

  // Only tenants can access this page
  if (session.role !== "TENANT" || session.isOwner) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <RecommendationForm />
    </main>
  );
}