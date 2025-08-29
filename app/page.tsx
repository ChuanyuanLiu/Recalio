"use client"

import { useConsultStore } from "./store";
import { useEffect } from "react";
import Calendar from "./components/Calendar";


export default function Home() {
  const { getSessions, sessions } = useConsultStore()

  useEffect(() => {
    getSessions()
  }, [getSessions])

  return (
    <div className="h-screen w-screen flex justify-center overflow-hidden">
      <div className="h-[calc(100vh-150px)] w-full max-w-[800px] px-2 py-2 mt-[150px]">
        <div className="mb-6">
          <div className="text-2xl font-semibold">
            Welcome back <span>Chuanyuan Liu</span>
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-medium">Recent Consults</h2>
        </div>
        <Calendar sessions={sessions} />
      </div>
    </div>
  );
}
