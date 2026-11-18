# NCWU StyleHub — Java Spring Boot backend image
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/target/stylehub-api-1.0.0.jar app.jar
EXPOSE 8000
CMD ["java", "-jar", "app.jar"]
