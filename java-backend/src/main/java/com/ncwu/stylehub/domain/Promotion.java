package com.ncwu.stylehub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "promotions")
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 200)
    public String title;

    @Column(length = 300)
    public String subtitle = "";

    @Column(length = 50)
    public String badge = "";

    @Column(name = "image_url", length = 500)
    public String imageUrl = "";

    @Column(name = "link_url", length = 300)
    public String linkUrl = "/shop";

    @Column(length = 50)
    public String position = "home-main";

    @Column(name = "is_active", nullable = false)
    public boolean isActive = true;
}
