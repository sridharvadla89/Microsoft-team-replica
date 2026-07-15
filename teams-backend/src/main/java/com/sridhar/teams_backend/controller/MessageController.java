package com.sridhar.teams_backend.controller;

import com.sridhar.teams_backend.dto.response.MessageDto;
import com.sridhar.teams_backend.entity.Users;
import com.sridhar.teams_backend.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/history/{contactId}")
    public ResponseEntity<List<MessageDto>> getChatHistory(@AuthenticationPrincipal Users currentUser,
                                                           @PathVariable Long contactId) {
        return ResponseEntity.ok(messageService.getChatHistory(currentUser.getId(), contactId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<MessageDto>> searchMessages(@AuthenticationPrincipal Users currentUser,
                                                           @RequestParam Long contactId,
                                                           @RequestParam String query) {
        return ResponseEntity.ok(messageService.searchMessages(currentUser.getId(), contactId, query));
    }

    @GetMapping("/unread")
    public ResponseEntity<Map<Long, Long>> getUnreadCounts(@AuthenticationPrincipal Users currentUser) {
        return ResponseEntity.ok(messageService.getUnreadCounts(currentUser.getId()));
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            // Create uploads directory if it doesn't exist
            File uploadsDir = new File("uploads");
            if (!uploadsDir.exists()) {
                uploadsDir.mkdirs();
            }

            // Generate unique filename to avoid duplicates
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String newFileName = UUID.randomUUID().toString() + fileExtension;

            File destFile = new File(uploadsDir, newFileName);
            file.transferTo(destFile);

            // Generate the URL (served statically via WebConfig mapping)
            String fileUrl = "http://localhost:8081/uploads/" + newFileName;

            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("fileName", originalFileName);
            response.put("mediaType", file.getContentType());

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "File upload failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{messageId}/pin")
    public ResponseEntity<MessageDto> togglePinMessage(@AuthenticationPrincipal Users currentUser,
                                                        @PathVariable Long messageId) {
        return ResponseEntity.ok(messageService.togglePinMessage(messageId, currentUser.getId()));
    }
}
