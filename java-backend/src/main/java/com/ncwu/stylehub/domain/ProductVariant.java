package com.ncwu.stylehub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "product_variants", uniqueConstraints =
        @UniqueConstraint(name = "uq_product_variant_options", columnNames = {"product_id", "style", "size"}))
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    public Product product;

    @Column(nullable = false, length = 100)
    public String style = "";

    @Column(nullable = false, length = 50)
    public String size = "";

    @Column(nullable = false)
    public double price;

    @Column(name = "compare_at_price")
    public Double compareAtPrice;

    @Column(name = "cost_price", nullable = false)
    public double costPrice;

    @Column(nullable = false)
    public int stock;

    @Column(name = "image_url", length = 500)
    public String imageUrl = "";
}
