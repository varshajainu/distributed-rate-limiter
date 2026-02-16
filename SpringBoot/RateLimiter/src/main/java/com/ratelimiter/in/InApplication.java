package com.ratelimiter.in;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


@SpringBootApplication
public class InApplication {

	public static void main(String[] args) {
		SpringApplication.run(InApplication.class, args);
		System.out.println("Application is running");
	}

}
