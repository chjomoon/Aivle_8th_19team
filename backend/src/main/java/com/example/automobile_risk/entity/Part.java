package com.example.automobile_risk.entity;

import com.example.automobile_risk.entity.enumclass.Unit;
import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
public class Part extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "part_id")
    private Long id;

    private String partName;
    private String partType;

    @Enumerated(EnumType.STRING)
    private Unit unit;

//    @OneToMany(mappedBy = "part")
//    List<Bom> bomList = new ArrayList<>();

    /**
     *  비즈니스 로직
     */
    public void update(String partName, String partType, Unit unit) {
        this.partName = partName;
        this.partType = partType;
        this.unit = unit;
    }
}
