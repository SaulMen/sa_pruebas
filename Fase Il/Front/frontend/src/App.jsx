import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from "./views/login"
import Register from './views/register';
import Home from './views/home';
import Perfil from './views/perfil';
import HomeProveedor from './views/homeProveedor';
import Carrito from './views/carrito';
import Ventas from './views/ventas';
import Admin from './views/admin';
import AdminDev from './views/adminDev';
import AdminCup from './views/adminCup';
import AdminMon from './views/adminMon';
import AdminApi from './views/adminApi';
import Devolucion from './views/devolucion';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/homeProveedor" element={<HomeProveedor />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/devolucion" element={<Devolucion />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/devoluciones" element={<AdminDev />} />
        <Route path="/admin/cupones" element={<AdminCup />} />
        <Route path="/admin/moneda" element={<AdminMon />} />
        <Route path="/admin/api" element={<AdminApi />} />
      </Routes>
    </Router>
  );
}

export default App;

