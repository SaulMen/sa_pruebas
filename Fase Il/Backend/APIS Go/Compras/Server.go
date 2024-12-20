package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"

	"github.com/dgrijalva/jwt-go"
	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

var DB *sql.DB
var jwtKey = []byte("mi_clave_secreta") // Clave secreta para JWT

// Estructura para el producto
type Producto struct {
	IDProducto  int     `json:"id_producto"`
	Nombre      string  `json:"nombre_producto"`
	Precio      float64 `json:"precio"`
	Stock       int     `json:"stock"`
	Categoria   string  `json:"categoria"`
	IDProveedor int     `json:"id_proveedor"`
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
	router.HandleFunc("/compras/agregarcarrito", VerifyJWT(AgregarProductoAlCarrito)).Methods("POST", "OPTIONS")
	router.HandleFunc("/compras/eliminarcarrito", VerifyJWT(EliminarProductoDelCarrito)).Methods("DELETE", "OPTIONS")
	router.HandleFunc("/compras/vercarrito/{moneda}", VerifyJWT(ObtenerCarritoConMoneda)).Methods("GET", "OPTIONS")
	router.HandleFunc("/compras/vercarrito/", VerifyJWT(ObtenerCarritoConMoneda)).Methods("GET", "OPTIONS")

	// Iniciar el servidor en el puerto 8081
	fmt.Println("Servidor escuchando en el puerto 7000...")
	log.Fatal(http.ListenAndServe("0.0.0.0:7000", router))
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

// MICROSERVICIO DE CARRITO DE COMPRAS

// AgregarProductoAlCarrito maneja la solicitud para agregar un producto al carrito
func AgregarProductoAlCarrito(w http.ResponseWriter, r *http.Request) {
	idCliente, ok := r.Context().Value("id_usuario").(int)
	if !ok {
		http.Error(w, "ID del cliente no encontrado en el token", http.StatusUnauthorized)
		return
	}

	// Obtener los datos del producto desde el cuerpo de la solicitud
	var request struct {
		IdProducto int `json:"id_producto"`
		Cantidad   int `json:"cantidad"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		fmt.Println("Error al decodificar la solicitud:", err)
		http.Error(w, "Error al decodificar la solicitud", http.StatusBadRequest)
		return
	}

	// Consultar el producto para obtener su precio y verificar disponibilidad en stock
	var producto PrecioProducto
	err := DB.QueryRow("SELECT id_producto, precio, stock FROM productos WHERE id_producto = ?", request.IdProducto).Scan(&producto.ID, &producto.Precio, &producto.Stock)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("Producto no encontrado:", err)
			http.Error(w, "Producto no encontrado", http.StatusNotFound)
		} else {
			fmt.Println("Error al consultar el producto:", err)
			http.Error(w, "Error al consultar el producto", http.StatusInternalServerError)
		}
		return
	}

	// Verificar si hay suficiente stock disponible
	if request.Cantidad > producto.Stock {
		fmt.Println("Stock insuficiente")
		http.Error(w, "Stock insuficiente", http.StatusBadRequest)
		return
	}

	// Verificar si el producto ya está en el carrito y si su estado es 'pendiente'
	var idCarrito int
	err = DB.QueryRow("SELECT id_carrito FROM carrito WHERE id_cliente = ? AND id_producto = ? AND estado = 'pendiente'", idCliente, request.IdProducto).Scan(&idCarrito)
	if err == nil {
		// Producto ya está en el carrito y está pendiente, actualizar cantidad y subtotal
		_, err = DB.Exec("UPDATE carrito SET cantidad = cantidad + ?, subtotal = (cantidad + ?) * ? WHERE id_carrito = ?", request.Cantidad, request.Cantidad, producto.Precio, idCarrito)
		if err != nil {
			fmt.Println("Error al actualizar el carrito:", err)
			http.Error(w, "Error al actualizar el carrito", http.StatusInternalServerError)
			return
		}

		// Actualizar el stock del producto
		_, err = DB.Exec("UPDATE productos SET stock = stock - ? WHERE id_producto = ?", request.Cantidad, request.IdProducto)
		if err != nil {
			fmt.Println("Error al actualizar el stock del producto:", err)
			http.Error(w, "Error al actualizar el stock del producto", http.StatusInternalServerError)
			return
		}
	} else if err == sql.ErrNoRows {
		// Producto no está en el carrito, agregar nuevo producto
		subtotal := float64(request.Cantidad) * producto.Precio
		_, err = DB.Exec("INSERT INTO carrito (id_cliente, id_producto, cantidad, subtotal, estado) VALUES (?, ?, ?, ?, ?)", idCliente, request.IdProducto, request.Cantidad, subtotal, "pendiente")
		if err != nil {
			fmt.Println("Error al agregar producto al carrito:", err)
			http.Error(w, "Error al agregar producto al carrito", http.StatusInternalServerError)
			return
		}

		// Reducir stock del producto
		_, err = DB.Exec("UPDATE productos SET stock = stock - ? WHERE id_producto = ?", request.Cantidad, request.IdProducto)
		if err != nil {
			fmt.Println("Error al reducir el stock del producto:", err)
			http.Error(w, "Error al reducir el stock del producto", http.StatusInternalServerError)
			return
		}
	} else {
		fmt.Println("Error al verificar existencia en el carrito:", err)
		http.Error(w, "Error al verificar existencia en el carrito", http.StatusInternalServerError)
		return
	}

	// Responder con éxito
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Producto agregado al carrito")
}

// EliminarProductoDelCarrito maneja la solicitud para eliminar un producto del carrito
func EliminarProductoDelCarrito(w http.ResponseWriter, r *http.Request) {
	idCliente, ok := r.Context().Value("id_usuario").(int)
	if !ok {
		http.Error(w, "ID del cliente no encontrado en el token", http.StatusUnauthorized)
		return
	}

	// Obtener el ID del producto desde el cuerpo de la solicitud
	var request struct {
		IdProducto int `json:"id_producto"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		fmt.Println("Error al decodificar la solicitud:", err)
		http.Error(w, "Error al decodificar la solicitud", http.StatusBadRequest)
		return
	}

	// Verificar si el producto está en el carrito del cliente
	var idCarrito, cantidadEnCarrito int
	err := DB.QueryRow("SELECT id_carrito, cantidad FROM carrito WHERE id_cliente = ? AND id_producto = ?", idCliente, request.IdProducto).Scan(&idCarrito, &cantidadEnCarrito)
	if err == sql.ErrNoRows {
		fmt.Println("Producto no encontrado en el carrito")
		http.Error(w, "Producto no encontrado en el carrito", http.StatusNotFound)
		return
	} else if err != nil {
		fmt.Println("Error al verificar producto en el carrito:", err)
		http.Error(w, "Error al verificar producto en el carrito", http.StatusInternalServerError)
		return
	}

	// Eliminar producto del carrito
	_, err = DB.Exec("DELETE FROM carrito WHERE id_carrito = ?", idCarrito)
	if err != nil {
		fmt.Println("Error al eliminar producto del carrito:", err)
		http.Error(w, "Error al eliminar producto del carrito", http.StatusInternalServerError)
		return
	}

	// Actualizar el stock del producto
	_, err = DB.Exec("UPDATE productos SET stock = stock + ? WHERE id_producto = ?", cantidadEnCarrito, request.IdProducto)
	if err != nil {
		fmt.Println("Error al actualizar el stock del producto:", err)
		http.Error(w, "Error al actualizar el stock del producto", http.StatusInternalServerError)
		return
	}

	// Responder con éxito y la cantidad eliminada
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Producto eliminado del carrito y %d unidades sumadas al stock", cantidadEnCarrito)
}

// ObtenerCarritoConMoneda maneja la solicitud para obtener el carrito de compras con precios en una moneda específica
func ObtenerCarritoConMoneda(w http.ResponseWriter, r *http.Request) {
	idCliente, ok := r.Context().Value("id_usuario").(int)
	if !ok {
		http.Error(w, "ID del cliente no encontrado en el token", http.StatusUnauthorized)
		return
	}

	// Obtener el parámetro de moneda de la URL
	vars := mux.Vars(r)
	moneda := vars["moneda"]

	// Consultar los productos en el carrito del cliente con estado pendiente
	rows, err := DB.Query("SELECT p.id_producto, p.nombre_producto, p.precio, c.cantidad, c.subtotal FROM carrito c INNER JOIN productos p ON c.id_producto = p.id_producto WHERE c.id_cliente = ? AND c.estado = 'pendiente'", idCliente)
	if err != nil {
		fmt.Println("Error al consultar el carrito:", err)
		http.Error(w, "Error al consultar el carrito", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var carrito []struct {
		IdProducto int     `json:"id_producto"`
		Nombre     string  `json:"nombre_producto"`
		Precio     float64 `json:"precio"`
		Cantidad   int     `json:"cantidad"`
		Subtotal   float64 `json:"subtotal"`
	}

	var totalCompra float64

	// Obtener el tipo de cambio de la base de datos solo si se solicita una moneda diferente a "base" o si no se especifica ninguna
	var tipoCambio map[string]float64
	if moneda != "" && moneda != "base" {
		tipoCambio = obtenerTipoDeCambio(moneda)
		if tipoCambio == nil {
			http.Error(w, "Moneda no soportada", http.StatusBadRequest)
			return
		}
	} else {
		// Si no se especifica moneda, se puede usar el tipo de cambio base o no hacer la conversión
		tipoCambio = obtenerTipoDeCambio("base") // Aquí "base" es el valor predeterminado que usas en la base de datos
	}

	// Procesar los productos del carrito
	for rows.Next() {
		var producto struct {
			IdProducto int     `json:"id_producto"`
			Nombre     string  `json:"nombre_producto"`
			Precio     float64 `json:"precio"`
			Cantidad   int     `json:"cantidad"`
			Subtotal   float64 `json:"subtotal"`
		}
		if err := rows.Scan(&producto.IdProducto, &producto.Nombre, &producto.Precio, &producto.Cantidad, &producto.Subtotal); err != nil {
			fmt.Println("Error al escanear el producto del carrito:", err)
			continue
		}

		// Si hay un tipo de cambio, convertir el precio del producto
		if tipoCambio != nil {
			producto.Precio /= tipoCambio["precio"]
		}

		// Aumentar el precio en un 10% y redondear a dos decimales
		producto.Precio = math.Round(producto.Precio*1.10*100) / 100

		// Calcular el subtotal (precio convertido * cantidad) y redondear a dos decimales
		producto.Subtotal = math.Round(producto.Precio*float64(producto.Cantidad)*100) / 100

		// Agregar el producto al carrito y actualizar el total de la compra
		carrito = append(carrito, producto)
		totalCompra += producto.Subtotal
	}

	// Redondear el total de la compra a dos decimales
	totalCompra = math.Round(totalCompra*100) / 100

	// Verificar si el carrito está vacío
	if len(carrito) == 0 {
		http.Error(w, "El carrito está vacío", http.StatusNotFound)
		return
	}

	// Agregar el total de compras al carrito
	carritoResponse := struct {
		Productos []struct {
			IdProducto int     `json:"id_producto"`
			Nombre     string  `json:"nombre_producto"`
			Precio     float64 `json:"precio"`
			Cantidad   int     `json:"cantidad"`
			Subtotal   float64 `json:"subtotal"`
		} `json:"productos"`
		TotalCompra float64 `json:"total_compra"`
	}{
		Productos:   carrito,
		TotalCompra: totalCompra,
	}

	// Codificar la respuesta como JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(carritoResponse); err != nil {
		fmt.Println("Error al codificar la respuesta JSON del carrito:", err)
		http.Error(w, "Error al procesar la solicitud", http.StatusInternalServerError)
		return
	}
}

// Obtener el tipo de cambio de la tabla CurrencyConversion
func obtenerTipoDeCambio(moneda string) map[string]float64 {
	//var tipoCambio map[string]float64
	query := fmt.Sprintf("SELECT conversion FROM currencyconversion WHERE name=?")

	// Declarar una variable para almacenar el resultado de la consulta
	var conversion float64

	// Ejecutar la consulta y obtener el resultado
	err := DB.QueryRow(query, moneda).Scan(&conversion)
	if err != nil {
		// Manejar errores como filas no encontradas o problemas con la base de datos
		if err == sql.ErrNoRows {
			return nil
		}
		return nil
	}
	conversionConDosDecimales := fmt.Sprintf("%.2f", conversion)
	println(conversionConDosDecimales)

	/*var usd, mxn, jpy float64
	if err := row.Scan(&conversion); err != nil {
		fmt.Println("Error al obtener tipo de cambio:", err)
		return nil
	}

	// Retornar el tipo de cambio basado en la moneda
	switch moneda {
	case "usd":
		tipoCambio = map[string]float64{"precio": usd}
	case "mxn":
		tipoCambio = map[string]float64{"precio": mxn}
	case "jpy":
		tipoCambio = map[string]float64{"precio": jpy}
	case "base": // Caso en que se pasa la moneda base
		tipoCambio = map[string]float64{"precio": 1} // No se realiza conversión para la moneda base
	default:
		return nil
	}*/

	return map[string]float64{"precio": conversion}
}
