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

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    public Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    public Product product;

    @Column(name = "product_name", nullable = false, length = 200)
    public String productName;

    @Column(name = "unit_price", nullable = false)
    public double unitPrice;

    /** Cost per unit captured at order time, so profit stays accurate when product costs change. */
    @Column(name = "unit_cost", nullable = false, columnDefinition = "double default 0")
    public double unitCost = 0.0;

    @Column(nullable = false)
    public int quantity;

    /** Empty = no size. */
    @Column(length = 50)
    public String size = "";
}
