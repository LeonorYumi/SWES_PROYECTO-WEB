const express = require("express");
const { supabaseAdmin } = require("../supabase");
const crypto = require('crypto');
const { createOrUpdateUserProfile } = require('../utils/authHelpers');
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/products", async (req, res) => {
  try {
    // Incluir explícitamente user_id
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, name, description, price, image, user_id, category, sellername, sellerphone, created_at, updated_at, users(id, email, nombre, phone)");

    if (error) {
      console.error("Error al obtener productos:", error);
      return res.status(500).json({ message: "Error al obtener productos", detail: error.message });
    }

    // Mapear campos para compatibilidad con frontend (sellerPhone/sellerName)
    // Mapear campos priorizando la relación real de la tabla de usuarios
const mapped = (data || []).map((p) => ({
  ...p,
  // Primero intentamos sacar el teléfono de la relación; si no tiene perfil, usamos el respaldo
  sellerPhone: p.users?.phone || p.sellerphone || p.sellerPhone || p.seller_phone || null,
  // ✅ CORRECCIÓN CRÍTICA: Asegurar que el user_id sea el del perfil real si existe, para consistencia.
  user_id: p.users?.id || p.user_id,
  // Primero intentamos usar el nombre real del usuario; si no, el email del usuario; si no, el string de respaldo
  sellerName: p.users?.nombre || p.users?.email || p.sellername || p.sellerName || p.seller_name || 'Anónimo',
}));

    console.log('Productos devueltos:', mapped.length, '| Primer producto:', mapped[0] || 'ninguno');

    res.json(mapped);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

router.get("/products/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📊 GET /products/user/${userId}`);
    console.log('   Token presente:', !!req.headers.authorization);
    console.log('   Usuario del token:', req.user?.email);
    console.log('   UID solicitado:', userId);

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, users(id, email, nombre, phone)")
      .eq("user_id", userId);
    
    if (error) {
      console.error('❌ Error Supabase:', error);
      throw error;
    }
    
    console.log('✅ Productos encontrados:', data?.length || 0);
    
    const mapped = (data || []).map((p) => ({
      ...p,
      sellerPhone: p.sellerphone || p.sellerPhone || p.seller_phone || p.users?.phone || null,
      sellerName: p.sellername || p.sellerName || p.seller_name || p.users?.nombre || p.users?.email || null,
    }));
    res.json(mapped);
  } catch (error) {
    console.error("❌ Error al obtener productos por usuario:", error);
    res.status(500).json({ message: "Error al obtener productos del usuario", detail: error.message });
  }
});

const ensureProductOwnerOrAdmin = async (productId, reqUser) => {
  const { data: existing, error: fetchError } = await supabaseAdmin.from("products").select("user_id").eq("id", productId).single();
  if (fetchError || !existing) return false;
  if (reqUser.role === "administrador") return true;
  if (existing.user_id === reqUser.uid) return true;

  const tokenEmail = (reqUser.email || "").toLowerCase().trim();
  if (!tokenEmail) return false;

  const { data: profileRef } = await supabaseAdmin.from('users').select('email').eq('id', existing.user_id).maybeSingle();
  if (profileRef?.email?.toLowerCase().trim() === tokenEmail) {
    return true;
  }

  const { data: profileByEmail } = await supabaseAdmin.from('users').select('id,email').eq('email', tokenEmail).maybeSingle();
  return profileByEmail?.id === existing.user_id;
};

router.get('/products/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('product_images')
      .select('id,product_id,image_url,created_at')
      .eq('product_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error cargando imágenes de producto:', error);
      return res.status(500).json({ message: 'Error al cargar imágenes de producto' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error cargando imágenes de producto:', error);
    res.status(500).json({ message: 'Error al cargar imágenes de producto' });
  }
});

router.post('/products/:id/images', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { images, primaryImageUrl } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Se requieren imágenes para guardar la galería.' });
    }

    const allowed = await ensureProductOwnerOrAdmin(id, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'No tienes permiso para agregar imágenes a este producto' });
    }

    const rows = images.map((image) => ({
      product_id: id,
      image_url: image.image_url || image.url,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabaseAdmin.from('product_images').insert(rows).select();
    if (error) {
      console.error('Error guardando imágenes de producto:', error);
      return res.status(500).json({ message: 'Error al guardar imágenes de producto' });
    }

    const productImageToSet = primaryImageUrl || rows[0]?.image_url;
    if (productImageToSet) {
      const { data: existingProduct, error: existingError } = await supabaseAdmin
        .from('products')
        .select('image')
        .eq('id', id)
        .single();

      if (!existingError && existingProduct) {
        const shouldUpdateProductImage = !!primaryImageUrl || !existingProduct.image;
        if (shouldUpdateProductImage) {
          const { error: updateError } = await supabaseAdmin
            .from('products')
            .update({ image: productImageToSet, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (updateError) {
            console.warn('No se pudo actualizar la imagen principal del producto:', updateError.message || updateError);
          }
        }
      }
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error guardando imágenes de producto:', error);
    res.status(500).json({ message: 'Error al guardar imágenes de producto' });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, users(id, email, nombre, phone)")
      .eq("id", id)
      .single();

    if (error || !data) return res.status(404).json({ message: "Producto no encontrado" });

    // Corrección aquí: Usamos 'data' en lugar de 'p'
    const mappedProduct = {
      ...data,
      sellerPhone: data.users?.phone || data.sellerphone || data.sellerPhone || data.seller_phone || null,
      sellerName: data.users?.nombre || data.users?.email || data.sellername || data.sellerName || data.seller_name || 'Anónimo',
    };

    res.json(mappedProduct);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ message: "Error al obtener producto" });
  }
});

router.post("/products", verifyToken, authorizeRoles("emprendedor", "administrador"), async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Asegurar que exista un perfil en la tabla users para el uid (evita FK violation)
    let mappedUserId = req.user.uid;
    try {
      const { data: existingProfile } = await supabaseAdmin.from('users').select('id,email').eq('id', req.user.uid).maybeSingle();
      if (!existingProfile) {
        // intentar crear o recuperar perfil
        const { error: profileErr, profile } = await createOrUpdateUserProfile(
          req.user.uid,
          req.user.email || '',
          req.user.email || '',
          req.user.role || 'visitante',
          ''
        );

        if (profileErr) {
          console.warn('Error creando perfil desde product route:', profileErr.message || profileErr);
        }

        // Si encontramos un perfil existente con distinto id (por unique email), usaremos ese id
        if (profile && profile.id && profile.id !== req.user.uid) {
          console.log('Mapping product.user_id from token uid to existing profile id:', req.user.uid, '->', profile.id);
          mappedUserId = profile.id;
        }
      }
    } catch (syncErr) {
      console.warn('No se pudo asegurar perfil de usuario antes de crear producto:', syncErr.message || syncErr);
    }

    const product = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price ? Number(req.body.price) : 0,
      image: req.body.image || null,
      sellername: req.body.sellerName || req.body.sellername || req.body.seller_name || null,
      sellerphone: req.body.sellerPhone || req.body.sellerphone || req.body.seller_phone || null,
      user_id: mappedUserId,
      created_at: new Date().toISOString(),
    };
    // Some DB schemas require a non-null id default. Ensure an id is present.
    if (!product.id) product.id = crypto.randomUUID();
    const { data, error } = await supabaseAdmin.from("products").insert(product).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Error al crear producto:", JSON.stringify(error, null, 2));
    const message = error?.message || error?.msg || "Error al crear producto";
    res.status(500).json({ message: "Error al crear producto", detail: message, error });
  }
});

router.put("/products/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ message: "Producto no encontrado" });

    // Determinar propiedad real teniendo en cuenta inconsistencia entre
    // auth.uid (token) y public.users.id (profile) cuando existen perfiles
    // con el mismo email pero distinto id.
    let isOwner = existing.user_id === req.user.uid;
    const isAdmin = req.user.role === "administrador";
    if (!isOwner) {
      try {
        // obtener email del profile referenciado por product.user_id
        const { data: profileRef } = await supabaseAdmin.from('users').select('id,email').eq('id', existing.user_id).maybeSingle();
        const tokenEmail = (req.user?.email || '').toLowerCase().trim();
        if (profileRef && profileRef.email && profileRef.email.toLowerCase().trim() === tokenEmail) {
          console.log('Ownership matched by email: token -> product.user_id', tokenEmail, existing.user_id);
          isOwner = true;
        } else {
          // también verificar si el token uid corresponde a otro profile id por email
          const { data: profileByEmail } = await supabaseAdmin.from('users').select('id,email').eq('email', tokenEmail).maybeSingle();
          if (profileByEmail && profileByEmail.id && profileByEmail.id === existing.user_id) {
            console.log('Ownership matched by mapping token uid -> existing profile id for product:', req.user.uid, '->', existing.user_id);
            isOwner = true;
          }
        }
      } catch (mapErr) {
        console.warn('Error comprobando propiedad de producto por email mapping:', mapErr.message || mapErr);
      }
    }
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para actualizar este producto" });
    }

    const updates = {
      ...(req.body.name !== undefined ? { name: req.body.name } : {}),
      ...(req.body.description !== undefined ? { description: req.body.description } : {}),
      ...(req.body.category !== undefined ? { category: req.body.category } : {}),
      ...(req.body.price !== undefined ? { price: Number(req.body.price) } : {}),
      ...(req.body.image !== undefined ? { image: req.body.image } : {}),
      ...(req.body.sellerName !== undefined || req.body.sellername !== undefined || req.body.seller_name !== undefined
        ? { sellername: req.body.sellerName || req.body.sellername || req.body.seller_name || null }
        : {}),
      ...(req.body.sellerPhone !== undefined || req.body.sellerphone !== undefined || req.body.seller_phone !== undefined
        ? { sellerphone: req.body.sellerPhone || req.body.sellerphone || req.body.seller_phone || null }
        : {}),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin.from("products").update(updates).eq("id", id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ message: "Error al actualizar producto", mensaje: "Error al actualizar producto" });
  }
});

router.delete("/products/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ message: "Producto no encontrado" });

    // Igual lógica que en PUT: permitir eliminar si el product.user_id
    // corresponde a un profile con el mismo email del token.
    let isOwner = existing.user_id === req.user.uid;
    const isAdmin = req.user.role === "administrador";
    if (!isOwner) {
      try {
        const { data: profileRef } = await supabaseAdmin.from('users').select('id,email').eq('id', existing.user_id).maybeSingle();
        const tokenEmail = (req.user?.email || '').toLowerCase().trim();
        if (profileRef && profileRef.email && profileRef.email.toLowerCase().trim() === tokenEmail) {
          isOwner = true;
        } else {
          const { data: profileByEmail } = await supabaseAdmin.from('users').select('id,email').eq('email', tokenEmail).maybeSingle();
          if (profileByEmail && profileByEmail.id && profileByEmail.id === existing.user_id) {
            isOwner = true;
          }
        }
      } catch (mapErr) {
        console.warn('Error comprobando propiedad de producto por email mapping (delete):', mapErr.message || mapErr);
      }
    }
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ message: "Error al eliminar producto" });
  }
});

router.get("/admin/stats", verifyToken, authorizeRoles("administrador"), async (req, res) => {
  try {
    const [{ count: totalProducts, error: totalError }, { data: products, error: productError }, { count: totalUsers, error: usersError }] = await Promise.all([
      supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("products").select("id,price,category,user_id, users(id,email,nombre)"),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
    ]);

    if (totalError || productError || usersError) {
      throw totalError || productError || usersError;
    }

    const totalValue = (products || []).reduce((sum, p) => sum + (Number(p.price) || 0), 0);

    // Productos por categoría
    const productsByCategory = {};
    (products || []).forEach((p) => {
      const cat = (p.category || 'Otros').toString();
      productsByCategory[cat] = (productsByCategory[cat] || 0) + 1;
    });

    // Top vendedores por número de productos
    const sellersCount = {};
    const sellerProfiles = {};
    (products || []).forEach((p) => {
      const seller = (p.user_id || 'unknown').toString();
      sellersCount[seller] = (sellersCount[seller] || 0) + 1;
      if (!sellerProfiles[seller]) {
        sellerProfiles[seller] = {
          name: p.users?.nombre || p.users?.email || null,
          email: p.users?.email || null,
        };
      }
    });
    const topSellers = Object.entries(sellersCount)
      .map(([id, count]) => ({
        sellerId: id,
        sellerName: sellerProfiles[id]?.name || null,
        productCount: count,
      }))
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 10);

    // Usuarios por rol
    const { data: usersData, error: usersDataErr } = await supabaseAdmin.from('users').select('id,role');
    const usersByRole = {};
    if (!usersDataErr && Array.isArray(usersData)) {
      usersData.forEach((u) => {
        const r = (u.role || 'visitante').toString();
        usersByRole[r] = (usersByRole[r] || 0) + 1;
      });
    }

    res.json({
      totalUsers: totalUsers || 0,
      totalProducts: totalProducts || 0,
      totalValue: totalValue.toFixed(2),
      avgPrice: ((products || []).length ? ((totalValue / (products || []).length).toFixed(2)) : '0.00'),
      productsByCategory,
      topSellers,
      usersByRole,
    });
  } catch (error) {
    console.error("Error al generar estadísticas de administrador:", error);
    res.status(500).json({ message: "Error interno al procesar las métricas" });
  }
});

module.exports = router;
