"use client"

import { useConsultStore } from "./store";
import type { ConsultSession } from "./schema";
import { useEffect } from "react";

function Consult({ session }: { session: ConsultSession }) {
  return <div>
    <div>
      {session.session.created_at}
    </div>
    <div>
      {session.session.duration}
    </div>
  </div>
}


export default function Home() {
  const { getSessions, sessions } = useConsultStore()

  useEffect(() => {
    getSessions()
  }, [getSessions])

  return (
    <div className="h-screen w-screen flex justify-center">
      <div className="h-full w-full max-w-[800px] px-2 py-2 mt-[150px]">
        <div>
          <div>
            Welcome back <span>Chuanyuan Liu</span>
          </div>
        </div>
        <div>
          Recent Consults
        </div>
        {sessions.map(x => <Consult key={x.session.session_id} session={x} />)}
      </div>
    </div>
  );
}
