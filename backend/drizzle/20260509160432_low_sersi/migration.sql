CREATE TABLE "user" (
	"id" varchar PRIMARY KEY,
	"username" varchar NOT NULL UNIQUE,
	"password" varchar NOT NULL,
	"email" varchar NOT NULL UNIQUE,
	"salt" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
