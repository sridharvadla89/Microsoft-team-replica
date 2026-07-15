package com.sridhar.teams_backend.repository;

import com.sridhar.teams_backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MessageRepo extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.sender.id = :userA AND m.receiver.id = :userB) OR (m.sender.id = :userB AND m.receiver.id = :userA) ORDER BY m.timestamp ASC")
    List<Message> findConversation(@Param("userA") Long userA, @Param("userB") Long userB);

    @Query("SELECT m FROM Message m WHERE ((m.sender.id = :userA AND m.receiver.id = :userB) OR (m.sender.id = :userB AND m.receiver.id = :userA)) AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.timestamp ASC")
    List<Message> searchConversation(@Param("userA") Long userA, @Param("userB") Long userB, @Param("query") String query);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.status = 'READ' WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.status = 'SENT'")
    void markAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    @Query("SELECT m.sender.id, COUNT(m) FROM Message m WHERE m.receiver.id = :userId AND m.status = 'SENT' GROUP BY m.sender.id")
    List<Object[]> countUnreadMessagesBySender(@Param("userId") Long userId);

    @Query("SELECT m FROM Message m WHERE m.group.id = :groupId ORDER BY m.timestamp ASC")
    List<Message> findGroupConversation(@Param("groupId") Long groupId);

    @Query("SELECT m FROM Message m WHERE m.group.id = :groupId AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.timestamp ASC")
    List<Message> searchGroupConversation(@Param("groupId") Long groupId, @Param("query") String query);
}
