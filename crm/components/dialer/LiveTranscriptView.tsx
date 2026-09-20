'use client';

import React, { useRef, useEffect } from 'react';
import { Activity, Mic, Send } from 'lucide-react';
import { TranscriptMessage, Account } from '@/lib/types';

interface LiveTranscriptViewProps {
  liveTranscript: TranscriptMessage[];
  selectedAccount: Account | null;
  callActive: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  isRecordingMic: boolean;
  toggleSpeechRecognition: () => void;
  handleSendMessage: (customText?: string) => void;
}

export function LiveTranscriptView({
  liveTranscript,
  selectedAccount,
  callActive,
  inputText,
  setInputText,
  isRecordingMic,
  toggleSpeechRecognition,
  handleSendMessage,
}: LiveTranscriptViewProps) {
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscript]);

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex-1 flex flex-col space-y-3 min-h-[360px]">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-300" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Real-time Transcript &amp; Sentiment
          </h3>
        </div>
        <span className="text-[11px] text-zinc-400">{liveTranscript.length} dialogue turns</span>
      </div>

      {/* Transcript Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-2">
        {liveTranscript.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-xs">
            Press &quot;Connect Voice Agent&quot; above to initiate live dialogue.
          </div>
        ) : (
          liveTranscript.map((msg) => {
            const isAgent = msg.speaker === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} space-y-1`}
              >
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <span className={`font-bold ${isAgent ? 'text-white' : 'text-zinc-300'}`}>
                    {isAgent ? 'Recovra Specialist (Sarah)' : selectedAccount?.name || 'Debtor'}
                  </span>
                  <span>{msg.timestamp}</span>
                  {msg.sentiment && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {msg.sentiment}
                    </span>
                  )}
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    isAgent
                      ? 'bg-zinc-800/90 border border-zinc-700 text-zinc-100 rounded-tl-sm'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tr-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Quick Simulation Prompts & Mic / Text Bar */}
      {callActive && (
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-zinc-400 font-medium shrink-0">Quick Debtor Response:</span>
            <button
              onClick={() => handleSendMessage('I can make a payment of $300 next Friday.')}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 whitespace-nowrap transition-colors"
            >
              &quot;Pay $300 next Friday&quot;
            </button>
            <button
              onClick={() => handleSendMessage('Can you give me a discount if I pay today in full?')}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 whitespace-nowrap transition-colors"
            >
              &quot;Request Settlement Discount&quot;
            </button>
            <button
              onClick={() => handleSendMessage("I lost my job last month and can't afford this right now.")}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 whitespace-nowrap transition-colors"
            >
              &quot;Report Unemployment Hardship&quot;
            </button>
            <button
              onClick={() => handleSendMessage('Can we set up a 4 month payment plan?')}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 whitespace-nowrap transition-colors"
            >
              &quot;Ask for Installment Plan&quot;
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSpeechRecognition}
              aria-label="Speak via microphone"
              className={`p-2.5 rounded-xl border transition-colors ${
                isRecordingMic
                  ? 'bg-zinc-100 text-zinc-950 animate-pulse border-white'
                  : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <label htmlFor="debtor-text-input" className="sr-only">
              Type debtor response
            </label>
            <input
              id="debtor-text-input"
              type="text"
              aria-label="Type debtor response"
              placeholder="Type debtor response or speak via mic..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <button
              onClick={() => handleSendMessage()}
              aria-label="Send response"
              className="bg-white hover:bg-zinc-200 text-zinc-950 p-2.5 rounded-xl transition-colors shadow"
            >
              <Send className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
