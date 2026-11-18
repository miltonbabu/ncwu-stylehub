package com.ncwu.stylehub.domain;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Member of the NCWU StyleHub Club (newsletter). */
@Entity
@Table(name = "subscribers")
public class Subscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true, length = 180)
    public String email;

    @Column(length = 40)
    public String source = "club";

    @Column(name = "is_active", nullable = false)
    public boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);
}
