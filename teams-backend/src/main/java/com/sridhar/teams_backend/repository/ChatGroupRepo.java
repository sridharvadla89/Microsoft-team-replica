package com.sridhar.teams_backend.repository;

import com.sridhar.teams_backend.entity.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatGroupRepo extends JpaRepository<ChatGroup, Long> {
    
    @Query("SELECT cg FROM ChatGroup cg JOIN ChatGroupMember cgm ON cg.id = cgm.group.id WHERE cgm.user.id = :userId ORDER BY cg.name ASC")
    List<ChatGroup> findGroupsByUserId(@Param("userId") Long userId);
}
