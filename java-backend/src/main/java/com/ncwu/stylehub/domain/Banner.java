package com.ncwu.stylehub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "banners")
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 200)
    public String title;

    @Column(length = 300)
    public String subtitle = "";

    @Column(name = "image_url", length = 500)
    public String imageUrl = "";

    @Column(name = "link_url", length = 300)
    public String linkUrl = "/shop";

    @Column(name = "sort_order", nullable = false)
    public int sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    public boolean isActive = true;
}
