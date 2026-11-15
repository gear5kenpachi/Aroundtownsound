CREATE TABLE orders (
 id TEXT PRIMARY KEY NOT NULL,
 customer TEXT NOT NULL,
 email TEXT NOT NULL,
 service TEXT NOT NULL,
 genre TEXT NOT NULL,
 preferred_date TEXT NOT NULL,
 brief TEXT NOT NULL,
 created_at TEXT NOT NULL,
 ip_hash TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX orders_created_at_idx ON orders(created_at);
--> statement-breakpoint
CREATE INDEX orders_ip_created_idx ON orders(ip_hash, created_at);
