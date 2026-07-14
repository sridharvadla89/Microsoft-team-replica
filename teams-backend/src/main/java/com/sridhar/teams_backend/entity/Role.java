package com.sridhar.teams_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="roles")
@Setter
@Getter
public class Role {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
@Getter
@Column(nullable = false,unique = true)
public String name;
public Role(){
}
public Role(Long id,String name){
    this.id=id;
    this.name=name;
}


}
