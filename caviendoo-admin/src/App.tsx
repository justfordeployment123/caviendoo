import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FruitList from './pages/FruitList';
import FruitEdit from './pages/FruitEdit';
import GovernorateList from './pages/GovernorateList';
import GovernorateEdit from './pages/GovernorateEdit';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fruits" element={<FruitList />} />
          <Route path="/fruits/new" element={<FruitEdit />} />
          <Route path="/fruits/:id" element={<FruitEdit />} />
          <Route path="/governorates" element={<GovernorateList />} />
          <Route path="/governorates/:id" element={<GovernorateEdit />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
