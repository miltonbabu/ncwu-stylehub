package com.ncwu.stylehub.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ncwu.stylehub.security.AuthInterceptor;
import com.ncwu.stylehub.service.OrderService;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderCreateRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderOut;
import com.ncwu.stylehub.web.dto.StoreDtos.RefundRequestCreate;
import com.ncwu.stylehub.web.dto.StoreDtos.RefundRequestOut;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderOut create(@Valid @RequestBody OrderCreateRequest req, HttpServletRequest request) {
        return orderService.create(AuthInterceptor.userId(request), req);
    }

    @GetMapping
    public List<OrderOut> myOrders(HttpServletRequest request) {
        return orderService.myOrders(AuthInterceptor.userId(request));
    }

    @GetMapping("/{orderId}")
    public OrderOut detail(@PathVariable long orderId, HttpServletRequest request) {
        return orderService.order(AuthInterceptor.userId(request), orderId);
    }

    /** Customer cancels their own order (allowed until it ships). */
    @PostMapping("/{orderId}/cancel")
    public OrderOut cancel(@PathVariable long orderId, HttpServletRequest request) {
        return orderService.cancel(AuthInterceptor.userId(request), orderId);
    }

    @GetMapping("/refunds")
    public List<RefundRequestOut> myRefunds(HttpServletRequest request) {
        return orderService.myRefunds(AuthInterceptor.userId(request));
    }

    @PostMapping("/refunds")
    @ResponseStatus(HttpStatus.CREATED)
    public RefundRequestOut requestRefund(@Valid @RequestBody RefundRequestCreate req,
                                         HttpServletRequest request) {
        return orderService.requestRefund(AuthInterceptor.userId(request), req);
    }
}
