import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/carrito.css";

const Carrito = () => {
    const token = localStorage.getItem('token');
    const defaultCoin = localStorage.getItem('coin') || '';
    const [coin, setCoin] = useState(defaultCoin);
    const [currencyOptions, setCurrencyOptions] = useState([]);
    const [codigoPromocion, setCodigoPromocion] = useState("");
    const [carrito, setCarrito] = useState({ productos: [], total_compra: 0 });
    const navigate = useNavigate();

    useEffect(() => {

        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

            // Saldo cliente
        fetch('http://138.197.240.72.nip.io/cliente/saldo', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // Token de autenticación
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("monedas:", data);
                localStorage.setItem('saldo',data['saldo'])
            })
            .catch((error) => {
                console.error('Error al cargar el saldo:', error);
            });

        fetch('http://138.197.240.72.nip.io/admin-panel/currency/')
            .then((response) => response.json())
            .then((data) => {
                console.log("monedas:", data);
                setCurrencyOptions(data || []);
            })
            .catch((error) => {
                console.error('Error al cargar las monedas:', error);
            });
                        //${coin.toLocaleLowerCase()}
        fetch(`http://138.197.240.72.nip.io/compras/vercarrito/${coin.toLowerCase()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // Token de autenticación
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Datos del carrito:', data);
                setCarrito(data);
            })
            .catch((error) => {
                console.error('Error al obtener los datos del carrito:', error);
            });
    }, [coin]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('id');
        window.location.href = '/';
    };

    const eliminarProducto = (id_producto) => {
        fetch('http://138.197.240.72.nip.io/compras/eliminarcarrito', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ id_producto }),
        })
            .then((response) => {
                if (response.ok) {
                    setCarrito((prevCarrito) => {
                        const productosActualizados = prevCarrito.productos.filter(
                            (producto) => producto.id_producto !== id_producto
                        );
                        const totalActualizado = productosActualizados.reduce(
                            (total, producto) => total + producto.subtotal,
                            0
                        );
                        return { productos: productosActualizados, total_compra: totalActualizado };
                    });
                } else {
                    console.error('Error al eliminar el producto.');
                }
            })
            .catch((error) => console.error('Error en la solicitud de eliminación:', error));
    };

    const finalizarCompra = () => {
        const body = {
            "estado": "comprado",
            ...(codigoPromocion && { "codigo_cupon": codigoPromocion }),
        };
        console.log(codigoPromocion, body)

        fetch(`http://138.197.240.72.nip.io/pago/procesar-pago/${coin.toLowerCase()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(body)
        })
            .then((response) => {
                if (response.ok) {
                    alert('Compra finalizada con éxito.');
                    setCarrito({ productos: [], total_compra: 0 });
                    setCodigoPromocion("");
                } else {
                    console.error('Error al finalizar la compra.');
                }
            })
            .catch((error) => console.error('Error al finalizar la compra:', error));
    };

    const handleCoinChange = (selectedCoin) => {
        const coinValue = selectedCoin === 'GTQ' ? '' : selectedCoin;
        setCoin(coinValue);
        localStorage.setItem('coin', coinValue);
    };

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
                    <a href="/" className="nav-link" onClick={handleLogout}>Salir</a>
                </nav>
            </div>

            <div className="main-carrito">
                <h2>Carrito de Compras</h2>
                <div className="carrito-list">
                    <h3>Saldo disponible: {localStorage.getItem('saldo')}</h3>
                    {carrito.productos.length > 0 ? (
                        carrito.productos.map((producto) => (
                            <div className="carrito-item" key={producto.id_producto}>
                                <div className="item-info">
                                    <h3>{producto.nombre_producto}</h3>
                                    <p>Precio: {producto.precio.toFixed(2)} 
                                    {coin=='' ? ' GTQ' : ' '+coin.toUpperCase()}
                                    </p>
                                    <p>Cantidad: {producto.cantidad}</p>
                                    <p>Subtotal: {producto.subtotal.toFixed(2)} 
                                    {coin=='' ? ' GTQ' : ' '+coin.toUpperCase()}</p>
                                </div>
                                <button
                                    className="delete-button"
                                    onClick={() => eliminarProducto(producto.id_producto)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No hay productos en el carrito.</p>
                    )}
                </div>
                {carrito.productos.length > 0 && (
                    <>
                        <div className="total">
                            <h3>Total de la Compra: {carrito.total_compra.toFixed(2)} 
                            {coin=='' ? ' GTQ' : ' '+coin.toUpperCase()}</h3>
                        </div>
                        <div className="codigo-promocion">
                            <label htmlFor="codigo-promocion">Código Promocional:</label>
                            <input
                                type="text"
                                id="codigo-promocion"
                                value={codigoPromocion}
                                onChange={(e) => setCodigoPromocion(e.target.value)}
                                placeholder="Ingresa tu código"
                            />
                        </div>
                        <button className="finalizar-button" onClick={finalizarCompra}>
                            Finalizar Compra
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Carrito;
