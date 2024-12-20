import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css'

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        contraseña: '',
        userType: 'cliente', // Valor por defecto
    });

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            if (formData.email=='admin@gmail.com' && formData.contraseña=='1234') {
                alert('Inicio de sesión exitoso');
                localStorage.setItem('token', 'admin');
                navigate('/admin');
            }else{
                const response = await fetch('http://localhost:3000/autenticacion/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        contraseña: formData.contraseña,
                    }),
                });
        
                if (response.ok) {
                    const data = await response.json(); // Incluye el token
                    alert('Inicio de sesión exitoso');
                    console.log('Datos recibidos del backend:', data);
        
                    // Almacena el token en localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('coin', "");
        
                    // Redirige según el tipo de usuario
                    if (formData.userType === 'cliente') {
                        navigate('/home'); 
                        localStorage.setItem('user', 'cliente');
                        localStorage.setItem('id', data.id);
                    } else if (formData.userType === 'proveedor') {
                        navigate('/homeProveedor'); 
                        localStorage.setItem('user', 'proveedor');
                        localStorage.setItem('id', data.id);
                    }
                } else {
                    console.error('Error al iniciar sesión:', response.statusText);
                    alert('Error al iniciar sesión. Verifica tus credenciales.');
                }
            }            
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Ocurrió un problema al conectar con el servidor.');
        }
    };

    return(
        <div className='main-login'>
            <p>Iniciar Sesión</p>
            <div className="datos">
                <form onSubmit={handleSubmit}>
                    <p>Usuario</p>
                    <input 
                        type="email"
                        name="email"
                        placeholder="Correo electrónico"
                        value={formData.email}
                        onChange={handleInputChange}
                        />
                    <p>Contraseña</p>
                    <input 
                        type="password"
                        name="contraseña"
                        placeholder="****"
                        value={formData.contraseña}
                        onChange={handleInputChange}
                        />
                    <div className="radio-group">
                        <input 
                            type="radio"
                            id="cliente"
                            name="userType"
                            value="cliente"
                            checked={formData.userType === 'cliente'}
                            onChange={handleInputChange}
                            />
                        <label htmlFor="cliente">Cliente</label>

                        <input 
                            type="radio"
                            id="proveedor"
                            name="userType"
                            value="proveedor"
                            checked={formData.userType === 'proveedor'}
                            onChange={handleInputChange}
                            />
                        <label htmlFor="proveedor">Proveedor</label>
                    </div>
                    <button type="submit">Entrar</button>
                </form>
                <a href="/register" className="register-link">¿No tienes cuenta? Registrate</a>
            </div>
        </div>
    );
};

export default Login