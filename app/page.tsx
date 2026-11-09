
import Image from "next/image";
import Link from "next/link";
import { verifySession } from "@/lib/session";
import LogoutButton from "@/app/components/LogoutButton";
import NavLoginButton from "@/app/components/NavLoginButton";
import ImageSlider from "@/app/components/ImageSlider";
import PropertyCard from "@/app/components/PropertyCard";
import OwnerRequestSection from "@/app/components/OwnerRequestSection";
import AssistantChat from "@/app/components/AssistantChat";
import { searchProperties } from "@/lib/properties";

type HomeProperty = {
  id: string;
  imageUrl: string | null;
  title: string;
  city: string;
  locality: string;
  monthlyRent: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  amenities: {
    amenity: {
      name: string;
    };
  }[];
};

export default async function Home() {
  const session = await verifySession();
  const { properties: rawProperties } = await searchProperties({});

  const properties = rawProperties as HomeProperty[];

  return (
    <div className="min-h-screen bg-[#F7F5F0]">

      {/* NAVIGATION */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[linear-gradient(110deg,#F7F0E2_0%,#EBD5A8_20%,#DFC184_45%,#D4AF6A_70%,#C69A48_100%)] border-b border-[#B88A3B]/40 shadow-md">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Homzy logo"
            width={72}
            height={72}
            unoptimized
          />
          <span className="text-4xl font-bold">
            <span className="text-[#10243A]">Hom</span>
            <span className="text-[#D4AF6A]">zy</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-[#10243A] font-semibold uppercase tracking-wider"
          >
            HOME
          </Link>

          <Link
            href="/properties"
            className="text-[#10243A] hover:text-[#8A6938] uppercase tracking-wider"
          >
            PROPERTIES
          </Link>

          <Link
            href="/#how-it-works"
            className="text-[#10243A] hover:text-[#8A6938] uppercase tracking-wider"
          >
            ABOUT
          </Link>

          {/* AI RECOMMENDATIONS - TENANTS ONLY */}
          {session?.role === "TENANT" && !session.isOwner && (
            <Link
              href="/recommendations"
              className="text-[#10243A] hover:text-[#8A6938] uppercase tracking-wider"
            >
              AI RECOMMENDATIONS
            </Link>
          )}

          {session ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-white hover:text-[#D4AF6A]"
              >
                Hi, {session.firstName}
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <NavLoginButton />
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#08182B] via-[#10243A] to-[#24486A] px-8 py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row">
          <div className="flex-1 text-center md:text-left">
            <p className="mb-4 font-semibold uppercase tracking-[0.25em] text-[#D4AF6A]">
              Find your perfect space
            </p>

            <h1 className="text-5xl font-bold leading-tight text-white">
              Find your home.
              <span className="block text-[#D4AF6A]">
                Find your happiness.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-gray-200">
              Discover rental homes based on your budget, location, lifestyle
              and daily travel needs - powered by AI.
            </p>

            <form
              action="/properties"
              method="GET"
              className="mt-8 flex w-full max-w-xl gap-2 rounded-xl bg-white p-2 shadow-xl"
            >
              <input
                type="text"
                name="city"
                placeholder="Search by city or locality"
                className="min-w-0 flex-1 rounded-lg px-4 py-3 text-[#10243A] outline-none"
              />

              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-[#B88A3B] to-[#D4AF6A] px-6 py-3 font-semibold text-[#10243A] transition hover:brightness-105"
              >
                Search
              </button>
            </form>
          </div>

          <div className="flex flex-1 justify-center">
            <ImageSlider />
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="bg-[#F7F5F0] px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold uppercase tracking-widest text-[#B88A3B]">
                Explore homes
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#10243A]">
                Featured Properties
              </h2>
            </div>

            <Link
              href="/properties"
              className="font-semibold text-[#10243A] underline decoration-[#D4AF6A] underline-offset-4 hover:text-[#B88A3B]"
            >
              View All Properties →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.length > 0 ? (
              properties.slice(0, 3).map((property: HomeProperty) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  imageUrl={property.imageUrl}
                  title={property.title}
                  city={property.city}
                  locality={property.locality}
                  monthlyRent={Number(property.monthlyRent)}
                  area={Number(property.area)}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  furnishing={property.furnishing}
                  amenityNames={property.amenities.map(
                    (item: HomeProperty["amenities"][number]) =>
                      item.amenity.name
                  )}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-[#10243A]">
                No approved properties are available yet. Please check back soon.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* POPULAR CITIES */}
      <section className="bg-white px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-center font-semibold uppercase tracking-widest text-[#B88A3B]">
            Find homes across India
          </p>

          <h2 className="mt-2 text-center text-3xl font-bold text-[#10243A]">
            Popular Cities
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {["Bangalore", "Mysore", "Hyderabad", "Chennai", "Pune", "Mumbai"].map(
              (city) => (
                <Link
                  key={city}
                  href={`/properties?city=${encodeURIComponent(city)}`}
                  className="cursor-pointer rounded-xl border border-[#D4AF6A]/40 bg-[#F7F5F0] px-4 py-6 text-center transition hover:border-[#D4AF6A] hover:bg-[#10243A] group"
                >
                  <p className="font-semibold text-[#10243A] group-hover:text-white">
                    {city}
                  </p>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#F7F5F0] px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-center font-semibold uppercase tracking-widest text-[#B88A3B]">
            Happy homes, happy people
          </p>

          <h2 className="mt-2 text-center text-3xl font-bold text-[#10243A]">
            What Our Users Say
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#D4AF6A]/30 bg-white p-6 shadow-sm">
              <p className="text-sm leading-7 text-gray-600">
                &quot;Homzy made finding a 2BHK near my office so much easier.
                No brokers, no hassle.&quot;
              </p>

              <p className="mt-4 text-sm font-semibold text-[#B88A3B]">
                - Ananya R., Bangalore
              </p>
            </div>

            <div className="rounded-2xl border border-[#D4AF6A]/30 bg-white p-6 shadow-sm">
              <p className="text-sm leading-7 text-gray-600">
                &quot;As an owner, listing my property took less than 5 minutes.
                Genuinely simple.&quot;
              </p>

              <p className="mt-4 text-sm font-semibold text-[#B88A3B]">
                - Rahul K., Mysore
              </p>
            </div>

            <div className="rounded-2xl border border-[#D4AF6A]/30 bg-white p-6 shadow-sm">
              <p className="text-sm leading-7 text-gray-600">
                &quot;I loved being able to filter by my exact budget and see
                everything clearly.&quot;
              </p>

              <p className="mt-4 text-sm font-semibold text-[#B88A3B]">
                - Priya S., Chennai
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW HOMZY WORKS */}
      <section id="how-it-works" className="bg-[#10243A] px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-center font-semibold uppercase tracking-widest text-[#D4AF6A]">
            Simple steps, better living
          </p>

          <h2 className="mt-2 text-center text-3xl font-bold text-white">
            How Homzy Works
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              ["1", "Search", "Tell us your budget, city, and preferences."],
              ["2", "Shortlist", "Browse AI-matched properties that fit your needs."],
              ["3", "Visit", "Request a visit directly with the property owner."],
              ["4", "Move In", "Finalize the deal and move into your new home."],
            ].map(([number, title, description]) => (
              <div key={number} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#B88A3B] to-[#F1DDA8] text-xl font-bold text-[#10243A]">
                  {number}
                </div>

                <h3 className="mt-4 font-semibold text-white">{title}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-300">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TENANT AI ASSISTANT */}
      {session?.role === "TENANT" && !session.isOwner && (
        <section id="homzy-ai-assistant" className="bg-[#F7F5F0]">
          <AssistantChat embedded />
        </section>
      )}

      {/* BECOME A HOMZY OWNER */}
      <OwnerRequestSection />

      {/* FOOTER */}
      <footer className="border-t border-[#B88A3B]/40 bg-[linear-gradient(110deg,#F7F0E2_0%,#EBD5A8_20%,#DFC184_45%,#D4AF6A_70%,#C69A48_100%)] px-8 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* BRAND */}
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Homzy logo"
                width={40}
                height={40}
                unoptimized
              />

              <span className="text-xl font-bold">
                <span className="text-[#10243A]">Hom</span>
                <span className="text-[#D4AF6A]">zy</span>
              </span>
            </div>

            <p className="mt-3 text-sm text-[#10243A]">
              Find a place you&apos;ll love to call home.
            </p>

            <p className="mt-2 text-sm text-[#10243A]">
              Discover rental homes matched to your budget, location, and
              lifestyle - powered by AI.
            </p>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#10243A]">
              Quick Links
            </h3>

            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <Link href="/" className="text-sm text-[#10243A] hover:text-[#8A6938]">
                  Home
                </Link>
              </li>

              <li>
                <Link href="/properties" className="text-sm text-[#10243A] hover:text-[#8A6938]">
                  Properties
                </Link>
              </li>

              <li>
                <Link href="/#how-it-works" className="text-sm text-[#10243A] hover:text-[#8A6938]">
                  About
                </Link>
              </li>

              {session?.role === "TENANT" && !session.isOwner && (
                <li>
                  <Link
                    href="/recommendations"
                    className="text-sm text-[#10243A] hover:text-[#8A6938]"
                  >
                    AI Recommendations
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* FOR OWNERS */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#10243A]">
              For Owners
            </h3>

            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <Link
                  href="/#become-owner"
                  className="text-sm text-[#10243A] hover:text-[#8A6938]"
                >
                  Become an Owner
                </Link>
              </li>

              <li>
                <Link
                  href="/properties/new"
                  className="text-sm text-[#10243A] hover:text-[#8A6938]"
                >
                  List Your Property
                </Link>
              </li>

              <li>
                <Link
                  href="/properties/my"
                  className="text-sm text-[#10243A] hover:text-[#8A6938]"
                >
                  Owner Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#10243A]">
              Contact
            </h3>

            <ul className="mt-4 flex flex-col gap-2">
              <li className="text-sm text-[#10243A]">
                support@homzy.demo
              </li>
              <li className="text-sm text-[#10243A]">Instagram</li>
              <li className="text-sm text-[#10243A]">Twitter / X</li>
              <li className="text-sm text-[#10243A]">LinkedIn</li>
            </ul>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center gap-4 border-t border-[#10243A]/20 pt-6">
          <p className="text-xs text-[#10243A]">
            © 2026 Homzy. All rights reserved.
          </p>

          <div className="flex gap-4">
            <span className="text-xs text-[#10243A]">Privacy Policy</span>
            <span className="text-xs text-[#10243A]">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
