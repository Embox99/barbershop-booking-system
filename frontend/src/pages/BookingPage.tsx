import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, User, Scissors } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../api/axios";
import type { Barber, Service } from "../types";

const today = () => new Date().toISOString().split("T")[0];

export const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const serviceId = searchParams.get("serviceId");

  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Load the selected service for display
  const { data: services } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => (await axios.get("/shop/services")).data,
    staleTime: 1000 * 60 * 5,
  });
  const selectedService = services?.find((s) => s.id === Number(serviceId));

  const { data: barbers, isLoading: barbersLoading } = useQuery<Barber[]>({
    queryKey: ["barbers"],
    queryFn: async () => (await axios.get("/shop/barbers")).data,
  });

  const { data: slots, isLoading: slotsLoading } = useQuery<string[]>({
    queryKey: ["slots", date, serviceId, selectedBarberId],
    queryFn: async () => {
      if (!serviceId || !selectedBarberId) return [];
      const response = await axios.get("/shop/slots", {
        params: { date, serviceId, barberId: selectedBarberId },
      });
      return response.data;
    },
    enabled: !!serviceId && !!selectedBarberId,
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTime) throw new Error("No time selected");
      const dateTime = `${date}T${selectedTime}:00.000Z`;
      return axios.post("/shop/appointments", {
        serviceId: Number(serviceId),
        dateTime,
        barberId: selectedBarberId,
      });
    },
    onSuccess: () => {
      toast.success("Booking confirmed!");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      navigate("/my-appointments");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Booking error");
    },
  });

  if (!serviceId)
    return (
      <div className="p-6 text-white">
        Please select a service first.{" "}
        <Link to="/services" className="underline">Go to services</Link>
      </div>
    );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        to="/services"
        className="text-sm text-gray-300 hover:text-white hover:underline mb-5 block"
      >
        ← Back to services
      </Link>

      {/* Selected service banner */}
      {selectedService && (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="h-12 w-12 bg-yellow-500 text-black rounded-full flex items-center justify-center shrink-0">
            <Scissors size={22} />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-lg">{selectedService.name}</p>
            {selectedService.description && (
              <p className="text-gray-400 text-sm">{selectedService.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-white font-bold text-xl">₪{selectedService.price}</p>
            <p className="text-gray-400 text-sm flex items-center gap-1 justify-end">
              <Clock size={12} /> {selectedService.duration} min
            </p>
          </div>
        </div>
      )}

      <h1 className="text-2xl text-white font-bold mb-6">Book appointment</h1>

      {/* Step 1 — Barber */}
      <div className="mb-8">
        <h2 className="text-lg text-white font-bold mb-3">1. Select a barber</h2>
        {barbersLoading ? (
          <div className="text-gray-300">Loading barbers...</div>
        ) : barbers?.length === 0 ? (
          <div className="text-gray-400">No barbers available.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {barbers?.map((barber) => (
              <button
                key={barber.id}
                onClick={() => { setSelectedBarberId(barber.id); setSelectedTime(null); }}
                className={`p-4 rounded-xl border flex items-center gap-3 transition
                  ${selectedBarberId === barber.id
                    ? "border-white bg-white text-black"
                    : "bg-white/10 border-transparent text-white hover:bg-white/20"
                  }`}
              >
                <div className={`p-2 rounded-full ${selectedBarberId === barber.id ? "bg-black text-white" : "bg-white/20 text-white"}`}>
                  <User size={20} />
                </div>
                <span className="font-bold">{barber.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2 — Date */}
      {selectedBarberId && (
        <div className="mb-8 animate-fade-in">
          <h2 className="text-lg font-bold mb-3 text-white">2. Select a date</h2>
          <div className="flex items-center gap-2 border border-transparent bg-white/10 p-3 rounded-xl w-full text-white">
            <Calendar className="text-gray-300 shrink-0" />
            <input
              type="date"
              value={date}
              min={today()}
              onChange={(e) => { setDate(e.target.value); setSelectedTime(null); }}
              className="w-full outline-none bg-transparent text-white [color-scheme:dark]"
            />
          </div>
        </div>
      )}

      {/* Step 3 — Time */}
      {selectedBarberId && (
        <div className="mb-8 animate-fade-in">
          <h2 className="text-lg font-bold mb-3 text-white">3. Select a time</h2>
          {slotsLoading ? (
            <div className="text-gray-400">Searching for available slots...</div>
          ) : slots?.length === 0 ? (
            <div className="text-red-400 bg-red-900/20 p-4 rounded-lg">
              No available slots for this day
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {slots?.map((time, index) => (
                <button
                  key={`${time}-${index}`}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 px-4 rounded-lg text-sm font-bold transition flex items-center justify-center
                    ${selectedTime === time
                      ? "bg-white text-black shadow-lg transform scale-105"
                      : "bg-white/10 text-white hover:bg-white/20 border border-transparent"
                    }`}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => bookingMutation.mutate()}
        disabled={!selectedTime || !selectedBarberId || bookingMutation.isPending}
        className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-yellow-400 transition shadow-lg mt-4"
      >
        {bookingMutation.isPending ? "Booking..." : "Confirm booking"}
      </button>
    </div>
  );
};
