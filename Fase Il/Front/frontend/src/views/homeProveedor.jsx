import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/homeProveedor.css';

const HomeProveedor = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [productToUpdate, setProductToUpdate] = useState(null);
    const [updateModalVisible, setUpdateModalVisible] = useState(false);
    const [imageBase64, setImageBase64] = useState('');
    const [newProductAdded, setNewProductAdded] = useState(false);
    const [productUpdated, setProductUpdated] = useState(false);
    const [newProduct, setNewProduct] = useState({
        nombre_producto: '',
        precio: '',
        stock: '',
        categoria: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            navigate('/');
        } else {
            console.log('Token disponible:', token);
    
            // Realizar la solicitud para obtener los productos
            fetch('http://138.197.240.72.nip.io/proveedores/verproductos', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                mode: "cors",
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error al obtener productos");
                }
                return response.json();
            })
            .then((data) => {
                console.log("Productos:", data);
                // Actualizar el estado de productos
                if (Array.isArray(data)) {
                    setProducts(data);
                } else {
                    console.error("La respuesta no es un arreglo:", data);
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
        }
    }, [navigate,newProductAdded,productUpdated]);
    

    const handleLogout = () => {
        localStorage.removeItem('token'); // Elimina el token
        localStorage.removeItem('user'); // Elimina el token
        localStorage.removeItem('id'); // Elimina el token
        navigate('/'); // Redirige al login
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const closeModal = async () => {

        setShowCreateModal(false);
    }

    const handleCreateProduct = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado.');
            return;
        }
    
        console.log('Imagen Base64 actual:', imageBase64);
        if (!imageBase64) {
            alert('Por favor, selecciona una imagen válida.');
            return;
        }
    
        try {
            const response = await fetch('http://138.197.240.72.nip.io/proveedores/productos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre_producto: newProduct.nombre_producto,
                    precio: parseFloat(newProduct.precio),
                    stock: parseInt(newProduct.stock),
                    categoria: newProduct.categoria,
                    imagen_base64: imageBase64,
                }),
            });
    
            if (response.ok) {
                const data = await response.json();
                alert('Producto creado exitosamente');
                setProducts((prevProducts) => [
                    ...prevProducts,
                    { id: data.id, ...newProduct },
                ]);
                setShowCreateModal(false);
                setNewProductAdded(true);
            } else {
                const textError = await response.text();
                console.error('Error al crear el producto:', textError);
                alert(`Error: ${textError}`);
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Ocurrió un error al conectar con el servidor.');
        }
    };

    const openUpdateModal = (product) => {
        setProductToUpdate({ ...product });
        setUpdateModalVisible(true);
    };
    
    const handleUpdateInputChange = (e) => {
        const { name, value } = e.target;
        setProductToUpdate((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };
    
    const handleUpdateProduct = async () => {
        const token = localStorage.getItem('token');
        if (!token || !productToUpdate) {
            alert('No estás autenticado o no hay producto seleccionado.');
            return;
        }
    
        try {
            const response = await fetch('http://138.197.240.72.nip.io/proveedores/actualizarproducto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_producto: productToUpdate.id_producto,
                    precio: parseFloat(productToUpdate.precio),
                    stock: parseInt(productToUpdate.stock),
                }),
            });
    
            if (response.ok) {
                alert('Producto actualizado exitosamente');
                setProducts((prevProducts) =>
                    prevProducts.map((product) =>
                        product.id_producto === productToUpdate.id_producto
                            ? { ...product, precio: productToUpdate.precio, stock: productToUpdate.stock }
                            : product
                    )
                );
                setUpdateModalVisible(false);
                setProductUpdated(true);
            } else {
                const textError = await response.text();
                console.error('Error al actualizar producto:', textError);
                alert(`Error: ${textError}`);
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Ocurrió un error al conectar con el servidor.');
        }
    };

    const handleDeleteProduct = async (id_producto) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado.');
            return;
        }
    
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este producto?");
        if (!confirmDelete) return;
    
        try {
            const response = await fetch('http://138.197.240.72.nip.io/proveedores/eliminarproducto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id_producto }),
            });
    
            if (response.ok) {
                alert('Producto eliminado exitosamente');
                setProducts((prevProducts) =>
                    prevProducts.filter((product) => product.id_producto !== id_producto)
                );
            } else {
                const textError = await response.text();
                console.error('Error al eliminar producto:', textError);
                alert(`Error: ${textError}`);
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Ocurrió un error al conectar con el servidor.');
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = reader.result.split(',')[1]; // Separa la cabecera del contenido Base64
                setImageBase64(img); // Actualiza el estado con la imagen
                console.log(imageBase64);
            };
            reader.readAsDataURL(file); // Convierte el archivo a Base64
        } else {
            console.error("No se seleccionó un archivo.");
        }
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

            <div className="button-container">
                <button className="action-button" onClick={() => setShowCreateModal(true)}>Crear producto</button>
                <button className="action-button">Cargar productos</button>
            </div>

            <div className="product-table-container">
                <table className="product-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th>Categoría</th>
                            <th>Etiqueta</th>
                            <th>No. Grupo</th>
                            <th>Actualizar</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id_producto || '1001'}
                            value={product.id_producto || '1001'}>
                            <td>{product.nombre_producto || 'N/A'}</td>
                            <td>${product.precio || '0.00'}</td>
                            <td>{product.stock || '0'}</td>
                            <td>{product.categoria || 'Sin categoría'}</td>
                            <td>{product.id_proveedor || 'Propio'}</td>
                            <td>{product.no_grupo || 18}</td>
                            <td>
                                <button
                                    className="update-button"
                                    onClick={() => openUpdateModal(product)}
                                >
                                    Actualizar
                                </button>
                            </td>
                            <td>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDeleteProduct(product.id_producto)}
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Crear Producto</h2>
                        <form>
                            <div className="form-field">
                                <input
                                    type="file"
                                    id="upload-img"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <label>Nombre del producto</label>
                                <input
                                    type="text"
                                    name="nombre_producto"
                                    value={newProduct.nombre_producto}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-field">
                                <label>Precio</label>
                                <input
                                    type="number"
                                    name="precio"
                                    value={newProduct.precio}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-field">
                                <label>Cantidad</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={parseFloat(newProduct.stock)}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-field">
                                <label>Categoría</label>
                                <input
                                    type="text"
                                    name="categoria"
                                    value={newProduct.categoria}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <button
                                type="button"
                                className="save-button"
                                onClick={handleCreateProduct}
                            >
                                Guardar
                            </button>
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={closeModal}
                            >
                                Cancelar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {updateModalVisible && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Actualizar Producto</h2>
                        <form>
                            <div className="form-field">
                                <label>Precio</label>
                                <input
                                    type="number"
                                    name="precio"
                                    value={productToUpdate.precio}
                                    onChange={handleUpdateInputChange}
                                />
                            </div>
                            <div className="form-field">
                                <label>Stock</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={productToUpdate.stock}
                                    onChange={handleUpdateInputChange}
                                />
                            </div>
                            <button
                                type="button"
                                className="save-button"
                                onClick={handleUpdateProduct}
                            >
                                Actualizar
                            </button>
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => setUpdateModalVisible(false)}
                            >
                                Cancelar
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default HomeProveedor;
