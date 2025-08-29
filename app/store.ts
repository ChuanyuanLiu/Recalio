import { create } from 'zustand';
import type { ConsultSession, Token } from './schema';
import { HEIDI_AUTH_API, HEIDI_SESSION_API, SESSION_IDS } from './constants';

interface ConsultSessionStore {
  currentSession: ConsultSession | null;
  sessions: ConsultSession[];
  token: Token | null;
  setCurrentSession: (id: string) => Promise<void>;
  getSessions: () => Promise<ConsultSession[]>;
  getToken: () => Promise<Token>;
}

export const useConsultStore = create<ConsultSessionStore>()(
  (set, get) => ({
    // Initial state
    currentSession: null,
    sessions: [],
    token: null,
    setCurrentSession: async (id: string) => {
      if (id === get().currentSession?.session.session_id) {
        return
      }
      let sessions = get().sessions
      if (get().sessions == null) {
        sessions = await get().getSessions()
      }
      const session = sessions.find(x => x.session.session_id === id)
      if (session) {
        set({ currentSession: session })
      }
    },
    // TODO: move HEIDI_API_KEY to backend
    getToken: async () => {
      const token = get().token
      if (token && token.expiration_time > new Date().toISOString()) {
        return token
      }
      const response = await fetch(HEIDI_AUTH_API, {
        method: "GET",
        headers: {
          "Heidi-Api-Key": process.env.NEXT_PUBLIC_HEIDI_API_KEY!
        }
      })
      const data = await response.json() as Token
      set({ token: data })
      return data
    },
    getSessions: async () => {
      const token = await get().getToken()
      const requests = []
      for (const sessionId of SESSION_IDS) {
        requests.push(fetch(`${HEIDI_SESSION_API}/${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token.token}`
          }
        }))
      }
      const responses = await Promise.all(requests)
      const data = await Promise.all(responses.map(async x => await x.json() as ConsultSession))
      set({ sessions: data })
      return data
    },
  })
);
