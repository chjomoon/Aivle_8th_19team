package com.example.automobile_risk.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"vehicle_model_id", "part_id"}
                )
        }
)
@Entity
public class Bom extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bom_id")
    private Long id;

    private int requiredQty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_model_id", nullable = false)
    private VehicleModel vehicleModel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    /**
     *  비즈니스 로직
     */
    public void update(int requiredQty, VehicleModel vehicleModel, Part part) {
        this.requiredQty = requiredQty;
        this.vehicleModel = vehicleModel;
        this.part = part;
    }
}
