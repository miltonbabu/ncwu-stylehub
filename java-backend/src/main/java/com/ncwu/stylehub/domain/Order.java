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
import jakarta.persistence.Table;

@Entity(name = "PurchaseOrder")
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /** Null for guest checkout — such orders are identified by their guest email instead. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    public User user;

    /** Email captured at guest checkout. Empty for orders placed by a signed-in customer. */
    @Column(name = "guest_email", length = 150)
    public String guestEmail = "";

    @Column(nullable = false, length = 20)
    public String status = "pending";

    @Column(nullable = false)
    public double total = 0.0;

    @Column(name = "shipping_name", nullable = false, length = 100)
    public String shippingName;

    @Column(name = "shipping_address", nullable = false, length = 500)
    public String shippingAddress;

    @Column(name = "shipping_phone", length = 30)
    public String shippingPhone = "";

    @Column(name = "payment_method", length = 30)
    public String paymentMethod = "card";

    @Column(name = "tracking_number", length = 100)
    public String trackingNumber = "";

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

    /** Bumped whenever the status or tracking number changes (shown in the customer timeline). */
    @Column(name = "updated_at")
    public LocalDateTime updatedAt = LocalDateTime.now(ZoneOffset.UTC);

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<OrderItem> items = new ArrayList<>();
}
