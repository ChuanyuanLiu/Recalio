"use client"

import { useConsultStore } from "./store";
import { useEffect } from "react";
import Calendar from "./components/Calendar";
import VoiceAgent from "./components/VoiceAgent";

export default function Home() {
  const { getSessions, sessions } = useConsultStore()

  useEffect(() => {
    getSessions()
  }, [getSessions])

  return (
    <div className="h-screen w-screen flex justify-center overflow-x-hidden">
      <div className="h-full w-full max-w-[800px] p-4 flex flex-col gap-4">

        <div className="">
          Welcome back <span>Max Lee</span>
        </div>
        <div>
          <VoiceAgent />
        </div>
        <div>
          <h2 className="font-medium mb-2">Recent Consults</h2>
          <Calendar sessions={sessions} />
        </div>
        <div className="h-[100px] shrink-0" />
      </div>
    </div>
  );
}
