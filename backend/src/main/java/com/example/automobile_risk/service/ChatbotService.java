package com.example.automobile_risk.service;

import com.example.automobile_risk.dto.ChatbotResponse;
import com.example.automobile_risk.dto.openai.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final int MAX_TOOL_CALLS = 3;

    private static final String SYSTEM_PROMPT = """
            당신은 자동차 제조 공정 관리 시스템의 AI 어시스턴트입니다.
            사용자의 질문 유형에 따라 적절하게 답변합니다.

            ## 시스템 UI 구조
            이 시스템은 두 가지 모드가 있습니다 (사이드바 하단에서 전환 가능):

            ### [공정확인 모드]
            - 메인 대시보드 (/) : 전체 공정 현황, 이상/경고 건수, 가동률 한눈에 보기
            - 프레스 머신 (/press) : 프레스 공정 모니터링, 압력/온도/사이클 분석
            - 용접 이미지 (/welding-image) : 용접 품질 이미지 분석, 불량 탐지
            - 윈드실드 (/windshield) : 윈드실드 조립 공정 모니터링
            - 엔진 진동 (/engine-vibration) : 엔진 진동 데이터 분석, 이상 탐지
            - 차체 조립 (/body) : 차체 조립 공정 현황
            - 도장 품질 (/paint) : 도장 품질 검사, 결함 탐지 (AI 이미지 분석)
            - 게시판 (/board) : 공지사항, 작업 지시, 커뮤니케이션

            ### [주문생산 모드]
            - 주문 (/order/orders) : 주문 목록 및 관리
            - 생산 (/order/production) : 생산 계획 및 현황
            - 공정 (/order/process) : 공정별 진행 상태

            ## 답변 규칙
            1. 한국어로 친절하게 답변합니다.
            2. 인사나 일반 대화에는 자연스럽게 대화합니다. (API 호출 불필요)
            3. UI 위치나 기능 질문에는 위 구조를 참고하여 안내합니다. (API 호출 불필요)
            4. 실시간 데이터가 필요한 질문에만 API를 호출합니다.
            5. 데이터 기반 답변 시 주요 수치를 강조하고, 필요 시 개선 방안을 제안합니다.
            6. 데이터를 조회한 경우에만 답변 마지막에 "---\\ndata_summary:" 형식으로 요약을 추가합니다.
               예: ---\\ndata_summary: 대시보드 기준 이상 22건, 경고 45건, 가동률 86.6%

            ## 예시
            - "안녕" → "안녕하세요! 무엇을 도와드릴까요?" (API 호출 X)
            - "도장 품질 어디서 봐?" → "도장 품질은 왼쪽 사이드바의 '도장 품질' 메뉴에서 확인할 수 있습니다. (/paint)" (API 호출 X)
            - "현재 이상 건수 알려줘" → API 호출 후 데이터 기반 답변
            """;

    private final OpenAiClient openAiClient;
    private final InternalApiClient internalApiClient;
    private final ObjectMapper objectMapper;

    public ChatbotResponse query(String message) {
        try {
            List<OpenAiMessage> messages = new ArrayList<>();
            messages.add(OpenAiMessage.system(SYSTEM_PROMPT));
            messages.add(OpenAiMessage.user(message));

            List<OpenAiTool> tools = List.of(OpenAiClient.buildCallSpringApiTool());

            int toolCallCount = 0;

            while (toolCallCount < MAX_TOOL_CALLS) {
                OpenAiChatResponse response = openAiClient.chat(messages, tools);

                if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                    return fallbackResponse();
                }

                OpenAiMessage assistantMessage = response.getChoices().get(0).getMessage();
                String finishReason = response.getChoices().get(0).getFinishReason();

                messages.add(assistantMessage);

                if (!"tool_calls".equals(finishReason) || assistantMessage.getToolCalls() == null) {
                    return parseResponse(assistantMessage.getContent());
                }

                for (OpenAiToolCall toolCall : assistantMessage.getToolCalls()) {
                    String result = executeToolCall(toolCall);
                    messages.add(OpenAiMessage.tool(toolCall.getId(), result));
                    toolCallCount++;
                }
            }

            // Max tool calls reached, do final call without tools
            OpenAiChatResponse finalResponse = openAiClient.chat(messages, null);
            if (finalResponse != null && finalResponse.getChoices() != null && !finalResponse.getChoices().isEmpty()) {
                return parseResponse(finalResponse.getChoices().get(0).getMessage().getContent());
            }

            return fallbackResponse();
        } catch (Exception e) {
            log.error("Chatbot query failed", e);
            return ChatbotResponse.builder()
                    .content("죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
                    .build();
        }
    }

    private String executeToolCall(OpenAiToolCall toolCall) {
        try {
            String functionName = toolCall.getFunction().getName();
            if (!"call_spring_api".equals(functionName)) {
                return "{\"error\": \"Unknown function: " + functionName + "\"}";
            }

            ToolCallArguments args = objectMapper.readValue(
                    toolCall.getFunction().getArguments(), ToolCallArguments.class);

            return internalApiClient.call(args.getMethod(), args.getPath(), args.getQueryParams());
        } catch (JsonProcessingException e) {
            log.error("Failed to parse tool call arguments", e);
            return "{\"error\": \"Invalid arguments\"}";
        }
    }

    private ChatbotResponse parseResponse(String content) {
        if (content == null) {
            return fallbackResponse();
        }

        String dataSummary = null;
        String mainContent = content;

        int separatorIdx = content.lastIndexOf("---\ndata_summary:");
        if (separatorIdx == -1) {
            separatorIdx = content.lastIndexOf("---\\ndata_summary:");
        }

        if (separatorIdx >= 0) {
            mainContent = content.substring(0, separatorIdx).trim();
            String afterSep = content.substring(separatorIdx);
            int colonIdx = afterSep.indexOf(":");
            if (colonIdx >= 0) {
                dataSummary = afterSep.substring(colonIdx + 1).trim();
            }
        }

        return ChatbotResponse.builder()
                .content(mainContent)
                .dataSummary(dataSummary)
                .build();
    }

    private ChatbotResponse fallbackResponse() {
        return ChatbotResponse.builder()
                .content("죄송합니다. 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.")
                .build();
    }
}
