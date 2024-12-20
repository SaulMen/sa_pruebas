import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';

const Home = () => {
    const token = localStorage.getItem('token');
    const defaultCoin = localStorage.getItem('coin') || '';
    const [coin, setCoin] = useState(defaultCoin);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState({}); 
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchCategory, setSearchCategory] = useState('');
    const [currencyOptions, setCurrencyOptions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('user')=='proveedor') {
            alert('Eres Proveedor. Por favor, inicia sesión.');
            navigate('/homeProveedor');
            return;
        }

        if (!token){
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

        fetch('http://138.197.240.72.nip.io/admin-panel/currency/')
            .then((response) => response.json())
            .then((data) => {
                console.log("monedas:", data);
                setCurrencyOptions(data || []);
            })
            .catch((error) => {
                console.error('Error al cargar las monedas:', error);
            });

        fetch(`http://138.197.240.72.nip.io/catalogo/productos/${coin}`)
            .then((response) => response.json())
            .then((data) => {
                const productos = data.productos || [];
                setProducts(productos);
                setFilteredProducts(productos);
                setLoading(false);
                const initialQuantities = productos.reduce((acc, product) => {
                    acc[product.id_producto] = 1;
                    return acc;
                }, {});
                console.log(data.productos);
                setQuantities(initialQuantities);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });
    }, [coin, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('id');
        localStorage.removeItem('coin');
        navigate('/');
    };

    const handleQuantityChange = (productId, change) => {
        setQuantities((prev) => ({
            ...prev,
            [productId]: Math.max(1, (prev[productId] || 1) + change),
        }));
    };

    const handleBuy = (productId) => {
        const cantidad = quantities[productId] || 1;

        fetch('http://138.197.240.72.nip.io/compras/agregarcarrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // Asume que el token está en localStorage
            },
            body: JSON.stringify({
                id_producto: productId,
                cantidad: cantidad,
            }),
        })
            .then((response) => {
                if (response.ok) {
                    console.log('Producto agregado al carrito exitosamente');
                    alert('Producto agregado al carrito exitosamente');
                } else {
                    console.error('Error al agregar al carrito');
                    alert('Error al agregar al carrito');
                }
            })
            .catch((error) => {
                console.error('Error en la solicitud:', error);
                alert('Error en la solicitud');
            });
    };

    const handleSearch = () => {
        if (!searchCategory) {
            setFilteredProducts(products);
            return;
        }

        fetch(`http://138.197.240.72.nip.io/catalogo/productos-buscar/${coin}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ categoria: searchCategory }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Hola", data.productos);
                setFilteredProducts(data.productos); // Actualizamos los productos filtrados
                console.log(filteredProducts.length);
            })
            .catch((error) => {
                console.error('Error buscando productos:', error);
            });
    };

    // Para manejar la búsqueda al presionar Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleCoinChange = (selectedCoin) => {
        const coinValue = selectedCoin === 'GTQ' ? '' : selectedCoin;
        setCoin(coinValue);
        localStorage.setItem('coin', coinValue);
    };

    // Para clientes: imagen, nombre, precio final y cantidad disponible
    // Para proveedores: nombre, precio, cantidad, categoría, 
    // EsMia (si me pertenece), numero de grupo (18 en los que me pertenezcan)
    return (
        <div className="main">
            <div className="main-home">
                <a href="/home" className="logo">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Usac_logo.png" alt="logo" />
                    <h2 className="nombre-empresa">Proyecto F1</h2>
                </a>
                <nav>
                    <div className="currency-selector">
                        <label htmlFor="currency">Moneda:</label>
                        <select
                            id="currency"
                            className="currency-dropdown"
                            value={coin || 'GTQ'}
                            onChange={(e) => handleCoinChange(e.target.value)}
                        >
                            {/* Cargar dinámicamente las opciones */}
                            <option value="">GTQ</option> {/* Moneda por defecto */}
                            {currencyOptions.map((currency) => (
                                <option key={currency.codigo} value={currency.name}>
                                    {currency.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <a href="/carrito" className="nav-link">Carrito</a>
                    <a href="/devolucion" className="nav-link">Devolución</a>
                    <a href="/perfil" className="nav-link">Perfil</a>
                    <a href="/" className="nav-link" onClick={()=>handleLogout()}>Salir</a>
                </nav>
            </div>

            {/* Barra de búsqueda */}
            <div className="search-bar">
                <input
                    type="text"
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Buscar por categoría"
                />
                <button onClick={handleSearch}>🔍</button>
            </div>

            <div className="productos">
                {loading ? (
                    <p>Cargando productos...</p>
                ) : (
                    <div className="product-grid">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <div
                                    className="product-card"
                                    key={product.id_producto}
                                    id={product.categoria}
                                    value={product.stock}
                                >
                                    <img
                                        src={product.imagen_foto}
                                        alt={product.nombre_producto}
                                        className="product-image"
                                    />
                                    <h3 className="product-title">{product.nombre_producto}</h3>
                                    <p className="product-price">{product.precio ? Number(product.precio).toFixed(2) : 
                                    Number(product.precio_final).toFixed(2)} 
                                    {coin=='' ? ' GTQ' : ' '+coin.toUpperCase()}</p>
                                    <div className="quantity-control">
                                        <button onClick={() => handleQuantityChange(product.id_producto, -1)}>-</button>
                                        <input
                                            type="text"
                                            readOnly
                                            value={quantities[product.id_producto] || 1}
                                        />
                                        <button onClick={() => handleQuantityChange(product.id_producto, 1)}>+</button>
                                    </div>
                                    <button
                                        className="buy-button"
                                        onClick={() => handleBuy(product.id_producto)}
                                    >
                                        Comprar
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p></p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;