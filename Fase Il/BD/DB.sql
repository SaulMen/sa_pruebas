CREATE DATABASE EconoMarket

USE EconoMarket

-- Tabla de usuarios
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    celular VARCHAR(20),
    tipo_usuario ENUM('proveedor', 'cliente', 'administrador') NOT NULL
);


-- Tabla de proveedores (relacionada con usuarios)
CREATE TABLE proveedores (
    id_proveedor INT PRIMARY KEY,
    nombre_empresa VARCHAR(255) NOT NULL,
    direccion_fisica TEXT NOT NULL,
    FOREIGN KEY (id_proveedor) REFERENCES usuarios(id_usuario)
);

-- Tabla de clientes (relacionada con usuarios)
CREATE TABLE clientes (
    id_cliente INT PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    imagen_foto VARCHAR(100),
    FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario)
);

-- Tabla de productos
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    categoria VARCHAR(100),
    id_proveedor INT,
    imagen_foto VARCHAR(100),
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

-- Tabla de tarjetas de débito/crédito de clientes
CREATE TABLE tarjetas (
    id_tarjeta INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    numero_tarjeta VARCHAR(20) NOT NULL,
    fecha_expiracion DATE NOT NULL,
    tipo_tarjeta ENUM('debito', 'credito') NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

-- Tabla de carrito de compras de clientes con estado 'pendiente' y 'comprado'
CREATE TABLE carrito (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_producto INT,
    cantidad INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'comprado') DEFAULT 'pendiente',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- Crear la tabla para convertir divisas
CREATE TABLE CurrencyConversion (
    id_currency INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20),
    simbolo VARCHAR(5),
    conversion FLOAT,
    codigo INT
);

 -- Crear la tabla de cupones
CREATE TABLE cupones (
    id_cupon INT AUTO_INCREMENT PRIMARY KEY,
    codigo_cupon VARCHAR(50) UNIQUE NOT NULL,
    porcentaje_descuento DECIMAL(5,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    usos_totales INT NOT NULL,
    usos_por_cliente INT NOT NULL
);

-- Crear la tabla de cupones de clientes
CREATE TABLE cliente_cupones (
    id_cliente INT NOT NULL,
    id_cupon INT NOT NULL,
    usos INT DEFAULT 0,
    PRIMARY KEY (id_cliente, id_cupon),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_cupon) REFERENCES cupones(id_cupon)
);

-- Crear la tabla de devoluciones
CREATE TABLE devoluciones (
    id_devolucion INT AUTO_INCREMENT PRIMARY KEY,
    id_carrito INT NOT NULL,
    cantidad_devuelta INT NOT NULL,
    monto_reembolsado DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    comentario_rechazo TEXT,
    FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito)
);


-- Crear la tabla de cartera de clientes
CREATE TABLE cartera_clientes (
    id_cliente INT PRIMARY KEY,
    saldo DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);


ALTER TABLE usuarios 
ADD rol ENUM('proveedor', 'cliente', 'administrador') NOT NULL DEFAULT 'cliente';


