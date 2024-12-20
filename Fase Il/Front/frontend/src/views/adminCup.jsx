import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminCup.css';

const AdminCup = () => {
    const navigate = useNavigate();
    const [cupones, setCupones] = useState([]); // Lista de usuarios (clientes/proveedores)
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCupon, setEditingCupon] = useState(null); // Nuevo estado para manejar edición
    const [formData, setFormData] = useState({});
    const [newCuponDeleted, setNewCuponDeleted] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token){
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

        fetch('http://138.197.240.72.nip.io/admin-panel/cupon', {
        })
            .then((response) => response.json())
            .then((data) => {
                setCupones(data || []);
                setLoading(false);
                console.log(data);
            })
            .catch((error) => {
                console.error('Error al cargar cupones:', error);
                setLoading(false);
            });
        
    }, [navigate, newCuponDeleted]);
    
    const handleLogout = () => {
        localStorage.removeItem('token'); // Elimina el token
        navigate('/'); // Redirige al login
    };

    const handleAddCupon = () => {
        setEditingCupon(null); // Limpia cualquier edición previa
        setFormData({});
        setShowModal(true);
    };

    const handleEdit = (id) => {
        const cuponToEdit = cupones.find((cupon) => cupon.id_cupon === id);
        if (cuponToEdit) {
            setEditingCupon(cuponToEdit); // Marca que estamos editando este cupón
            setFormData(cuponToEdit); // Precarga los datos en el formulario
            setShowModal(true);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingCupon(null);
        setFormData({});
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        const endpoint = editingCupon
            ? `http://138.197.240.72.nip.io/admin-panel/cupon/${editingCupon.id_cupon}`
            : 'http://138.197.240.72.nip.io/admin-panel/cupon';
        const method = editingCupon ? 'PUT' : 'POST';
        const dataToSend = editingCupon ?
            {
                codigo_cupon: formData.codigo_cupon,
                porcentaje_descuento: formData.porcentaje_descuento,
                fecha_vencimiento: formData.fecha_vencimiento,
                usos_totales: formData.usos_totales,
                usos_por_cliente: formData.usos_por_cliente,
            } :
            {
                id_cupon: formData.id_cupon,
                codigo_cupon: formData.codigo_cupon,
                porcentaje_descuento: formData.porcentaje_descuento,
                fecha_vencimiento: formData.fecha_vencimiento,
                usos_totales: formData.usos_totales,
                usos_por_cliente: formData.usos_por_cliente,
            }
        console.log(dataToSend);
        fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })
        .then((response) => {
            if (response.ok) {
                alert(editingCupon ? 'Cupón actualizado correctamente' : 'Cupón agregado correctamente');
                setShowModal(false);
                setFormData({});
                if (editingCupon) {
                    // Actualiza la lista localmente sin recargar
                    setCupones((prev) =>
                        prev.map((cupon) =>
                            cupon.id_cupon === editingCupon.id_cupon ? formData : cupon
                        )
                    );
                } else {
                    setCupones((prev) => [...prev, formData]);
                }
            } else {
                alert(`Error al ${editingCupon ? 'actualizar' : 'agregar'} el cupón`);
            }
        })
        .catch((error) => {
            console.error(`Error al ${editingCupon ? 'actualizar' : 'agregar'} el cupón:`, error);
        });
    };

    const handleDelete = (id) => {
        //console.log(cupones);
        if (window.confirm('¿Estás seguro de que deseas eliminar este cupón?')) {
            fetch(`http://138.197.240.72.nip.io/admin-panel/cupon/${id}`, {
                method: 'DELETE',
            })
                .then((response) => {
                    if (response.ok) {
                        alert('Cupón eliminado correctamente');
                        setCupones(cupones.filter((cupon) => cupon.id_cupon !== id));
                        setNewCuponDeleted(true);
                    } else {
                        alert('Error al eliminar cupón');
                    }
                })
                .catch((error) => {
                    console.error('Error al eliminar cupón:', error);
                });
        }
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

            {/* Botones para agregar cupones */}
            <div className="admin-buttons">
                <button className="add-button" onClick={() => handleAddCupon('Cupon')}>
                    Crear Cupón
                </button>
            </div>

            {/* Tabla de cupones */}
            <div className="user-table">
                {loading ? (
                    <p>Cargando cupones...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Codigo</th>
                                <th>Porcentaje</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Individual</th>
                                <th>Editar</th>
                                <th>Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cupones.length > 0 ? (
                                cupones.map((cupon) => (
                                    <tr key={cupon.id_cupon}>
                                        <td>{cupon.codigo_cupon}</td>
                                        <td>{Math.trunc(cupon.porcentaje_descuento)}</td>
                                        <td>{(cupon.fecha_vencimiento).split("T")[0]}</td>
                                        <td>{cupon.usos_totales}</td>
                                        <td>{cupon.usos_por_cliente}</td>
                                        <td>
                                            <button className="edit-button" onClick={() => handleEdit(cupon.id_cupon)}>
                                                Editar
                                            </button>
                                        </td>
                                        <td>
                                            <button className="delete-button" onClick={() => handleDelete(cupon.id_cupon)}>
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">No hay cupones disponibles.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-admin-cupones">
                    <div className="modal-content-admin-cupones">
                        <h3>{editingCupon ? 'Editar Cupón' : 'Agregar Cupón'}</h3>
                        <input
                            type="text"
                            name="codigo_cupon"
                            placeholder="Código"
                            value={formData.codigo_cupon || ''}
                            onChange={handleFormChange}
                        />
                        <input
                            type="text"
                            name="porcentaje_descuento"
                            placeholder="Porcentaje"
                            value={formData.porcentaje_descuento || ''}
                            onChange={handleFormChange}
                        />
                        <input
                            type="date"
                            name="fecha_vencimiento"
                            value={formData.fecha_vencimiento || ''}
                            onChange={handleFormChange}
                        />
                        <input
                            type="number"
                            name="usos_totales"
                            placeholder="Usos totales"
                            value={formData.usos_totales || ''}
                            onChange={handleFormChange}
                        />
                        <input
                            type="number"
                            name="usos_por_cliente"
                            placeholder="Usos/Cliente"
                            value={formData.usos_por_cliente || ''}
                            onChange={handleFormChange}
                        />
                        <div className="modal-buttons-admin-cupones">
                            <button onClick={handleSubmit} className="add-button">
                                {editingCupon ? 'Guardar' : 'Agregar'}
                            </button>
                            <button onClick={handleModalClose} className="cancel-button">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            
        </div>
    );
};

export default AdminCup;
