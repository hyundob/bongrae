FROM gradle:8.10-jdk21-alpine AS builder
WORKDIR /workspace
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
ENV JAVA_OPTS="-Xms512m -Xmx1024m"
COPY --from=builder /workspace/build/libs/*.jar app.jar
EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
