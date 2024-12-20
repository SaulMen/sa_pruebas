import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminDev.css';

const AdminDev = () => {
    const navigate = useNavigate();
    const [devoluciones, setDevoluciones] = useState([]); // Estado para las devoluciones
    const [comentarios, setComentarios] = useState({}); 

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token){
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

         // Llamada al endpoint para obtener las devoluciones
         fetch('http://138.197.240.72.nip.io/cliente/devoluciones', {
            headers: {
                'Authorization': `Bearer ${token}`, // Asegúrate de enviar el token
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setDevoluciones(data.devoluciones || []);
                console.log(data);
            })
            .catch((error) => {
                console.error('Error al obtener devoluciones:', error);
            });
        
    }, [navigate]);


    const handleLogout = () => {
        localStorage.removeItem('token'); // Elimina el token
        navigate('/'); // Redirige al login
    };

    const handleAction = (idDevolucion, estado) => {
        const comentario = comentarios[idDevolucion] || ''; // Obtener el comentario del estado
        const body = {
            estado,
            ...(estado === 'rechazado' && comentario ? { comentario_rechazo: comentario } : {}),
        };
        console.log(body, idDevolucion);

        fetch(`http://138.197.240.72.nip.io/cliente/devoluciones/${idDevolucion}`, {
            method: 'PUT', // Método para actualizar
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
            .then((response) => {
                if (response.ok) {
                    alert(`Devolución ${estado === 'aprobado' ? 'aprobado' : 'rechazada'} exitosamente`);
                    // Actualizar la tabla al eliminar la devolución procesada
                    setDevoluciones((prev) => prev.filter((dev) => dev.id_devolucion !== idDevolucion));
                } else {
                    alert('Error al procesar la devolución.');
                }
            })
            .catch((error) => {
                console.error('Error en la solicitud:', error);
                alert('Error en la solicitud.');
            });
    };

    const handleComentarioChange = (idDevolucion, value) => {
        setComentarios((prev) => ({
            ...prev,
            [idDevolucion]: value,
        }));
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

            <div className="devoluciones-container">
                <h3>Devoluciones</h3>
                {devoluciones.length > 0 ? (
                    <table className="devoluciones-table">
                        <thead>
                            <tr>
                                <th>Cantidad Devuelta</th>
                                <th>Monto Reembolsado</th>
                                <th>Estado</th>
                                <th>Comentario</th>
                                <th>Aceptar</th>
                                <th>Rechazar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devoluciones.map((devolucion) => (
                                <tr key={devolucion.id_devolucion}>
                                    <td>{devolucion.cantidad_devuelta}</td>
                                    <td>{devolucion.monto_reembolsado}</td>
                                    <td>{devolucion.estado}</td>
                                    <td>
                                        <input
                                            type="text"
                                            value={comentarios[devolucion.id_devolucion] || ''}
                                            onChange={(e) =>
                                                handleComentarioChange(devolucion.id_devolucion, e.target.value)
                                            }
                                            placeholder="Comentario (opcional)"
                                            disabled={devolucion.estado !== 'pendiente'}
                                        />
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleAction(devolucion.id_devolucion, 'aprobado')}
                                            disabled={devolucion.estado !== 'pendiente'}
                                        >
                                            Aceptar
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleAction(devolucion.id_devolucion, 'rechazado')}
                                            disabled={devolucion.estado !== 'pendiente'}
                                        >
                                            Rechazar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No hay devoluciones pendientes.</p>
                )}
            </div>
            
        </div>
    );
};

export default AdminDev;
