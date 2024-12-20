package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/dgrijalva/jwt-go"
	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

var DB *sql.DB
var jwtKey = []byte("mi_clave_secreta") // Clave secreta para JWT

// Estructura para el producto
type Producto struct {
	IDProducto   int     `json:"id_producto"`
	Nombre       string  `json:"nombre_producto"`
	Precio       float64 `json:"precio"`
	Stock        int     `json:"stock"`
	Categoria    string  `json:"categoria"`
	IDProveedor  int     `json:"id_proveedor"`
	ImagenBase64 string  `json:"imagen_base64"`
	ImagenURL    string  `json:"imagen_url"`
}

// Estructura para venta
type Venta struct {
	NombreProducto string  `json:"nombre_producto"`
	CantidadTotal  int     `json:"cantidad_total"`
	Total          float64 `json:"total"`
}

// Estructura para el producto con precio y stock
type PrecioProducto struct {
	ID     int     `json:"id_producto"`
	Precio float64 `json:"precio"`
	Stock  int     `json:"stock"`
}

// Estructura para el token JWT
type Claims struct {
	IDUsuario int `json:"id_usuario"` // El id_usuario se extrae del JWT
	jwt.StandardClaims
}

// InitDB establece la conexión con la base de datos.
func InitDB() {
	var err error

	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	// Construir el DSN (Data Source Name)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", dbUser, dbPassword, dbHost, dbPort, dbName)

	// Conectar con la base de datos
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Error al conectar con la base de datos: ", err)
	}

	// Verificar si la base de datos está disponible
	if err = DB.Ping(); err != nil {
		log.Fatal("Error al verificar la conexión a la base de datos: ", err)
	}
	fmt.Println("Conexión exitosa a la base de datos.")
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Agregar los encabezados CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// Cargar las variables de entorno desde el archivo .env
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error cargando el archivo .env")
	}

	// Inicializar base de datos
	InitDB()

	// Crear un enrutador con Gorilla Mux
	router := mux.NewRouter()

	// Middleware para habilitar CORS
	router.Use(enableCORS)

	// Rutas
	router.HandleFunc("/proveedores/productos", VerifyJWT(CreateProducto)).Methods("GET", "POST", "OPTIONS")
	router.HandleFunc("/proveedores/verproductos", VerifyJWT(GetProductos)).Methods("GET", "POST", "OPTIONS")
	router.HandleFunc("/proveedores/actualizarproducto", VerifyJWT(UpdateProducto)).Methods("PUT", "POST", "OPTIONS")
	router.HandleFunc("/proveedores/eliminarproducto", VerifyJWT(DeleteProducto)).Methods("DELETE", "POST", "OPTIONS")
	router.HandleFunc("/proveedores/perfilproveedor", VerifyJWT(GetPerfilProveedor)).Methods("GET", "OPTIONS")
	router.HandleFunc("/proveedores/ventasproveedor", VerifyJWT(GetVentas)).Methods("GET", "OPTIONS")

	// Iniciar el servidor en el puerto 9000
	fmt.Println("Servidor escuchando en el puerto 9000...")
	log.Fatal(http.ListenAndServe("0.0.0.0:9000", router))
}

// VerifyJWT verifica la validez del token JWT
func VerifyJWT(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			http.Error(w, "Token no proporcionado", http.StatusUnauthorized)
			return
		}

		if len(tokenString) < 7 || tokenString[:7] != "Bearer " {
			http.Error(w, "Token mal formado", http.StatusUnauthorized)
			return
		}
		tokenString = tokenString[7:]

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			fmt.Println("Error en la verificación del token:", err)
			http.Error(w, "Token inválido", http.StatusUnauthorized)
			return
		}

		ctx := r.Context()
		ctx = context.WithValue(ctx, "id_usuario", claims.IDUsuario)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

// CrearProducto
func CreateProducto(w http.ResponseWriter, r *http.Request) {
	// Obtener el idUsuario del contexto
	idUsuario := r.Context().Value("id_usuario").(int)

	// Decodificar los datos del producto del cuerpo de la solicitud
	var producto Producto
	err := json.NewDecoder(r.Body).Decode(&producto)
	if err != nil {
		http.Error(w, "Error al decodificar los datos del producto", http.StatusBadRequest)
		return
	}

	// Asociar el producto con el idUsuario como idProveedor
	producto.IDProveedor = idUsuario

	// Verificar que la imagen Base64 no esté vacía
	if producto.ImagenBase64 == "" {
		http.Error(w, "Imagen Base64 vacía", http.StatusBadRequest)
		return
	}

	// Decodificar la imagen Base64
	imageData, err := decodeBase64Image(producto.ImagenBase64)
	if err != nil {
		http.Error(w, "Error al decodificar la imagen: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Subir la imagen a S3
	imageURL, err := uploadImageToS3(imageData, "producto-"+producto.Nombre+".jpg")
	if err != nil {
		http.Error(w, "Error al subir la imagen a S3", http.StatusInternalServerError)
		return
	}
	producto.ImagenURL = imageURL

	// Insertar el producto en la base de datos
	_, err = DB.Exec(`INSERT INTO productos (nombre_producto, precio, stock, categoria, id_proveedor, imagen_foto) 
                      VALUES (?, ?, ?, ?, ?, ?)`,
		producto.Nombre, producto.Precio, producto.Stock, producto.Categoria, producto.IDProveedor, producto.ImagenURL)
	if err != nil {
		http.Error(w, "Error al insertar el producto en la base de datos", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	response := map[string]string{
		"message": "Producto creado exitosamente",
	}
	json.NewEncoder(w).Encode(response)
}

// Decodificar la imagen Base64
func decodeBase64Image(base64Str string) ([]byte, error) {
	// Decodificar la cadena Base64
	imageData, err := base64.StdEncoding.DecodeString(base64Str)
	if err != nil {
		return nil, fmt.Errorf("fallo al decodificar Base64: %v", err)
	}
	return imageData, nil
}

// Subir la imagen a S3
func uploadImageToS3(imageBase64 []byte, filename string) (string, error) {
	// Leer variables de entorno
	bucketName := os.Getenv("S3_BUCKET_NAME")
	region := os.Getenv("S3_REGION")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	directory := "productos/"

	// Verificar si todas las variables de entorno están establecidas
	if bucketName == "" || region == "" || accessKey == "" || secretKey == "" {
		return "", fmt.Errorf("faltan variables de entorno para configurar S3")
	}

	// Configurar AWS SDK con credenciales estáticas
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		),
	)
	if err != nil {
		return "", fmt.Errorf("error al cargar la configuración de AWS: %v", err)
	}

	// Crear el cliente S3
	s3Client := s3.NewFromConfig(cfg)

	// Preparar el objeto de la imagen para subir a S3
	objectKey := directory + filename
	input := &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
		Body:   bytes.NewReader(imageBase64),
	}

	// Subir la imagen
	_, err = s3Client.PutObject(context.TODO(), input)
	if err != nil {
		return "", fmt.Errorf("error al subir la imagen a S3: %v", err)
	}

	// Generar URL de la imagen subida
	imageURL := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, objectKey)

	return imageURL, nil
}

// GetProductos maneja la consulta de productos de un proveedor
func GetProductos(w http.ResponseWriter, r *http.Request) {
	idProveedor, ok := r.Context().Value("id_usuario").(int)
	if !ok {
		http.Error(w, "ID de proveedor no encontrado en el token", http.StatusUnauthorized)
		return
	}

	// Consultar productos específicos del proveedor en la base de datos
	rows, err := DB.Query(`
		SELECT id_producto, nombre_producto, precio, stock, categoria, 
		       COALESCE(imagen_foto, '') AS imagen_foto
		FROM productos 
		WHERE id_proveedor = ?`, idProveedor)
	if err != nil {
		fmt.Println("Error al consultar los productos del proveedor:", err)
		http.Error(w, "Error al consultar los productos", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Definición de la estructura Producto
	type Producto struct {
		IDProducto int     `json:"id_producto"`
		Nombre     string  `json:"nombre_producto"`
		Precio     float64 `json:"precio"`
		Stock      int     `json:"stock"`
		Categoria  string  `json:"categoria"`
		ImagenFoto string  `json:"imagen_foto"`
	}

	var productos []Producto
	for rows.Next() {
		var producto Producto
		if err := rows.Scan(
			&producto.IDProducto,
			&producto.Nombre,
			&producto.Precio,
			&producto.Stock,
			&producto.Categoria,
			&producto.ImagenFoto); err != nil {
			fmt.Println("Error al escanear producto:", err)
			http.Error(w, "Error al leer los productos", http.StatusInternalServerError)
			return
		}
		productos = append(productos, producto)
	}

	// Serializar la lista de productos a JSON y responder
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(productos); err != nil {
		fmt.Println("Error al serializar productos:", err)
		http.Error(w, "Error al enviar los productos", http.StatusInternalServerError)
		return
	}
}

// UpdateProducto maneja la actualización de un producto por su ID
func UpdateProducto(w http.ResponseWriter, r *http.Request) {
	idProveedor, ok := r.Context().Value("id_usuario").(int)
	//fmt.Println("ID de proveedor:", idProveedor)
	if !ok {
		http.Error(w, "ID de proveedor no encontrado en el token", http.StatusUnauthorized)
		return
	}

	// Decodificar el cuerpo de la solicitud para obtener los datos del producto
	var updateRequest struct {
		IDProducto *int     `json:"id_producto"`
		Precio     *float64 `json:"precio,omitempty"`
		Stock      *int     `json:"stock,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&updateRequest); err != nil {
		http.Error(w, "Error al leer el cuerpo de la solicitud", http.StatusBadRequest)
		return
	}

	// Validar que se proporcione el id_producto
	if updateRequest.IDProducto == nil {
		http.Error(w, "El campo 'id_producto' es obligatorio", http.StatusBadRequest)
		return
	}

	// Construir la consulta SQL dinámica
	query := "UPDATE productos SET"
	params := []interface{}{}

	if updateRequest.Precio != nil {
		query += " precio = ?,"
		params = append(params, *updateRequest.Precio)
	}
	if updateRequest.Stock != nil {
		query += " stock = stock + ?,"
		params = append(params, *updateRequest.Stock)
	}

	// Remover la última coma y agregar condiciones WHERE
	query = query[:len(query)-1] + " WHERE id_producto = ? AND id_proveedor = ?"
	params = append(params, *updateRequest.IDProducto, idProveedor)

	// Ejecutar la consulta SQL
	result, err := DB.Exec(query, params...)
	if err != nil {
		fmt.Println("Error al actualizar el producto:", err)
		http.Error(w, "Error al actualizar el producto", http.StatusInternalServerError)
		return
	}

	// Verificar si se actualizó alguna fila
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No se encontró el producto o no pertenece al proveedor", http.StatusNotFound)
		return
	}

	// Responder con un mensaje de éxito
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Producto actualizado correctamente",
	})
}

// DeleteProducto maneja la eliminación de un producto por su ID
func DeleteProducto(w http.ResponseWriter, r *http.Request) {
	idProveedor, ok := r.Context().Value("id_usuario").(int)
	//fmt.Println("ID de proveedor:", idProveedor)
	if !ok {
		http.Error(w, "ID de proveedor no encontrado en el token", http.StatusUnauthorized)
		return
	}

	// Decodificar el cuerpo de la solicitud para obtener el ID del producto
	var deleteRequest struct {
		IDProducto int `json:"id_producto"`
	}

	if err := json.NewDecoder(r.Body).Decode(&deleteRequest); err != nil {
		http.Error(w, "Error al leer el cuerpo de la solicitud", http.StatusBadRequest)
		return
	}

	// Validar que se proporcione el ID del producto
	if deleteRequest.IDProducto == 0 {
		http.Error(w, "El campo 'id_producto' es obligatorio", http.StatusBadRequest)
		return
	}

	// Eliminar el producto de la base de datos
	result, err := DB.Exec("DELETE FROM productos WHERE id_producto = ? AND id_proveedor = ?", deleteRequest.IDProducto, idProveedor)
	if err != nil {
		fmt.Println("Error al eliminar el producto:", err)
		http.Error(w, "Error al eliminar el producto", http.StatusInternalServerError)
		return
	}

	// Verificar si se eliminó alguna fila
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No se encontró el producto o no pertenece al proveedor", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Producto eliminado correctamente",
	})
}

// GetPerfilProveedor maneja la obtención del perfil de un proveedor
func GetPerfilProveedor(w http.ResponseWriter, r *http.Request) {
	idProveedor, ok := r.Context().Value("id_usuario").(int)
	if !ok {
		http.Error(w, "ID de proveedor no encontrado en el token", http.StatusUnauthorized)
		return
	}

	// Consultar información del proveedor en la base de datos
	query := `
        SELECT p.nombre_empresa, u.email, p.direccion_fisica, u.celular
        FROM proveedores p
        INNER JOIN usuarios u ON p.id_proveedor = u.id_usuario
        WHERE p.id_proveedor = ?
    `

	row := DB.QueryRow(query, idProveedor)

	// Almacenar la información del proveedor
	var perfil struct {
		NombreEmpresa   string `json:"nombre_empresa"`
		Email           string `json:"email"`
		DireccionFisica string `json:"direccion_fisica"`
		Celular         string `json:"celular"`
	}

	if err := row.Scan(&perfil.NombreEmpresa, &perfil.Email, &perfil.DireccionFisica, &perfil.Celular); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Proveedor no encontrado", http.StatusNotFound)
		} else {
			fmt.Println("Error al consultar el perfil del proveedor:", err)
			http.Error(w, "Error interno del servidor", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(perfil)
}

// GetVentasProveedor maneja la obtención de las ventas del proveedor con estado 'comprado'
func GetVentas(w http.ResponseWriter, r *http.Request) {
	// Obtener el id_proveedor del token
	idProveedor, ok := r.Context().Value("id_usuario").(int) // Cambié "id_usuario" a "id_proveedor"
	if !ok {
		http.Error(w, "ID de proveedor no encontrado en el token", http.StatusUnauthorized)
		return
	}

	// Consultar productos del carrito con estado 'comprado' para el proveedor
	rows, err := DB.Query(`
        SELECT p.nombre_producto, SUM(c.cantidad) AS cantidad_total, SUM(c.subtotal) AS total 
        FROM carrito c 
        JOIN productos p ON c.id_producto = p.id_producto 
        WHERE p.id_proveedor = ? AND c.estado = 'comprado' 
        GROUP BY p.nombre_producto`, idProveedor)

	if err != nil {
		fmt.Println("Error al consultar ventas del proveedor:", err)
		http.Error(w, "Error al consultar las ventas", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Almacenar las ventas en una lista
	var ventas []Venta
	for rows.Next() {
		var venta Venta
		if err := rows.Scan(&venta.NombreProducto, &venta.CantidadTotal, &venta.Total); err != nil {
			fmt.Println("Error al escanear venta:", err)
			http.Error(w, "Error al leer las ventas", http.StatusInternalServerError)
			return
		}
		ventas = append(ventas, venta)
	}

	// Serializar la lista de ventas a JSON y responder
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ventas)
}
