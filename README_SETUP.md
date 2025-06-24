
# GLPI Signature Capture Wizard - Guía de Instalación

## Requisitos Previos

1. **Node.js** (versión 16 o superior)
2. **MySQL/MariaDB** (para las bases de datos)
3. **Servidor GLPI** funcionando con base de datos accesible

## Instalación

### 1. Configurar la Base de Datos Local

```sql
-- Conectar a MySQL/MariaDB como root
mysql -u root -p

-- Ejecutar el archivo de configuración
source database/setup.sql
```

### 2. Configurar el Backend

```bash
# Navegar a la carpeta del servidor
cd server

# Instalar dependencias
npm install

# Copiar y editar configuración
cp index.js index.js.backup
```

### 3. Configurar Conexiones de Base de Datos

Editar el archivo `server/index.js` y modificar las siguientes secciones:

#### Configuración Base de Datos Local:
```javascript
const localDbConfig = {
  host: 'localhost',           // IP del servidor MySQL local
  user: 'tu_usuario_mysql',    // Usuario MySQL
  password: 'tu_password',     // Contraseña MySQL
  database: 'signature_wizard'
};
```

#### Configuración Base de Datos GLPI:
```javascript
const glpiDbConfig = {
  host: '192.168.1.100',       // IP del servidor GLPI
  user: 'glpi_user',           // Usuario con acceso a BD GLPI
  password: 'glpi_password',   // Contraseña GLPI
  database: 'glpi'             // Nombre de la BD GLPI
};
```

#### Configuración Email:
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',      // Servidor SMTP
  port: 587,
  secure: false,
  auth: {
    user: 'tu_email@gmail.com',        // Tu email
    pass: 'tu_contraseña_aplicacion'   // Contraseña de aplicación
  }
});
```

### 4. Iniciar el Sistema

#### Terminal 1 - Backend:
```bash
cd server
npm start
```

#### Terminal 2 - Frontend:
```bash
# En la raíz del proyecto
npm run dev
```

## Configuración de Usuarios

### Añadir Códigos de Acceso:
```sql
USE signature_wizard;
INSERT INTO access_codes (code, description) VALUES ('nuevo_codigo', 'Descripción del código');
```

### Añadir Técnicos:
```sql
INSERT INTO technicians (name, email) VALUES ('Nombre Técnico', 'email@empresa.com');
```

## Configuración GLPI

Para que la aplicación funcione correctamente con GLPI, asegúrate de que:

1. **El usuario de base de datos tenga permisos de lectura en las siguientes tablas:**
   - `glpi_users`
   - `glpi_useremails`
   - `glpi_computers`
   - `glpi_phones`
   - `glpi_monitors`
   - `glpi_computertypes`
   - `glpi_phonetypes`
   - `glpi_monitortypes`
   - `glpi_states`

2. **Crear usuario específico para la aplicación:**
```sql
-- En la base de datos GLPI
CREATE USER 'signature_app'@'%' IDENTIFIED BY 'password_seguro';
GRANT SELECT ON glpi.glpi_users TO 'signature_app'@'%';
GRANT SELECT ON glpi.glpi_useremails TO 'signature_app'@'%';
GRANT SELECT ON glpi.glpi_computers TO 'signature_app'@'%';
GRANT SELECT ON glpi.glpi_phones TO 'signature_app'@'%';
GRANT SELECT ON glpi.glpi_monitors TO 'signature_app'@'%';
GRANT SELECT ON glpi.glpi_computertypes TO 'signature_app'@'%';
GRANT SELECT ON glpi.glpi_phonetypes TO 'signature_app'@'%';
GRANT SELECT ON glpi.glpi_monitortypes TO 'signature_app'@'%';
GRANT SELECT ON glpi.glpi_states TO 'signature_app'@'%';
FLUSH PRIVILEGES;
```

## Configuración de Email

### Para Gmail:
1. Activar autenticación de 2 factores
2. Generar contraseña de aplicación específica
3. Usar esa contraseña en la configuración

### Para otros proveedores:
Modificar la configuración SMTP según tu proveedor de email.

## Funcionalidades

✅ **Autenticación con código de acceso**
✅ **Gestión de técnicos con firmas persistentes**  
✅ **Conexión directa a GLPI (sin API)**
✅ **Visualización de usuarios y activos de GLPI**
✅ **Captura de firmas optimizada para móviles**
✅ **Generación de PDF**
✅ **Envío automático de emails**
✅ **Prevención de movimiento de pantalla al firmar**

## Acceso

- **URL:** http://localhost:8080
- **Código de acceso inicial:** 64721

## Solución de Problemas

### Error de conexión a base de datos:
- Verificar credenciales en `server/index.js`
- Comprobar que los servidores MySQL estén activos
- Verificar conectividad de red al servidor GLPI

### Problemas con emails:
- Verificar configuración SMTP
- Revisar contraseñas de aplicación
- Comprobar firewall/antivirus

### Firmas en móviles:
- La aplicación está optimizada para prevenir el movimiento de pantalla
- Usar `touch-action: none` en los canvas de firma
- Prevenir eventos `touchstart` y `touchmove` por defecto

## Estructura de Archivos

```
proyecto/
├── src/
│   ├── components/
│   │   ├── AuthScreen.tsx
│   │   ├── TechnicianSignatureWizard.tsx
│   │   ├── TechnicianSignature.tsx
│   │   ├── UserAssetsSelection.tsx
│   │   └── UserSignature.tsx
│   └── pages/
│       └── Index.tsx
├── server/
│   ├── index.js
│   └── package.json
├── database/
│   └── setup.sql
└── README_SETUP.md
```
