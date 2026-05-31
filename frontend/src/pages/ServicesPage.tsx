import { Link } from "react-router-dom";
import { Clock, Scissors } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";
import PageLoader from "../components/PageLoader";
import type { Service } from "../types";


export const ServicesPage = () => {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => (await axios.get("/shop/services")).data,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading)
    return (
      <div className="p-10 text-center">
        <PageLoader />
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Select a service</h1>
        <Link to="/" className="text-white hover:underline text-xl">
          ← Home
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {services?.map((service) => (
          <div
            key={service.id}
            className="border rounded-3xl p-6 bg-white/10 backdrop-blur-md border-white/15 text-white hover:bg-white/15 transition flex flex-col"
          >
            <div className="flex-1">
              <div className="h-12 w-12 bg-yellow-500 text-black rounded-full flex items-center justify-center mb-4">
                <Scissors size={22} />
              </div>
              <h2 className="text-xl font-bold mb-1">{service.name}</h2>
              {service.description && (
                <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                  {service.description}
                </p>
              )}
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <Clock size={13} /> {service.duration} min
              </p>
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
              <span className="font-bold text-xl">₪{service.price}</span>
              <Link
                to={`/booking?serviceId=${service.id}`}
                className="bg-yellow-500 text-black px-5 py-2 rounded-xl text-sm font-bold hover:bg-yellow-400 transition"
              >
                Book now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
