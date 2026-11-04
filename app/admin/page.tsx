
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export default async function AdminDashboard() {
  // 1. Verify login session
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  // 2. Verify Admin role directly from the database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      role: true,
      firstName: true,
    },
  });

  // 3. Block Tenants and Owners
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  // 4. Fetch dashboard statistics
  const [
    totalUsers,
    totalOwners,
    totalProperties,
    pendingOwnerRequests,
    pendingProperties,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { isOwner: true },
    }),
    prisma.property.count(),
    prisma.ownerRequest.count({
      where: { status: "PENDING" },
    }),
    prisma.property.count({
      where: { status: "PENDING" },
    }),
  ]);

  const dashboardCards = [
    {
      title: "Total Users",
      value: totalUsers,
      description: "Registered HOMZY users",
      icon: "👥",
    },
    {
      title: "Total Owners",
      value: totalOwners,
      description: "Approved property owners",
      icon: "🏠",
    },
    {
      title: "Total Properties",
      value: totalProperties,
      description: "All property listings",
      icon: "🏢",
    },
    {
      title: "Pending Owner Requests",
      value: pendingOwnerRequests,
      description: "Requests awaiting review",
      icon: "📋",
    },
    {
      title: "Pending Properties",
      value: pendingProperties,
      description: "Listings awaiting approval",
      icon: "⏳",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      {/* Header */}
      <header className="bg-[#10243A] px-6 py-6 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wide">
              HOMZY{" "}
              <span className="text-[#D4AF6A]">ADMIN</span>
            </h1>

            <p className="mt-2 text-sm text-gray-300">
              Welcome, {user.firstName}
            </p>
          </div>

          <span className="rounded-full border border-[#D4AF6A] px-4 py-2 text-sm text-[#D4AF6A]">
            Administrator
          </span>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <h2 className="text-3xl font-bold text-[#10243A]">
            Admin Dashboard
          </h2>

          <p className="mt-2 text-gray-600">
            Manage users, properties and Owner access requests.
          </p>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-[#D4AF6A]/40 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#10243A]">
                  {card.title}
                </h3>

                <span className="text-2xl">{card.icon}</span>
              </div>

              <p className="mt-5 text-4xl font-bold text-[#B88A3B]">
                {card.value}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Management sections */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#10243A]">
            Management Overview
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "User Management",
                description: "View and manage registered users.",
              },
              {
                title: "Owner Requests",
                description: "Review and process Owner applications.",
              },
              {
                title: "Property Management",
                description: "Review and manage property listings.",
              },
              {
                title: "Enquiries & Visits",
                description: "Monitor tenant enquiries and visits.",
              },
              {
                title: "AI Matching",
                description: "Monitor property matching activity.",
              },
              {
                title: "Analytics & Reports",
                description: "View platform statistics and reports.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-[#10243A]">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  {item.description}
                </p>

                <p className="mt-4 text-sm font-medium text-[#B88A3B]">
                  Coming soon
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-5 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} HOMZY Admin Dashboard
      </footer>
    </main>
  );
}
