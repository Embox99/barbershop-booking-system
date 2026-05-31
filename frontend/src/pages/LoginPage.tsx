import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  // Already logged in — redirect away
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const otpMutation = useMutation({
    mutationFn: () => axios.post("/users/otp", { phone }),
    onSuccess: () => { setStep("code"); setCode(""); },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Error sending code"),
  });

  const loginMutation = useMutation({
    mutationFn: () => axios.post("/users/login", { phone, code }),
    onSuccess: (response) => {
      const { token, user } = response.data;
      login(token, user);
      navigate(user.name ? "/" : "/onboarding");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Invalid code"),
  });

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1 text-center">
          {step === "phone" ? "Log in" : "Enter code"}
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          {step === "phone"
            ? "Enter your phone number to receive a code"
            : `Code sent to ${phone}`}
        </p>

        {step === "phone" ? (
          <>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && phone && otpMutation.mutate()}
              placeholder="050-000-0000"
              autoFocus
              className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-black"
            />
            <button
              onClick={() => otpMutation.mutate()}
              disabled={!phone || otpMutation.isPending}
              className="w-full bg-black text-white py-3 rounded-lg font-bold disabled:opacity-50"
            >
              {otpMutation.isPending ? "Sending..." : "Get code"}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) =>
                e.key === "Enter" && code.length === 4 && loginMutation.mutate()
              }
              placeholder="1234"
              autoFocus
              className="w-full border p-3 rounded-lg mb-4 text-center tracking-widest text-xl outline-none focus:border-black"
            />
            <button
              onClick={() => loginMutation.mutate()}
              disabled={code.length < 4 || loginMutation.isPending}
              className="w-full bg-black text-white py-3 rounded-lg font-bold disabled:opacity-50 mb-3"
            >
              {loginMutation.isPending ? "Logging in..." : "Log in"}
            </button>
            <div className="flex justify-between text-sm">
              <button
                onClick={() => { setStep("phone"); setCode(""); }}
                className="text-gray-400 hover:text-black transition"
              >
                ← Change number
              </button>
              <button
                onClick={() => otpMutation.mutate()}
                disabled={otpMutation.isPending}
                className="text-gray-400 hover:text-black transition disabled:opacity-50"
              >
                {otpMutation.isPending ? "Sending..." : "Resend code"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
