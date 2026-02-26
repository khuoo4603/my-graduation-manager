package com.khuoo.gradmanager.grad.loadmodel;


// user_major + major 조인 결과 Row
public record UserMajorRow(
        long majorId,          // 전공ID
        String majorName,      // 전공명 (ex. 소프트웨어융합전공)
        String majorType       // 전공타입 (ex. 주전공, 복수전공)
) {}