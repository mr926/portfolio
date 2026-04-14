"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Full page navigation so proxy re-evaluates the auth cookie on the server
        window.location.href = "/admin";
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-16 text-center">
          <h1 className="text-2xl font-extrabold tracking-tighter uppercase text-black">
            CHAOS LAB
          </h1>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#5e5e5e] mt-2">
            Admin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-3">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5e5e5e] mb-3">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-[#c6c6c6] pb-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-[#ba1a1a] text-[10px] tracking-widest uppercase">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-[#3b3b3b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
