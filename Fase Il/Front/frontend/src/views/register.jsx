import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/register.css';

const Register = () => {
    const [userType, setUserType] = useState('cliente');
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        contraseña: '',
        celular: '',
        nombre_completo: '',
        nombre_empresa: '',
        direccion_fisica: '',
    });

    const navigate = useNavigate(); // Inicializa el hook

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const endpoint = userType === 'cliente'
            ? 'http://localhost:3000/autenticacion/registro-cliente'
            : 'http://localhost:3000/autenticacion/registro-proveedor';

        const dataToSend =
            userType === 'cliente'
                ? {
                    nombre: formData.nombre,
                    email: formData.email,
                    contraseña: formData.contraseña,
                    celular: formData.celular,
                    nombre_completo: `${formData.nombre} ${formData.nombre_completo}`,
                }
                : {
                    nombre: formData.nombre,
                    email: formData.email,
                    contraseña: formData.contraseña,
                    celular: formData.celular,
                    nombre_empresa: formData.nombre_empresa,
                    direccion_fisica: formData.direccion_fisica,
                };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                alert('Registro exitoso');
                navigate('/'); // Redirige a la página principal    
            } else {
                console.error('Error en el registro:', response.statusText);
                alert('Ocurrió un error al registrar.');
            }
        } catch (error) {
            console.error('Error al enviar datos:', error);
            alert('Ocurrió un error al conectar con el servidor.');
        }
    };

    return (
        <div className='main-register'>
            <p>Registro</p>

            <div className="radio-group">
                <input
                    type="radio"
                    id="cliente"
                    name="userType"
                    value="cliente"
                    checked={userType === 'cliente'}
                    onChange={() => setUserType('cliente')}
                />
                <label htmlFor="cliente">Cliente</label>

                <input
                    type="radio"
                    id="proveedor"
                    name="userType"
                    value="proveedor"
                    checked={userType === 'proveedor'}
                    onChange={() => setUserType('proveedor')}
                />
                <label htmlFor="proveedor">Proveedor</label>
            </div>

            {/* Formulario condicional */}
            <div className="datos">
                <form onSubmit={handleSubmit}>
                    {userType === 'cliente' ? (
                        <>
                            <p>Nombres</p>
                            <input 
                                type="text"
                                name="nombre"
                                placeholder="Ingresa tus nombres"
                                value={formData.nombre}
                                onChange={handleInputChange} />
                            <p>Apellidos</p>
                            <input 
                                type="text"
                                name="nombre_completo"
                                placeholder="Ingresa tus apellidos"
                                value={formData.nombre_completo}
                                onChange={handleInputChange} />
                            <p>Email</p>
                            <input 
                                type="email"
                                name="email"
                                placeholder="Ingresa tu correo electrónico"
                                value={formData.email}
                                onChange={handleInputChange} />
                            <p>Contraseña</p>
                            <input 
                                type="password"
                                name="contraseña"
                                placeholder="****"
                                value={formData.contraseña}
                                onChange={handleInputChange} />
                            <p>Celular</p>
                            <input 
                                type="tel"
                                name="celular"
                                placeholder="Ingresa tu número de celular"
                                value={formData.celular}
                                onChange={handleInputChange} />
                        </>
                    ) : (
                        <>
                            <p>Nombre Empresa</p>
                            <input
                                type="text"
                                name="nombre_empresa"
                                placeholder="Ingresa el nombre de tu empresa"
                                value={formData.nombre_empresa}
                                onChange={handleInputChange}
                            />
                            <p>Email</p>
                            <input
                                type="email"
                                name="email"
                                placeholder="Ingresa tu correo electrónico"
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
                            <p>Dirección Física</p>
                            <input
                                type="text"
                                name="direccion_fisica"
                                placeholder="Ingresa la dirección física"
                                value={formData.direccion_fisica}
                                onChange={handleInputChange}
                            />
                            <p>Celular</p>
                            <input
                                type="tel"
                                name="celular"
                                placeholder="Ingresa tu número de celular"
                                value={formData.celular}
                                onChange={handleInputChange}
                            />
                        </>
                    )}
                    <button type="submit">Registrar</button>
                </form>
                <a href="/" className="login-link">¿Ya tienes cuenta? Inicia sesión</a>
            </div>
        </div>
    );
};

export default Register;
