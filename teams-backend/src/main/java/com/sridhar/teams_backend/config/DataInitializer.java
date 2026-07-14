package com.sridhar.teams_backend.config;

import com.sridhar.teams_backend.entity.Role;
import com.sridhar.teams_backend.repository.RoleRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final RoleRepo roleRepo;
    public DataInitializer(RoleRepo roleRepo){
        this.roleRepo=roleRepo;
    }
    @Override
    public void run(String... args){
        if(roleRepo.findByName("ADMIN").isEmpty()){
            roleRepo.save(new Role(null,"ADMIN"));
        }
        if (roleRepo.findByName("EMPLOYEE").isEmpty()){
            roleRepo.save(new Role(null,"EMPLOYEE"));
        }
    }

}
