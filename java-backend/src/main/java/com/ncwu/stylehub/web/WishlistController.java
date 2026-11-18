package com.ncwu.stylehub.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ncwu.stylehub.security.AuthInterceptor;
import com.ncwu.stylehub.service.CatalogService;
import com.ncwu.stylehub.web.dto.StoreDtos.ProductOut;

import jakarta.servlet.http.HttpServletRequest;

/** Saved products for the authenticated user. */
@RestController
@RequestMapping("/api/v1/wishlist")
public class WishlistController {

    private final CatalogService catalogService;

    public WishlistController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public List<ProductOut> wishlist(HttpServletRequest request) {
        return catalogService.wishlistProducts(AuthInterceptor.userId(request));
    }

    @PostMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@PathVariable long productId, HttpServletRequest request) {
        catalogService.addWishlist(AuthInterceptor.userId(request), productId);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsave(@PathVariable long productId, HttpServletRequest request) {
        catalogService.removeWishlist(AuthInterceptor.userId(request), productId);
    }
}
