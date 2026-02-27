package com.khuoo.gradmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@ConfigurationPropertiesScan
@SpringBootApplication
public class GradmanagerBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(GradmanagerBackendApplication.class, args);
	}

}
