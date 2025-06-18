'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Upload,
  History,
  Download
} from 'lucide-react';
import { authService } from '../../lib/services/authService';

interface UserStats {
  documents_count: number;
  comparisons_count: number;
  reports_count: number;
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    documents_count: 0,
    comparisons_count: 0,
    reports_count: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const loadUserStats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingStats(true);
      const userStats = await authService.getUserStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user, loadUserStats]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error al cerrar sesión. Inténtalo de nuevo.');
    }
  };

  const handleUploadDocuments = () => {
    // Navigate to main page with focus on uploading documents
    router.push('/?focus=upload');
  };

  const handleNewComparison = () => {
    // Navigate to comparison page
    router.push('/');
  };

  const handleViewHistory = () => {
    // Navigate to main page with sidebar open on history tab
    router.push('/?sidebar=history');
  };

  const handleViewReports = () => {
    // Navigate to main page with sidebar open on reports tab
    router.push('/?sidebar=reports');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Doc Comparison
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user.name}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {user.planType === 'free' ? 'Gratis' : 'Premium'}
                </span>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {user.name}!
          </h2>
          <p className="text-gray-600">
            Gestiona tus documentos legislativos y análisis de comparación desde aquí.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleUploadDocuments}>
            <CardContent className="p-6 text-center">
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Subir Documentos
              </h3>
              <p className="text-gray-600 text-sm">
                Cargar nuevos documentos para análisis
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleNewComparison}>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nueva Comparación
              </h3>
              <p className="text-gray-600 text-sm">
                Comparar dos documentos legislativos
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewHistory}>
            <CardContent className="p-6 text-center">
              <History className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Historial
              </h3>
              <p className="text-gray-600 text-sm">
                Ver comparaciones anteriores
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewReports}>
            <CardContent className="p-6 text-center">
              <Download className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reportes
              </h3>
              <p className="text-gray-600 text-sm">
                Descargar reportes generados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? '...' : stats.documents_count}
                  </p>
                  <p className="text-gray-600">Documentos Subidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? '...' : stats.comparisons_count}
                  </p>
                  <p className="text-gray-600">Comparaciones Realizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Download className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? '...' : stats.reports_count}
                  </p>
                  <p className="text-gray-600">Reportes Generados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actividad Reciente
            </h3>
            <div className="text-center py-8">
              <p className="text-gray-500">
                {stats.documents_count === 0 
                  ? "No hay actividad reciente. ¡Comienza subiendo tu primer documento!"
                  : "Cargando actividad reciente..."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 