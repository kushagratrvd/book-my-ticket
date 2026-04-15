INSERT INTO seats (isbooked)
SELECT 0 FROM generate_series(1, 20);