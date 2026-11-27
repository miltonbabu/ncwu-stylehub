package com.ncwu.stylehub.domain;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** A saved shipping address in a customer's address book. */
@Entity
@Table(name = "addresses")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    /** Short label such as "Home" or "Office". */
    @Column(nullable = false, length = 40)
    public String label = "";

    @Column(name = "full_name", nullable = false, length = 100)
    public String fullName;

    @Column(nullable = false, length = 30)
    public String phone = "";

    @Column(nullable = false, length = 300)
    public String address;

    @Column(name = "is_default", nullable = false)
    public boolean isDefault = false;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);
}
