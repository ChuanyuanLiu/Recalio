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
      <div className="h-[calc(100vh-150px)] w-full max-w-[800px] px-2 py-2 mt-[150px] flex flex-col gap-4">
        <div className="">
          Welcome back <span>Chuanyuan Liu</span>
        </div>
        <div>
          <h2 className="font-medium mb-2">Recent Consults</h2>
          <Calendar sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
