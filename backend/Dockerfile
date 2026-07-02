FROM openjdk:17-jdk-slim

WORKDIR /app

COPY pom.xml .
RUN apt-get update && apt-get install -y maven && \
    mvn dependency:resolve

COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim
COPY --from=0 /app/target/carpooling-backend-*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
