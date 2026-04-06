// FriendlyTeaching.cl — Live Chat Widget (Student side)
// Floating chat bubble + expandable panel for class Q&A.
'use client';
import { useState, useRef, useEffect } from 'react';
import { useLiveChat } from '@/hooks/useLiveChat';

interface Props {
  sessionId: string;
  studentUid: string;
  studentName: string;
}

export default function LiveChatStudent({ sessionId, studentUid, studentName }: Props) {
  const { messages, sendMessage } = useLiveChat(sessionId);
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const unreadCount = messages.filter((m) => m.authorRole === 'teacher').length;

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isOpen]);

  function handleSend() {
    if (!text.trim()) return;
    sendMessage(studentUid, studentName, 'student', text, isQuestion);
    setText('');
    setIsQuestion(false);
  }

  // Floating bubble when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-gradient-to-br from-[#C8A8DC] to-[#9B7CB8] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        title="Abrir chat"
      >
        <span className="text-xl">💬</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-[#E0D5FF] flex flex-col overflow-hidden animate-[slideUp_0.2s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] flex-shrink-0">
        <span className="text-xs font-bold text-white">💬 Chat de clase</span>
        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white text-sm">✕</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-8">Sin mensajes aún. ¡Haz una pregunta!</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.authorId === studentUid;
            return (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 max-w-[85%] ${
                  isMine
                    ? 'bg-[#F0E5FF] ml-auto'
                    : msg.authorRole === 'teacher'
                      ? 'bg-blue-50 border border-blue-100'
                      : msg.isPinned
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-gray-50'
                }`}
              >
                <span className={`text-[10px] font-bold block mb-0.5 ${
                  msg.authorRole === 'teacher' ? 'text-blue-600' : isMine ? 'text-[#9B7CB8]' : 'text-gray-500'
                }`}>
                  {msg.authorRole === 'teacher' ? '🧑‍🏫 Profesor' : isMine ? 'Tú' : msg.authorName}
                  {msg.isQuestion && <span className="text-blue-500 ml-1">❓</span>}
                  {msg.isPinned && <span className="text-amber-500 ml-1">📌</span>}
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">{msg.text}</p>
                {msg.isQuestion && msg.isAnswered && (
                  <span className="text-[9px] text-green-500 font-bold">✅ Respondida</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-100 p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <button
            onClick={() => setIsQuestion(!isQuestion)}
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
              isQuestion ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-blue-50'
            }`}
          >
            ❓ Pregunta
          </button>
          {isQuestion && <span className="text-[9px] text-blue-500">El profesor verá tu pregunta destacada</span>}
        </div>
        <div className="flex gap-1.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={isQuestion ? 'Escribe tu pregunta...' : 'Escribe un mensaje...'}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="px-3 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
          >
            📤
          </button>
        </div>
      </div>
    </div>
  );
}
