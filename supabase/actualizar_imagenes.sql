-- =====================================================
-- RECETARIANDO — Actualiza solo las imagenes de las 18
-- recetas demo con fotos reales (Wikimedia Commons).
-- Idempotente: se puede ejecutar las veces que quieras.
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- =====================================================

update public.recetas
set imagen_url = case spoonacular_id
    when 90001 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Paella_Mixta_at_Celler_sa_Premsa.jpg/960px-Paella_Mixta_at_Celler_sa_Premsa.jpg'
    when 90002 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Al_pastor_tacos_-_35419459020.jpg/960px-Al_pastor_tacos_-_35419459020.jpg'
    when 90003 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Guacamole_and_chips_-_Stierch.jpg/960px-Guacamole_and_chips_-_Stierch.jpg'
    when 90004 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Ceviche_del_Per%C3%BA.jpg/960px-Ceviche_del_Per%C3%BA.jpg'
    when 90005 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Enchiladas_verdes_con_pollo.jpg/960px-Enchiladas_verdes_con_pollo.jpg'
    when 90006 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Empanadas_%28Norte_de_Santander%29.jpg/960px-Empanadas_%28Norte_de_Santander%29.jpg'
    when 90007 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Arepa_filled_with_queso_llanero.jpg/960px-Arepa_filled_with_queso_llanero.jpg'
    when 90008 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Mole_poblano%2C_M%C3%A9xico.JPG/960px-Mole_poblano%2C_M%C3%A9xico.JPG'
    when 90009 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Chiles_rellenos_y_capeados.jpg/960px-Chiles_rellenos_y_capeados.jpg'
    when 90010 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Tamales_Mexicanos_sweet_corn_tamales_01.jpg/960px-Tamales_Mexicanos_sweet_corn_tamales_01.jpg'
    when 90011 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Pozole_Rojo_Mexicano.jpg/960px-Pozole_Rojo_Mexicano.jpg'
    when 90012 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Bowl_of_lentil_soup_with_green_and_red_lentils.jpg/960px-Bowl_of_lentil_soup_with_green_and_red_lentils.jpg'
    when 90013 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Spaghetti_Bolognese_-_Figaros%2C_Brighton_2023-10-06.jpg/960px-Spaghetti_Bolognese_-_Figaros%2C_Brighton_2023-10-06.jpg'
    when 90014 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Margherita_Originale.JPG/960px-Margherita_Originale.JPG'
    when 90015 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Caesar-salad.jpg/960px-Caesar-salad.jpg'
    when 90016 then 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Brownie_IMG_001.jpg/960px-Brownie_IMG_001.jpg'
    when 90017 then 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Banana_Pancakes_Pk021.jpg'
    when 90018 then 'https://upload.wikimedia.org/wikipedia/commons/5/58/Homemade_salmon_sushi_3.jpg'
end
where spoonacular_id between 90001 and 90018;