package com.ncwu.stylehub.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ncwu.stylehub.service.NewsletterService;
import com.ncwu.stylehub.web.dto.StoreDtos.ClubSubscribeRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.SubscriberOut;

import jakarta.validation.Valid;

/** Public "Join the NCWU StyleHub Club" sign-up. */
@RestController
@RequestMapping("/api/v1/newsletter")
public class NewsletterController {

    private final NewsletterService newsletterService;

    public NewsletterController(NewsletterService newsletterService) {
        this.newsletterService = newsletterService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriberOut subscribe(@Valid @RequestBody ClubSubscribeRequest req) {
        return newsletterService.subscribe(req.email());
    }
}
