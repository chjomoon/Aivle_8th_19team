package com.example.automobile_risk.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
public class VehicleModel extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_model_id")
    private Long id;

    private String modelName;
    private String segment;
    private String fuel;
    private String description;
    private boolean isActive;

//    @OneToMany(mappedBy = "vehicleModel")
//    List<Bom> bomList = new ArrayList<>();

    /**
     *  비즈니스 로직
     */
    public void update(String modelName, String segment, String fuel, String description, boolean isActive) {
        this.modelName = modelName;
        this.segment = segment;
        this.fuel = fuel;
        this.description = description;
        this.isActive = isActive;
    }
}
