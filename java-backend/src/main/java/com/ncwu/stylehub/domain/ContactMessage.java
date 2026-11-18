package com.ncwu.stylehub.domain;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Message submitted through the public contact form; read by admins in the back office. */
@Entity
@Table(name = "contact_messages")
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 100)
    public String name;

    @Column(nullable = false, length = 180)
    public String email;

    @Column(nullable = false, length = 200)
    public String subject = "";

    @Column(nullable = false, length = 2000)
    public String message;

    @Column(name = "is_read", nullable = false)
    public boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);
}
