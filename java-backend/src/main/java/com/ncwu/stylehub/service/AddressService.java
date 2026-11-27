package com.ncwu.stylehub.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.Address;
import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.web.dto.StoreDtos.AddressOut;
import com.ncwu.stylehub.web.dto.StoreDtos.AddressRequest;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/** Per-customer shipping address book used by the checkout screen. */
@Service
public class AddressService {

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<AddressOut> list(long userId) {
        return em.createQuery("SELECT a FROM Address a WHERE a.user.id = :uid " +
                        "ORDER BY a.isDefault DESC, a.id DESC", Address.class)
                .setParameter("uid", userId).getResultList().stream().map(AddressService::toOut).toList();
    }

    @Transactional
    public AddressOut create(long userId, AddressRequest req) {
        Address address = new Address();
        address.user = em.find(User.class, userId);
        if (address.user == null) {
            throw new ApiException(404, "User not found");
        }
        apply(address, req);
        boolean first = em.createQuery("SELECT COUNT(a) FROM Address a WHERE a.user.id = :uid", Long.class)
                .setParameter("uid", userId).getSingleResult() == 0;
        if (first || Boolean.TRUE.equals(req.isDefault())) {
            clearDefault(userId);
            address.isDefault = true;
        }
        em.persist(address);
        return toOut(address);
    }

    @Transactional
    public AddressOut update(long userId, long addressId, AddressRequest req) {
        Address address = owned(userId, addressId);
        apply(address, req);
        if (Boolean.TRUE.equals(req.isDefault())) {
            clearDefault(userId);
            address.isDefault = true;
        }
        return toOut(address);
    }

    @Transactional
    public void delete(long userId, long addressId) {
        Address address = owned(userId, addressId);
        boolean wasDefault = address.isDefault;
        em.remove(address);
        em.flush();
        if (wasDefault) {
            em.createQuery("SELECT a FROM Address a WHERE a.user.id = :uid ORDER BY a.id DESC", Address.class)
                    .setParameter("uid", userId).setMaxResults(1).getResultStream().findFirst()
                    .ifPresent(next -> next.isDefault = true);
        }
    }

    private void apply(Address address, AddressRequest req) {
        address.label = req.label() == null || req.label().isBlank() ? "Home" : req.label().trim();
        address.fullName = req.fullName().trim();
        address.phone = req.phone() == null ? "" : req.phone().trim();
        address.address = req.address().trim();
    }

    private void clearDefault(long userId) {
        em.createQuery("UPDATE Address a SET a.isDefault = false WHERE a.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
    }

    /**
     * Loads the address with its owner already fetched. The entities use field access, so a
     * lazy to-one proxy cannot serve {@code address.user.id} and would read as null.
     */
    private Address owned(long userId, long addressId) {
        List<Address> found = em.createQuery("SELECT a FROM Address a JOIN FETCH a.user WHERE a.id = :id",
                        Address.class)
                .setParameter("id", addressId).getResultList();
        if (found.isEmpty() || found.get(0).user.id != userId) {
            throw new ApiException(404, "Address not found");
        }
        return found.get(0);
    }

    public static AddressOut toOut(Address address) {
        return new AddressOut(address.id, address.label, address.fullName, address.phone, address.address,
                address.isDefault);
    }
}
