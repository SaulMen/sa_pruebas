import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/devolucion.css";

const Devolucion = () => {
    const token = localStorage.getItem('token');
    const [compras, setCompras] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {

        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

        const fetchCompras = async () => {
            try {
                const response = await fetch('http://138.197.240.72.nip.io/cliente/compras', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Error al obtener las compras');
                }
                const data = await response.json();
                console.log("compras realizadas", data);
                setCompras(data.compras);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchCompras();
    }, [navigate]);

    // Manejar la devolución de un producto
    const handleDevolucion = async (idProducto, cantidad) => {
        try {
            const response = await fetch('http://138.197.240.72.nip.io/cliente/devolucion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    "id_producto": idProducto,
                    "cantidad": cantidad,
                }),
            });

            if (!response.ok) {
                throw new Error('Error al procesar la devolución');
            }

            // Actualizar el estado eliminando el producto devuelto
            setCompras(compras.filter(compra => compra.id_producto !== idProducto));
            alert('Devolución realizada con éxito');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar la devolución');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('id');
        window.location.href = '/';
    };

    return (
        <div className="main">
            <div className="main-home">
                <a href="/home" className="logo">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Usac_logo.png" alt="logo" />
                    <h2 className="nombre-empresa">Proyecto F1</h2>
                </a>
                <nav>
                    <a href="/carrito" className="nav-link">Carrito</a>
                    <a href="/devolucion" className="nav-link">Devolución</a>
                    <a href="/perfil" className="nav-link">Perfil</a>
                    <a href="/" className="nav-link" onClick={handleLogout}>Salir</a>
                </nav>
            </div>

            <div className="tabla-container-dev">
                <h2>Devoluciones</h2>
                {compras.length > 0 ? (
                    <table className="tabla-devolucion">
                        <thead>
                            <tr>
                                <th>Nombre Producto</th>
                                <th>Cantidad</th>
                                <th>Subtotal</th>
                                <th>Devolver</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compras.map(compra => (
                                <tr key={compra.id_producto}>
                                    <td>{compra.nombre_producto}</td>
                                    <td>{compra.cantidad}</td>
                                    <td>{compra.subtotal}</td>
                                    <td>
                                        <button
                                            onClick={() => handleDevolucion(compra.id_producto, compra.cantidad)}
                                            className="btn-eliminar-dev"
                                        >
                                            Devolver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No hay compras registradas.</p>
                )}
            </div>
            
        </div>
    );
};

export default Devolucion;
