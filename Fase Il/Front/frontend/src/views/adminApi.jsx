import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminApi.css';

const AdminApi = () => {
    const navigate = useNavigate();
    const [apiUrl, setApiUrl] = useState(''); 

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token){
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

        
    }, [navigate]);


    const handleLogout = () => {
        localStorage.removeItem('token'); // Elimina el token
        localStorage.removeItem('url');
        navigate('/'); // Redirige al login
    };

    const handleApiUrlChange = (e) => {
        setApiUrl(e.target.value); // Actualiza el estado con el valor ingresado
    };

    const handleLoadProducts = () => {
        if (!apiUrl) {
            alert('Por favor, ingrese una URL válida.');
            return;
        }
        localStorage.setItem('url', apiUrl)

        // Tal vez quitar, en sí no es necsario
        fetch(apiUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Error al cargar los productos: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log('Productos obtenidos:', data);
            })
            .catch((error) => {
                console.error('Error al obtener los productos:', error);
            });

        // Realiza una solicitud a la API ingresada
        fetch('http://138.197.240.72.nip.io/api-consumir/procesar-productos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'url':apiUrl,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Error al cargar los productos: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log('Productos cargados:', data);
                alert('Productos cargados con éxito. Verifica la consola para más detalles.');
            })
            .catch((error) => {
                console.error('Error al cargar los productos:', error);
                alert('Hubo un error al cargar los productos. Verifica la URL e intenta nuevamente.');
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

            <div className="admin-api">
                <h3>Cargar Productos desde una API</h3>
                <input
                    type="text"
                    placeholder="Ingrese la URL API REST"
                    value={apiUrl}
                    onChange={handleApiUrlChange}
                    className="api-input"
                />
                <button onClick={handleLoadProducts} className="load-button">
                    Cargar Productos
                </button>
            </div>
            
        </div>
    );
};

export default AdminApi;
