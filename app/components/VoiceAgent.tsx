"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConversation } from '@elevenlabs/react';
import { StatusPill } from "./voice/StatusPill";
import { VuMeter } from "./voice/VuMeter";
import {
  MicIcon,
  DeviceIcon,
  PlayIcon,
  StopIcon,
  WaveIcon,
  LockIcon,
  TerminalIcon,
  ChevronIcon
} from "./voice/Icons";

/**
 * Voice Conversation Panel with ElevenLabs Integration
 * - Clean, friendly UI with clear states
 * - Integrated with ElevenLabs Conversational AI
 * - Tailwind only (no external UI libs)
 * - Accessible, keyboard-friendly
 */

type Status = "disconnected" | "connecting" | "connected" | "error";

type Permission = "prompt" | "granted" | "denied";

export default function VoiceAgent() {
  // State management
  const [permission, setPermission] = useState<Permission>("prompt");
  const [selectedDevice, setSelectedDevice] = useState("Default Microphone");
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [level, setLevel] = useState(0); // VU meter level (0..1)
  const [error, setError] = useState<string | null>(null);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      setError(null);
      pushLog('Connected to ElevenLabs agent');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
      pushLog('Disconnected from ElevenLabs agent');
    },
    onMessage: (message) => {
      console.log('Message from agent:', message);
      pushLog(`Agent message: ${JSON.stringify(message)}`);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setError(`Failed to connect to voice agent: ${error}`);
      pushLog(`Error: ${error}`);
    },
  });

  // Map ElevenLabs status to our Status type
  const status: Status = useMemo(() => {
    if (error) return "error";
    switch (conversation.status) {
      case 'connected': return 'connected';
      case 'connecting': return 'connecting';
      case 'disconnected': return 'disconnected';
      default: return 'disconnected';
    }
  }, [conversation.status, error]);

  // Animate VU meter when connected and speaking
  useEffect(() => {
    let id: NodeJS.Timeout | undefined;
    if (status === "connected" && conversation.isSpeaking) {
      // Simulate audio input level when agent is speaking
      id = setInterval(() => setLevel(Math.random() * 0.8 + 0.2), 100);
    } else if (status === "connected") {
      // Show baseline activity when listening
      id = setInterval(() => setLevel(Math.random() * 0.3), 200);
    } else {
      setLevel(0);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [status, conversation.isSpeaking]);

  // Utility functions
  const timestamp = useCallback(() => new Date().toLocaleTimeString(), []);
  const pushLog = useCallback((line: string) => setLogs((l) => [timestamp(), line, ...l]), [timestamp]);

  // --- Action Handlers ---
  const onGrantPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermission("granted");
      setError(null);
      pushLog("Microphone permission granted");
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermission("denied");
      setError('Microphone permission is required for voice conversations.');
      pushLog("Microphone permission denied");
    }
  }, [pushLog]);

  const onStart = useCallback(async () => {
    if (permission !== "granted") return;

    try {
      setError(null);
      pushLog("Starting conversation...");

      // Check if agent ID is configured
      const agentId = process.env.NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID;
      if (!agentId || agentId === 'your_agent_id_here') {
        setError('Please configure NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID in your .env.local file');
        pushLog("Error: Agent ID not configured");
        return;
      }

      // Start the ElevenLabs conversation
      await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
        dynamicVariables: {
          full_name: 'Max Lee',
          date_of_birth: '01/01/2000',
          home_address: '746 Swanston Street',
          patient_query: '-',
          transcript: '-'
        }
      });

      pushLog("Conversation started successfully");
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError(`Failed to start voice conversation: ${error instanceof Error ? error.message : error}`);
      pushLog(`Failed to start conversation: ${error}`);
    }
  }, [conversation, permission, pushLog]);

  const onStop = useCallback(async () => {
    try {
      await conversation.endSession();
      setError(null);
      pushLog("Conversation stopped");
    } catch (error) {
      console.error('Failed to stop conversation:', error);
      setError('Failed to stop conversation properly.');
      pushLog(`Failed to stop conversation: ${error}`);
    }
  }, [conversation, pushLog]);

  const onDeviceChange = (d: string) => {
    setSelectedDevice(d);
    pushLog(`Switched mic to: ${d}`);
  };

  const canStart = permission === "granted" && (status === "disconnected" || status === "error");
  const canStop = status === "connected";

  return (
    <div data-component="voice-agent" className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StatusPill status={status} />
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4">
          <MicIcon className="mt-0.5 h-5 w-5 text-red-600" />
          <div className="flex-1 text-red-800">
            <div className="font-medium">Connection Error</div>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Permission banner */}
      {permission !== "granted" && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <MicIcon className="mt-0.5 h-5 w-5 text-slate-600" />
          <div className="flex-1 text-slate-800">
            <div className="font-medium">Microphone access required for voice conversations</div>
            <p className="text-sm opacity-90">We only listen while a conversation is active. You can change this anytime in your browser settings.</p>
          </div>
          <button
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
            onClick={onGrantPermission}
          >
            Grant Permission
          </button>
        </div>
      )}

      {/* Controls row */}
      {permission === "granted" && <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="col-span-2 flex items-center gap-2 rounded-xl border border-slate-200 p-2">
          <DeviceIcon className="h-5 w-5 text-slate-500" />
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            value={selectedDevice}
            onChange={(e) => onDeviceChange(e.target.value)}
            disabled={permission !== "granted"}
            aria-label="Select microphone"
          >
            <option>Default Microphone</option>
            <option>USB Mic (UAC)</option>
            <option>MacBook Microphone</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onStart}
            disabled={!canStart}
            className={
              "flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow transition md:flex-none " +
              (canStart
                ? "bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                : "cursor-not-allowed bg-emerald-300")
            }
            aria-label="Start conversation"
          >
            <div className="flex items-center justify-center gap-2">
              {status === "connecting" ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connecting...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" /> Start Conversation
                </>
              )}
            </div>
          </button>
          <button
            onClick={onStop}
            disabled={!canStop}
            className={
              "rounded-xl px-4 py-3 text-sm font-semibold text-white shadow transition " +
              (canStop
                ? "bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300"
                : "cursor-not-allowed bg-rose-300")
            }
            aria-label="Stop conversation"
          >
            <StopIcon className="h-4 w-4" />
          </button>
        </div>
      </div>}

      {/* Live indicator + VU meter */}
      {permission === "granted" && <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-slate-200 p-3">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <WaveIcon className="h-4 w-4" /> Audio Level
            </div>
            {status === "connected" && (
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${conversation.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
                <span className="text-xs text-slate-500">
                  {conversation.isSpeaking ? 'Agent Speaking' : 'Listening'}
                </span>
              </div>
            )}
          </div>
          <VuMeter level={level} />
        </div>
        <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
          <div className="mb-1 flex items-center gap-2">
            <LockIcon className="h-4 w-4" /> Privacy
          </div>
          <p className="leading-relaxed">Audio is processed in real time by ElevenLabs. Conversations are not stored by default.</p>
        </div>
      </div>}

      {/* Logs / diagnostics */}
      <div className="rounded-xl border border-slate-200">
        <button
          onClick={() => setShowLogs((s) => !s)}
          className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-3 text-left text-sm text-slate-700 hover:bg-slate-100"
          aria-expanded={showLogs}
        >
          <span className="flex items-center gap-2"><TerminalIcon className="h-4 w-4" /> Connection details</span>
          <ChevronIcon className={"h-4 w-4 transition " + (showLogs ? "rotate-180" : "")} />
        </button>
        {showLogs && (
          <div className="max-h-48 overflow-auto p-3 text-xs text-slate-600">
            {logs.length === 0 ? (
              <div className="italic opacity-70">No logs yet.</div>
            ) : (
              <ul className="space-y-1">
                {logs.map((l) => (
                  <li key={l} className="font-mono">{l}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>


    </div>
  );
}
