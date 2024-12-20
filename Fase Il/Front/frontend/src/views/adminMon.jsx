import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminMon.css';

const AdminMon = () => {
    const navigate = useNavigate();
    const [monedas, setMonedas] = useState([]);
    const [monedas2, setMonedas2] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newCurrencyDeleted, setNewCurrencyDeleted] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token){
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

        fetch('http://localhost:3003/admin-panel/currency/', {
        })
            .then((response) => response.json())
            .then((data) => {
                setMonedas(data || []);
                setLoading(false);
                console.log(data);
            })
            .catch((error) => {
                console.error('Error al cargar monedas:', error);
                setLoading(false);
            });

       
        
    }, [navigate, newCurrencyDeleted]);


    const handleLogout = () => {
        localStorage.removeItem('token'); // Elimina el token
        navigate('/'); // Redirige al login
    };

    const handleDelete = (id) => {
        //console.log(monedas);
        if (window.confirm('¿Estás seguro de que deseas eliminar esta moneda?')) {
            fetch(`http://localhost:3003/admin-panel/currency/${id}`, {
                method: 'DELETE',
            })
                .then((response) => {
                    if (response.ok) {
                        alert('Moneda eliminado correctamente');
                        setMonedas(monedas.filter((moneda) => moneda.id_currency !== id));
                        setNewCurrencyDeleted(true);
                    } else {
                        alert('Error al eliminar moneda');
                    }
                })
                .catch((error) => {
                    console.error('Error al eliminar cupón:', error);
                });
        }
    };

    const handleAddCurrency = () => {
        fetch('http://localhost:3003/admin-panel/currency/precreate')
            .then((response) => response.json())
            .then((data) => {
                setMonedas2(data || []);
                setShowModal(true);
                console.log(data);
            })
            .catch((error) => {
                console.error('Error al cargar las monedas disponibles:', error);
            });
    };

    const handleConfirmAddCurrency = (moneda) => {
        const dataToSend =
            {
                id_currency: 25,
                name: moneda.nombre,
                simbolo: moneda.nombre.substring(0, 3),
                conversion: 5,
                codigo: moneda.codigo
            }
        console.log(dataToSend);
        fetch('http://localhost:3003/admin-panel/currency/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })
            .then((response) => {
                if (response.ok) {
                    alert('Moneda agregada correctamente');
                    setShowModal(false);
                    setNewCurrencyDeleted(!newCurrencyDeleted); // Refresca la lista
                } else {
                    alert('Error al agregar la moneda');
                }
            })
            .catch((error) => {
                console.error('Error al agregar la moneda:', error);
            });
    };

    return (
        <div className="main">
            <div className="main-home">
                <a href="/admin" className="logo">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Usac_logo.png" alt="logo" />
                    <h2 className="nombre-empresa">Proyecto F1</h2>
                </a>
                <nav>
                    <a href="/admin/api" className="nav-link">API</a>
                    <a href="/admin/devoluciones" className="nav-link">Devoluciones</a>
                    <a href="/admin/cupones" className="nav-link">Cupones</a>
                    <a href="/admin/moneda" className="nav-link">Moneda</a>
                    <a href="/" className="nav-link" onClick={handleLogout}>Salir</a>
                </nav>
            </div>

            {/* Botón para agregar moneda */}
            <div className="admin-buttons">
                <button className="add-button" onClick={handleAddCurrency}>
                    Agregar Moneda
                </button>
            </div>

            {/* Tabla de monedas */}
            <div className="user-table">
                {loading ? (
                    <p>Cargando Monedas...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Simbolo</th>
                                <th>Conversión</th>
                                <th>Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monedas.length > 0 ? (
                                monedas.map((moneda) => (
                                    <tr key={moneda.id_currency}>
                                        <td>{moneda.name}</td>
                                        <td>{moneda.simbolo}</td>
                                        <td>{moneda.conversion.toFixed(4)}</td>
                                        <td>
                                            <button className="delete-button" onClick={() => handleDelete(moneda.id_currency)}>
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">No hay monedas disponibles.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-admin-monedas">
                    <div className="modal-content-admin-monedas">
                        <h3>Agregar Moneda</h3>
                        <h3>Agregar Moneda</h3>
                        <h3>Agregar Moneda</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Código</th>
                                    <th>Agregar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monedas2.length > 0 ? (
                                    monedas2.map((moneda) => (
                                        <tr key={moneda.codigo}>
                                            <td>{moneda.nombre}</td>
                                            <td>{moneda.codigo}</td>
                                            <td>
                                                <button className="add-button" onClick={() => handleConfirmAddCurrency(moneda)}>
                                                    Agregar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No hay monedas disponibles para agregar.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <button className="close-button" onClick={() => setShowModal(false)}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default AdminMon;
