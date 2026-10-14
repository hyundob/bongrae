package kr.or.bongrae.alumni.common;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", error.getReason() == null ? "요청을 처리할 수 없습니다." : error.getReason()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException error) {
        var fields = new LinkedHashMap<String, String>();
        error.getBindingResult().getFieldErrors().forEach(field -> fields.putIfAbsent(field.getField(), "입력값을 확인해 주세요."));
        return ResponseEntity.badRequest().body(Map.of("message", "입력 내용을 확인해 주세요.", "fields", fields));
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> conflict() { return ResponseEntity.status(409).body(Map.of("message", "이미 등록된 정보이거나 다른 작업과 충돌했습니다.")); }
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<?> changed() { return ResponseEntity.status(409).body(Map.of("message", "다른 사용자가 수정했습니다. 새로고침 후 다시 작성해 주세요.")); }
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<?> uploadSize() { return ResponseEntity.status(413).body(Map.of("message", "첨부파일 용량이 너무 큽니다.")); }
}
