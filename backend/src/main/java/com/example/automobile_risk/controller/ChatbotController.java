package com.example.automobile_risk.controller;

import com.example.automobile_risk.dto.ChatbotRequest;
import com.example.automobile_risk.dto.ChatbotResponse;
import com.example.automobile_risk.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/query")
    public ChatbotResponse query(@RequestBody ChatbotRequest request) {
        return chatbotService.query(request.getMessage());
    }
}
