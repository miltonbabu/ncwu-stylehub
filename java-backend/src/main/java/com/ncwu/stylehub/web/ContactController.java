package com.ncwu.stylehub.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ncwu.stylehub.service.ContactService;
import com.ncwu.stylehub.web.dto.StoreDtos.ContactMessageOut;
import com.ncwu.stylehub.web.dto.StoreDtos.ContactRequest;

import jakarta.validation.Valid;

/** Public contact form — every submission lands in the admin inbox and is emailed to the store owner. */
@RestController
@RequestMapping("/api/v1/contact")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContactMessageOut submit(@Valid @RequestBody ContactRequest req) {
        return contactService.submit(req);
    }
}
