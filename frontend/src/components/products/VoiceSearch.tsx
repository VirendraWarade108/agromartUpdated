'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X } from 'lucide-react';
import { showErrorToast } from '@/store/uiStore';

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  onClose?: () => void;
}

export function VoiceSearch({ onSearch, onClose }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser support for Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      setTranscript((prev) => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        showErrorToast('Error', `Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        showErrorToast('Error', 'Failed to start voice recognition');
      }
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleSearch = () => {
    const query = (transcript + interimTranscript).trim();
    if (query) {
      onSearch(query);
      setTranscript('');
      setInterimTranscript('');
      if (onClose) onClose();
    }
  };

  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
          <div className="text-center">
            <MicOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Voice Search Not Supported</h3>
            <p className="text-gray-600 mb-6">Your browser doesn't support voice search. Please use text search instead.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Voice Search</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Microphone Button */}
          <div className="flex justify-center">
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`relative w-24 h-24 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 scale-105'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {isListening ? (
                <MicOff className="w-12 h-12 text-white mx-auto my-6" />
              ) : (
                <Mic className="w-12 h-12 text-white mx-auto my-6" />
              )}

              {isListening && (
                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75" />
              )}
            </button>
          </div>

          {/* Status Text */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {isListening ? '🎤 Listening...' : '👂 Ready to listen'}
            </p>
            <p className="text-xs text-gray-500">Speak clearly for better results</p>
          </div>

          {/* Transcript Display */}
          <div className="space-y-2">
            {transcript && (
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase">Recognized Text</label>
                <div className="mt-1 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-gray-900">{transcript}</p>
                </div>
              </div>
            )}

            {interimTranscript && (
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase">Currently Hearing</label>
                <div className="mt-1 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-gray-600 italic">{interimTranscript}</p>
                </div>
              </div>
            )}

            {!transcript && !interimTranscript && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Click the microphone and start speaking...</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {transcript && (
              <>
                <button
                  onClick={handleClear}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSearch}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Search
                </button>
              </>
            )}

            {!transcript && (
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border-2 border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-xs text-blue-800 font-medium">💡 Tip:</p>
            <p className="text-xs text-blue-700 mt-1">
              Say product names, categories, or phrases like "tomato seeds" or "organic fertilizer"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
