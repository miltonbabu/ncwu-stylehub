package com.ncwu.stylehub.domain;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 200)
    public String name;

    @Column(nullable = false, unique = true, length = 200)
    public String slug;

    @Column(length = 4000)
    public String description = "";

    @Column(nullable = false)
    public double price;

    @Column(name = "compare_at_price")
    public Double compareAtPrice;

    /** Purchase cost per unit — used for real profit reporting (never exposed to customers). */
    @Column(name = "cost_price", nullable = false, columnDefinition = "double default 0")
    public double costPrice = 0.0;

    @Column(nullable = false)
    public int stock = 0;

    /** Comma-separated size options, e.g. "S,M,L,XL" or "38,39,40"; empty = no size options. */
    @Column(length = 200)
    public String sizes = "";

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    public Category category;

    @Column(name = "image_url", length = 500)
    public String imageUrl = "";

    @Column(name = "is_featured", nullable = false)
    public boolean isFeatured = false;

    @Column(name = "is_active", nullable = false)
    public boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    public List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    public List<ProductVariant> variants = new ArrayList<>();
}
