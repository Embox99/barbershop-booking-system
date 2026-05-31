import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Clock, Scissors, User, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../api/axios";
import type { Appointment, AppointmentStatus } from "../types";


const statusStyles: Record<AppointmentStatus, string> = {
  confirmed: "bg-green-900/30 text-green-400 border border-green-800",
  pending: "bg-yellow-900/30 text-yellow-400 border border-yellow-800",
  cancelled: "bg-red-900/30 text-red-400 border border-red-800",
};

const statusLabel: Record<AppointmentStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
};

export const MyAppointmentsPage = () => {
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["my-appointments"],
    queryFn: async () => (await axios.get("/shop/appointments")).data,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) =>
      axios.patch(`/shop/appointments/${id}/cancel`),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to cancel"),
  });

  const upcoming = appointments?.filter(
    (a) => a.status !== "cancelled" && new Date(a.dateTime) >= new Date()
  );
  const past = appointments?.filter(
    (a) => a.status === "cancelled" || new Date(a.dateTime) < new Date()
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Appointments</h1>
        <Link to="/" className="text-sm text-gray-400 hover:text-white">
          ← Home
        </Link>
      </div>

      {isLoading && (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      )}

      {!isLoading && appointments?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">You have no appointments yet.</p>
          <Link
            to="/services"
            className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
          >
            Book now
          </Link>
        </div>
      )}

      {/* Upcoming */}
      {(upcoming?.length ?? 0) > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Upcoming
          </h2>
          <div className="flex flex-col gap-3">
            {upcoming?.map((app) => (
              <AppointmentCard
                key={app.id}
                app={app}
                onCancel={() => {
                  if (confirm("Cancel this appointment?"))
                    cancelMutation.mutate(app.id);
                }}
                isCancelling={cancelMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past / cancelled */}
      {(past?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            History
          </h2>
          <div className="flex flex-col gap-3">
            {past?.map((app) => (
              <AppointmentCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const AppointmentCard = ({
  app,
  onCancel,
  isCancelling,
}: {
  app: Appointment;
  onCancel?: () => void;
  isCancelling?: boolean;
}) => {
  const isPast = new Date(app.dateTime) < new Date();
  const canCancel = onCancel && !isPast && app.status !== "cancelled";

  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Scissors size={16} className="text-yellow-500" />
            <span className="font-bold">{app.service.name}</span>
            <span
              className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${statusStyles[app.status]}`}
            >
              {statusLabel[app.status]}
            </span>
          </div>
          <div className="text-sm text-gray-300 flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <Calendar size={13} />
              {new Date(app.dateTime).toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={13} />
              {new Date(app.dateTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              })}
            </span>
            <span className="flex items-center gap-2">
              <User size={13} />
              {app.barber.name}
            </span>
          </div>
        </div>

        {canCancel && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="text-red-400 hover:text-red-300 transition p-1 mt-1 disabled:opacity-50"
            title="Cancel appointment"
          >
            <XCircle size={20} />
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-sm text-gray-400">
        <span>{app.service.duration} min</span>
        <span className="font-bold text-white">₪{app.service.price}</span>
      </div>
    </div>
  );
};
