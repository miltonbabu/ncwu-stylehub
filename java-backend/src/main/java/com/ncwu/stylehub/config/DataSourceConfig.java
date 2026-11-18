package com.ncwu.stylehub.config;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/**
 * Datasource selection:
 *  - DATABASE_URL set (Supabase Cloud PostgreSQL) -> PostgreSQL
 *  - otherwise -> local H2 file database so the API runs immediately
 */
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = System.getenv("DATABASE_URL");
        if (url == null || url.isBlank()) {
            DriverManagerDataSource ds = new DriverManagerDataSource();
            ds.setDriverClassName("org.h2.Driver");
            ds.setUrl("jdbc:h2:file:./data/stylehub;DB_CLOSE_DELAY=-1");
            ds.setUsername("sa");
            ds.setPassword("");
            return ds;
        }

        // Accepts both plain jdbc URLs and postgres://user:pass@host/db URLs from Supabase
        String user = env("DATABASE_USER");
        String pass = env("DATABASE_PASSWORD");
        String rest = url.replaceFirst("^postgres(ql)?://", "");

        if (rest.contains("@") && rest.indexOf('@') < rest.indexOf('/')) {
            String creds = rest.substring(0, rest.indexOf('@'));
            rest = rest.substring(rest.indexOf('@') + 1);
            if (creds.contains(":")) {
                user = creds.substring(0, creds.indexOf(':'));
                pass = creds.substring(creds.indexOf(':') + 1);
            } else {
                user = creds;
            }
        }

        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setUrl("jdbc:postgresql://" + rest);
        ds.setUsername(user != null ? user : "postgres");
        ds.setPassword(pass != null ? pass : "");
        return ds;
    }

    private static String env(String key) {
        return System.getenv(key);
    }
}
