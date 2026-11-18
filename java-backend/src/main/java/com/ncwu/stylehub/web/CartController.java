package com.ncwu.stylehub.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ncwu.stylehub.security.AuthInterceptor;
import com.ncwu.stylehub.service.StoreService;
import com.ncwu.stylehub.web.dto.StoreDtos.CartItemCreate;
import com.ncwu.stylehub.web.dto.StoreDtos.CartItemOut;
import com.ncwu.stylehub.web.dto.StoreDtos.CartItemUpdate;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final StoreService storeService;

    public CartController(StoreService storeService) {
        this.storeService = storeService;
    }

    @GetMapping
    public List<CartItemOut> cart(HttpServletRequest request) {
        return storeService.cart(AuthInterceptor.userId(request));
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public CartItemOut add(@Valid @RequestBody CartItemCreate req, HttpServletRequest request) {
        return storeService.addToCart(AuthInterceptor.userId(request), req);
    }

    @PutMapping("/items/{itemId}")
    public CartItemOut update(@PathVariable long itemId, @Valid @RequestBody CartItemUpdate req,
                              HttpServletRequest request) {
        return storeService.updateCartItem(AuthInterceptor.userId(request), itemId, req.quantity());
    }

    @DeleteMapping("/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable long itemId, HttpServletRequest request) {
        storeService.removeCartItem(AuthInterceptor.userId(request), itemId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(HttpServletRequest request) {
        storeService.clearCart(AuthInterceptor.userId(request));
    }
}
