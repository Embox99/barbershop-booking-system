import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export const OnboardingPage = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const mutation = useMutation({
    mutationFn: async () => {
      return axios.put("/users/profile", { name });
    },
    onSuccess: (response) => {
      setUser(response.data);
      navigate("/");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Error saving name"),
  });

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-2">Let's get acquainted!</h1>
        <p className="text-gray-500 mb-8">
          What should we call you when you come for a haircut?
        </p>

        <div className="text-left">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John"
            className="w-full border-2 border-gray-200 p-4 rounded-xl outline-none focus:border-black transition text-lg"
            autoFocus
          />
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg mt-8 disabled:opacity-50 hover:scale-[1.02] transition-transform"
        >
          {mutation.isPending ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
};
