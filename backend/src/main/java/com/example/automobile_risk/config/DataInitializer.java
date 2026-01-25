package com.example.automobile_risk.config;

import com.example.automobile_risk.entity.Anomaly;
import com.example.automobile_risk.entity.DashboardHistory;
import com.example.automobile_risk.entity.Post;
import com.example.automobile_risk.entity.ProcessEntity;
import com.example.automobile_risk.repository.AnomalyRepository;
import com.example.automobile_risk.repository.DashboardHistoryRepository;
import com.example.automobile_risk.repository.PostRepository;
import com.example.automobile_risk.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

        private final ProcessRepository processRepository;
        private final AnomalyRepository anomalyRepository;
        private final DashboardHistoryRepository historyRepository;
        private final PostRepository postRepository;

        @Override
        public void run(String... args) throws Exception {
                if (processRepository.count() == 0) {
                        processRepository.saveAll(Arrays.asList(
                                        ProcessEntity.builder().name("프레스").efficiency(85.0).status("정상")
                                                        .normalCount(85).warningCount(10)
                                                        .anomalyCount(5).build(),
                                        ProcessEntity.builder().name("엔진").efficiency(90.0).status("정상").normalCount(90)
                                                        .warningCount(7)
                                                        .anomalyCount(3).build(),
                                        ProcessEntity.builder().name("차체").efficiency(78.0).status("위험").normalCount(78)
                                                        .warningCount(15)
                                                        .anomalyCount(7).build(),
                                        ProcessEntity.builder().name("도장").efficiency(88.0).status("정상").normalCount(88)
                                                        .warningCount(8)
                                                        .anomalyCount(4).build(),
                                        ProcessEntity.builder().name("설비").efficiency(92.0).status("정상").normalCount(92)
                                                        .warningCount(5)
                                                        .anomalyCount(3).build()));

                        anomalyRepository.saveAll(Arrays.asList(
                                        Anomaly.builder().processName("프레스").count(5).avgDelay(2.5).type("anomaly")
                                                        .build(),
                                        Anomaly.builder().processName("프레스").count(10).avgDelay(0.5).type("warning")
                                                        .build(),
                                        Anomaly.builder().processName("엔진").count(3).avgDelay(4.0).type("anomaly")
                                                        .build(),
                                        Anomaly.builder().processName("엔진").count(7).avgDelay(0.8).type("warning")
                                                        .build(),
                                        Anomaly.builder().processName("차체").count(7).avgDelay(3.2).type("anomaly")
                                                        .build(),
                                        Anomaly.builder().processName("차체").count(15).avgDelay(0.6).type("warning")
                                                        .build(),
                                        Anomaly.builder().processName("도장").count(4).avgDelay(2.8).type("anomaly")
                                                        .build(),
                                        Anomaly.builder().processName("도장").count(8).avgDelay(0.4).type("warning")
                                                        .build(),
                                        Anomaly.builder().processName("설비").count(3).avgDelay(5.0).type("anomaly")
                                                        .build(),
                                        Anomaly.builder().processName("설비").count(5).avgDelay(1.0).type("warning")
                                                        .build()));

                        historyRepository.saveAll(Arrays.asList(
                                        DashboardHistory.builder().date("1/5").totalDelay(35.0).build(),
                                        DashboardHistory.builder().date("1/6").totalDelay(42.0).build(),
                                        DashboardHistory.builder().date("1/7").totalDelay(58.0).build(),
                                        DashboardHistory.builder().date("1/8").totalDelay(51.0).build()));
                        historyRepository.save(DashboardHistory.builder().date("2024-03-24").totalDelay(2.2).build());
                }

                // Seed Board
                if (postRepository.count() == 0) {
                        Post post = Post.builder()
                                        .title("시스템 점검 공지")
                                        .content("오늘 23시부터 정기 시스템 점검이 있을 예정입니다.")
                                        .authorName("관리자")
                                        .build();
                        postRepository.save(post);
                }
        }
}
