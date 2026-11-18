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
import com.ncwu.stylehub.service.StoreService;
import com.ncwu.stylehub.web.dto.StoreDtos.ReviewCreateRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.ReviewOut;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final StoreService storeService;

    public ReviewController(StoreService storeService) {
        this.storeService = storeService;
    }

    @GetMapping("/product/{productId}")
    public List<ReviewOut> productReviews(@PathVariable long productId) {
        return storeService.productReviews(productId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewOut submit(@Valid @RequestBody ReviewCreateRequest req, HttpServletRequest request) {
        return storeService.submitReview(AuthInterceptor.userId(request), req);
    }
}
