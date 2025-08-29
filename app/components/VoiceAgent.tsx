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

interface MicrophoneDevice {
  deviceId: string;
  label: string;
}

export default function VoiceAgent() {
  // State management
  const [permission, setPermission] = useState<Permission>("prompt");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [availableDevices, setAvailableDevices] = useState<MicrophoneDevice[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [level, setLevel] = useState(0); // VU meter level (0..1)
  const [error, setError] = useState<string | null>(null);

  // Audio monitoring refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Utility functions
  const timestamp = useCallback(() => new Date().toLocaleTimeString(), []);
  const pushLog = useCallback((line: string) => setLogs((l) => [timestamp(), line, ...l]), [timestamp]);

  // Audio monitoring functions
  const startAudioMonitoring = useCallback(async () => {
    try {
      // Get user media stream with selected device
      const constraints: MediaStreamConstraints = {
        audio: selectedDevice
          ? { deviceId: { exact: selectedDevice } }
          : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      microphoneStreamRef.current = stream;

      // Create audio context and analyser  
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      pushLog('Audio monitoring started');

      // Start analyzing audio levels
      const analyzeAudio = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS (Root Mean Square) for audio level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        const normalizedLevel = Math.min(rms / 128, 1); // Normalize to 0-1 range

        setLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      };

      analyzeAudio();
    } catch (error) {
      console.error('Failed to start audio monitoring:', error);
      pushLog(`Failed to start audio monitoring: ${error}`);
    }
  }, [selectedDevice, pushLog]);

  const stopAudioMonitoring = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop microphone stream
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      microphoneStreamRef.current = null;
    }

    analyserRef.current = null;
    setLevel(0);
    pushLog('Audio monitoring stopped');
  }, [pushLog]);

  // Start/stop audio monitoring based on connection status
  useEffect(() => {
    if (status === "connected") {
      startAudioMonitoring();
    } else {
      stopAudioMonitoring();
    }

    // Cleanup on unmount
    return () => {
      stopAudioMonitoring();
    };
  }, [status, startAudioMonitoring, stopAudioMonitoring]);

  // Enumerate available microphone devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}...`
        }));

      setAvailableDevices(audioInputs);

      // Set default device if none selected
      if (!selectedDevice && audioInputs.length > 0) {
        setSelectedDevice(audioInputs[0].deviceId);
      }

      pushLog(`Found ${audioInputs.length} audio input devices`);
      return audioInputs;
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      pushLog(`Failed to enumerate devices: ${error}`);
      setError('Failed to access audio devices. Please check browser permissions.');
      return [];
    }
  }, [selectedDevice, pushLog]);

  // Update device list when permissions change
  useEffect(() => {
    if (permission === "granted") {
      enumerateDevices();
    }
  }, [permission, enumerateDevices]);

  // Listen for device changes (plugged/unplugged)
  useEffect(() => {
    if (permission === "granted") {
      const handleDeviceChange = () => {
        enumerateDevices();
      };

      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [permission, enumerateDevices]);

  // --- Action Handlers ---
  const onGrantPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermission("granted");
      setError(null);
      pushLog("Microphone permission granted");
      // Enumerate devices after permission is granted
      await enumerateDevices();
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermission("denied");
      setError('Microphone permission is required for voice conversations.');
      pushLog("Microphone permission denied");
    }
  }, [pushLog, enumerateDevices]);

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

      // If a specific device is selected, test access to it before starting
      if (selectedDevice) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: selectedDevice } }
          });
          // Close the test stream immediately
          testStream.getTracks().forEach(track => {
            track.stop();
          });
          pushLog(`Successfully accessed selected microphone device`);
        } catch (error) {
          console.error('Selected microphone device not accessible:', error);
          pushLog(`Warning: Selected microphone may not be accessible`);
          setError('Selected microphone device is not accessible. Please select a different device.');
          return;
        }
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
  }, [conversation, permission, pushLog, selectedDevice]);

  const onStop = useCallback(async () => {
    try {
      await conversation.endSession();
      stopAudioMonitoring();
      setError(null);
      pushLog("Conversation stopped");
    } catch (error) {
      console.error('Failed to stop conversation:', error);
      setError('Failed to stop conversation properly.');
      pushLog(`Failed to stop conversation: ${error}`);
    }
  }, [conversation, pushLog, stopAudioMonitoring]);

  const onDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    const device = availableDevices.find(d => d.deviceId === deviceId);
    const deviceLabel = device?.label || deviceId;
    pushLog(`Switched mic to: ${deviceLabel}`);

    // Restart audio monitoring with new device if currently connected
    if (status === "connected") {
      stopAudioMonitoring();
      // Small delay to ensure cleanup is complete before restarting
      setTimeout(() => {
        startAudioMonitoring();
      }, 100);
    }
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
          <div className="flex-1">
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={selectedDevice}
              onChange={(e) => onDeviceChange(e.target.value)}
              disabled={permission !== "granted"}
              aria-label="Select microphone"
            >
              {availableDevices.length === 0 ? (
                <option value="">No microphones available</option>
              ) : (
                availableDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))
              )}
            </select>
            {selectedDevice && (
              <div className="mt-1 text-xs text-slate-500">
                Active: {availableDevices.find(d => d.deviceId === selectedDevice)?.label || 'Unknown device'}
              </div>
            )}
          </div>
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
