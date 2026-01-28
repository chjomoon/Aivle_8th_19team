package com.example.automobile_risk.service;

import com.example.automobile_risk.controller.dto.SensorCreateForm;
import com.example.automobile_risk.controller.dto.SensorUpdateForm;
import com.example.automobile_risk.entity.Equipment;
import com.example.automobile_risk.entity.Sensor;
import com.example.automobile_risk.exception.EquipmentNotFoundException;
import com.example.automobile_risk.exception.SensorNotFoundException;
import com.example.automobile_risk.repository.EquipmentRepository;
import com.example.automobile_risk.repository.SensorRepository;
import com.example.automobile_risk.service.dto.SensorDetailResponse;
import com.example.automobile_risk.service.dto.SensorListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class SensorService {

    private final SensorRepository sensorRepository;
    private final EquipmentRepository equipmentRepository;

    /**
     *  1. 센서 생성
     */
    @Transactional
    public Long create(SensorCreateForm form) {

        Long equipmentId = form.getEquipmentId();
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        Sensor sensor = Sensor.create(
                form.getSensorType(),
                form.getUnit(),
                equipment
        );

        Sensor savedSensor = sensorRepository.save(sensor);

        return savedSensor.getId();
    }

    /**
     *  2. 센서 수정
     */
    @Transactional
    public Long update(Long id, SensorUpdateForm form) {

        Long equipmentId = form.getEquipmentId();
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new SensorNotFoundException(id));

        sensor.update(
                form.getSensorType(),
                form.getUnit(),
                equipment
        );

        return sensor.getId();
    }

    /**
     *  3. 센서 삭제
     */
    @Transactional
    public Long delete(Long sensorId) {

        Sensor sensor = sensorRepository.findById(sensorId)
                .orElseThrow(() -> new SensorNotFoundException(sensorId));

        sensorRepository.deleteById(sensorId);

        return sensor.getId();
    }

    /**
     *  4. 센서 단건 조회
     */
    public SensorDetailResponse getDetail(Long sensorId) {

        Sensor sensor = sensorRepository.findById(sensorId)
                .orElseThrow(() -> new SensorNotFoundException(sensorId));

        return SensorDetailResponse.from(sensor);
    }

    /**
     *  5. 센서 목록 조회
     */
    public List<SensorListResponse> getList() {

        List<Sensor> sensorList = sensorRepository.findAll();

        return sensorList.stream()
                .map(SensorListResponse::from)
                .collect(Collectors.toList());
    }
}
