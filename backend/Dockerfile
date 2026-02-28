# syntax=docker/dockerfile:1.7

FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY gradlew settings.gradle* build.gradle* gradle.properties* /app/
COPY gradle /app/gradle
RUN chmod +x /app/gradlew

COPY src /app/src

RUN --mount=type=cache,target=/root/.gradle \
    /app/gradlew --no-daemon clean build -x test

FROM eclipse-temurin:17-jre
WORKDIR /app

RUN useradd -r -u 10001 appuser
USER appuser

COPY --from=build /app/build/libs/*.jar /app/app.jar

EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]