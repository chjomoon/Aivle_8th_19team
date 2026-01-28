package com.example.automobile_risk.service;

import com.example.automobile_risk.controller.dto.SensorDataCreateForm;
import com.example.automobile_risk.entity.Sensor;
import com.example.automobile_risk.entity.SensorData;
import com.example.automobile_risk.exception.EquipmentNotFoundException;
import com.example.automobile_risk.exception.SensorDataNotFoundException;
import com.example.automobile_risk.exception.SensorNotFoundException;
import com.example.automobile_risk.repository.EquipmentRepository;
import com.example.automobile_risk.repository.SensorDataRepository;
import com.example.automobile_risk.repository.SensorRepository;
import com.example.automobile_risk.service.dto.SensorDataDetailResponse;
import com.example.automobile_risk.service.dto.SensorDataListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class SensorDataService {

    private final SensorDataRepository sensorDataRepository;
    private final SensorRepository sensorRepository;
    private final EquipmentRepository equipmentRepository;

    /**
     *  1. 생성
     */
    @Transactional
    public Long create(SensorDataCreateForm form) {

        Long sensorId = form.getSensorId();
        Sensor sensor = sensorRepository.findById(sensorId)
                .orElseThrow(() -> new SensorNotFoundException(sensorId));

        SensorData sensorData = SensorData.create(
                form.getValue(),
                form.getMeasuredAt(),
                sensor
        );

        SensorData savedSensorData = sensorDataRepository.save(sensorData);

        return savedSensorData.getId();
    }

//    /**
//     *  2. 수정
//     */
//    @Transactional
//    public Long update(Long id, SensorDataUpdateForm form) {
//
//        Long sensorId = form.getSensorId();
//        Sensor sensor = sensorRepository.findById(sensorId)
//                .orElseThrow(() -> new SensorNotFoundException(sensorId));
//
//        SensorData sensorData = sensorDataRepository.findById(id)
//                .orElseThrow(() -> new SensorDataNotFoundException(id));
//
//        sensorData.update(
//                form.getValue(),
//                form.getMeasuredAt(),
//                sensor
//        );
//
//        return sensorData.getId();
//    }
//
//    /**
//     *  3. 삭제
//     */
//    @Transactional
//    public Long delete(Long sensorDataId) {
//
//        SensorData sensorData = sensorDataRepository.findById(sensorDataId)
//                .orElseThrow(() -> new SensorDataNotFoundException(sensorDataId));
//
//        sensorDataRepository.deleteById(sensorData.getId());
//
//        return sensorData.getId();
//    }

    /**
     *  4. 단건 조회
     */
    public SensorDataDetailResponse getDetail(Long sensorDataId) {

        SensorData sensorData = sensorDataRepository.findById(sensorDataId)
                .orElseThrow(() -> new SensorDataNotFoundException(sensorDataId));

        return SensorDataDetailResponse.from(sensorData);
    }

//    /**
//     *  5. 목록 조회
//     */
//    public List<SensorDataListResponse> getList() {
//
//        List<SensorData> sensorDataList = sensorDataRepository.findBySensorAndPeriod();
//
//        return sensorDataList.stream()
//                .map(SensorDataListResponse::from)
//                .collect(Collectors.toList());
//    }

    /**
     *  센서별 + 기간 조회
     */
    public List<SensorDataListResponse> getBySensorAndPeriod(
            Long sensorId,
            LocalDateTime from,
            LocalDateTime to
    ) {

        // 센서 존재 검증 (의미적으로 좋음)
        sensorRepository.findById(sensorId)
                .orElseThrow(() -> new SensorNotFoundException(sensorId));

        List<SensorData> list =
                sensorDataRepository.findBySensorAndPeriod(sensorId, from, to);

        return list.stream()
                .map(SensorDataListResponse::from)
                .toList();
    }

    /**
     *  설비별 + 기간 조회
     */
    public List<SensorDataListResponse> getByEquipmentAndPeriod(
            Long equipmentId,
            LocalDateTime from,
            LocalDateTime to
    ) {

        equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        List<SensorData> list =
                sensorDataRepository.findByEquipmentAndPeriod(equipmentId, from, to);

        return list.stream()
                .map(SensorDataListResponse::from)
                .toList();
    }
}
