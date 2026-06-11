-- ============================================================
-- HobbyConnect — Seed: Sample activities for the map
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- (Requiere que el usuario admin exista)
-- ============================================================

DO $$
DECLARE
  admin_id uuid;
  cat_futbol uuid;
  cat_baloncesto uuid;
  cat_arte uuid;
  cat_musica uuid;
  cat_lectura uuid;
  cat_tenis uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@hobbyconnect.com';

  -- Get category IDs
  SELECT id INTO cat_futbol      FROM public.categories WHERE name = 'Fútbol';
  SELECT id INTO cat_baloncesto  FROM public.categories WHERE name = 'Baloncesto';
  SELECT id INTO cat_arte        FROM public.categories WHERE name = 'Arte';
  SELECT id INTO cat_musica      FROM public.categories WHERE name = 'Música';
  SELECT id INTO cat_lectura     FROM public.categories WHERE name = 'Lectura';
  SELECT id INTO cat_tenis       FROM public.categories WHERE name = 'Tenis';

  -- Insert activities
  INSERT INTO public.activities
    (creator_id, category_id, title, description, location_name, location_address, lat, lng, scheduled_at, max_participants, is_free, cost, status)
  VALUES
    (admin_id, cat_futbol,     'Partido de fútbol 5v5',         'Buscamos jugadores para un partido amistoso, todos los niveles bienvenidos.',   'Estadio Metropolitano',        'Cra. 46 #76-68, Barranquilla',   10.9278, -74.7965, now() + interval '2 days',    10, true,  null,  'open'),
    (admin_id, cat_baloncesto, 'Basketball tarde libre',        'Cancha al aire libre, trae tu balón si tienes.',                               'Parque Las Estrellas',         'Cll. 84, Barranquilla',          10.9900, -74.8150, now() + interval '3 days',    8,  true,  null,  'open'),
    (admin_id, cat_arte,       'Taller de pintura acuarela',    'Aprende técnicas básicas de acuarela. Materiales incluidos.',                  'Centro Cultural Barranquilla', 'Cra. 54 #52-258, Barranquilla', 10.9639, -74.7964, now() + interval '4 days',    12, false, 25000, 'open'),
    (admin_id, cat_musica,     'Jam session acústica',          'Sesión informal de música acústica, guitarras y voces bienvenidas.',           'Parque Tomás Suri Salcedo',    'Cll. 72 con Cra. 43, Barranquilla', 10.9831, -74.8040, now() + interval '5 days', 15, true,  null,  'open'),
    (admin_id, cat_lectura,    'Club de lectura — Gabo',        'Discutimos "Cien años de soledad". Lleva tu copia si tienes.',                 'Biblioteca Departamental',     'Cll. 40 #46-66, Barranquilla',  10.9451, -74.8063, now() + interval '6 days',    10, true,  null,  'open'),
    (admin_id, cat_tenis,      'Práctica de tenis dobles',      'Buscamos pareja para jugar dobles en cancha pública.',                        'Club Campestre Barranquilla',  'Cra. 58 #94-70, Barranquilla',  11.0020, -74.8210, now() + interval '7 days',    4,  true,  null,  'open'),
    (admin_id, cat_futbol,     'Torneo relámpago fútbol sala',  'Mini torneo de 4 equipos. Inscripción por equipo.',                           'Coliseo Hurtado',              'Cra. 41 #72-25, Barranquilla',  10.9833, -74.7980, now() + interval '8 days',    20, false, 10000, 'open'),
    (admin_id, cat_arte,       'Fotografía urbana — salida',    'Recorrido fotográfico por el centro histórico. Trae tu cámara o celular.',    'Barrio El Prado',              'Cra. 54 #68-20, Barranquilla',  10.9905, -74.8120, now() + interval '9 days',    15, true,  null,  'open');

  -- Add admin as participant in each activity
  INSERT INTO public.activity_participants (activity_id, user_id)
  SELECT id, admin_id FROM public.activities WHERE creator_id = admin_id
  ON CONFLICT DO NOTHING;

END $$;
