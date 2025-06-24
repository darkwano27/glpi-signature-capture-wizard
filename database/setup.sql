
-- Base de datos para el Sistema de Captura de Firmas GLPI
-- Ejecutar estos comandos en MySQL/MariaDB

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS signature_wizard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE signature_wizard;

-- Tabla de códigos de acceso
CREATE TABLE IF NOT EXISTS access_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar código de acceso inicial
INSERT INTO access_codes (code, description) VALUES 
('64721', 'Código de acceso principal'),
('admin123', 'Código de administrador');

-- Tabla de técnicos
CREATE TABLE IF NOT EXISTS technicians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    signature LONGTEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar técnicos de ejemplo
INSERT INTO technicians (name, email) VALUES 
('Juan Pérez', 'juan.perez@empresa.com'),
('María García', 'maria.garcia@empresa.com'),
('Carlos López', 'carlos.lopez@empresa.com');

-- Tabla de entregas (registro de firmas y entregas)
CREATE TABLE IF NOT EXISTS deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    assets_data LONGTEXT,
    technician_signature LONGTEXT,
    user_signature LONGTEXT,
    pdf_path VARCHAR(500),
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES technicians(id)
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Configuraciones iniciales
INSERT INTO system_config (config_key, config_value, description) VALUES 
('smtp_host', 'smtp.gmail.com', 'Servidor SMTP para envío de emails'),
('smtp_port', '587', 'Puerto SMTP'),
('smtp_user', 'your_email@gmail.com', 'Usuario SMTP'),
('smtp_password', 'your_app_password', 'Contraseña SMTP'),
('company_name', 'Mi Empresa', 'Nombre de la empresa'),
('pdf_footer', 'Documento generado automáticamente', 'Pie de página del PDF');

-- Índices para mejorar rendimiento
CREATE INDEX idx_technicians_active ON technicians(active);
CREATE INDEX idx_deliveries_technician ON deliveries(technician_id);
CREATE INDEX idx_deliveries_date ON deliveries(created_at);
CREATE INDEX idx_access_codes_active ON access_codes(active);

-- Vista para estadísticas
CREATE VIEW delivery_stats AS
SELECT 
    t.name as technician_name,
    COUNT(d.id) as total_deliveries,
    DATE(d.created_at) as delivery_date
FROM technicians t
LEFT JOIN deliveries d ON t.id = d.technician_id
WHERE t.active = TRUE
GROUP BY t.id, t.name, DATE(d.created_at);

COMMIT;
