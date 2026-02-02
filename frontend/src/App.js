import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import ProductDetailPage from './components/ProductDetailPage';
import AddProductPage from './components/AddProductPage';
import AdminProductsPage from './components/AdminProductsPage';
import AddSellerPage from './components/AddSellerPage';
import ManageSellersPage from './components/ManageSellersPage';
import ProductOrderedReport from './components/ProductOrderedReport';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ProfilePage from './components/ProfilePage';
import AdminKycPage from './components/AdminKycPage';
import OrderHistoryPage from './components/OrderHistoryPage';
import MyNetworkPage from './components/MyNetworkPage';
import SellerOrdersPage from './components/SellerOrdersPage';
import MyPointsPage from './components/MyPointsPage';
import AdminPointsReportPage from './components/AdminPointsReportPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/add-product" element={<AddProductPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/add-seller" element={<AddSellerPage />} />
          <Route path="/admin/sellers" element={<ManageSellersPage />} />
          <Route path="/admin/reports/orders" element={<ProductOrderedReport />} />
          <Route path="/admin/kyc" element={<AdminKycPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-orders" element={<OrderHistoryPage />} />
          <Route path="/my-network" element={<MyNetworkPage />} />
          <Route path="/my-points" element={<MyPointsPage />} />
          <Route path="/seller/orders" element={<SellerOrdersPage />} />
          <Route path="/admin/reports/points" element={<AdminPointsReportPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route element={<ProtectedRoute />}> {/* Protected Routes go here */}
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
