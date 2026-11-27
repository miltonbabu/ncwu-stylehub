package com.ncwu.stylehub.domain;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Single-row record of the administrator session that is currently allowed in. */
@Entity
@Table(name = "admin_session")
public class AdminSession {

    /** Always 1 — the table only ever holds the active session. */
    @Id
    public Long id;

    @Column(name = "user_id", nullable = false)
    public long userId;

    @Column(nullable = false, length = 64)
    public String jti;

    @Column(name = "issued_at", nullable = false)
    public LocalDateTime issuedAt = LocalDateTime.now(ZoneOffset.UTC);
}
