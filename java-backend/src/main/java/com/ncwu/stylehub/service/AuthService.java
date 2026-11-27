package com.ncwu.stylehub.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.security.JwtService;
import com.ncwu.stylehub.security.PasswordHasher;
import com.ncwu.stylehub.web.dto.AuthDtos.LoginRequest;
import com.ncwu.stylehub.web.dto.AuthDtos.RegisterRequest;
import com.ncwu.stylehub.web.dto.AuthDtos.Token;
import com.ncwu.stylehub.web.dto.AuthDtos.UserOut;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/** Sign up / sign in logic — same behaviour and messages as the Python backend. */
@Service
public class AuthService {

    @PersistenceContext
    private EntityManager em;

    private final JwtService jwtService;
    private final MailService mailService;
    private final AdminSessionService adminSessionService;

    public AuthService(JwtService jwtService, MailService mailService,
            AdminSessionService adminSessionService) {
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.adminSessionService = adminSessionService;
    }

    @Transactional
    public Token register(RegisterRequest req) {
        String email = req.email().toLowerCase();
        Long existing = em.createQuery("SELECT COUNT(u) FROM User u WHERE u.email = :e", Long.class)
                .setParameter("e", email).getSingleResult();
        if (existing != null && existing > 0) {
            throw new ApiException(400, "Email is already registered");
        }
        User user = new User();
        user.name = req.name();
        user.email = email;
        user.passwordHash = PasswordHasher.hash(req.password());
        user.role = "customer";
        em.persist(user);
        mailService.sendWelcome(user);
        return tokenFor(user);
    }

    @Transactional
    public Token login(LoginRequest req) {
        User user = em.createQuery("SELECT u FROM User u WHERE u.email = :e", User.class)
                .setParameter("e", req.email().toLowerCase())
                .getResultStream().findFirst()
                .orElseThrow(() -> new ApiException(401, "Invalid email or password"));
        if (!PasswordHasher.verify(req.password(), user.passwordHash)) {
            throw new ApiException(401, "Invalid email or password");
        }
        if (!user.isActive) {
            throw new ApiException(403, "Account is disabled");
        }
        return tokenFor(user);
    }

    @Transactional(readOnly = true)
    public UserOut me(long userId) {
        User user = em.find(User.class, userId);
        if (user == null) {
            throw new ApiException(401, "Could not validate credentials");
        }
        return toUserOut(user);
    }

    public static UserOut toUserOut(User user) {
        return new UserOut(user.id, user.name, user.email, user.role, user.isActive, user.createdAt);
    }

    private Token tokenFor(User user) {
        String token = jwtService.create(user.id, user.role);
        if ("admin".equals(user.role)) {
            // A fresh admin sign-in replaces whoever was signed in before.
            adminSessionService.activate(user.id, jwtService.jti(token));
        }
        return new Token(token, "bearer", toUserOut(user));
    }
}
