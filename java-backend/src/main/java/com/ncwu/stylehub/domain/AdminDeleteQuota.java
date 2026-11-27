package com.ncwu.stylehub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Single-row counter of how much the test administrator has deleted. */
@Entity
@Table(name = "admin_delete_quota")
public class AdminDeleteQuota {

    /** Always 1 — the table only ever holds the current counters. */
    @Id
    public Long id;

    @Column(name = "products_deleted", nullable = false)
    public int productsDeleted;

    @Column(name = "orders_deleted", nullable = false)
    public int ordersDeleted;
}
