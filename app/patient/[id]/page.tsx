"use client"

import { useConsultStore } from "../../store";
import { useEffect, useId } from "react";
import Calendar from "../../components/Calendar";
import VoiceAgent from "../../components/VoiceAgent";

export default function Home() {
  const { getSessions, sessions } = useConsultStore()
  const scrollContainerId = useId()

  useEffect(() => {
    getSessions()
  }, [getSessions])

  return (
    <div className="h-screen w-screen flex justify-center overflow-hidden flex-col items-center">
      <div className="bg-slate-100 flex w-full items-center shadow z-50 px-4">
        <div className="text-lg font-semibold text-[#6a9c9a]">Recalio Voice Assistant</div>
      </div>
      <div id={scrollContainerId} className="flex-1 overflow-y-auto w-full flex justify-center">
        <div className="max-w-[800px] p-4 flex flex-col gap-4">
          <img src="/friendly_health_clinic.png" alt="Family Health Clinic" className="max-w-[200px] mx-auto" />
          <div>
            Welcome back <span className="font-medium">Max Lee</span>, here are recent consultations provided by <span className="font-medium">Friendly Health Clinic</span>.
          </div>
          <div className="pt-8">
            <Calendar sessions={sessions} scrollContainerId={scrollContainerId} />
          </div>
          <div>
            <VoiceAgent />
          </div>
          <div className="h-[100px] shrink-0" />
        </div>
      </div>
    </div>
  );
}
