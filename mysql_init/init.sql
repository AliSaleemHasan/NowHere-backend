CREATE DATABASE IF NOT EXISTS Users_Info;

CREATE USER 'info_admin'@'%' IDENTIFIED BY 'admin';
GRANT ALL PRIVILEGES on Users_Info.* to  info_admin;



CREATE DATABASE IF NOT EXISTS Users_Credentials;

CREATE USER 'creadentials_admin'@'%' IDENTIFIED BY 'admin';
GRANT ALL PRIVILEGES on Users_Credentials.* to creadentials_admin;

FLUSH PRIVILEGES;