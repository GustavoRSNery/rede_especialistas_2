import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// =========================================================
// Lazy Loading obrigatório (PDD): cada página só é
// baixada quando o usuário navegar até ela.
// =========================================================
const HomePage = lazy(() => import('./pages/HomePage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const QuadroPage = lazy(() => import('./pages/QuadroPage'));

function LoadingFallback() {
  return (
    <div className="spinner-wrapper">
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quadro/:quadroId" element={<BoardPage />} />
          <Route path="/kanban" element={<QuadroPage />} />
          {/* Rota não encontrada redireciona para home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
