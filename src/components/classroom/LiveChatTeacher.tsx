// FriendlyTeaching.cl — Live Chat Panel (Teacher side)
// Shows all messages + Q&A queue with pin/answer actions.
'use client';
import { useState, useRef, useEffect } from 'react';
import { useLiveChat } from '@/hooks/useLiveChat';

interface Props {
  sessionId: string;
  teacherId: string;
  teacherName: string;
  onClose: () => void;
}

export default function LiveChatTeacher({ sessionId, teacherId, teacherName, onClose }: Props) {
  const { messages, unansweredCount, sendMessage, markAnswered, togglePin } = useLiveChat(sessionId);
  const [text, setText] = useState('');
  const [tab, setTab] = useState<'chat' | 'questions'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  function handleSend() {
    if (!text.trim()) return;
    sendMessage(teacherId, teacherName, 'teacher', text);
    setText('');
  }

  const questions = messages.filter((m) => m.isQuestion);

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#F0E5FF] flex-shrink-0">
        <h3 className="text-sm font-bold text-[#5A3D7A]">💬 Chat en vivo</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => setTab('chat')}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            tab === 'chat' ? 'text-[#5A3D7A] border-b-2 border-[#C8A8DC]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Chat ({messages.length})
        </button>
        <button
          onClick={() => setTab('questions')}
          className={`flex-1 py-2 text-xs font-bold transition-colors relative ${
            tab === 'questions' ? 'text-[#5A3D7A] border-b-2 border-[#C8A8DC]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Preguntas ({questions.length})
          {unansweredCount > 0 && (
            <span className="absolute -top-0.5 right-4 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {unansweredCount}
            </span>
          )}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-2">
        {tab === 'chat' ? (
          messages.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">Sin mensajes aún</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 max-w-[90%] ${
                  msg.authorRole === 'teacher'
                    ? 'bg-[#F0E5FF] ml-auto'
                    : msg.isPinned
                      ? 'bg-amber-50 border border-amber-200'
                      : msg.isQuestion
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className={`text-[10px] font-bold ${msg.authorRole === 'teacher' ? 'text-[#9B7CB8]' : 'text-gray-500'}`}>
                    {msg.authorRole === 'teacher' ? '🧑‍🏫 Tú' : `👤 ${msg.authorName}`}
                    {msg.isQuestion && <span className="text-blue-500 ml-1">❓</span>}
                    {msg.isPinned && <span className="text-amber-500 ml-1">📌</span>}
                  </span>
                  {msg.authorRole === 'student' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => togglePin(msg.id, msg.isPinned)}
                        className="text-[10px] text-gray-400 hover:text-amber-500"
                        title={msg.isPinned ? 'Desfijar' : 'Fijar'}
                      >
                        📌
                      </button>
                      {msg.isQuestion && !msg.isAnswered && (
                        <button
                          onClick={() => markAnswered(msg.id)}
                          className="text-[10px] text-gray-400 hover:text-green-500"
                          title="Marcar como respondida"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{msg.text}</p>
                {msg.isQuestion && msg.isAnswered && (
                  <span className="text-[9px] text-green-500 font-bold">✅ Respondida</span>
                )}
              </div>
            ))
          )
        ) : (
          // Questions tab
          questions.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">Sin preguntas aún</p>
          ) : (
            questions.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 ${
                  msg.isAnswered ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-500">👤 {msg.authorName}</span>
                  {!msg.isAnswered ? (
                    <button
                      onClick={() => markAnswered(msg.id)}
                      className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold hover:bg-green-200 transition-colors"
                    >
                      ✅ Responder
                    </button>
                  ) : (
                    <span className="text-[10px] text-green-500 font-bold">✅ Respondida</span>
                  )}
                </div>
                <p className="text-xs text-gray-700">{msg.text}</p>
              </div>
            ))
          )
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-100 p-3">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Escribe un mensaje..."
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
