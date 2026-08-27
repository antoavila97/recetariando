-- =====================================================
-- RECETARIANDO — Recetas de ejemplo (demo)
-- -----------------------------------------------------
-- 1. Ejecuta PRIMERO schema.sql
-- 2. Despues, ejecuta este archivo en el SQL Editor
-- Se puede volver a ejecutar (es idempotente).
-- Estas recetas usan spoonacular_id 90001+ para no
-- chocar con las reales que importes despues.
-- =====================================================

-- Función auxiliar: insertar/actualizar receta + su nutricion.
-- Devuelve el id local de la receta.
create or replace function public.seed_receta(
    p_sid bigint,
    p_titulo text,
    p_imagen text,
    p_resumen text,
    p_instrucciones text,
    p_prep int,
    p_coccion int,
    p_porciones int,
    p_calificacion numeric,
    p_vegano boolean,
    p_vegetariano boolean,
    p_gluten boolean,
    p_lactosa boolean,
    p_saludable boolean,
    p_calorias numeric,
    p_proteinas numeric,
    p_carbs numeric,
    p_grasa numeric,
    p_fibra numeric
) returns bigint
language plpgsql
as $$
declare v_id bigint;
begin
    insert into public.recetas (
        spoonacular_id, titulo, imagen_url, resumen, instrucciones,
        tiempo_preparacion, tiempo_coccion, porciones, calificacion,
        vegano, vegetariano, sin_gluten, sin_lactosa, saludable
    ) values (
        p_sid, p_titulo, p_imagen, p_resumen, p_instrucciones,
        p_prep, p_coccion, p_porciones, p_calificacion,
        p_vegano, p_vegetariano, p_gluten, p_lactosa, p_saludable
    )
    on conflict (spoonacular_id) do update
        set titulo = excluded.titulo, imagen_url = excluded.imagen_url, resumen = excluded.resumen
    returning id into v_id;

    insert into public.nutricion (receta_id, calorias, proteinas, carbohidratos, grasa, fibra)
    values (v_id, p_calorias, p_proteinas, p_carbs, p_grasa, p_fibra)
    on conflict (receta_id) do update
        set calorias = excluded.calorias,
            proteinas = excluded.proteinas,
            carbohidratos = excluded.carbohidratos,
            grasa = excluded.grasa,
            fibra = excluded.fibra;

    return v_id;
end;
$$;

-- Función auxiliar: insertar ingrediente (si no existe) y
-- vincularlo a la receta indicada por su spoonacular_id.
create or replace function public.seed_ingrediente(
    p_nombre text,
    p_cantidad text,
    p_unidad text,
    p_receta_sid bigint
) returns void
language plpgsql
as $$
declare v_ing_id bigint; v_receta_id bigint;
begin
    insert into public.ingredientes (nombre) values (p_nombre)
    on conflict (nombre) do nothing
    returning id into v_ing_id;

    if v_ing_id is null then
        select id into v_ing_id from public.ingredientes where nombre = p_nombre;
    end if;

    select id into v_receta_id from public.recetas where spoonacular_id = p_receta_sid;

    if v_receta_id is not null and v_ing_id is not null then
        insert into public.receta_ingredientes (receta_id, ingrediente_id, cantidad, unidad)
        values (v_receta_id, v_ing_id, p_cantidad, p_unidad)
        on conflict (receta_id, ingrediente_id) do nothing;
    end if;
end;
$$;

-- ============ RECETAS DE EJEMPLO ============

-- 1. Paella de pollo y mariscos
select public.seed_receta(
    90001, 'Paella de pollo y mariscos',
    'https://placehold.co/600x400/ee5a6f/ffffff?text=Paella',
    E'Deliciosa paella valenciana con pollo, gambas y mejillones, aromatico azafran y arroz en su punto.',
    E'1. Calienta el aceite en una paellera y dora el pollo por todos lados.\n2. Agrega la cebolla y el ajo picados; sofríe 3 minutos.\n3. Añade el arroz y el azafrán; remueve para que se impregne.\n4. Vierte el caldo caliente, sal y cocina a fuego medio 15 minutos.\n5. Coloca los mariscos encima y cocina 10 minutos más.\n6. Retira del fuego, tapa con un trapo y reposa 5 minutos antes de servir.',
    20, 45, 4, 4.8, false, false, true, true, true,
    520, 28, 62, 14, 3
);
select public.seed_ingrediente('Arroz bomba', '1 taza', 'taza', 90001);
select public.seed_ingrediente('Pollo', '300 g', 'gramos', 90001);
select public.seed_ingrediente('Gambas', '200 g', 'gramos', 90001);
select public.seed_ingrediente('Mejillones', '200 g', 'gramos', 90001);
select public.seed_ingrediente('Cebolla', '1 unidad', 'pieza', 90001);
select public.seed_ingrediente('Ajo', '2 dientes', 'pieza', 90001);
select public.seed_ingrediente('Azafrán', '1 pizca', 'pizca', 90001);
select public.seed_ingrediente('Aceite de oliva', '2 cucharadas', 'cucharada', 90001);

-- 2. Tacos al pastor
select public.seed_receta(
    90002, 'Tacos al pastor',
    'https://placehold.co/600x400/ee5a6f/ffffff?text=Tacos+al+Pastor',
    E'Tacos mexicanos con cerdo marinado en achiote, piña asada y salsa, servidos en tortilla de maiz.',
    E'1. Marina la carne de cerdo con achiote, vinagre y especias por 2 horas.\n2. Dora la carne en un sarten caliente hasta que esté dorada.\n3. Asa la piña hasta que se caramelice.\n4. Calienta las tortillas y arma los tacos.\n5. Acompaña con cebolla, cilantro y salsa roja.',
    25, 20, 4, 4.6, false, false, true, true, false,
    480, 24, 45, 20, 5
);
select public.seed_ingrediente('Tortillas de maíz', '8 unidades', 'pieza', 90002);
select public.seed_ingrediente('Carne de cerdo', '400 g', 'gramos', 90002);
select public.seed_ingrediente('Piña', '1/2 unidad', 'pieza', 90002);
select public.seed_ingrediente('Cebolla', '1/2 unidad', 'pieza', 90002);
select public.seed_ingrediente('Cilantro', '1 ramo', 'ramo', 90002);
select public.seed_ingrediente('Salsa roja', '1/2 taza', 'taza', 90002);
select public.seed_ingrediente('Achiote', '2 cucharadas', 'cucharada', 90002);

-- 3. Guacamole clásico
select public.seed_receta(
    90003, 'Guacamole clásico',
    'https://placehold.co/600x400/7fb069/ffffff?text=Guacamole',
    E'Dip mexicano cremoso de aguacate con tomate, cebolla morada, cilantro y un toque de limon.',
    E'1. Machaca los aguacates con un tenedor.\n2. Agrega tomate, cebolla, cilantro y chile picados.\n3. Exprime el limón y sazona con sal.\n4. Mezcla todo y sirve con totopos.',
    15, 0, 4, 4.9, true, true, true, true, true,
    210, 2, 9, 18, 7
);
select public.seed_ingrediente('Aguacate', '3 unidades', 'pieza', 90003);
select public.seed_ingrediente('Tomate', '1 unidad', 'pieza', 90003);
select public.seed_ingrediente('Cebolla morada', '1/2 unidad', 'pieza', 90003);
select public.seed_ingrediente('Cilantro', '1/4 ramo', 'ramo', 90003);
select public.seed_ingrediente('Limón', '1 unidad', 'pieza', 90003);
select public.seed_ingrediente('Chile serrano', '1 unidad', 'pieza', 90003);
select public.seed_ingrediente('Sal', '1 pizca', 'pizca', 90003);

-- 4. Ceviche peruano
select public.seed_receta(
    90004, 'Ceviche peruano',
    'https://placehold.co/600x400/7fb069/ffffff?text=Ceviche',
    E'Pescado fresco cocido en limon con cebolla morada, ají limo y cilantro; se sirve con camote y cancha.',
    E'1. Corta la corvina en cubos y mezcla con el jugo de limón.\n2. Deja marinar 10 minutos en el refrigerador.\n3. Agrega cebolla morada, ají y cilantro picados.\n4. Sazona con sal y pimienta.\n5. Sirve con camote cocido, maíz cancha y lechuga.',
    25, 0, 4, 4.7, false, false, true, true, true,
    240, 32, 20, 6, 4
);
select public.seed_ingrediente('Corvina', '500 g', 'gramos', 90004);
select public.seed_ingrediente('Limón', '6 unidades', 'pieza', 90004);
select public.seed_ingrediente('Cebolla morada', '1 unidad', 'pieza', 90004);
select public.seed_ingrediente('Ají limo', '2 unidades', 'pieza', 90004);
select public.seed_ingrediente('Cilantro', '1 ramo', 'ramo', 90004);
select public.seed_ingrediente('Camote', '2 unidades', 'pieza', 90004);
select public.seed_ingrediente('Maíz cancha', '1/2 taza', 'taza', 90004);
select public.seed_ingrediente('Lechuga', '2 hojas', 'hoja', 90004);

-- 5. Enchiladas verdes de pollo
select public.seed_receta(
    90005, 'Enchiladas verdes de pollo',
    'https://placehold.co/600x400/ee5a6f/ffffff?text=Enchiladas',
    E'Tortillas rellenas de pollo bañadas en salsa verde, gratinadas con queso y crema.',
    E'1. Cocina los tomatillos y el chile, licúa con cilantro.\n2. Sofríe la salsa verde en un poco de aceite.\n3. Rellena las tortillas con pollo deshebrado.\n4. Baña las enchiladas con la salsa.\n5. Decora con crema, queso fresco y cebolla.',
    30, 25, 4, 4.5, false, false, true, false, false,
    520, 30, 45, 24, 6
);
select public.seed_ingrediente('Tortillas de maíz', '8 unidades', 'pieza', 90005);
select public.seed_ingrediente('Pollo', '400 g', 'gramos', 90005);
select public.seed_ingrediente('Tomatillo', '8 unidades', 'pieza', 90005);
select public.seed_ingrediente('Chile serrano', '2 unidades', 'pieza', 90005);
select public.seed_ingrediente('Cilantro', '1 ramo', 'ramo', 90005);
select public.seed_ingrediente('Crema', '1/2 taza', 'taza', 90005);
select public.seed_ingrediente('Queso fresco', '150 g', 'gramos', 90005);

-- 6. Empanadas de carne
select public.seed_receta(
    90006, 'Empanadas de carne',
    'https://placehold.co/600x400/ee5a6f/ffffff?text=Empanadas',
    E'Media luna de masa rellena de carne molida, cebolla, pimentón, huevo y aceitunas. Horneadas y doradas.',
    E'1. Prepara la masa con harina, agua, aceite y sal; reposa 10 minutos.\n2. Sofríe la carne con cebolla, pimentón y comino.\n3. Agrega huevo duro picado y aceitunas.\n4. Estira la masa, corta discos y rellena.\n5. Sella los bordes y hornea 25 minutos a 180°C.',
    40, 25, 6, 4.4, false, false, false, true, false,
    590, 22, 55, 30, 3
);
select public.seed_ingrediente('Harina de trigo', '500 g', 'gramos', 90006);
select public.seed_ingrediente('Carne molida', '400 g', 'gramos', 90006);
select public.seed_ingrediente('Cebolla', '1 unidad', 'pieza', 90006);
select public.seed_ingrediente('Pimentón', '1 unidad', 'pieza', 90006);
select public.seed_ingrediente('Huevo', '2 unidades', 'pieza', 90006);
select public.seed_ingrediente('Aceitunas', '1/2 taza', 'taza', 90006);
select public.seed_ingrediente('Comino', '1 cucharadita', 'cucharadita', 90006);
select public.seed_ingrediente('Aceite', '1/4 taza', 'taza', 90006);

-- 7. Arepas rellenas de queso
select public.seed_receta(
    90007, 'Arepas rellenas de queso',
    'https://placehold.co/600x400/f2a65a/ffffff?text=Arepas',
    E'Arepas doradas de maiz precocido rellenas de queso blanco, clasico venezolano y colombiano.',
    E'1. Mezcla la harina de maíz con agua y sal hasta formar masa suave.\n2. Forma bolas y aplánalas en discos.\n3. Cocina en plancha 5 minutos por lado.\n4. Corta la arepa a la mitad y rellena con queso.\n5. Vuelve a la plancha hasta que el queso se derrita.',
    15, 15, 4, 4.6, false, true, true, false, false,
    340, 10, 38, 16, 3
);
select public.seed_ingrediente('Harina de maíz precocida', '2 tazas', 'taza', 90007);
select public.seed_ingrediente('Agua', '2 1/2 tazas', 'taza', 90007);
select public.seed_ingrediente('Sal', '1 cucharadita', 'cucharadita', 90007);
select public.seed_ingrediente('Queso blanco', '250 g', 'gramos', 90007);
select public.seed_ingrediente('Mantequilla', '1 cucharada', 'cucharada', 90007);

-- 8. Mole poblano con pollo
select public.seed_receta(
    90008, 'Mole poblano con pollo',
    'https://placehold.co/600x400/6b3b6b/ffffff?text=Mole',
    E'Pollo bañado en mole rojo con chiles secos, chocolate, almendras y especias. Plato festivo mexicano.',
    E'1. Tuesta los chiles secos y remójalos en agua caliente.\n2. Licúa los chiles con almendras, ajonjolí y chocolate.\n3. Sofríe la salsa en aceite, agrega canela y caldo.\n4. Cocina la salsa a fuego bajo 40 minutos.\n5. Agrega el pollo cocido y cocina 15 minutos más.\n6. Sirve con arroz y tortillas.',
    45, 60, 4, 4.3, false, false, true, true, false,
    620, 38, 40, 35, 8
);
select public.seed_ingrediente('Pollo', '600 g', 'gramos', 90008);
select public.seed_ingrediente('Chiles secos', '6 unidades', 'pieza', 90008);
select public.seed_ingrediente('Chocolate', '50 g', 'gramos', 90008);
select public.seed_ingrediente('Almendras', '50 g', 'gramos', 90008);
select public.seed_ingrediente('Ajonjolí', '2 cucharadas', 'cucharada', 90008);
select public.seed_ingrediente('Canela', '1 rama', 'rama', 90008);
select public.seed_ingrediente('Aceite', '3 cucharadas', 'cucharada', 90008);

-- 9. Chiles rellenos de queso
select public.seed_receta(
    90009, 'Chiles rellenos de queso',
    'https://placehold.co/600x400/f2a65a/ffffff?text=Chiles+Rellenos',
    E'Chiles poblanos asados rellenos de queso oaxaca, capeados en huevo y bañados en salsa de tomate.',
    E'1. Asa los chiles y retira la piel y las semillas.\n2. Rellena con queso oaxaca deshebrado.\n3. Prepara el capeado batiendo claras a punto de turrón.\n4. Pasa los chiles por harina y por el huevo.\n5. Fríe en aceite caliente y baña con salsa de tomate.',
    30, 20, 4, 4.2, false, true, true, false, false,
    460, 18, 20, 34, 4
);
select public.seed_ingrediente('Chiles poblanos', '4 unidades', 'pieza', 90009);
select public.seed_ingrediente('Queso oaxaca', '300 g', 'gramos', 90009);
select public.seed_ingrediente('Huevo', '4 unidades', 'pieza', 90009);
select public.seed_ingrediente('Harina de trigo', '1/2 taza', 'taza', 90009);
select public.seed_ingrediente('Tomate', '3 unidades', 'pieza', 90009);
select public.seed_ingrediente('Aceite', '1 taza', 'taza', 90009);

-- 10. Tamales de elote
select public.seed_receta(
    90010, 'Tamales de elote',
    'https://placehold.co/600x400/f2a65a/ffffff?text=Tamales',
    E'Tamales dulces de elote con mantequilla, envueltos en hojas de maiz y cocidos al vapor.',
    E'1. Licúa los granos de elote con mantequilla, azúcar y leche.\n2. Agrega harina de maíz hasta obtener masa suave.\n3. Coloca la masa sobre hojas de maíz y dobla en paquetitos.\n4. Cocina al vapor 45 minutos.\n5. Deja reposar y sirve calientes.',
    30, 60, 8, 4.4, false, true, true, false, false,
    380, 6, 50, 18, 4
);
select public.seed_ingrediente('Elote', '4 unidades', 'pieza', 90010);
select public.seed_ingrediente('Mantequilla', '100 g', 'gramos', 90010);
select public.seed_ingrediente('Azúcar', '1/2 taza', 'taza', 90010);
select public.seed_ingrediente('Harina de maíz', '1 1/2 tazas', 'taza', 90010);
select public.seed_ingrediente('Leche', '1/2 taza', 'taza', 90010);
select public.seed_ingrediente('Hojas de maíz', '8 unidades', 'pieza', 90010);

-- 11. Pozole rojo con cerdo
select public.seed_receta(
    90011, 'Pozole rojo con cerdo',
    'https://placehold.co/600x400/ee5a6f/ffffff?text=Pozole',
    E'Guisado de maíz cacahuazintle y carne de cerdo en caldo de chile guajillo; se sirve con rábanos y orégano.',
    E'1. Cocina el maíz cacahuazintle en olla de presión 40 minutos.\n2. Cocina la carne de cerdo con cebolla y ajo.\n3. Licúa los chiles guajillo hidratados y cuélalos.\n4. Mezcla el caldo con la salsa y sazona.\n5. Sirve con rábanos, lechuga, orégano y limón.',
    30, 90, 6, 4.6, false, false, true, true, false,
    540, 34, 48, 22, 9
);
select public.seed_ingrediente('Maíz cacahuazintle', '500 g', 'gramos', 90011);
select public.seed_ingrediente('Carne de cerdo', '600 g', 'gramos', 90011);
select public.seed_ingrediente('Chile guajillo', '6 unidades', 'pieza', 90011);
select public.seed_ingrediente('Rábanos', '1/2 taza', 'taza', 90011);
select public.seed_ingrediente('Lechuga', '1 taza', 'taza', 90011);
select public.seed_ingrediente('Orégano', '1 cucharadita', 'cucharadita', 90011);
select public.seed_ingrediente('Limón', '2 unidades', 'pieza', 90011);

-- 12. Sopa de lentejas
select public.seed_receta(
    90012, 'Sopa de lentejas',
    'https://placehold.co/600x400/7fb069/ffffff?text=Sopa+de+Lentejas',
    E'Sopa nutritiva y economica de lentejas con zanahoria, tomate y comino. Ideal para dias frios.',
    E'1. Sofríe cebolla, ajo y tomate picados en aceite.\n2. Agrega las lentejas y la zanahoria en cubos.\n3. Cubre con agua y agrega comino y sal.\n4. Cocina a fuego medio 30 minutos o hasta que estén suaves.\n5. Ajusta la sazón y sirve caliente.',
    10, 35, 4, 4.7, true, true, true, true, true,
    320, 18, 48, 8, 16
);
select public.seed_ingrediente('Lentejas', '300 g', 'gramos', 90012);
select public.seed_ingrediente('Zanahoria', '2 unidades', 'pieza', 90012);
select public.seed_ingrediente('Cebolla', '1 unidad', 'pieza', 90012);
select public.seed_ingrediente('Ajo', '2 dientes', 'pieza', 90012);
select public.seed_ingrediente('Tomate', '1 unidad', 'pieza', 90012);
select public.seed_ingrediente('Comino', '1 cucharadita', 'cucharadita', 90012);
select public.seed_ingrediente('Aceite de oliva', '2 cucharadas', 'cucharada', 90012);

-- 13. Pasta a la boloñesa
select public.seed_receta(
    90013, 'Pasta a la boloñesa',
    'https://placehold.co/600x400/ee5a6f/ffffff?text=Bolognesa',
    E'Espagueti con salsa boloñesa de carne molida, tomate, zanahoria y albahaca, hecha despacio.',
    E'1. Sofríe la carne molida hasta que se dore.\n2. Agrega cebolla, zanahoria, apio y ajo picados.\n3. Vierte el tomate triturado y la albahaca.\n4. Cocina a fuego bajo 30 minutos.\n5. Cocina la pasta al dente y mezcla con la salsa.',
    15, 40, 4, 4.5, false, false, false, false, false,
    560, 28, 65, 20, 6
);
select public.seed_ingrediente('Pasta', '400 g', 'gramos', 90013);
select public.seed_ingrediente('Carne molida', '400 g', 'gramos', 90013);
select public.seed_ingrediente('Tomate triturado', '1 lata', 'lata', 90013);
select public.seed_ingrediente('Cebolla', '1 unidad', 'pieza', 90013);
select public.seed_ingrediente('Zanahoria', '1 unidad', 'pieza', 90013);
select public.seed_ingrediente('Apio', '1 palo', 'palo', 90013);
select public.seed_ingrediente('Ajo', '2 dientes', 'pieza', 90013);
select public.seed_ingrediente('Albahaca', '1/4 taza', 'taza', 90013);

-- 14. Pizza margarita
select public.seed_receta(
    90014, 'Pizza margarita',
    'https://placehold.co/600x400/f2a65a/ffffff?text=Pizza',
    E'Pizza napolitana con salsa de tomate, mozzarella fresca y albahaca sobre masa crujiente.',
    E'1. Prepara la masa con harina, levadura, agua y sal; reposa 1 hora.\n2. Estira la masa en un círculo.\n3. Cubre con salsa de tomate y mozzarella en rodajas.\n4. Hornea a 220°C por 15 minutos.\n5. Termina con albahaca fresca y un hilo de aceite.',
    20, 15, 2, 4.6, false, true, false, false, false,
    620, 24, 70, 26, 4
);
select public.seed_ingrediente('Harina de trigo', '300 g', 'gramos', 90014);
select public.seed_ingrediente('Levadura', '10 g', 'gramos', 90014);
select public.seed_ingrediente('Tomate triturado', '1/2 taza', 'taza', 90014);
select public.seed_ingrediente('Mozzarella', '200 g', 'gramos', 90014);
select public.seed_ingrediente('Albahaca', '1 ramo', 'ramo', 90014);
select public.seed_ingrediente('Aceite de oliva', '1 cucharada', 'cucharada', 90014);
select public.seed_ingrediente('Sal', '1 pizca', 'pizca', 90014);

-- 15. Ensalada César con pollo
select public.seed_receta(
    90015, 'Ensalada César con pollo a la parrilla',
    'https://placehold.co/600x400/7fb069/ffffff?text=Cesar',
    E'Lechuga romana con pollo a la parrilla, crutones de pan, parmesano y aderezo César.',
    E'1. Sazona y asa la pechuga de pollo en la plancha.\n2. Corta el pan en cubos y tuesta en aceite.\n3. Licúa el aderezo con mayonesa, ajo, limón y parmesano.\n4. Mezcla la lechuga con el aderezo.\n5. Añade el pollo en tiras, crutones y más parmesano.',
    20, 15, 4, 4.4, false, false, true, false, false,
    420, 32, 18, 25, 3
);
select public.seed_ingrediente('Lechuga romana', '1 cabeza', 'pieza', 90015);
select public.seed_ingrediente('Pechuga de pollo', '2 unidades', 'pieza', 90015);
select public.seed_ingrediente('Pan', '4 rebanadas', 'rebanada', 90015);
select public.seed_ingrediente('Queso parmesano', '50 g', 'gramos', 90015);
select public.seed_ingrediente('Aderezo César', '1/2 taza', 'taza', 90015);
select public.seed_ingrediente('Limón', '1 unidad', 'pieza', 90015);

-- 16. Brownie de chocolate
select public.seed_receta(
    90016, 'Brownie de chocolate',
    'https://placehold.co/600x400/6b3b6b/ffffff?text=Brownie',
    E'Brownie denso y jugoso de chocolate con nueces, con corteza brillante y centro suave.',
    E'1. Derrite el chocolate con la mantequilla a fuego bajo.\n2. Bate los huevos con el azúcar hasta esponjar.\n3. Incorpora el chocolate y luego la harina.\n4. Agrega las nueces y vierte en un molde.\n5. Hornea 25 minutos a 180°C y deja enfriar antes de cortar.',
    15, 30, 9, 4.2, false, true, false, false, false,
    450, 6, 45, 28, 3
);
select public.seed_ingrediente('Chocolate', '200 g', 'gramos', 90016);
select public.seed_ingrediente('Mantequilla', '150 g', 'gramos', 90016);
select public.seed_ingrediente('Azúcar', '1 taza', 'taza', 90016);
select public.seed_ingrediente('Huevo', '3 unidades', 'pieza', 90016);
select public.seed_ingrediente('Harina de trigo', '1 taza', 'taza', 90016);
select public.seed_ingrediente('Nueces', '1/2 taza', 'taza', 90016);

-- 17. Pancakes de avena y plátano
select public.seed_receta(
    90017, 'Pancakes de avena y plátano',
    'https://placehold.co/600x400/7fb069/ffffff?text=Pancakes',
    E'Panqueques saludables de avena y plátano, sin azúcar refinada, perfectos para el desayuno.',
    E'1. Muele la avena hasta obtener harina.\n2. Licúa la avena con el plátano, huevos, leche y canela.\n3. Calienta un sartén engrasado.\n4. Vierte porciones y cocina 2 minutos por lado.\n5. Sirve con miel y más plátano.',
    10, 10, 3, 4.8, false, true, false, false, true,
    320, 14, 52, 8, 6
);
select public.seed_ingrediente('Avena', '1 1/2 tazas', 'taza', 90017);
select public.seed_ingrediente('Plátano', '2 unidades', 'pieza', 90017);
select public.seed_ingrediente('Huevo', '2 unidades', 'pieza', 90017);
select public.seed_ingrediente('Leche', '1/2 taza', 'taza', 90017);
select public.seed_ingrediente('Canela', '1 cucharadita', 'cucharadita', 90017);
select public.seed_ingrediente('Miel', '2 cucharadas', 'cucharada', 90017);

-- 18. Sushi roll de salmón
select public.seed_receta(
    90018, 'Sushi roll de salmón',
    'https://placehold.co/600x400/6b3b6b/ffffff?text=Sushi',
    E'"Roll" de sushi con salmón fresco, aguacate y pepino envuelto en alga nori y arroz sazonado.',
    E'1. Cocina el arroz con vinagre de arroz y azúcar.\n2. Coloca el arroz sobre el alga nori y extiende.\n3. Añade salmón, aguacate y pepino en tiras.\n4. Enrolla con la estera y humedece el borde.\n5. Corta en 8 piezas y sirve con wasabi y soja.',
    45, 20, 4, 4.9, false, false, false, true, true,
    380, 22, 58, 8, 3
);
select public.seed_ingrediente('Arroz para sushi', '2 tazas', 'taza', 90018);
select public.seed_ingrediente('Salmón', '300 g', 'gramos', 90018);
select public.seed_ingrediente('Alga nori', '4 hojas', 'hoja', 90018);
select public.seed_ingrediente('Aguacate', '1 unidad', 'pieza', 90018);
select public.seed_ingrediente('Pepino', '1/2 unidad', 'pieza', 90018);
select public.seed_ingrediente('Wasabi', '1 cucharadita', 'cucharadita', 90018);
select public.seed_ingrediente('Salsa de soja', '2 cucharadas', 'cucharada', 90018);

-- =====================================================
-- FIN DE seed_demo.sql
-- (las funciones seed_receta / seed_ingrediente se dejan
--  para que puedas agregar mas recetas en el futuro)
-- =====================================================

-- Proteccion: solo el propietario (supabase_admin/rol de SQL editor)
-- podra usar estas funciones auxiliares.
revoke all on function public.seed_receta(bigint, text, text, text, text, int, int, int, numeric, boolean, boolean, boolean, boolean, boolean, numeric, numeric, numeric, numeric, numeric) from public, anon, authenticated;
revoke all on function public.seed_ingrediente(text, text, text, bigint) from public, anon, authenticated;