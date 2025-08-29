"use client"

import type { ConsultSession } from "../schema";
import { useMemo } from "react";
import { useConsultStore } from "../store";
import { cn } from "@/lib/utils";

type GroupedSessions = {
  [year: string]: {
    [month: string]: {
      [day: string]: ConsultSession[]
    }
  }
}

function formatTimeOnly(isoString: string): string {
  const date = new Date(isoString);
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleTimeString('en-US', timeOptions);
}

function groupSessionsByDate(sessions: ConsultSession[]): GroupedSessions {
  const grouped: GroupedSessions = {};

  sessions.forEach(session => {
    const date = new Date(session.session.created_at);
    const year = date.getFullYear().toString();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate().toString().padStart(2, '0');

    if (!grouped[year]) {
      grouped[year] = {};
    }
    if (!grouped[year][month]) {
      grouped[year][month] = {};
    }
    if (!grouped[year][month][day]) {
      grouped[year][month][day] = [];
    }

    grouped[year][month][day].push(session);
  });

  // Sort sessions within each day by time
  Object.keys(grouped).forEach(year => {
    Object.keys(grouped[year]).forEach(month => {
      Object.keys(grouped[year][month]).forEach(day => {
        grouped[year][month][day].sort((a, b) =>
          new Date(a.session.created_at).getTime() - new Date(b.session.created_at).getTime()
        );
      });
    });
  });

  return grouped;
}

function SessionItem({ session }: { session: ConsultSession }) {
  const { setCurrentSession, currentSession } = useConsultStore()
  const isActive = currentSession?.session.session_id === session.session.session_id

  return (
    <div
      className={cn(
        "btn w-[200px]",
        isActive ? "btn-active" : ""
      )}
      onClick={() => {
        setCurrentSession(session.session.session_id)
      }}
    >
      <div>
        {formatTimeOnly(session.session.created_at)}
      </div>
      <div>
        {Math.round(session.session.duration / 60)} minutes
      </div>
    </div>
  );
}

interface CalendarProps {
  sessions: ConsultSession[];
}

export default function Calendar({ sessions }: CalendarProps) {
  const groupedSessions = useMemo(() => groupSessionsByDate(sessions), [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No sessions found
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {Object.keys(groupedSessions).map(year => {
        const months = Object.keys(groupedSessions[year]);
        return (
          <div key={year} className="">
            <h3 className="font-medium text-gray-500 mb-2">{year}</h3>
            {months.map(month => {
              const days = Object.keys(groupedSessions[year][month]);
              return (
                <div key={month} className="">
                  <h4 className="font-medium text-gray-500 mb-2">{month}</h4>
                  {days.map(day => {
                    const sessions = groupedSessions[year][month][day];
                    const dayLabel = new Date(sessions[0].session.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric'
                    });

                    return (
                      <div key={day} className="">
                        <h5 className="font-medium mb-2">{dayLabel}</h5>
                        <div className="flex flex-row flex-wrap gap-2">
                          {sessions.map(session =>
                            <SessionItem key={session.session.session_id} session={session} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
