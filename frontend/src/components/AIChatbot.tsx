import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '안녕하세요! 공정 관리 AI 어시스턴트입니다. 공정 상태, 납기 리스크, 이상 현황 등에 대해 질문해주세요.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exampleQuestions = [
    "현재 가장 납기 리스크가 높은 오더는?",
    "오늘 발생한 공정 이상이 납기에 미치는 영향은?",
    "프레스 공정의 현재 상태는?",
    "차체 조립 라인의 이상 내역을 알려줘",
    "납기 지연을 줄이려면 어떻게 해야 해?",
  ];

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // 납기 리스크 관련
    if (lowerMessage.includes('납기') && (lowerMessage.includes('리스크') || lowerMessage.includes('위험') || lowerMessage.includes('높은'))) {
      return `📊 **납기 리스크 분석 결과**\n\n현재 가장 리스크가 높은 오더는 **ORD-2026-0015**입니다.\n\n**주요 리스크 요인:**\n• 차체 조립 공정 이상 7건 발생 (예상 지연: 22.4시간)\n• 설비 점검으로 인한 가동 중단 (예상 지연: 15시간)\n• 엔진 조립 사이클 타임 초과 (예상 지연: 12시간)\n\n**총 예상 지연:** 2일 1시간\n**원래 납기:** 2026년 1월 20일\n**예상 납기:** 2026년 1월 22일 오전 7시\n\n💡 **권장 조치:**\n1. 차체 조립 라인 즉시 점검 및 정비\n2. 설비 점검 일정 단축 방안 검토\n3. 엔진 조립 라인 작업자 추가 투입 고려`;
    }

    // 공정 이상 영향 분석
    if (lowerMessage.includes('공정') && lowerMessage.includes('이상') && lowerMessage.includes('영향')) {
      return `⚠️ **금일 공정 이상 영향 분석**\n\n**발생 이상 총 22건** (경고 45건)\n\n**공정별 영향:**\n• 프레스: 5건 → 12.5시간 지연 예상\n• 엔진 조립: 3건 → 12시간 지연 예상\n• 차체 조립: 7건 → 22.4시간 지연 예상 ⚡\n• 도장 품질: 4건 → 11.2시간 지연 예상\n• 설비: 3건 → 15시간 지연 예상\n\n**총 납기 영향:** 약 73.1시간 (3일 1시간) 지연\n\n🎯 **긴급 대응이 필요한 공정:**\n1. **차체 조립** - 용접 로봇 R-05 점검 필요\n2. **설비** - 프레스 머신 PM-02 온도 이상\n3. **엔진 조립** - 피스톤 조립 사이클 타임 지연`;
    }

    // 프레스 공정
    if (lowerMessage.includes('프레스')) {
      return `🏭 **프레스 공정 현황**\n\n**전체 상태:** 양호\n**가동률:** 96%\n**이상 발생:** 5건 (경고 10건)\n\n**주요 지표:**\n• 평균 압력: 862 kPa (정상 범위)\n• 평균 온도: 77°C (정상 범위)\n• 평균 진동: 1.3 mm/s (정상 범위)\n\n⚠️ **주의 사항:**\n• PM-02: 온도 82°C로 상승 중, 점검 권장\n• PM-01, PM-03, PM-04: 정상 가동 중\n\n💡 **권장 조치:**\nPM-02 냉각 시스템 점검 및 온도 모니터링 강화`;
    }

    // 차체 조립
    if (lowerMessage.includes('차체')) {
      return `🔧 **차체 조립 라인 이상 내역**\n\n**총 이상 건수:** 7건\n**영향도:** 높음 (22.4시간 지연 예상)\n\n**상세 내역:**\n1. **R-05 (실링 로봇)** - 점검 중\n   • 발생 시각: 13:45\n   • 예상 복구: 16:30\n   • 영향: 2.75시간 생산 중단\n\n2. **프론트 용접 라인** - 재작업 8건\n   • 용접 불량으로 인한 재작업\n   • 영향: 4시간 지연\n\n3. **리어 용접 라인** - 재작업 8건\n   • 치수 정확도 이슈\n   • 영향: 4시간 지연\n\n🎯 **긴급 조치:**\n1. R-05 로봇 긴급 정비 완료\n2. 용접 파라미터 재설정\n3. 품질 검사 강화`;
    }

    // 납기 지연 개선
    if (lowerMessage.includes('납기') && (lowerMessage.includes('줄이') || lowerMessage.includes('개선') || lowerMessage.includes('단축'))) {
      return `💡 **납기 지연 개선 방안**\n\n**즉시 실행 가능한 조치:**\n\n1. **우선순위 재조정**\n   • 리스크 높은 오더 우선 생산\n   • 병목 공정 집중 관리\n\n2. **인력 재배치**\n   • 차체 조립 라인에 숙련 작업자 2명 추가\n   • 야간 근무 시간 1시간 연장 검토\n\n3. **설비 최적화**\n   • 예방 정비 일정 재조정\n   • 대기 중인 로봇(R-03) 활용 방안 검토\n\n4. **공정 개선**\n   • 엔진 조립 사이클 타임 단축 (목표: -1.5분)\n   • 도장 부스 온습도 자동 제어 강화\n\n**예상 효과:**\n• 현재 73시간 → 개선 후 48시간으로 단축 가능\n• 납기 준수율 92% → 97% 향상 예상`;
    }

    // 엔진 조립
    if (lowerMessage.includes('엔진')) {
      return `⚙️ **엔진 조립 공정 현황**\n\n**생산 현황:**\n• 금일 생산량: 336대 (목표: 350대, 96%)\n• 불량률: 2.1% (목표: 1.5% 이하)\n• 평균 사이클 타임: 12.7분 (목표 대비 +0.7분)\n\n**주요 이슈:**\n• EA-라인2: 피스톤 조립 사이클 타임 지연 (16.2분 → 목표 15분)\n• EA-라인3: 토크 렌치 교정 필요\n• EA-라인1: 부품 재고 부족 예상 (48시간 내)\n\n✅ **개선 제안:**\n1. 피스톤 조립 작업 표준 재검토\n2. 토크 렌치 즉시 교정\n3. 부품 긴급 발주 요청`;
    }

    // 도장 품질
    if (lowerMessage.includes('도장')) {
      return `🎨 **도장 품질 현황**\n\n**품질 지표:**\n• 품질 적합률: 98.3% ✅\n• 평균 도막 두께: 33.4μm (목표 범위 내)\n• 불량 발생: 40건\n\n**불량 유형 분포:**\n• 흐름자국: 15건 (최다)\n• 먼지: 12건\n• 기포: 8건\n• 색상 불균일: 5건\n\n**환경 조건:**\n• 부스 온도: 24.0°C (적정)\n• 습도: 51% (적정)\n\n💡 **개선 방안:**\n1. 부스 청정도 점검 (먼지 불량 저감)\n2. 도료 점도 조정 (흐름자국 개선)\n3. PB-03 필터 교체 예정 (1/15)`;
    }

    // 설비 관리
    if (lowerMessage.includes('설비')) {
      return `🔧 **설비 관리 현황**\n\n**전체 설비 상태:**\n• 가동률: 91.5% (목표: 90% 이상)\n• 정상 가동: 85%\n• 점검 대기: 10%\n• 정비 중: 5%\n\n**예정된 정비:**\n1. PM-02 (프레스) - 정기 점검 (1/12)\n2. R-05 (로봇) - 부품 교체 (1/13) 🔴 긴급\n3. PB-03 (도장부스) - 필터 교체 (1/15)\n4. CB-01 (컨베이어) - 윤활유 보충 (1/16)\n\n**전력 사용:**\n• 현재: 5.3 MW\n• 에너지 효율: 87.2% (개선 중)\n\n⚠️ **긴급 조치 필요:**\nR-05 로봇 부품 교체를 금일 중으로 앞당기는 것을 권장합니다.`;
    }

    // 전체 현황
    if (lowerMessage.includes('전체') || lowerMessage.includes('종합') || lowerMessage.includes('현황')) {
      return `📊 **종합 공정 현황**\n\n**주요 지표:**\n• 전체 가동률: 86.6%\n• 이상 발생: 22건\n• 경고: 45건\n• 생산 효율: 94.2%\n\n**공정별 상태:**\n✅ 프레스: 양호 (이상 5건)\n⚠️ 엔진 조립: 주의 (이상 3건, 사이클 타임 지연)\n🔴 차체 조립: 위험 (이상 7건, 로봇 점검중)\n✅ 도장 품질: 양호 (이상 4건)\n✅ 설비: 양호 (이상 3건)\n\n**납기 예측:**\n• 예상 지연: 3일 1시간\n• 원래 납기: 1월 20일\n• 예상 납기: 1월 23일 오전 7시\n\n🎯 **우선 대응 필요:**\n1. 차체 조립 라인 정상화\n2. 엔진 조립 사이클 타임 개선\n3. 설비 예방 정비 강화`;
    }

    // 기본 응답
    return `죄송합니다. 해당 질문에 대한 정보를 찾을 수 없습니다.\n\n다음과 같은 질문을 시도해보세요:\n• "현재 납기 리스크가 높은 오더는?"\n• "공정 이상이 납기에 미치는 영향은?"\n• "프레스 공정의 현재 상태는?"\n• "차체 조립 라인의 이상 내역을 알려줘"\n• "납기 지연을 줄이려면 어떻게 해야 해?"`;
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleExampleClick = (question: string) => {
    setInputValue(question);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-50"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">AI 어시스턴트</h3>
                <p className="text-xs text-blue-100">공정 관리 전문</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Example Questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">💡 예시 질문:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQuestions.slice(0, 2).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(question)}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="질문을 입력하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
