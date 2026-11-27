package com.ncwu.stylehub.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ncwu.stylehub.service.CatalogService;
import com.ncwu.stylehub.web.dto.StoreDtos.BannerOut;
import com.ncwu.stylehub.web.dto.StoreDtos.CategoryOut;
import com.ncwu.stylehub.web.dto.StoreDtos.ProductOut;
import com.ncwu.stylehub.web.dto.StoreDtos.PromotionOut;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    public List<CategoryOut> categories() {
        return catalogService.categories();
    }

    @GetMapping("/products")
    public List<ProductOut> products(
            @RequestParam(required = false) String search,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(value = "min_price", required = false) Double minPrice,
            @RequestParam(value = "max_price", required = false) Double maxPrice,
            @RequestParam(required = false) String size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(value = "page_size", defaultValue = "12") int pageSize) {
        int size2 = Math.min(Math.max(pageSize, 1), 48);
        return catalogService.products(search, category, featured, minPrice, maxPrice, size,
                sort, Math.max(page, 1), size2);
    }

    @GetMapping("/products/{id}")
    public ProductOut product(@PathVariable long id) {
        return catalogService.product(id);
    }

    /** "You may also like" — same category first, then featured items from other categories. */
    @GetMapping("/products/{id}/related")
    public List<ProductOut> related(@PathVariable long id,
                                    @RequestParam(defaultValue = "4") int limit) {
        return catalogService.related(id, Math.min(Math.max(limit, 1), 8));
    }

    @GetMapping("/banners")
    public List<BannerOut> banners() {
        return catalogService.banners();
    }

    @GetMapping("/promotions")
    public List<PromotionOut> promotions() {
        return catalogService.promotions();
    }
}
