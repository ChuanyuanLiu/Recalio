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

function SessionItem({ session, scrollContainerId }: { session: ConsultSession; scrollContainerId: string }) {
  const { setCurrentSession, currentSession } = useConsultStore()
  const isActive = currentSession?.session.session_id === session.session.session_id

  return (
    <div
      className={cn(
        "bg-gray-50 border border-gray-200 rounded-xl p-3 cursor-pointer hover:bg-blue-100 transition-colors flex-1 min-w-0",
        isActive && "bg-blue-50 border-blue-200"
      )}
      onClick={() => {
        setCurrentSession(session.session.session_id)
        // Scroll to VoiceAgent after a brief delay to allow state update
        setTimeout(() => {
          const voiceAgentElement = document.querySelector('[data-component="voice-agent"]');
          const scrollContainer = document.getElementById(scrollContainerId);
          if (voiceAgentElement && scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = voiceAgentElement.getBoundingClientRect();
            const scrollTop = scrollContainer.scrollTop;
            const targetScrollTop = scrollTop + elementRect.top - containerRect.top - 20; // 20px offset from top

            scrollContainer.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          }
        }, 100);
      }}
    >
      <div className="text-xl font-normal text-gray-900 mb-1">
        {formatTimeOnly(session.session.created_at)}
      </div>
      <div className="text-lg text-gray-600">
        {Math.round(session.session.duration / 60)} minutes
      </div>
    </div>
  );
}

interface CalendarProps {
  sessions: ConsultSession[];
  scrollContainerId: string;
}

export default function Calendar({ sessions, scrollContainerId }: CalendarProps) {
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
            <h3 className="text-6xl font-light text-gray-900 mb-6">{year}</h3>
            {months.map(month => {
              const days = Object.keys(groupedSessions[year][month]);
              return (
                <div key={month} className="mb-8">
                  <h4 className="text-4xl font-light text-gray-700 mb-6">{month}</h4>
                  {days.map(day => {
                    const sessions = groupedSessions[year][month][day];
                    const dayLabel = new Date(sessions[0].session.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric'
                    });

                    return (
                      <div key={day} className="mb-8">
                        <h5 className="text-3xl font-light text-gray-900 mb-6">{dayLabel}</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {sessions.map(session =>
                            <SessionItem key={session.session.session_id} session={session} scrollContainerId={scrollContainerId} />
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
