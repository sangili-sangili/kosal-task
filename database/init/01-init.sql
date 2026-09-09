-- Initial database provisioning for enterprise container setup
CREATE DATABASE IF NOT EXISTS `enterprise_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON `enterprise_db`.* TO 'root'@'%';
FLUSH PRIVILEGES;
