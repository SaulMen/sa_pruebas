import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';

const Admin = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]); // Lista de usuarios (clientes/proveedores)
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(""); // "Cliente" o "Proveedor"
    const [formData, setFormData] = useState({});
    const [editingUser, setEditingUser] = useState(null);
    const [newUserDeleted, setNewUserDeleted] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token){
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

        // Llamada al endpoint para obtener todos los usuarios (clientes y proveedores)
        fetch('http://138.197.240.72.nip.io/admin-panel/user', {
            
        })
            .then((response) => response.json())
            .then((data) => {
                setUsers(data || []);
                setLoading(false);
                console.log(data);
            })
            .catch((error) => {
                console.error('Error al cargar usuarios:', error);
                setLoading(false);
            });
        
    }, [navigate, newUserDeleted]);


    const handleLogout = () => {
        localStorage.removeItem('token'); // Elimina el token
        localStorage.removeItem('user'); // Elimina el token
        localStorage.removeItem('id'); // Elimina el token
        navigate('/'); // Redirige al login
    };

    const handleAddUser = (type) => {
        setModalType(type);
        setFormData({});
        setEditingUser(null);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        console.log(editingUser);
        const endpoint = editingUser
            ? `http://138.197.240.72.nip.io/admin-panel/user/${editingUser.id_usuario}`
            : "http://138.197.240.72.nip.io/admin-panel/user";
        let dataToSend={};
        if(editingUser){
            dataToSend =
            modalType === "Cliente"
                ? {
                    id_usuario : editingUser.id_usuario,
                    nombre: formData.nombre,
                    email: formData.email,
                    contraseña: formData.contraseña,
                    celular: formData.celular,
                    tipo_usuario: "cliente",
                    rol: "cliente"
                }//user.tipo_usuario, user.rol
                : {
                    id_usuario : editingUser.id_usuario,
                    nombre: formData.nombre_empresa,
                    email: formData.email,
                    contraseña: formData.contraseña,
                    celular: formData.celular,
                    tipo_usuario: "proveedor",
                    rol: "proveedor"
                };
        }else{
            dataToSend =
            modalType === "Cliente"
                ? {
                    nombre: `${formData.nombre} ${formData.apellido}`,
                    email: formData.email,
                    contraseña: formData.contraseña,
                    celular: formData.celular,
                    tipo_usuario: "cliente",
                    rol: "cliente"
                }//user.tipo_usuario, user.rol
                : {
                    nombre: formData.nombre_empresa,
                    email: formData.email,
                    contraseña: formData.contraseña,
                    celular: formData.celular,
                    tipo_usuario: "proveedor",
                    rol: "proveedor"
                };
        }
        console.log(dataToSend);
        fetch(endpoint, {
            method: editingUser ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })
            .then((response) => {
                if (response.ok) {
                    alert(editingUser ? 'Usuario editado correctamente' : `${modalType} agregado correctamente`);
                    setShowModal(false);
                    setFormData({});
                    setEditingUser(null);
                    // Refresca la lista de usuarios
                    if (editingUser) {
                        setUsers((prevUsers) =>
                            prevUsers.map((user) =>
                                user.id_usuario === editingUser.id_usuario ? { ...user, ...dataToSend } : user
                            )
                        );
                    } else {
                        setUsers((prevUsers) => [...prevUsers, dataToSend]);
                    }
                } else {
                    alert(`Error al ${editingUser ? 'editar' : 'agregar'} usuario`);
                }
            })
            .catch((error) => {
                console.error(`Error al ${editingUser ? 'editar' : 'agregar'} usuario:`, error);
            });
    };

    const handleEdit = (id) => {
        const userToEdit = users.find((user) => user.id_usuario === id);
        setModalType(userToEdit.rol === "cliente" ? "Cliente" : "Proveedor");
        setEditingUser(userToEdit);
        setFormData(userToEdit); // Precarga los datos del usuario
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            fetch(`http://138.197.240.72.nip.io/admin-panel/user/${id}`, {
                method: 'DELETE',
            })
                .then((response) => {
                    if (response.ok) {
                        alert('Usuario eliminado correctamente');
                        setUsers(users.filter((user) => user.id !== id));
                        setNewUserDeleted(true);
                    } else {
                        alert('Error al eliminar usuario');
                    }
                })
                .catch((error) => {
                    console.error('Error al eliminar usuario:', error);
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

            {/* Botones para agregar cliente y proveedor */}
            <div className="admin-buttons">
                <button onClick={() => handleAddUser('Cliente')} className="add-button">
                    Agregar Cliente
                </button>
                <button onClick={() => handleAddUser('Proveedor')} className="add-button">
                    Agregar Proveedor
                </button>
            </div>

            {/* Tabla de usuarios */}
            <div className="user-table">
                {loading ? (
                    <p>Cargando usuarios...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Celular</th>
                                <th>Tipo</th>
                                <th>Editar</th>
                                <th>Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id_usuario}>
                                        <td>{user.nombre}</td>
                                        <td>{user.email}</td>
                                        <td>{user.celular}</td>
                                        <td>{user.rol}</td>
                                        <td>
                                            <button
                                                className="edit-button"
                                                onClick={() => handleEdit(user.id_usuario)}
                                            >
                                                Editar
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                className="delete-button"
                                                onClick={() => handleDelete(user.id_usuario)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">No hay usuarios disponibles.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-admin">
                    <div className="modal-content-admin">
                        <h3>{editingUser ? `Editar ${modalType}` : `Agregar ${modalType}`}</h3>
                        {modalType === "Cliente" ? (
                            <>
                                <input
                                    type="text"
                                    name="nombre"
                                    placeholder="Nombre"
                                    value={formData.nombre || ""}
                                    onChange={handleFormChange}
                                />
                                <input
                                    type="email"
                                    name="correo"
                                    placeholder="Correo"
                                    value={formData.email || ""}
                                    onChange={handleFormChange}
                                />
                                <input
                                    type="password"
                                    name="contraseña"
                                    placeholder="Contraseña"
                                    value={formData.contraseña || ""}
                                    onChange={handleFormChange}
                                />
                                <input
                                    type="text"
                                    name="celular"
                                    placeholder="Celular"
                                    value={formData.celular || ""}
                                    onChange={handleFormChange}
                                />
                            </>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    name="nombre_empresa"
                                    placeholder="Nombre Empresa"
                                    value={formData.nombre || ""}
                                    onChange={handleFormChange}
                                />
                                <input
                                    type="email"
                                    name="correo"
                                    placeholder="Correo"
                                    value={formData.email || ""}
                                    onChange={handleFormChange}
                                />
                                <input
                                    type="password"
                                    name="contraseña"
                                    placeholder="Contraseña"
                                    value={formData.contraseña || ""}
                                    onChange={handleFormChange}
                                />
                                <input
                                    type="text"
                                    name="celular"
                                    placeholder="Celular"
                                    value={formData.celular || ""}
                                    onChange={handleFormChange}
                                />
                            </>
                        )}
                        <div className="modal-buttons-admin">
                            <button onClick={handleSubmit} className="add-button">Agregar</button>
                            <button onClick={handleModalClose} className="cancel-button">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default Admin;
