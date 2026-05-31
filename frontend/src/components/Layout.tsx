import { Outlet } from "react-router-dom";

export const Layout = () => {
  return (
    <div className="min-h-screen relative text-black">
      <div className="fixed inset-0 -z-10">
        <img
          src="bg-barber.png"
          alt="Background"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
};
