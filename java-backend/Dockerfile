FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
ENV MAVEN_OPTS="-Xmx384m -XX:MaxMetaspaceSize=192m"
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 app && useradd --uid 10001 --gid app --no-create-home app
WORKDIR /app
RUN mkdir -p uploads data && chown -R app:app /app
COPY --from=build --chown=app:app /build/target/stylehub-api-1.0.0.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
