"use client";

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState } from 'react';
import { Icon } from '@iconify/react';

export default function VoiceAgent() {
  const [error, setError] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
    },
    onMessage: (message) => {
      console.log('Message from agent:', message);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setError(`Failed to connect to voice agent`);
    },
  });

  const requestMicrophonePermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsPermissionGranted(true);
      setError(null);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setError('Microphone permission is required for voice conversations.');
      return false;
    }
  }, []);

  const startConversation = useCallback(async () => {
    try {
      setError(null);

      // Check if agent ID is configured
      const agentId = process.env.NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID;
      console.log('agentId', agentId);
      if (!agentId || agentId === 'your_agent_id_here') {
        setError('Please configure NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID in your .env.local file');
        return;
      }

      // Check microphone permission first
      if (!isPermissionGranted) {
        const granted = await requestMicrophonePermission();
        if (!granted) return;
      }

      // Start the conversation
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

    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError(`Failed to start voice conversation: ${error instanceof Error ? error.message : error}`);
    }
  }, [conversation, isPermissionGranted, requestMicrophonePermission]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setError(null);
    } catch (error) {
      console.error('Failed to stop conversation:', error);
      setError('Failed to stop conversation properly.');
    }
  }, [conversation]);

  const getStatusColor = () => {
    switch (conversation.status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (conversation.status) {
      case 'connected': return 'material-symbols:check-circle';
      case 'connecting': return 'eos-icons:loading';
      case 'disconnected': return 'material-symbols:radio-button-unchecked';
      default: return 'material-symbols:radio-button-unchecked';
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <Icon icon="material-symbols:error" className="text-red-500" />
            {error}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Icon
              icon={getStatusIcon()}
              className={`${getStatusColor()} ${conversation.status === 'connecting' ? 'animate-spin' : ''}`}
            />
            <span className={`font-medium ${getStatusColor()}`}>
              Status: {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
            </span>
          </div>

          {conversation.status === 'connected' && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${conversation.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="text-sm text-gray-600">
                {conversation.isSpeaking ? 'Speaking' : 'Listening'}
              </span>
            </div>
          )}
        </div>

        {/* Microphone Permission */}
        {!isPermissionGranted && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Icon icon="material-symbols:mic-off" />
              <span className="text-sm">Microphone access required for voice conversations</span>
            </div>
            <button
              onClick={requestMicrophonePermission}
              className="mt-2 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
            >
              Grant Permission
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connected' || conversation.status === 'connecting' || !isPermissionGranted}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {conversation.status === 'connecting' ? (
              <>
                <Icon icon="eos-icons:loading" className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Icon icon="material-symbols:play-arrow" />
                Start Conversation
              </>
            )}
          </button>

          <button
            onClick={stopConversation}
            disabled={conversation.status !== 'connected'}
            className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Icon icon="material-symbols:stop" />
          </button>
        </div>
      </div>
    </div>
  );
}
