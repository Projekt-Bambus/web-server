CREATE DATABASE `admin` IF NOT EXIST;
USE `admin`;

CREATE USER 'server'@'LOCALHOST' IDENTIFIED BY '<secure_password>';

CREATE TABLE `log` (
  `id` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `entry` varchar(65000) NOT NULL,
  `timestamp` datetime NOT NULL
);

CREATE TABLE `login` (
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL
);


INSERT INTO `login` (`username`, `password_hash`) VALUES
('admin', 'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec'),
('pavel', '4d0b24ccade22df6d154778cd66baf04288aae26df97a961f3ea3dd616fbe06dcebecc9bbe4ce93c8e12dca21e5935c08b0954534892c568b8c12b92f26a2448');

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `timestamp` datetime NOT NULL,
  `expires` datetime DEFAULT NULL
);


ALTER TABLE `log`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `login`
  ADD PRIMARY KEY (`username`);

ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
