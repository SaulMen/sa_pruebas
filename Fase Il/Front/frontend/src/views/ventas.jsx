import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ventas.css';

const Ventas = () => {
    const [ventas, setVentas] = useState([]);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchVentas = async () => {
            try {
                const response = await fetch('http://138.197.240.72.nip.io/proveedores/ventasproveedor', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                setVentas(data);
            } catch (error) {
                console.error('Error fetching ventas:', error);
            }
        };

        fetchVentas();
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token'); // Elimina el token
        localStorage.removeItem('user'); // Elimina el token
        localStorage.removeItem('id'); // Elimina el token
        navigate('/'); // Redirige al login
    };

    return (
        <div className="main">
            <div className="main-home">
                <a href="/homeProveedor" className="logo">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Usac_logo.png" alt="logo" />
                    <h2 className="nombre-empresa">Proyecto F1</h2>
                </a>
                <nav>
                    <a href="/ventas" className="nav-link">Ventas</a>
                    <a href="/perfil" className="nav-link">Perfil</a>
                    <a href="/" className="nav-link" onClick={()=>handleLogout()}>Salir</a>
                </nav>
            </div>

            <div className="ventas-container">
                <h2 className="ventas-title">Mis Ventas</h2>
                <div className="ventas-list">
                    {ventas && ventas.length > 0 ? (
                        ventas.map((venta, index) => (
                            <div key={index} className="venta-item">
                                <h3>{venta.nombre_producto}</h3>
                                <p>Cantidad: {venta.cantidad_total}</p>
                                <p>Total: ${venta.total}</p>
                            </div>
                        ))
                    ) : (
                        <p>No tienes ventas registradas.</p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Ventas;
