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
import com.ncwu.stylehub.service.AddressService;
import com.ncwu.stylehub.web.dto.StoreDtos.AddressOut;
import com.ncwu.stylehub.web.dto.StoreDtos.AddressRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public List<AddressOut> list(HttpServletRequest request) {
        return addressService.list(AuthInterceptor.userId(request));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressOut create(@Valid @RequestBody AddressRequest req, HttpServletRequest request) {
        return addressService.create(AuthInterceptor.userId(request), req);
    }

    @PutMapping("/{addressId}")
    public AddressOut update(@PathVariable long addressId, @Valid @RequestBody AddressRequest req,
                             HttpServletRequest request) {
        return addressService.update(AuthInterceptor.userId(request), addressId, req);
    }

    @DeleteMapping("/{addressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long addressId, HttpServletRequest request) {
        addressService.delete(AuthInterceptor.userId(request), addressId);
    }
}
