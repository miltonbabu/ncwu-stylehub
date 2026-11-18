package com.ncwu.stylehub.web;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.security.AuthInterceptor;
import com.ncwu.stylehub.service.AnalyticsService;
import com.ncwu.stylehub.service.CatalogService;
import com.ncwu.stylehub.service.CloudinaryUploader;
import com.ncwu.stylehub.service.ContactService;
import com.ncwu.stylehub.service.NewsletterService;
import com.ncwu.stylehub.service.OrderService;
import com.ncwu.stylehub.service.StoreService;
import com.ncwu.stylehub.web.dto.AuthDtos.UserOut;
import com.ncwu.stylehub.web.dto.StoreDtos.AdminAnalytics;
import com.ncwu.stylehub.web.dto.StoreDtos.AdminCreateUserRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.AdminStats;
import com.ncwu.stylehub.web.dto.StoreDtos.ContactMessageOut;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderOut;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderPatchRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.ProductCreateRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.ProductOut;
import com.ncwu.stylehub.web.dto.StoreDtos.ProductUpdateRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.ReviewOut;
import com.ncwu.stylehub.web.dto.StoreDtos.SubscriberOut;
import com.ncwu.stylehub.web.dto.StoreDtos.UserPatchRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/** Back office: product uploading/management, user management, review moderation, orders, stats. */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private static final Set<String> IMAGE_EXTENSIONS = Set.of(".png", ".jpg", ".jpeg", ".webp", ".gif");

    private final CatalogService catalogService;
    private final OrderService orderService;
    private final StoreService storeService;
    private final AnalyticsService analyticsService;
    private final NewsletterService newsletterService;
    private final ContactService contactService;

    public AdminController(CatalogService catalogService, OrderService orderService, StoreService storeService,
                           AnalyticsService analyticsService, NewsletterService newsletterService,
                           ContactService contactService) {
        this.catalogService = catalogService;
        this.orderService = orderService;
        this.storeService = storeService;
        this.analyticsService = analyticsService;
        this.newsletterService = newsletterService;
        this.contactService = contactService;
    }

    /* ---------------- Products ---------------- */

    @GetMapping("/products")
    public List<ProductOut> products() {
        return catalogService.adminProducts();
    }

    @GetMapping("/products/{id}")
    public ProductOut product(@PathVariable long id) {
        return catalogService.adminProduct(id);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductOut create(@Valid @RequestBody ProductCreateRequest req) {
        return catalogService.createProduct(req);
    }

    @PutMapping("/products/{id}")
    public ProductOut update(@PathVariable long id, @RequestBody ProductUpdateRequest req) {
        return catalogService.updateProduct(id, req);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        catalogService.deleteProduct(id);
    }

    @PostMapping("/products/{id}/images")
    public ProductOut uploadImage(@PathVariable long id, @RequestParam("file") MultipartFile file)
            throws IOException {
        if (file.isEmpty()) {
            throw new ApiException(400, "No file uploaded");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new ApiException(400, "Image must be 5MB or less");
        }
        String original = file.getOriginalFilename();
        String ext = original != null && original.contains(".")
                ? original.substring(original.lastIndexOf('.')).toLowerCase()
                : ".png";
        if (!IMAGE_EXTENSIONS.contains(ext)) {
            throw new ApiException(400, "Unsupported image type");
        }

        // Cloudinary CDN when configured; local uploads/ folder as fallback (existing behaviour)
        String url = CloudinaryUploader.upload(file.getBytes(), original != null ? original : "image" + ext);
        if (url == null) {
            File dir = new File(System.getProperty("user.dir"), "uploads");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            String filename = UUID.randomUUID().toString().replace("-", "") + ext;
            file.transferTo(new File(dir, filename));
            url = "/uploads/" + filename;
        }
        return catalogService.attachImage(id, url);
    }

    /* ---------------- Users ---------------- */

    @GetMapping("/users")
    public List<UserOut> users() {
        return storeService.adminUsers();
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserOut createUser(@Valid @RequestBody AdminCreateUserRequest req) {
        return storeService.createUser(req);
    }

    @PatchMapping("/users/{id}")
    public UserOut patchUser(@PathVariable long id, @RequestBody UserPatchRequest req,
                             HttpServletRequest request) {
        return storeService.patchUser(AuthInterceptor.userId(request), id, req);
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable long id, HttpServletRequest request) {
        storeService.deleteUser(AuthInterceptor.userId(request), id);
    }

    /* ---------------- Reviews ---------------- */

    @GetMapping("/reviews")
    public List<ReviewOut> reviews(@RequestParam(value = "status_filter", required = false) String statusFilter) {
        return storeService.adminReviews(statusFilter);
    }

    @PostMapping("/reviews/{id}/approve")
    public ReviewOut approve(@PathVariable long id) {
        return storeService.moderateReview(id, "approved");
    }

    @PostMapping("/reviews/{id}/reject")
    public ReviewOut reject(@PathVariable long id) {
        return storeService.moderateReview(id, "rejected");
    }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(@PathVariable long id) {
        storeService.deleteReview(id);
    }

    /* ---------------- Orders ---------------- */

    @GetMapping("/orders")
    public List<OrderOut> orders() {
        return orderService.adminOrders();
    }

    @PatchMapping("/orders/{id}")
    public OrderOut patchOrder(@PathVariable long id, @RequestBody OrderPatchRequest req) {
        return orderService.updateOrder(id, req.status(), req.trackingNumber());
    }

    @PutMapping("/orders/{id}")
    public OrderOut updateOrder(@PathVariable long id, @RequestBody OrderPatchRequest req) {
        return orderService.updateOrder(id, req.status(), req.trackingNumber());
    }

    @DeleteMapping("/orders/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrder(@PathVariable long id) {
        orderService.deleteOrder(id);
    }

    /* ---------------- NCWU StyleHub Club ---------------- */

    @GetMapping("/newsletter")
    public List<SubscriberOut> subscribers() {
        return newsletterService.subscribers();
    }

    @DeleteMapping("/newsletter/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSubscriber(@PathVariable long id) {
        newsletterService.delete(id);
    }

    /* ---------------- Contact inbox ---------------- */

    @GetMapping("/contact-messages")
    public List<ContactMessageOut> contactMessages() {
        return contactService.messages();
    }

    @PatchMapping("/contact-messages/{id}/read")
    public void markContactRead(@PathVariable long id) {
        contactService.markRead(id);
    }

    @DeleteMapping("/contact-messages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteContactMessage(@PathVariable long id) {
        contactService.delete(id);
    }

    /* ---------------- Stats ---------------- */

    @GetMapping("/stats")
    public AdminStats stats() {
        return storeService.stats();
    }

    @GetMapping("/analytics")
    public AdminAnalytics analytics(@RequestParam(value = "days", defaultValue = "7") int days) {
        return analyticsService.analytics(days);
    }
}
