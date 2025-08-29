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
        "flex justify-between py-2 px-4 rounded-lg mb-2 hover:cursor-pointer transition-colors",
        isActive ? "bg-blue-100 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"
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
          <div key={year} className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{year}</h3>
            {months.map(month => {
              const days = Object.keys(groupedSessions[year][month]);
              return (
                <div key={month} className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">{month}</h4>
                  {days.map(day => {
                    const sessions = groupedSessions[year][month][day];
                    const dayLabel = new Date(sessions[0].session.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric'
                    });

                    return (
                      <div key={day} className="mb-4">
                        <h5 className="text-sm font-medium text-gray-600 mb-2">{dayLabel}</h5>
                        <div className="ml-2">
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
