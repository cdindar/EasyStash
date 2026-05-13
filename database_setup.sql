CREATE DATABASE easystash;
USE easystash;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lockers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  locker_number VARCHAR(20) UNIQUE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  locker_id INT NOT NULL,
  qr_token VARCHAR(255) UNIQUE NOT NULL,
  token_valid BOOLEAN DEFAULT TRUE,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (locker_id) REFERENCES lockers(id)
);

CREATE TABLE access_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

-- Testdaten: 5 Schließfächer anlegen
INSERT INTO lockers (locker_number) VALUES ('F-01'), ('F-02'), ('F-03'), ('F-04'), ('F-05');