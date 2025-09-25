package com.example.skyline.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/stress")
public class StressTestController {
    
    @GetMapping("/cpu")
    public ResponseEntity<Map<String, Object>> cpuStress(@RequestParam(defaultValue = "5") int seconds) {
        Map<String, Object> response = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        // CPU 집약적 작업 (소수 찾기)
        long endTime = startTime + (seconds * 1000L);
        int count = 0;
        
        while (System.currentTimeMillis() < endTime) {
            for (int i = 2; i < 10000; i++) {
                if (isPrime(i)) {
                    count++;
                }
            }
        }
        
        long duration = System.currentTimeMillis() - startTime;
        
        response.put("type", "CPU Stress Test");
        response.put("duration_ms", duration);
        response.put("primes_found", count);
        response.put("status", "completed");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/memory")
    public ResponseEntity<Map<String, Object>> memoryStress(@RequestParam(defaultValue = "100") int sizeMB) {
        Map<String, Object> response = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            // 메모리 할당 (1MB = 1024 * 1024 bytes)
            List<byte[]> memoryBlocks = new ArrayList<>();
            
            for (int i = 0; i < sizeMB; i++) {
                byte[] block = new byte[1024 * 1024]; // 1MB
                // 메모리 블록에 데이터 쓰기
                for (int j = 0; j < block.length; j += 1024) {
                    block[j] = (byte) (j % 256);
                }
                memoryBlocks.add(block);
            }
            
            // 잠시 유지
            Thread.sleep(2000);
            
            long duration = System.currentTimeMillis() - startTime;
            
            response.put("type", "Memory Stress Test");
            response.put("duration_ms", duration);
            response.put("memory_allocated_mb", sizeMB);
            response.put("blocks_created", memoryBlocks.size());
            response.put("status", "completed");
            
            // 메모리 해제를 위해 참조 제거
            memoryBlocks.clear();
            System.gc(); // GC 힌트
            
        } catch (OutOfMemoryError e) {
            response.put("type", "Memory Stress Test");
            response.put("status", "failed");
            response.put("error", "OutOfMemoryError: " + e.getMessage());
            return ResponseEntity.status(507).body(response);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            response.put("type", "Memory Stress Test");
            response.put("status", "interrupted");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> systemInfo() {
        Map<String, Object> info = new HashMap<>();
        Runtime runtime = Runtime.getRuntime();
        
        info.put("processors", runtime.availableProcessors());
        info.put("total_memory_mb", runtime.totalMemory() / (1024 * 1024));
        info.put("free_memory_mb", runtime.freeMemory() / (1024 * 1024));
        info.put("max_memory_mb", runtime.maxMemory() / (1024 * 1024));
        info.put("used_memory_mb", (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024));
        
        return ResponseEntity.ok(info);
    }
    
    private boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        
        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) {
                return false;
            }
        }
        return true;
    }
}