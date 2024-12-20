import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/perfil.css';

const Perfil = () => {
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isCardModalOpen, setCardModalOpen] = useState(false);
    const [isViewCardModalOpen, setViewCardModalOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [photoUpdated, setPhotoUpdated] = useState(false);
    const [cardData, setCardData] = useState({
        numero_tarjeta: '',
        fecha_expiracion: '',
        tipo_tarjeta: 'credito',
    });
    const [tarjetas, setTarjetas] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('user');
        const userId = localStorage.getItem('id');

        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

        const endpoint =
            userType === 'proveedor'
                ? 'http://138.197.240.72.nip.io/proveedores/perfilproveedor'
                : 'http://138.197.240.72.nip.io/cliente/info';
        const payload = JSON.stringify({ id_producto: userId });

        fetch(endpoint, {
            method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                mode: "cors",
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Error al obtener información del perfil');
            }
            return response.json();
        })
        .then((data) => {
            console.log('Datos del perfil:', data);
            setUserData(data);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Hubo un problema al cargar los datos del perfil.');
        });
    }, [navigate, photoUpdated]);

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const base64Image = await convertToBase64(file);
            const img = base64Image.split(',')[1];
            // Enviar la imagen al servidor
            const token = localStorage.getItem('token');

            const response = await fetch('http://138.197.240.72.nip.io/cliente/subir_foto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ Fotografia: img }),
            });

            if (!response.ok) {
                throw new Error('Error al subir la imagen');
            }

            const data = await response.json();
            console.log('Imagen subida con éxito:', data);
            // Actualiza la información del perfil si es necesario
            setUserData((prevData) => ({
                ...prevData,
                imagen_foto: data.fotografia, // O el campo que te retorne el servidor
            }));
            alert('Imagen cargada con éxito.');
            console.log('Imagen cargada con éxito.');
            setPhotoUpdated(true);
        } catch (error) {
            console.error('Error al cargar la imagen:', error);
            alert('Hubo un problema al cargar la imagen.');
        }
    };

    const fetchTarjetas = () => {
        const token = localStorage.getItem('token');

        fetch('http://138.197.240.72.nip.io/cliente/tarjetas', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error al obtener tarjetas');
                }
                return response.json();
            })
            .then((data) => {
                setTarjetas(data.tarjetas);
                setViewCardModalOpen(true);
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Hubo un problema al obtener las tarjetas.');
            });
    };

    const handleDeleteCard = (id_tarjeta) => {
        const token = localStorage.getItem('token');

        fetch(`http://138.197.240.72.nip.io/cliente/tarjetas/${id_tarjeta}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error al eliminar la tarjeta');
                }
                alert('Tarjeta eliminada con éxito.');
                setTarjetas((prevTarjetas) =>
                    prevTarjetas.filter((tarjeta) => tarjeta.id_tarjeta !== id_tarjeta)
                );
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Hubo un problema al eliminar la tarjeta.');
            });
    };

    const handleCardInputChange = (e) => {
        const { name, value } = e.target;
        setCardData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSaveCard = () => {
        const token = localStorage.getItem('token');

        fetch('http://138.197.240.72.nip.io/cliente/registrar_tarjeta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(cardData),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error al registrar tarjeta');
                }
                return response.json();
            })
            .then((data) => {
                console.log('Tarjeta registrada:', data);
                alert('Tarjeta registrada con éxito.');
                setCardModalOpen(false); // Cerrar el modal
                setCardData({
                    numero_tarjeta: '',
                    fecha_expiracion: '',
                    tipo_tarjeta: 'credito',
                }); // Limpiar el formulario
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Hubo un problema al registrar la tarjeta.');
            });
    };

    const handleUploadClick = () => {
        document.getElementById('upload-input').click();
    };

    if (!userData) {
        return <div>Cargando perfil...</div>;
    }

    const isProveedor = localStorage.getItem('user') === 'proveedor';

    const handleLogout = () => {
        localStorage.removeItem('token'); // Elimina el token
        localStorage.removeItem('user'); // Elimina el token
        localStorage.removeItem('id'); // Elimina el token
        navigate('/'); // Redirige al login
    };

    return (
        <div className="main">
            <div className="main-home">
                <a href={isProveedor ? "/homeProveedor" : "/home"} className="logo">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Usac_logo.png" alt="logo" />
                    <h2 className="nombre-empresa">Proyecto F1</h2>
                </a>
                <nav>
                    <a href={isProveedor ? "/ventas" : "/carrito"}  className="nav-link">
                    {isProveedor ? "Ventas" : "Carrito"}</a>
                    <a href={isProveedor ? "/" : "/devolucion"}  className="nav-link">
                    {isProveedor ? "" : "Devolución"}</a>
                    <a href="/perfil" className="nav-link">Perfil</a>
                    <a href="/" className="nav-link" onClick={()=> handleLogout()}>Salir</a>
                </nav>
            </div>

            <div className="profile-container">
                {/* Lado izquierdo */}
                {!isProveedor && (
                    <div className="profile-left">
                        <div className="profile-picture">
                            <img src={userData.imagen_foto} alt="Perfil" />
                        </div>
                        <input
                            type="file"
                            id="upload-input"
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <button className="upload-button" onClick={handleUploadClick}>
                            Cargar
                        </button>
                        <div className="card-icon">
                            <i className="fas fa-credit-card"></i>
                        </div>
                        <div>
                            <button className="add-card-button" onClick={() => setCardModalOpen(true)}>
                                Agregar tarjeta
                            </button>
                            <button className="add-card-button" onClick={fetchTarjetas}>
                                Ver tarjetas
                            </button>
                        </div>
                    </div>
                )}

                {/* Lado derecho */}
                <div className="profile-right">
                    <button className="edit-button" onClick={() => setEditModalOpen(true)}>
                        Editar
                    </button>
                    <div className="profile-fields">
                        <div className="profile-field">
                            <label>{isProveedor ? 'Nombre de la Empresa' : 'Nombre Completo'}</label>
                            <input
                                type="text"
                                value={isProveedor ? userData.nombre_empresa : userData.nombre_completo}
                                disabled
                            />
                        </div>
                        <div className="profile-field">
                            <label>Email</label>
                            <input type="email" value={userData.email} disabled />
                        </div>
                        {isProveedor && (
                            <div className="profile-field">
                                <label>Dirección Física</label>
                                <input type="text" value={userData.direccion_fisica} disabled />
                            </div>
                        )}
                        <div className="profile-field">
                            <label>Celular</label>
                            <input type="tel" value={userData.celular} disabled />
                        </div>
                        {!isProveedor && (
                            <div className="profile-field">
                                <label>Contraseña</label>
                                <input type="password" value="********" disabled />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modales (ventanas flotantes) */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Editar Perfil</h2>
                        <div className="profile-field">
                            <label>Nombre Completo</label>
                            <input type="text" placeholder="Ingrese su nombre completo" />
                        </div>
                        <div className="profile-field">
                            <label>Email</label>
                            <input type="email" placeholder="Ingrese su email" />
                        </div>
                        <div className="profile-field">
                            <label>Contraseña</label>
                            <input type="password" placeholder="Ingrese su contraseña" />
                        </div>
                        <div className="profile-field">
                            <label>Celular</label>
                            <input type="tel" placeholder="Ingrese su celular" />
                        </div>
                        <button
                            className="modal-save-button"
                            onClick={() => setEditModalOpen(false)}
                        >
                            Guardar
                        </button>
                        <button
                            className="modal-cancel-button"
                            onClick={() => setEditModalOpen(false)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {isCardModalOpen && (  
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Agregar Tarjeta</h2>
                        <div className="profile-field">
                            <label>Número de Tarjeta</label>
                            <input
                                type="text"
                                name="numero_tarjeta"
                                placeholder="1234 5678 9012 3456"
                                value={cardData.numero_tarjeta}
                                onChange={handleCardInputChange}
                            />
                        </div>
                        <div className="profile-field">
                            <label>Fecha de Expiración</label>
                            <input
                                type="date"
                                name="fecha_expiracion"
                                value={cardData.fecha_expiracion}
                                onChange={handleCardInputChange}
                            />
                        </div>
                        <div className="profile-field">
                            <label>Tipo de Tarjeta</label>
                            <select
                                name="tipo_tarjeta"
                                value={cardData.tipo_tarjeta}
                                onChange={handleCardInputChange}
                            >
                                <option value="credito">Crédito</option>
                                <option value="debito">Débito</option>
                            </select>
                        </div>
                        <button className="modal-save-button" onClick={handleSaveCard}>
                            Guardar Tarjeta
                        </button>
                        <button
                            className="modal-cancel-button"
                            onClick={() => setCardModalOpen(false)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {isViewCardModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        {/*<h2>Tarjeta Actual</h2>
                        <div className="profile-field">
                            <label>Número de Tarjeta</label>
                            <input type="text" placeholder="1234 5678 9012 3456" disabled/>
                        </div>
                        <div className="profile-field">
                            <label>Fecha de Expiración</label>
                            <input type="text" placeholder="AA-MM-DD" disabled/>
                        </div>
                        <div className="profile-field">
                            <label>Tipo de Tarjeta</label>
                            <input type="text" placeholder="Crédito/Débito" disabled/>
                        </div>*/}
                        <button
                            className="add-card-button"
                            onClick={() => setViewCardModalOpen(false)}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal para Ver Tarjetas */}
            {isViewCardModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Tarjetas</h2>
                        {tarjetas.length > 0 ? (
                            tarjetas.map((tarjeta) => (
                                <div key={tarjeta.id_tarjeta} className="profile-field">
                                    <p>
                                        <strong>Número:</strong> {tarjeta.numero_tarjeta}
                                    </p>
                                    <p>
                                        <strong>Tipo:</strong> {tarjeta.tipo_tarjeta}
                                    </p>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDeleteCard(tarjeta.id_tarjeta)}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No se encontraron tarjetas.</p>
                        )}
                        <button
                            className="add-card-button"
                            onClick={() => setViewCardModalOpen(false)}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Perfil;
