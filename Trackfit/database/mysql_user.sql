CREATE USER IF NOT EXISTS 'trackfit_user'@'localhost' IDENTIFIED BY 'trackfit_password';
CREATE USER IF NOT EXISTS 'trackfit_user'@'127.0.0.1' IDENTIFIED BY 'trackfit_password';

GRANT ALL PRIVILEGES ON `trackfit`.* TO 'trackfit_user'@'localhost';
GRANT ALL PRIVILEGES ON `trackfit`.* TO 'trackfit_user'@'127.0.0.1';

FLUSH PRIVILEGES;