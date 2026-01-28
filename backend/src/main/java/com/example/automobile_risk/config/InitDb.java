package com.example.automobile_risk.config;

import com.example.automobile_risk.entity.*;
import com.example.automobile_risk.entity.enumclass.Unit;
import com.example.automobile_risk.service.ManufacturingOrchestrationService;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Component
public class InitDb {

    private final InitService initService;

    @PostConstruct
    public void init() {
        initService.vehicleModelDbInit();
        initService.OrderAndProductionDbInit();
    }

    @Component
    @Transactional
    @RequiredArgsConstructor
    static class InitService {

        private final EntityManager em;
        private final ManufacturingOrchestrationService manufacturingOrchestrationService;

        public void vehicleModelDbInit() {

            /**
             *  차량 모델
             */
            VehicleModel avante_CN8 = createVehicleModel("아반떼 CN8", "준중형 세단", "가솔린", "2026년 하반기 출시 예정인 현대 아반떼의 8세대 모델", true);
            VehicleModel sonata_DN8 = createVehicleModel("쏘나타 DN8", "중형 세단", "하이브리드", "국민차 하면 가장 먼저 떠오르는 명실상부한 대한민국 대표 승용차", true);
            VehicleModel grandeur_GN7 = createVehicleModel("그랜저 GN7", "준대형 세단", "가솔린", "현대자동차의 준대형 세단인 그랜저의 7세대 모델이다. 코드명은 GN7.", true);
            VehicleModel tucson_NX4 = createVehicleModel("투싼 NX4", "준중형 SUV", "가솔린", "현대 투싼의 4세대 모델로, 프로젝트명은 NX4.", true);
            VehicleModel santafe_MX5 = createVehicleModel("싼타페 MX5", "중형 SUV", "하이브리드", "현대 싼타페 5세대 모델로, 프로젝트명은 MX5.", true);
            em.persist(avante_CN8);
            em.persist(sonata_DN8);
            em.persist(grandeur_GN7);
            em.persist(tucson_NX4);
            em.persist(santafe_MX5);

            /**
             *  부품
             */
            Part headLamp = createPart("헤드 램프", "실외", Unit.EA);
            Part tailLamp = createPart("테일 램프", "실외", Unit.EA);
            Part door = createPart("도어", "실외", Unit.EA);
            Part bumper = createPart("범퍼", "실외", Unit.EA);
            Part radiatorGrill = createPart("라디에이터 그릴", "실외", Unit.EA);
            em.persist(headLamp);
            em.persist(tailLamp);
            em.persist(door);
            em.persist(bumper);
            em.persist(radiatorGrill);

            /**
             *  BOM (차량-부품)
             */
            Bom avante_CN8_headLamp = createBom(2, avante_CN8, headLamp);
            Bom avante_CN8_tailLamp = createBom(2, avante_CN8, tailLamp);
            Bom avante_CN8_door = createBom(4, avante_CN8, door);
            Bom avante_CN8_bumper = createBom(2, avante_CN8, bumper);
            Bom avante_CN8_radiatorGrill = createBom(1, avante_CN8, radiatorGrill);
            em.persist(avante_CN8_headLamp);
            em.persist(avante_CN8_tailLamp);
            em.persist(avante_CN8_door);
            em.persist(avante_CN8_bumper);
            em.persist(avante_CN8_radiatorGrill);

            Bom sonata_DN8_headLamp = createBom(2, sonata_DN8, headLamp);
            Bom sonata_DN8_tailLamp = createBom(2, sonata_DN8, tailLamp);
            Bom sonata_DN8_door = createBom(4, sonata_DN8, door);
            Bom sonata_DN8_bumper = createBom(2, sonata_DN8, bumper);
            Bom sonata_DN8_radiatorGrill = createBom(1, sonata_DN8, radiatorGrill);
            em.persist(sonata_DN8_headLamp);
            em.persist(sonata_DN8_tailLamp);
            em.persist(sonata_DN8_door);
            em.persist(sonata_DN8_bumper);
            em.persist(sonata_DN8_radiatorGrill);

            Bom grandeur_MX5_headLamp = createBom(2, grandeur_GN7, headLamp);
            Bom grandeur_MX5_tailLamp = createBom(2, grandeur_GN7, tailLamp);
            Bom grandeur_MX5_door = createBom(4, grandeur_GN7, door);
            Bom grandeur_MX5_bumper = createBom(2, grandeur_GN7, bumper);
            Bom grandeur_MX5_radiatorGrill = createBom(1, grandeur_GN7, radiatorGrill);
            em.persist(grandeur_MX5_headLamp);
            em.persist(grandeur_MX5_tailLamp);
            em.persist(grandeur_MX5_door);
            em.persist(grandeur_MX5_bumper);
            em.persist(grandeur_MX5_radiatorGrill);

            Bom tucson_NX4_headLamp = createBom(2, tucson_NX4, headLamp);
            Bom tucson_NX4_tailLamp = createBom(2, tucson_NX4, tailLamp);
            Bom tucson_NX4_door = createBom(4, tucson_NX4, door);
            Bom tucson_NX4_bumper = createBom(2, tucson_NX4, bumper);
            Bom tucson_NX4_radiatorGrill = createBom(1, tucson_NX4, radiatorGrill);
            em.persist(tucson_NX4_headLamp);
            em.persist(tucson_NX4_tailLamp);
            em.persist(tucson_NX4_door);
            em.persist(tucson_NX4_bumper);
            em.persist(tucson_NX4_radiatorGrill);

            Bom santafe_GN7_headLamp = createBom(2, santafe_MX5, headLamp);
            Bom santafe_GN7_tailLamp = createBom(2, santafe_MX5, tailLamp);
            Bom santafe_GN7_door = createBom(4, santafe_MX5, door);
            Bom santafe_GN7_bumper = createBom(2, santafe_MX5, bumper);
            Bom santafe_GN7_radiatorGrill = createBom(1, santafe_MX5, radiatorGrill);
            em.persist(santafe_GN7_headLamp);
            em.persist(santafe_GN7_tailLamp);
            em.persist(santafe_GN7_door);
            em.persist(santafe_GN7_bumper);
            em.persist(santafe_GN7_radiatorGrill);

            /**
             *  주문
             */
            Order order1 = Order.createOrder(LocalDateTime.now(), LocalDateTime.now().plusDays(7), 10, avante_CN8);
            Order order2 = Order.createOrder(LocalDateTime.now(), LocalDateTime.now().plusDays(7), 5, sonata_DN8);
            Order order3 = Order.createOrder(LocalDateTime.now(), LocalDateTime.now().plusDays(7), 1, grandeur_GN7);
            Order order4 = Order.createOrder(LocalDateTime.now(), LocalDateTime.now().plusDays(7), 1, tucson_NX4);
            Order order5 = Order.createOrder(LocalDateTime.now(), LocalDateTime.now().plusDays(7), 1, santafe_MX5);
            em.persist(order1);
            em.persist(order2);
            em.persist(order3);
            em.persist(order4);
            em.persist(order5);

            /**
             *  생산
             */
            Production production1 = Production.createProduction(LocalDateTime.now());
            Production production2 = Production.createProduction(LocalDateTime.now());
            Production production3 = Production.createProduction(LocalDateTime.now());
            Production production4 = Production.createProduction(LocalDateTime.now());
            Production production5 = Production.createProduction(LocalDateTime.now());
            em.persist(production1);
            em.persist(production2);
            em.persist(production3);
            em.persist(production4);
            em.persist(production5);

            /**
             *  주문-생산
             *  생산에 주문 연동
             */
            OrderProduction orderProduction1 = OrderProduction.createOrderProduction(order1, production1, 6);
            OrderProduction orderProduction2 = OrderProduction.createOrderProduction(order1, production2, 4);
            OrderProduction orderProduction3 = OrderProduction.createOrderProduction(order2, production3, 3);
            OrderProduction orderProduction4 = OrderProduction.createOrderProduction(order4, production4, 1);
            OrderProduction orderProduction5 = OrderProduction.createOrderProduction(order5, production5, 1);

            // 생산 시작
            production1.start();
            log.info("proudction1 상태 : {}", production1.getProductionStatus());

            /**
             *  공정 타입
             */
            ProcessType press = ProcessType.createProcessType("프레스", 1, true);
            ProcessType welding = ProcessType.createProcessType("용접", 2, true);
            ProcessType assembly = ProcessType.createProcessType("조립", 3, true);
            ProcessType painting = ProcessType.createProcessType("도장", 4, true);
            ProcessType inspection = ProcessType.createProcessType("검수", 5, true);
            em.persist(press);
            em.persist(welding);
            em.persist(assembly);
            em.persist(painting);
            em.persist(inspection);

            /**
             *  설비
             */
            Equipment pressEquipment_1 = Equipment.createEquipment("프레스 1호기", press);
            Equipment pressEquipment_2 = Equipment.createEquipment("프레스 2호기", press);
            Equipment weldingEquipment_1 = Equipment.createEquipment("용접 1호기", welding);
            Equipment assemblyEquipment_1 = Equipment.createEquipment("조립 1호기", assembly);
            Equipment paintingEquipment_1 = Equipment.createEquipment("도장 1호기", painting);
            Equipment inspectionEquipment_1 = Equipment.createEquipment("검수 1호기", inspection);
            em.persist(pressEquipment_1);
            em.persist(pressEquipment_2);
            em.persist(weldingEquipment_1);
            em.persist(assemblyEquipment_1);
            em.persist(paintingEquipment_1);
            em.persist(inspectionEquipment_1);

            /**
             *  공정 수행
             */
            ProcessExecution processExecution_press = ProcessExecution.createEntity(LocalDateTime.now(), 1, production1, press, pressEquipment_1);
            ProcessExecution processExecution_assembly = ProcessExecution.createEntity(LocalDateTime.now(), 1, production1, assembly, assemblyEquipment_1);
            ProcessExecution processExecution_welding = ProcessExecution.createEntity(LocalDateTime.now(), 1, production1, welding, weldingEquipment_1);
            ProcessExecution processExecution_painting = ProcessExecution.createEntity(LocalDateTime.now(), 1, production1, painting, paintingEquipment_1);
            ProcessExecution processExecution_inspection = ProcessExecution.createEntity(LocalDateTime.now(), 1, production1, inspection, inspectionEquipment_1);
            em.persist(processExecution_press);
            em.persist(processExecution_assembly);
            em.persist(processExecution_welding);
            em.persist(processExecution_painting);
            em.persist(processExecution_inspection);

            // 프레스 공정 가동
            processExecution_press.operate();

            /**
             *  센서 (프레스 공정 컬럼)
             */
            Sensor sensor1 = Sensor.create("timestamp", Unit.MS, pressEquipment_1);
            Sensor sensor2 = Sensor.create("ai0_vibration", Unit.HZ, pressEquipment_1);
            Sensor sensor3 = Sensor.create("ai1_vibration", Unit.HZ, pressEquipment_1);
            Sensor sensor4 = Sensor.create("ai2_current", Unit.HZ, pressEquipment_1);
            Sensor sensor5 = Sensor.create("equipment_state", Unit.NONE, pressEquipment_1);
            em.persist(sensor1);
            em.persist(sensor2);
            em.persist(sensor3);
            em.persist(sensor4);
            em.persist(sensor5);

            /**
             *  센서 데이터 (프레스 공정 컬럼의 데이터)
             */
            SensorData sensorData1 = SensorData.create(55d, LocalDateTime.now(), sensor1);
            SensorData sensorData2 = SensorData.create(50d, LocalDateTime.now(), sensor2);
            SensorData sensorData3 = SensorData.create(51d, LocalDateTime.now(), sensor3);
            SensorData sensorData4 = SensorData.create(52d, LocalDateTime.now(), sensor4);
            SensorData sensorData5 = SensorData.create(0d, LocalDateTime.now(), sensor5);
            em.persist(sensorData1);
            em.persist(sensorData2);
            em.persist(sensorData3);
            em.persist(sensorData4);
            em.persist(sensorData5);

            // 프레스 공정 완료
            processExecution_press.complete(LocalDateTime.now());

            // 부품조립 공정 가동 -> 완료
            processExecution_assembly.operate();
            processExecution_assembly.complete(LocalDateTime.now());

            // 용접 공정 가동 -> 완료
            processExecution_welding.operate();
            processExecution_welding.complete(LocalDateTime.now());

            // 도장 공정 가동 -> 완료
            processExecution_painting.operate();
            processExecution_painting.complete(LocalDateTime.now());

            // 검수 공정 가동 -> 완료
            processExecution_inspection.operate();
            processExecution_inspection.complete(LocalDateTime.now());

            /**
             *  생산 완료
             */
            // 생산될 차량들 시리얼 넘버 목록
            List<String> serialNumbers = new ArrayList<>();
            serialNumbers.add("VIN-20260123-001");
            serialNumbers.add("VIN-20260123-002");
            serialNumbers.add("VIN-20260123-003");
            serialNumbers.add("VIN-20260123-004");
            serialNumbers.add("VIN-20260123-005");
            serialNumbers.add("VIN-20260123-006");
            serialNumbers.add("VIN-20260123-007");

            // 생산 완료
            manufacturingOrchestrationService.completeProduction(
                    production1.getId(), LocalDateTime.now().plusDays(6), serialNumbers
            );
        }

        public void OrderAndProductionDbInit() {
        }

        private static VehicleModel createVehicleModel(String modelName, String segment, String fuel, String description, boolean isActive) {

            return VehicleModel.builder()
                    .modelName(modelName)
                    .segment(segment)
                    .fuel(fuel)
                    .description(description)
                    .isActive(isActive)
                    .build();
        }

        private static Part createPart(String partName, String partType, Unit unit) {

            return Part.builder()
                    .partName(partName)
                    .partType(partType)
                    .unit(unit)
                    .build();
        }

        private static Bom createBom(int requiredQty, VehicleModel vehicleModel, Part part) {

            return Bom.builder()
                    .requiredQty(requiredQty)
                    .vehicleModel(vehicleModel)
                    .part(part)
                    .build();
        }

    }
}