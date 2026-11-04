
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [ownerLoading, setOwnerLoading] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Show/hide password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load profile.");
          return;
        }

        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
        setPhone(data.phone);
        setIsOwner(data.isOwner ?? false);
      } catch {
        setError("Unable to load your profile.");
      } finally {
        setInitialLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleBecomeOwner() {
    setOwnerLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/owner/activate", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Owner activation failed.");
        return;
      }

      setIsOwner(true);
      setSuccess(data.message || "Owner access activated successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setOwnerLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSuccess("Profile updated successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Unable to change password.");
        return;
      }

      setPasswordSuccess(
        data.message || "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A1F44]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A1F44] px-4 py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">

        <h1 className="text-2xl font-bold text-[#0A1F44]">
          Your Profile
        </h1>

        <p className="mt-1 text-sm text-zinc-600">
          Update your account details.
        </p>

        {/* Profile Details */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="firstName" className="text-sm font-medium text-zinc-700">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="lastName" className="text-sm font-medium text-zinc-700">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-zinc-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Email cannot be changed here.
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
              Contact Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-[#D4AF37] px-4 py-2 font-semibold text-[#0A1F44] hover:bg-[#c19d2e] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Change Password */}
        <div className="mt-8 border-t border-zinc-200 pt-6">

          <h2 className="text-xl font-bold text-[#0A1F44]">
            Change Password
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            Update your password to keep your account secure.
          </p>

          <form
            onSubmit={handlePasswordChange}
            className="mt-4 flex flex-col gap-4"
          >

            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="text-sm font-medium text-zinc-700">
                Current Password
              </label>

              <div className="relative mt-1">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-12 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />

                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#0A1F44]"
                >
                  {showCurrentPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A11.5 11.5 0 0 1 12 5c5 0 9 7 9 7a14 14 0 0 1-3 3.6" />
                      <path d="M6.2 6.2C3.5 8 2 12 2 12s4 7 10 7c1 0 2-.2 2.8-.6" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="text-sm font-medium text-zinc-700">
                New Password
              </label>

              <div className="relative mt-1">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-12 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />

                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#0A1F44]"
                >
                  {showNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A11.5 11.5 0 0 1 12 5c5 0 9 7 9 7a14 14 0 0 1-3 3.6" />
                      <path d="M6.2 6.2C3.5 8 2 12 2 12s4 7 10 7c1 0 2-.2 2.8-.6" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                Use at least 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">
                Confirm New Password
              </label>

              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-12 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#0A1F44]"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A11.5 11.5 0 0 1 12 5c5 0 9 7 9 7a14 14 0 0 1-3 3.6" />
                      <path d="M6.2 6.2C3.5 8 2 12 2 12s4 7 10 7c1 0 2-.2 2.8-.6" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}

            {passwordSuccess && (
              <p className="text-sm text-green-600">{passwordSuccess}</p>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-md bg-[#0A1F44] px-4 py-2 font-semibold text-white hover:bg-[#153568] disabled:opacity-60"
            >
              {passwordLoading ? "Updating..." : "Change Password"}
            </button>

          </form>
        </div>

        {/* Owner Activation */}
        {!isOwner ? (
          <div className="mt-6 rounded-lg border border-[#D4AF37] p-4">
            <h2 className="font-bold text-[#0A1F44]">
              Want to become an Owner?
            </h2>

            <p className="mt-2 text-sm text-zinc-600">
              Activate Owner access to start listing your properties on HOMZY.
            </p>

            <button
              type="button"
              onClick={handleBecomeOwner}
              disabled={ownerLoading}
              className="mt-4 w-full rounded-md bg-[#0A1F44] px-4 py-2 font-semibold text-white hover:bg-[#153568] disabled:opacity-60"
            >
              {ownerLoading ? "Activating..." : "Become an Owner"}
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4">
            <h2 className="font-bold text-green-800">
              Owner Access Active
            </h2>
            <p className="mt-1 text-sm text-green-700">
              You can now list and manage your properties.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
