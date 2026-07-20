import { useEffect, useState } from 'react';
import { FiUsers, FiPackage, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND}/admin/stats`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Error cargando estadísticas');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const safeStats = stats || {
    totalUsers: 0,
    totalProducts: 0,
    totalValue: 0,
    avgPrice: 0,
    productsByCategory: {},
    topSellers: [],
    usersByRole: {},
  };

  const animUsers = Number(safeStats.totalUsers) || 0;
  const animProducts = Number(safeStats.totalProducts) || 0;
  const animValue = Number(parseFloat(safeStats.totalValue) || 0);
  const animAvg = Number(parseFloat(safeStats.avgPrice) || 0);

  const formatCurrency = (value, digits = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
  }).format(value);

  if (loading) return <div className="p-6">Cargando métricas...</div>;
  if (!stats) return <div className="p-6">No hay métricas disponibles.</div>;

  const cards = [
  { id: 'users', title: 'Usuarios registrados', value: animUsers.toLocaleString('es-ES'), icon: <FiUsers className="w-6 h-6 text-[#0f766e]" />, bg: 'bg-teal-50' },
  { id: 'products', title: 'Publicaciones activas', value: animProducts.toLocaleString('es-ES'), icon: <FiPackage className="w-6 h-6 text-[#ea580c]" />, bg: 'bg-orange-50' },
  { id: 'value', title: 'Valor del catálogo', value: formatCurrency(animValue), icon: <FiDollarSign className="w-6 h-6 text-[#2563eb]" />, bg: 'bg-blue-50' },
  { id: 'avg', title: 'Precio promedio', value: formatCurrency(animAvg, 2), icon: <FiTrendingUp className="w-6 h-6 text-[#7c3aed]" />, bg: 'bg-violet-50' },
  ];

  const categoryEntries = Object.entries(safeStats.productsByCategory || {}).map(([category, count], index) => ({
    category,
    count,
    color: ['#0f7dfa', '#f97316', '#0ea5e9', '#9333ea', '#22c55e', '#facc15', '#fb7185'][index % 7],
  }));

  const categoryLabels = categoryEntries.map((item) => item.category);
  const categoryData = categoryEntries.map((item) => item.count);
  const palette = categoryEntries.map((item) => item.color);

  const topSellers = Array.isArray(safeStats.topSellers) ? safeStats.topSellers : [];
  const formattedSellers = topSellers.slice(0, 5).map((seller, index) => ({
    rank: index + 1,
    label: seller.sellerName || `Vendedor ${index + 1}`,
    id: seller.sellerId || `seller-${index + 1}`,
    products: seller.productCount,
    subtitle:
      seller.sellerName && seller.sellerName !== 'unknown'
        ? seller.sellerId !== 'unknown'
          ? seller.sellerId
          : null
        : null,
  }));
  const usersByRole = safeStats.usersByRole || {};

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Estadísticas Administrativas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.id} className="p-5 bg-white rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.04)] border border-slate-100 flex items-center gap-4 hover:shadow-[0_20px_60px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-300">
            <div className={`p-3 rounded-2xl ${c.bg}`}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-1">{c.title}</p>
              <p className="text-3xl font-medium text-slate-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Resumen</h3>
            <p className="text-sm text-slate-500">Visión rápida de la actividad del portal.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Distribución por categoría</p>
                <p className="text-xs text-slate-400">Comparación de los emprendimientos publicados.</p>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                Total: {stats.totalProducts || 0}
              </div>
            </div>

            <div className="w-full min-h-[320px]">
              <Doughnut
                data={{
                  labels: categoryLabels,
                  datasets: [
                    {
                      data: categoryData,
                      backgroundColor: categoryLabels.map((_, i) => palette[i % palette.length]),
                      borderColor: '#ffffff',
                      borderWidth: 2,
                      hoverOffset: 14,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '64%',
                  layout: { padding: 12 },
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 16,
                        color: '#334155',
                        usePointStyle: true,
                        pointStyle: 'circle',
                      },
                    },
                    tooltip: {
                      padding: 12,
                      bodySpacing: 10,
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed || 0;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0) || 1;
                          const pct = ((value / total) * 100).toFixed(1);
                          return `${context.label}: ${value} (${pct}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {categoryEntries.map((item) => (
                <div key={item.category} className="flex items-center gap-3 rounded-3xl bg-white/90 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] ring-1 ring-slate-200">
                  <span className="inline-flex h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.category}</p>
                    <p className="text-xs text-slate-500">{item.count} publicación{item.count === 1 ? '' : 'es'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold text-slate-800">Top vendedores</p>
                <p className="text-xs text-slate-400">Más emprendimientos activos.</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              {formattedSellers.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-400">No hay datos</div>
              ) : (
                formattedSellers.map((seller) => {
                    const medalColors = ['text-amber-500', 'text-slate-400', 'text-orange-700'];
                  const isTop3 = seller.rank <= 3;
                  return (
                  <div
                  key={seller.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                    seller.rank === 1
                    ? 'border-amber-200 bg-amber-50/60'
                    : 'border-slate-200 bg-slate-50'
                  }`}
                  >
                    <div className="w-9 h-9 shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      {seller.rank === 1 ? (
                        <FaTrophy className={`w-4 h-4 ${medalColors[0]}`} />
                      ) : isTop3 ? (
                      <FaMedal className={`w-4 h-4 ${medalColors[seller.rank - 1]}`} />
                    ) : (
                    <span className="text-sm font-bold text-slate-700">#{seller.rank}</span>
                    )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{seller.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{seller.products} producto{seller.products === 1 ? '' : 's'}</p>
                    </div>
                  
                  </div>
                  );
                })
                )}
              </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Usuarios por rol</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
                {Object.keys(usersByRole).length === 0 ? (
                  <div className="col-span-3 text-slate-400">Sin datos</div>
                ) : (
                  Object.entries(usersByRole).map(([role, count]) => (
                    <div key={role} className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="text-xs text-slate-500 capitalize">{role}</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{count}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}