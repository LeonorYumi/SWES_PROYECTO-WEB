import { Link } from 'react-router-dom';
import { useRef,useEffect, useState } from 'react';
import logoSwes from '../assets/icono_sistema.png';
import { getAll } from '../services/crudService';
import { IconIdBadge, IconSearch, IconChartBar, IconUsers, IconBrandWhatsapp, IconBrandFacebook, IconBrandInstagram, IconMail, IconPhone, IconMapPin, IconBrandTiktok, IconBrandLinkedin } from '@tabler/icons-react';
import fondoCompras from '../assets/imagen_landing.png';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

function Landing() {
  const [emprendimientos, setEmprendimientos] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const carruselItems = emprendimientos.length > 0 ? [...emprendimientos, ...emprendimientos] : [];

  const features = [
    { Icon: IconIdBadge,  color: 'bg-violet-50 text-violet-700', title: 'Perfil de emprendimiento', desc: 'Crea y personaliza tu perfil de negocio' },
    { Icon: IconSearch,   color: 'bg-teal-50 text-teal-700',     title: 'Descubrimiento fácil',      desc: 'Explora y filtra emprendimientos por categoría.' },
    { Icon: IconChartBar, color: 'bg-amber-50 text-amber-700',   title: 'Panel de estadísticas',     desc: 'Visualiza como admistrador las métricas de los emprendimientos.' },
    
  ];

  useEffect(() => {
    const cargarEmprendimientos = async () => {
      try {
        const data = await getAll('products');
        setEmprendimientos(data || []);
      } catch (error) {
        console.error(error);
      }
    };
    cargarEmprendimientos();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-brand-primary selection:text-white antialiased">

      {/* HEADER */}
      <header className="bg-neutral-surface border-b border-neutral-border min-h-16 flex items-center px-4 md:px-8 py-3 relative z-50">
        <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between gap-2">
          
          {/* Logo */}
          
          <Link to="/" className="flex items-center gap-2 select-none shrink-0">
          <img src={logoSwes} alt="SWES" className="w-7 h-7 object-contain" />
          <span className="font-bold text-neutral-text text-lg sm:text-xl">SWES</span>
          <span className="font-bold text-brand-primary text-lg sm:text-xl">EPN</span>
          </Link>
          
          {/* Acciones - Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
            to="/login"
            className="px-4 py-1.5 rounded-input text-sm font-semibold text-neutral-subtle hover:text-neutral-text hover:bg-neutral-bg transition-all whitespace-nowrap"
            >
              Iniciar sesión
            </Link>
    
            <Link
            to="/register"
            className="px-4 py-1.5 rounded-input text-sm font-semibold bg-brand-primary text-white hover:bg-brand-hover transition-all whitespace-nowrap"
            >
              Registrarse
            </Link>
          </div>
          
          {/* Acciones - Mobile: CTA principal + hamburguesa */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
            to="/register"
            className="px-3 py-1.5 rounded-input text-xs font-semibold bg-brand-primary text-white hover:bg-brand-hover transition-all whitespace-nowrap"
            >
              Registrarse
            </Link>
            
            <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-input text-neutral-subtle hover:text-neutral-text hover:bg-neutral-bg transition-colors"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Panel del menu movil */}
        {menuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 mt-1 mx-2 bg-white border border-neutral-border rounded-xl shadow-xl z-50 overflow-hidden">
            <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-3 text-sm font-semibold text-neutral-subtle hover:bg-neutral-bg hover:text-neutral-text transition-all"
            >
              Iniciar sesión
            </Link>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 pt-8 md:pt-14">
        
        {/* HERO: Texto izquierda + Imagen derecha */}
        
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16 lg:min-h-[420px]">
          
          {/* TEXTO */}
          <div className="flex flex-col items-start text-left lg:pl-12">
            <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-slate-900 mb-6"
            >Impulsa tu negocio y conecta con la <span className="text-brand-primary">comunidad universitaria</span>
            </motion.h1>
            
            {/* BOTONES */}

            <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-10"
            >
              <Link
                to="/register"
                className="rounded-full bg-brand-primary px-7 py-3.5 text-sm font-bold text-white hover:bg-brand-hover hover:shadow-lg hover:shadow-brand-primary/20 transition-all text-center"
              >
                Publicar mi emprendimiento
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all text-center"
              >
                Explorar emprendimientos
              </Link>
            
            </motion.div>
          </div>

          {/* IMAGEN */}
          <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="hidden lg:flex items-center justify-center"
          >
          <img
          src={fondoCompras}
          alt="Fondo SWES"
          className="max-w-full max-h-[420px] object-contain floating"
          />
          </motion.div>

        </section>

        <section className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {/* ROLES: ¿Quién puede usar SWES? */}

          <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200"
          >
            <h3 className="font-bold text-slate-900 text-xl mb-5 pb-3 border-b border-slate-100">¿Quién puede usar SWES?</h3>
            
            <div className="space-y-7">
              {[
                { Icon: IconUsers, role: 'Visitante', desc: 'Explora y contacta emprendimientos.', color: 'bg-slate-50 text-slate-600' },
                { Icon: IconIdBadge, role: 'Emprendedor', desc: 'Publica y gestiona tu negocio.', color: 'bg-blue-50 text-blue-600' },
                { Icon: IconChartBar, role: 'Administrador', desc: 'Controla y modera la plataforma.', color: 'bg-violet-50 text-violet-700' },].map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${r.color}`}>
                    <r.Icon size={18} stroke={1.75} aria-hidden="true" />
                  </div>
                  
                  <div>
                    <p className="font-semibold text-slate-900 text-md">{r.role}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* FAQ */}
          
          <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <h3 className="font-bold text-slate-900 text-xl mb-5 pb-3 border-b border-slate-100">Preguntas Frecuentes</h3>
            <div className="space-y-3">
              
              {[
                { q: '¿La plataforma tiene algún costo?', a: 'No, SWES es gratuito para la comunidad universitaria.' },
                { q: '¿Cómo se coordinan pagos y entregas?', a: 'Te contactas directamente con el vendedor vía WhatsApp.' },
                { q: '¿Necesito correo institucional?', a: 'No es obligatorio, el sistema adapta los accesos según tu rol.' },
              
              ].map((faq, i) => {
                const [open, setOpen] = useState(false);
                return (
                
                <div key={i} className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100'}`}>
                  
                  <button
                  onClick={() => setOpen(!open)}
                  className="w-full flex items-center justify-between gap-2 p-3 text-left"
                  >
                    <span className="text-md font-semibold text-slate-900">{faq.q}</span>
                    <span className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180 text-blue-500' : ''}`}>▾</span>
                  </button>
                  
                  {open && (
                    <div className="px-3 pb-3">
                      <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                    </div>
                  )}

                </div>
                );})}
            </div>
            
          </motion.div>

          {/* CAMPAIGN: Funcionalidades destacadas */}
          <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200"
          >
            <h3 className="font-bold text-slate-900 text-xl mb-5 pb-3 border-b border-slate-100">Lo que ofrece SWES</h3>
            
            <div className="space-y-7">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${f.color}`}>
                    <f.Icon size={18} stroke={1.75} aria-hidden="true" />
                    
                  </div>
                  
                  <div>
                   <p className="font-semibold text-slate-900 text-md">{f.title}</p>
                   <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
        </section>

        
        {/* EMPRENDIMIENTOS DESTACADOS */}
        <section className="py-8 md:py-10 border-t border-slate-200/60 mb-5">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-primary tracking-tight">
              Emprendimientos destacados
            </h2>
            <p className="text-md sm:text-sm text-slate-600 mt-4 font-semibold">
              Descubre los proyectos más populares de nuestra comunidad universitaria
            </p>
          </div>

          {/* Lista de Emprendimientos */}
          {emprendimientos.length > 0 && (
  <div className="relative max-w-6xl mx-auto px-4 overflow-hidden">
    {/* Fades en los bordes para que no se corte feo */}
    <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50/50 to-transparent z-10"></div>
    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50/50 to-transparent z-10"></div>

    <div className="carousel-track flex gap-6 w-max">
      {carruselItems.map((emp, i) => (
        <Link
          key={`${emp.id}-${i}`}
          to="/login"
          className="group shrink-0 w-[280px] sm:w-[320px] rounded-2xl border border-slate-200/80 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-primary/10"
        >
        <div className="relative w-full h-48 bg-gradient-to-br from-brand-primary/5 to-brand-accent/5 overflow-hidden">
  {emp.image ? (
    <img
      src={emp.image}
      alt={emp.name}
      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-50">📦</div>
  )}
</div>

<div className="p-5">
  {emp.category && (
    <span className="inline-block mb-2 text-xs font-bold uppercase tracking-wide text-brand-primary/70">
      {emp.category}
    </span>
  )}

  <div className="flex items-center justify-between gap-3">
    <h3 className="font-bold text-slate-900 text-xl line-clamp-1 group-hover:text-brand-primary transition-colors duration-200">
      {emp.name}
    </h3>
    {emp.price && (
  <span className="shrink-0 text-brand-primary font-bold text-2xl">
    ${Number(emp.price).toFixed(2)}
  </span>
)}
  </div>

  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-brand-primary transition-colors">
    <span>Explorar</span>
    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
  </div>
</div>
        </Link>
      ))}
    </div>
  </div>
)}
        </section>

        {/* SEGUNDA LLAMADA A LA ACCIÓN */}
        <section className="relative overflow-hidden py-14 md:py-20 rounded-3xl bg-gradient-to-br from-brand-primary to-blue-800 px-6 md:px-12 mb-5">
  {/* Blobs decorativos de fondo */}
  <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
  <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none"></div>

  <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
    <div className="text-center md:text-left">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
        ¿Listo para impulsar tu emprendimiento?
      </h2>
      <p className="text-sm sm:text-base text-blue-100">
        Únete a cientos de emprendedores que ya usan SWES para crecer.
      </p>
    </div>

    <Link
      to="/register"
      className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-7 md:px-8 py-3 md:py-3.5 text-sm font-bold text-brand-primary shadow-lg transition-all hover:shadow-xl hover:scale-105 whitespace-nowrap"
    >
      Comenzar gratis
      <span className="transition-transform group-hover:translate-x-1">→</span>
    </Link>
  </div>
</section>
      </main>

      <footer className="relative overflow-hidden bg-slate-900 text-white">
        <img
  src={logoSwes}
  alt=""
  aria-hidden="true"
  className="pointer-events-none select-none absolute -right-6 -bottom-8 w-56 h-56 md:w-72 md:h-72 object-contain opacity-20 brightness-0 invert"
/>
  <div className="relative z-10 mx-auto max-w-screen-2xl px-6 md:px-10 py-12">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

      {/* LOGO + CONTACTO */}
      <div className="md:col-span-1">
        <div className="flex items-center gap-2 mb-5">
          <span className="font-bold text-white text-xl">SWES</span>
          <span className="font-bold text-white text-xl">EPN</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-sm text-slate-300">
            <IconMail size={16} stroke={1.75} />
            <span>swes@epn.edu.ec</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-300">
            <IconPhone size={16} stroke={1.75} />
            <span>(+593) 2 2976 300</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-300">
            <IconMapPin size={16} stroke={1.75} />
            <span>Av. Ladrón de Guevara E11-253</span>
          </div>
        </div>
      </div>

      {/* PLATAFORMA */}
      <div>
        <h4 className="font-bold text-lg mb-4 text-white">Plataforma</h4>
        <div className="space-y-3">
          <Link to="/register" className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white transition-colors">
            <IconIdBadge size={16} stroke={1.75} />
            Publicar emprendimiento
          </Link>
          <Link to="/login" className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white transition-colors">
            <IconSearch size={16} stroke={1.75} />
            Explorar emprendimientos
          </Link>
          <Link to="/login" className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white transition-colors">
            <IconChartBar size={16} stroke={1.75} />
            Panel de estadísticas
          </Link>
        </div>
      </div>

      {/* SOPORTE */}
      <div>
        <h4 className="font-bold text-lg mb-4 text-white">Soporte</h4>
        <div className="space-y-3">
          <a href="#" className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white transition-colors">
            <IconUsers size={16} stroke={1.75} />
            Preguntas frecuentes
          </a>
          <a href="https://wa.me/593" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white transition-colors">
            <IconBrandWhatsapp size={16} stroke={1.75} />
            Contacto vía WhatsApp
          </a>
        </div>
      </div>

      {/* REDES SOCIALES */}
      <div>
        <h4 className="font-bold text-lg mb-4 text-white">Redes sociales</h4>
        <div className="flex items-center gap-3">
          <a href="#" aria-label="Facebook" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <IconBrandFacebook size={18} stroke={1.75} />
          </a>
          <a href="#" aria-label="Instagram" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <IconBrandInstagram size={18} stroke={1.75} />
          </a>
          <a href="#" aria-label="LinkedIn" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <IconBrandLinkedin size={18} stroke={1.75} />
          </a>
          <a href="#" aria-label="TikTok" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <IconBrandTiktok size={18} stroke={1.75} />
          </a>
        </div>
      </div>

    </div>

    {/* LÍNEA INFERIOR */}
    <div className="mt-10 pt-6  flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-slate-400">© 2026 SWES - Sistema de Gestión de Emprendimientos Estudiantiles</p>
    </div>
  </div>
</footer>
    </div>
  );
}

export default Landing;
