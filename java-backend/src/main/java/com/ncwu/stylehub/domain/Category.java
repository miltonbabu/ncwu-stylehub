package com.ncwu.stylehub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 100)
    public String name;

    @Column(nullable = false, unique = true, length = 100)
    public String slug;

    @Column(length = 4000)
    public String description = "";

    @Column(name = "image_url", length = 500)
    public String imageUrl = "";

    @Column(name = "sort_order", nullable = false)
    public int sortOrder = 0;
}
