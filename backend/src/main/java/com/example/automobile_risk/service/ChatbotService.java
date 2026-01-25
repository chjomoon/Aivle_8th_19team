package com.example.automobile_risk.service;

import com.example.automobile_risk.dto.ChatbotResponse;
import org.springframework.stereotype.Service;

@Service
public class ChatbotService {

    public ChatbotResponse query(String message) {
        String lowerMessage = message.toLowerCase();
        String response = "";

        if (lowerMessage.contains("납기") && (lowerMessage.contains("리스크") || lowerMessage.contains("위험"))) {
            response = "📊 **납기 리스크 분석 결과**\n\n현재 가장 리스크가 높은 오더는 **ORD-2026-0015**입니다.\n\n**주요 리스크 요인:**\n• 차체 조립 공정 이상 7건 발생 (예상 지연: 22.4시간)\n• 설비 점검으로 인한 가동 중단 (예상 지연: 15시간)\n• 엔진 조립 사이클 타임 초과 (예상 지연: 12시간)\n\n**총 예상 지연:** 2일 1시간\n**원래 납기:** 2026년 1월 20일\n**예상 납기:** 2026년 1월 22일 오전 7시";
        } else if (lowerMessage.contains("프레스")) {
            response = "🏭 **프레스 공정 현황**\n\n**전체 상태:** 양호\n**가동률:** 96%\n**이상 발생:** 5건 (경고 10건)\n\n**주요 지표:**\n• 평균 압력: 862 kPa (정상 범위)\n• 평균 온도: 77°C (정상 범위)\n• 평균 진동: 1.3 mm/s (정상 범위)";
        } else if (lowerMessage.contains("전체") || lowerMessage.contains("종합")) {
            response = "📊 **종합 공정 현황**\n\n**주요 지표:**\n• 전체 가동률: 86.6%\n• 이상 발생: 22건\n• 경고: 45건\n• 생산 효율: 94.2%";
        } else {
            response = "죄송합니다. 해당 질문에 대해 학습된 데이터가 부족합니다. '납기 리스크'나 '프레스 공정'에 대해 물어봐주세요.";
        }

        return ChatbotResponse.builder().content(response).build();
    }
}
