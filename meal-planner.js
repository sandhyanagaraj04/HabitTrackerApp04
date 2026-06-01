/* ═══════════════════════════════════════════════════════════
   MEAL PLANNER — RECIPE DATABASE + APPLICATION LOGIC
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ── RECIPE DATABASE (100% vegetarian, egg-free) ─────────── */
const RECIPES = {
  // ── BREAKFAST ──
  r01: { id:'r01', name:'Classic Oatmeal', emoji:'🥣', category:'breakfast', cuisine:'American', prepTime:5, cookTime:10, servings:2, difficulty:'easy', tags:['healthy','vegetarian','high-fiber'],
    ingredients:[{name:'rolled oats',amount:1,unit:'cup',category:'grains'},{name:'milk',amount:2,unit:'cups',category:'dairy'},{name:'banana',amount:1,unit:'piece',category:'fruits'},{name:'honey',amount:2,unit:'tbsp',category:'sweeteners'},{name:'cinnamon',amount:0.5,unit:'tsp',category:'spices'}],
    instructions:['Bring milk to a gentle boil in a saucepan.','Add oats, reduce heat to medium-low.','Cook 5–7 min, stirring occasionally.','Remove from heat; rest 2 min.','Top with sliced banana, honey, and cinnamon.'],
    nutrition:{calories:320,protein:12,carbs:58,fat:6,fiber:5}},

  r02: { id:'r02', name:'Avocado Toast', emoji:'🥑', category:'breakfast', cuisine:'Modern', prepTime:5, cookTime:5, servings:1, difficulty:'easy', tags:['healthy','vegan','quick'],
    ingredients:[{name:'sourdough bread',amount:2,unit:'slices',category:'grains'},{name:'avocado',amount:1,unit:'piece',category:'fruits'},{name:'cherry tomatoes',amount:5,unit:'pieces',category:'vegetables'},{name:'lemon juice',amount:1,unit:'tbsp',category:'condiments'},{name:'chili flakes',amount:0.25,unit:'tsp',category:'spices'},{name:'salt',amount:1,unit:'pinch',category:'spices'}],
    instructions:['Toast bread until golden.','Mash avocado with lemon juice and salt.','Spread avocado on toast.','Top with halved tomatoes and chili flakes.'],
    nutrition:{calories:280,protein:7,carbs:32,fat:15,fiber:8}},

  r03: { id:'r03', name:'Greek Yogurt Parfait', emoji:'🍓', category:'breakfast', cuisine:'Mediterranean', prepTime:5, cookTime:0, servings:1, difficulty:'easy', tags:['healthy','high-protein','no-cook'],
    ingredients:[{name:'Greek yogurt',amount:200,unit:'g',category:'dairy'},{name:'mixed berries',amount:0.5,unit:'cup',category:'fruits'},{name:'granola',amount:3,unit:'tbsp',category:'grains'},{name:'honey',amount:1,unit:'tbsp',category:'sweeteners'},{name:'chia seeds',amount:1,unit:'tsp',category:'seeds'}],
    instructions:['Layer yogurt in a glass or bowl.','Add mixed berries.','Top with granola and chia seeds.','Drizzle with honey and serve immediately.'],
    nutrition:{calories:290,protein:18,carbs:38,fat:5,fiber:4}},

  r04: { id:'r04', name:'Masala Dosa', emoji:'🫓', category:'breakfast', cuisine:'Indian', prepTime:10, cookTime:20, servings:2, difficulty:'medium', tags:['vegan','savory','south-indian'],
    ingredients:[{name:'dosa batter',amount:2,unit:'cups',category:'grains'},{name:'potato',amount:2,unit:'pieces',category:'vegetables'},{name:'onion',amount:1,unit:'piece',category:'vegetables'},{name:'green chilli',amount:1,unit:'piece',category:'vegetables'},{name:'mustard seeds',amount:0.5,unit:'tsp',category:'spices'},{name:'turmeric',amount:0.25,unit:'tsp',category:'spices'},{name:'coconut chutney',amount:4,unit:'tbsp',category:'condiments'},{name:'oil',amount:1,unit:'tbsp',category:'oils'}],
    instructions:['Boil and mash potatoes with turmeric and salt.','Sauté mustard seeds, onion, chilli; mix into potato filling.','Heat dosa tawa; spread batter in a thin circle.','Add filling in centre; fold dosa over.','Serve with coconut chutney and sambar.'],
    nutrition:{calories:310,protein:8,carbs:56,fat:7,fiber:4}},

  r05: { id:'r05', name:'Poha', emoji:'🍚', category:'breakfast', cuisine:'Indian', prepTime:5, cookTime:10, servings:2, difficulty:'easy', tags:['vegan','light','quick'],
    ingredients:[{name:'flattened rice (poha)',amount:1.5,unit:'cups',category:'grains'},{name:'onion',amount:1,unit:'piece',category:'vegetables'},{name:'potato',amount:1,unit:'piece',category:'vegetables'},{name:'green peas',amount:0.25,unit:'cup',category:'vegetables'},{name:'mustard seeds',amount:0.5,unit:'tsp',category:'spices'},{name:'turmeric',amount:0.25,unit:'tsp',category:'spices'},{name:'lemon juice',amount:1,unit:'tbsp',category:'condiments'},{name:'fresh coriander',amount:2,unit:'tbsp',category:'herbs'}],
    instructions:['Rinse poha and drain well.','Heat oil; splutter mustard seeds.','Sauté onion and potato until soft.','Add peas and turmeric; cook 2 min.','Add poha; mix gently and cook 3 min.','Finish with lemon juice and coriander.'],
    nutrition:{calories:270,protein:6,carbs:52,fat:5,fiber:3}},

  r06: { id:'r06', name:'Overnight Chia Pudding', emoji:'🍮', category:'breakfast', cuisine:'Modern', prepTime:5, cookTime:0, servings:2, difficulty:'easy', tags:['vegan','meal-prep','no-cook'],
    ingredients:[{name:'chia seeds',amount:4,unit:'tbsp',category:'seeds'},{name:'almond milk',amount:2,unit:'cups',category:'dairy'},{name:'vanilla extract',amount:1,unit:'tsp',category:'baking'},{name:'maple syrup',amount:2,unit:'tbsp',category:'sweeteners'},{name:'mango',amount:1,unit:'piece',category:'fruits'}],
    instructions:['Mix chia seeds, almond milk, vanilla, and maple syrup.','Stir well; refrigerate overnight or at least 4 hours.','Stir once more before serving.','Top with diced mango.'],
    nutrition:{calories:240,protein:7,carbs:34,fat:9,fiber:11}},

  r07: { id:'r07', name:'Smoothie Bowl', emoji:'🫐', category:'breakfast', cuisine:'Modern', prepTime:8, cookTime:0, servings:1, difficulty:'easy', tags:['vegan','antioxidant','no-cook'],
    ingredients:[{name:'frozen blueberries',amount:1,unit:'cup',category:'fruits'},{name:'frozen banana',amount:1,unit:'piece',category:'fruits'},{name:'coconut milk',amount:0.25,unit:'cup',category:'dairy'},{name:'granola',amount:3,unit:'tbsp',category:'grains'},{name:'kiwi',amount:1,unit:'piece',category:'fruits'},{name:'coconut flakes',amount:1,unit:'tbsp',category:'toppings'}],
    instructions:['Blend frozen blueberries, banana, and coconut milk until thick.','Pour into a bowl.','Top with granola, sliced kiwi, and coconut flakes.'],
    nutrition:{calories:310,protein:5,carbs:62,fat:7,fiber:8}},

  r08: { id:'r08', name:'Upma', emoji:'🥣', category:'breakfast', cuisine:'Indian', prepTime:5, cookTime:15, servings:2, difficulty:'easy', tags:['vegan','savory','filling'],
    ingredients:[{name:'semolina (rava)',amount:1,unit:'cup',category:'grains'},{name:'onion',amount:1,unit:'piece',category:'vegetables'},{name:'carrot',amount:1,unit:'piece',category:'vegetables'},{name:'green peas',amount:0.25,unit:'cup',category:'vegetables'},{name:'mustard seeds',amount:0.5,unit:'tsp',category:'spices'},{name:'ginger',amount:0.5,unit:'tsp',category:'spices'},{name:'water',amount:2.5,unit:'cups',category:'liquids'},{name:'oil',amount:1,unit:'tbsp',category:'oils'}],
    instructions:['Dry roast semolina until golden; set aside.','Heat oil; splutter mustard seeds, add ginger.','Sauté onion and vegetables 3 min.','Add water and salt; bring to boil.','Slowly add roasted semolina, stirring continuously.','Cook on low 3–4 min; serve with chutney.'],
    nutrition:{calories:290,protein:8,carbs:54,fat:5,fiber:3}},

  // ── LUNCH ──
  r09: { id:'r09', name:'Paneer Tikka Wrap', emoji:'🌯', category:'lunch', cuisine:'Indian', prepTime:15, cookTime:15, servings:2, difficulty:'medium', tags:['vegetarian','high-protein','portable'],
    ingredients:[{name:'paneer',amount:200,unit:'g',category:'protein'},{name:'flour tortillas',amount:2,unit:'pieces',category:'grains'},{name:'yogurt',amount:3,unit:'tbsp',category:'dairy'},{name:'tikka masala paste',amount:2,unit:'tbsp',category:'spices'},{name:'bell pepper',amount:1,unit:'piece',category:'vegetables'},{name:'onion',amount:1,unit:'piece',category:'vegetables'},{name:'mint chutney',amount:2,unit:'tbsp',category:'condiments'},{name:'lemon juice',amount:1,unit:'tbsp',category:'condiments'}],
    instructions:['Cube paneer; marinate in yogurt and tikka paste 10 min.','Grill paneer and peppers on high heat until charred.','Warm tortillas on a dry pan.','Spread mint chutney; layer paneer, peppers, onion rings.','Squeeze lemon, roll tightly, and serve.'],
    nutrition:{calories:440,protein:22,carbs:44,fat:18,fiber:4}},

  r10: { id:'r10', name:'Veggie Pasta Salad', emoji:'🥗', category:'lunch', cuisine:'Italian', prepTime:10, cookTime:12, servings:3, difficulty:'easy', tags:['vegetarian','meal-prep','cold'],
    ingredients:[{name:'fusilli pasta',amount:250,unit:'g',category:'grains'},{name:'cherry tomatoes',amount:1,unit:'cup',category:'vegetables'},{name:'cucumber',amount:1,unit:'piece',category:'vegetables'},{name:'black olives',amount:0.25,unit:'cup',category:'vegetables'},{name:'feta cheese',amount:80,unit:'g',category:'dairy'},{name:'olive oil',amount:3,unit:'tbsp',category:'oils'},{name:'lemon juice',amount:2,unit:'tbsp',category:'condiments'},{name:'dried oregano',amount:1,unit:'tsp',category:'herbs'}],
    instructions:['Cook pasta al dente; rinse under cold water.','Halve tomatoes; dice cucumber.','Toss pasta with all vegetables.','Whisk olive oil, lemon juice, oregano for dressing.','Pour dressing over salad; top with feta.','Chill 15 min before serving.'],
    nutrition:{calories:390,protein:13,carbs:52,fat:15,fiber:4}},

  r11: { id:'r11', name:'Quinoa Buddha Bowl', emoji:'🫙', category:'lunch', cuisine:'Modern', prepTime:10, cookTime:20, servings:2, difficulty:'medium', tags:['vegan','high-protein','meal-prep'],
    ingredients:[{name:'quinoa',amount:1,unit:'cup',category:'grains'},{name:'chickpeas',amount:1,unit:'can',category:'protein'},{name:'cucumber',amount:1,unit:'piece',category:'vegetables'},{name:'cherry tomatoes',amount:1,unit:'cup',category:'vegetables'},{name:'red onion',amount:0.5,unit:'piece',category:'vegetables'},{name:'tahini',amount:2,unit:'tbsp',category:'condiments'},{name:'lemon juice',amount:2,unit:'tbsp',category:'condiments'}],
    instructions:['Cook quinoa per package directions; cool slightly.','Roast chickpeas with olive oil and spices at 200°C for 20 min.','Chop vegetables.','Make dressing: mix tahini, lemon juice, garlic, water.','Assemble bowls; drizzle with dressing.'],
    nutrition:{calories:490,protein:19,carbs:72,fat:14,fiber:12}},

  r12: { id:'r12', name:'Tomato Lentil Soup', emoji:'🍲', category:'lunch', cuisine:'Mediterranean', prepTime:10, cookTime:30, servings:4, difficulty:'easy', tags:['vegan','meal-prep','high-fiber'],
    ingredients:[{name:'red lentils',amount:1,unit:'cup',category:'protein'},{name:'tomatoes',amount:2,unit:'pieces',category:'vegetables'},{name:'carrot',amount:2,unit:'pieces',category:'vegetables'},{name:'onion',amount:1,unit:'piece',category:'vegetables'},{name:'garlic',amount:3,unit:'cloves',category:'vegetables'},{name:'cumin',amount:1,unit:'tsp',category:'spices'},{name:'vegetable broth',amount:4,unit:'cups',category:'liquids'},{name:'olive oil',amount:2,unit:'tbsp',category:'oils'}],
    instructions:['Sauté onion, carrot, garlic in olive oil until soft.','Add cumin; cook 1 min.','Add tomatoes, lentils, and broth.','Simmer 25–30 min until lentils are tender.','Blend partially for creamy texture.','Season and serve.'],
    nutrition:{calories:280,protein:16,carbs:44,fat:5,fiber:14}},

  r13: { id:'r13', name:'Aloo Chaat', emoji:'🥔', category:'lunch', cuisine:'Indian', prepTime:10, cookTime:15, servings:2, difficulty:'easy', tags:['vegan','tangy','street-food'],
    ingredients:[{name:'potato',amount:3,unit:'pieces',category:'vegetables'},{name:'tamarind chutney',amount:2,unit:'tbsp',category:'condiments'},{name:'mint chutney',amount:2,unit:'tbsp',category:'condiments'},{name:'red onion',amount:1,unit:'piece',category:'vegetables'},{name:'chaat masala',amount:1,unit:'tsp',category:'spices'},{name:'cumin powder',amount:0.5,unit:'tsp',category:'spices'},{name:'fresh coriander',amount:2,unit:'tbsp',category:'herbs'},{name:'pomegranate seeds',amount:2,unit:'tbsp',category:'fruits'}],
    instructions:['Boil potatoes; peel and cube.','Pan-fry potato cubes until crispy.','Toss with both chutneys and spices.','Top with diced onion, coriander, pomegranate seeds.','Serve immediately.'],
    nutrition:{calories:260,protein:5,carbs:50,fat:4,fiber:5}},

  r14: { id:'r14', name:'Mediterranean Bowl', emoji:'🫒', category:'lunch', cuisine:'Mediterranean', prepTime:10, cookTime:15, servings:2, difficulty:'easy', tags:['healthy','vegetarian','colorful'],
    ingredients:[{name:'brown rice',amount:1,unit:'cup',category:'grains'},{name:'falafel',amount:6,unit:'pieces',category:'protein'},{name:'hummus',amount:4,unit:'tbsp',category:'condiments'},{name:'cucumber',amount:1,unit:'piece',category:'vegetables'},{name:'kalamata olives',amount:0.25,unit:'cup',category:'vegetables'},{name:'feta cheese',amount:50,unit:'g',category:'dairy'},{name:'fresh parsley',amount:2,unit:'tbsp',category:'herbs'}],
    instructions:['Cook rice.','Warm falafel in oven or pan.','Dice cucumber; halve olives.','Assemble: rice base, falafel, cucumber, olives.','Add hummus and crumbled feta.','Garnish with parsley.'],
    nutrition:{calories:510,protein:16,carbs:68,fat:20,fiber:9}},

  r15: { id:'r15', name:'Minestrone Soup', emoji:'🍜', category:'lunch', cuisine:'Italian', prepTime:15, cookTime:35, servings:6, difficulty:'medium', tags:['vegan','meal-prep','warming'],
    ingredients:[{name:'kidney beans',amount:1,unit:'can',category:'protein'},{name:'zucchini',amount:1,unit:'piece',category:'vegetables'},{name:'carrot',amount:2,unit:'pieces',category:'vegetables'},{name:'celery',amount:2,unit:'stalks',category:'vegetables'},{name:'tomato paste',amount:2,unit:'tbsp',category:'condiments'},{name:'ditalini pasta',amount:0.5,unit:'cup',category:'grains'},{name:'vegetable broth',amount:6,unit:'cups',category:'liquids'},{name:'basil',amount:1,unit:'tsp',category:'herbs'}],
    instructions:['Sauté carrot, celery, zucchini in olive oil.','Add tomato paste; cook 2 min.','Add broth and beans; bring to boil.','Add pasta; simmer 10 min.','Season with basil, salt, pepper.','Serve with crusty bread.'],
    nutrition:{calories:220,protein:10,carbs:38,fat:4,fiber:8}},

  r16: { id:'r16', name:'Caprese Salad', emoji:'🍅', category:'lunch', cuisine:'Italian', prepTime:5, cookTime:0, servings:2, difficulty:'easy', tags:['vegetarian','no-cook','summer'],
    ingredients:[{name:'tomatoes',amount:3,unit:'pieces',category:'vegetables'},{name:'fresh mozzarella',amount:200,unit:'g',category:'dairy'},{name:'fresh basil',amount:10,unit:'leaves',category:'herbs'},{name:'olive oil',amount:2,unit:'tbsp',category:'oils'},{name:'balsamic glaze',amount:1,unit:'tbsp',category:'condiments'},{name:'salt',amount:1,unit:'pinch',category:'spices'}],
    instructions:['Slice tomatoes and mozzarella evenly.','Alternate on plate: tomato, mozzarella, basil.','Drizzle with olive oil and balsamic glaze.','Sprinkle with salt and serve.'],
    nutrition:{calories:320,protein:18,carbs:8,fat:24,fiber:2}},

  // ── DINNER ──
  r17: { id:'r17', name:'Paneer Butter Masala', emoji:'🍛', category:'dinner', cuisine:'Indian', prepTime:10, cookTime:30, servings:4, difficulty:'medium', tags:['vegetarian','rich','comfort'],
    ingredients:[{name:'paneer',amount:300,unit:'g',category:'protein'},{name:'tomatoes',amount:4,unit:'pieces',category:'vegetables'},{name:'onion',amount:2,unit:'pieces',category:'vegetables'},{name:'garlic',amount:4,unit:'cloves',category:'vegetables'},{name:'ginger',amount:1,unit:'tsp',category:'spices'},{name:'butter',amount:2,unit:'tbsp',category:'dairy'},{name:'cream',amount:4,unit:'tbsp',category:'dairy'},{name:'garam masala',amount:1,unit:'tsp',category:'spices'},{name:'basmati rice',amount:2,unit:'cups',category:'grains'}],
    instructions:['Blend tomatoes, onion, garlic, ginger into a smooth purée.','Cook purée in butter until oil separates (10 min).','Add garam masala and salt; cook 2 min.','Add paneer cubes; simmer 8 min.','Stir in cream; cook 2 min more.','Serve with steamed basmati rice.'],
    nutrition:{calories:530,protein:22,carbs:58,fat:22,fiber:4}},

  r18: { id:'r18', name:'Vegetable Fried Rice', emoji:'🍳', category:'dinner', cuisine:'Asian', prepTime:10, cookTime:15, servings:3, difficulty:'easy', tags:['vegan','quick','meal-prep'],
    ingredients:[{name:'cooked rice',amount:3,unit:'cups',category:'grains'},{name:'carrot',amount:1,unit:'piece',category:'vegetables'},{name:'green peas',amount:0.5,unit:'cup',category:'vegetables'},{name:'corn',amount:0.5,unit:'cup',category:'vegetables'},{name:'spring onion',amount:3,unit:'stalks',category:'vegetables'},{name:'soy sauce',amount:3,unit:'tbsp',category:'condiments'},{name:'sesame oil',amount:1,unit:'tsp',category:'oils'},{name:'garlic',amount:3,unit:'cloves',category:'vegetables'},{name:'ginger',amount:0.5,unit:'tsp',category:'spices'}],
    instructions:['Use day-old rice for best results.','Stir-fry garlic and ginger in hot oil 30 sec.','Add carrots, peas, corn; stir-fry 3 min.','Add rice; toss on high heat 3 min.','Add soy sauce and sesame oil; mix well.','Garnish with spring onion and serve.'],
    nutrition:{calories:380,protein:9,carbs:68,fat:8,fiber:5}},

  r19: { id:'r19', name:'Tofu Stir-Fry', emoji:'🥢', category:'dinner', cuisine:'Asian', prepTime:15, cookTime:15, servings:3, difficulty:'medium', tags:['vegan','high-protein','asian'],
    ingredients:[{name:'firm tofu',amount:400,unit:'g',category:'protein'},{name:'broccoli',amount:2,unit:'cups',category:'vegetables'},{name:'bell pepper',amount:2,unit:'pieces',category:'vegetables'},{name:'snap peas',amount:1,unit:'cup',category:'vegetables'},{name:'soy sauce',amount:3,unit:'tbsp',category:'condiments'},{name:'ginger',amount:1,unit:'tsp',category:'spices'},{name:'garlic',amount:3,unit:'cloves',category:'vegetables'},{name:'sesame oil',amount:1,unit:'tsp',category:'oils'},{name:'jasmine rice',amount:1.5,unit:'cups',category:'grains'}],
    instructions:['Press tofu dry; cut into cubes.','Cook rice.','Pan-fry tofu in oil until golden on all sides (8 min).','Add garlic, ginger, vegetables; stir-fry 4–5 min.','Add soy sauce and sesame oil; toss.','Serve over rice.'],
    nutrition:{calories:420,protein:24,carbs:52,fat:12,fiber:6}},

  r20: { id:'r20', name:'Vegetable Curry', emoji:'🍛', category:'dinner', cuisine:'Indian', prepTime:10, cookTime:30, servings:4, difficulty:'medium', tags:['vegan','spicy','meal-prep'],
    ingredients:[{name:'chickpeas',amount:2,unit:'cans',category:'protein'},{name:'spinach',amount:2,unit:'cups',category:'vegetables'},{name:'tomatoes',amount:2,unit:'pieces',category:'vegetables'},{name:'onion',amount:1,unit:'piece',category:'vegetables'},{name:'coconut milk',amount:1,unit:'can',category:'dairy'},{name:'curry powder',amount:2,unit:'tbsp',category:'spices'},{name:'garam masala',amount:1,unit:'tsp',category:'spices'},{name:'basmati rice',amount:2,unit:'cups',category:'grains'}],
    instructions:['Sauté onion until golden.','Add curry powder and garam masala; cook 1 min.','Add diced tomatoes; cook 5 min.','Add chickpeas and coconut milk; simmer 15 min.','Stir in spinach until wilted.','Serve with basmati rice.'],
    nutrition:{calories:520,protein:18,carbs:74,fat:16,fiber:13}},

  r21: { id:'r21', name:'Pasta Arrabbiata', emoji:'🍝', category:'dinner', cuisine:'Italian', prepTime:5, cookTime:25, servings:4, difficulty:'easy', tags:['vegan','spicy','classic'],
    ingredients:[{name:'penne pasta',amount:400,unit:'g',category:'grains'},{name:'tomato passata',amount:2,unit:'cups',category:'condiments'},{name:'garlic',amount:5,unit:'cloves',category:'vegetables'},{name:'red chilli flakes',amount:1,unit:'tsp',category:'spices'},{name:'olive oil',amount:3,unit:'tbsp',category:'oils'},{name:'fresh basil',amount:10,unit:'leaves',category:'herbs'},{name:'parmesan',amount:40,unit:'g',category:'dairy'}],
    instructions:['Cook penne al dente.','Sauté garlic in olive oil until golden.','Add chilli flakes; cook 30 sec.','Add passata; simmer 15 min until thick.','Toss with pasta; season well.','Serve with fresh basil and parmesan.'],
    nutrition:{calories:460,protein:14,carbs:76,fat:11,fiber:5}},

  r22: { id:'r22', name:'Stuffed Bell Peppers', emoji:'🫑', category:'dinner', cuisine:'Mediterranean', prepTime:15, cookTime:35, servings:4, difficulty:'medium', tags:['vegetarian','colorful','wholesome'],
    ingredients:[{name:'bell peppers',amount:4,unit:'pieces',category:'vegetables'},{name:'brown rice',amount:1,unit:'cup',category:'grains'},{name:'black beans',amount:1,unit:'can',category:'protein'},{name:'corn',amount:0.5,unit:'cup',category:'vegetables'},{name:'tomato sauce',amount:1,unit:'cup',category:'condiments'},{name:'cumin',amount:1,unit:'tsp',category:'spices'},{name:'cheddar cheese',amount:80,unit:'g',category:'dairy'},{name:'fresh coriander',amount:2,unit:'tbsp',category:'herbs'}],
    instructions:['Cook rice; preheat oven to 190°C.','Halve peppers lengthways; remove seeds.','Mix rice, beans, corn, tomato sauce, cumin.','Fill pepper halves with rice mixture.','Top with cheese; bake 25–30 min.','Garnish with coriander.'],
    nutrition:{calories:420,protein:16,carbs:66,fat:10,fiber:10}},

  r23: { id:'r23', name:'Mushroom Risotto', emoji:'🍄', category:'dinner', cuisine:'Italian', prepTime:10, cookTime:35, servings:4, difficulty:'medium', tags:['vegetarian','creamy','comfort'],
    ingredients:[{name:'arborio rice',amount:1.5,unit:'cups',category:'grains'},{name:'mixed mushrooms',amount:400,unit:'g',category:'vegetables'},{name:'vegetable broth',amount:5,unit:'cups',category:'liquids'},{name:'white wine',amount:0.5,unit:'cup',category:'liquids'},{name:'onion',amount:1,unit:'piece',category:'vegetables'},{name:'garlic',amount:3,unit:'cloves',category:'vegetables'},{name:'parmesan',amount:80,unit:'g',category:'dairy'},{name:'butter',amount:2,unit:'tbsp',category:'dairy'},{name:'thyme',amount:1,unit:'tsp',category:'herbs'}],
    instructions:['Sauté mushrooms until golden; set aside.','Sauté onion and garlic in butter.','Add rice; toast 2 min.','Add wine; stir until absorbed.','Add broth ladle by ladle, stirring constantly.','Stir in mushrooms, parmesan, butter.','Season and serve immediately.'],
    nutrition:{calories:480,protein:14,carbs:68,fat:14,fiber:3}},

  r24: { id:'r24', name:'Aloo Palak', emoji:'🥬', category:'dinner', cuisine:'Indian', prepTime:10, cookTime:25, servings:4, difficulty:'easy', tags:['vegan','iron-rich','comfort'],
    ingredients:[{name:'spinach',amount:4,unit:'cups',category:'vegetables'},{name:'potato',amount:3,unit:'pieces',category:'vegetables'},{name:'onion',amount:1,unit:'piece',category:'vegetables'},{name:'garlic',amount:3,unit:'cloves',category:'vegetables'},{name:'ginger',amount:1,unit:'tsp',category:'spices'},{name:'cumin seeds',amount:0.5,unit:'tsp',category:'spices'},{name:'garam masala',amount:0.5,unit:'tsp',category:'spices'},{name:'roti / flatbread',amount:4,unit:'pieces',category:'grains'}],
    instructions:['Boil potato cubes until just tender.','Blanch spinach 1 min; blend to a purée.','Sauté cumin, garlic, ginger, onion until golden.','Add potatoes; cook 3 min.','Pour in spinach purée; simmer 8 min.','Add garam masala; serve with warm roti.'],
    nutrition:{calories:350,protein:10,carbs:56,fat:8,fiber:8}},

  r25: { id:'r25', name:'Dal Tadka & Naan', emoji:'🫓', category:'dinner', cuisine:'Indian', prepTime:10, cookTime:30, servings:4, difficulty:'easy', tags:['vegan','high-protein','comfort'],
    ingredients:[{name:'yellow lentils',amount:1.5,unit:'cups',category:'protein'},{name:'onion',amount:1,unit:'piece',category:'vegetables'},{name:'tomatoes',amount:2,unit:'pieces',category:'vegetables'},{name:'garlic',amount:4,unit:'cloves',category:'vegetables'},{name:'cumin seeds',amount:1,unit:'tsp',category:'spices'},{name:'turmeric',amount:0.5,unit:'tsp',category:'spices'},{name:'naan bread',amount:4,unit:'pieces',category:'grains'},{name:'ghee',amount:2,unit:'tbsp',category:'oils'}],
    instructions:['Boil lentils with turmeric until soft (20 min).','Heat ghee; add cumin seeds until they splutter.','Add onion, garlic, tomatoes; cook until oil separates.','Pour tadka over lentils; stir well.','Simmer 5 min.','Serve with warm naan.'],
    nutrition:{calories:440,protein:20,carbs:62,fat:12,fiber:11}},

  r26: { id:'r26', name:'Pasta Primavera', emoji:'🍝', category:'dinner', cuisine:'Italian', prepTime:10, cookTime:20, servings:3, difficulty:'easy', tags:['vegetarian','spring','light'],
    ingredients:[{name:'penne pasta',amount:300,unit:'g',category:'grains'},{name:'zucchini',amount:1,unit:'piece',category:'vegetables'},{name:'cherry tomatoes',amount:1,unit:'cup',category:'vegetables'},{name:'bell pepper',amount:1,unit:'piece',category:'vegetables'},{name:'asparagus',amount:150,unit:'g',category:'vegetables'},{name:'garlic',amount:3,unit:'cloves',category:'vegetables'},{name:'olive oil',amount:3,unit:'tbsp',category:'oils'},{name:'parmesan',amount:40,unit:'g',category:'dairy'},{name:'fresh basil',amount:8,unit:'leaves',category:'herbs'}],
    instructions:['Cook pasta al dente; reserve 0.5 cup pasta water.','Sauté garlic in olive oil 1 min.','Add all vegetables; cook 5–6 min until tender.','Toss vegetables with pasta and pasta water.','Season well; top with parmesan and basil.'],
    nutrition:{calories:450,protein:15,carbs:68,fat:13,fiber:6}},

  // ── SNACKS ──
  r27: { id:'r27', name:'Hummus & Veggie Plate', emoji:'🥕', category:'snack', cuisine:'Middle Eastern', prepTime:5, cookTime:0, servings:2, difficulty:'easy', tags:['vegan','healthy','no-cook'],
    ingredients:[{name:'hummus',amount:0.5,unit:'cup',category:'condiments'},{name:'carrot',amount:2,unit:'pieces',category:'vegetables'},{name:'cucumber',amount:1,unit:'piece',category:'vegetables'},{name:'bell pepper',amount:1,unit:'piece',category:'vegetables'},{name:'celery',amount:2,unit:'stalks',category:'vegetables'},{name:'pita bread',amount:2,unit:'pieces',category:'grains'}],
    instructions:['Slice all vegetables into sticks.','Arrange on plate with hummus in center.','Serve with pita bread cut into wedges.'],
    nutrition:{calories:220,protein:8,carbs:34,fat:7,fiber:8}},

  r28: { id:'r28', name:'Trail Mix', emoji:'🥜', category:'snack', cuisine:'American', prepTime:2, cookTime:0, servings:4, difficulty:'easy', tags:['vegan','portable','energy'],
    ingredients:[{name:'mixed nuts',amount:1,unit:'cup',category:'nuts'},{name:'dried cranberries',amount:0.25,unit:'cup',category:'fruits'},{name:'dark chocolate chips',amount:2,unit:'tbsp',category:'sweets'},{name:'pumpkin seeds',amount:2,unit:'tbsp',category:'seeds'},{name:'coconut flakes',amount:2,unit:'tbsp',category:'toppings'}],
    instructions:['Combine all ingredients in a bowl.','Toss to mix.','Store in an airtight jar.'],
    nutrition:{calories:180,protein:5,carbs:16,fat:12,fiber:2}},

  r29: { id:'r29', name:'Apple & Peanut Butter', emoji:'🍎', category:'snack', cuisine:'American', prepTime:2, cookTime:0, servings:1, difficulty:'easy', tags:['quick','healthy','kid-friendly'],
    ingredients:[{name:'apple',amount:1,unit:'piece',category:'fruits'},{name:'peanut butter',amount:2,unit:'tbsp',category:'nuts'},{name:'cinnamon',amount:0.25,unit:'tsp',category:'spices'}],
    instructions:['Core and slice apple.','Dust with cinnamon.','Serve with peanut butter for dipping.'],
    nutrition:{calories:200,protein:5,carbs:28,fat:10,fiber:4}},

  r30: { id:'r30', name:'Energy Bliss Balls', emoji:'🍡', category:'snack', cuisine:'Modern', prepTime:10, cookTime:0, servings:12, difficulty:'easy', tags:['vegan','meal-prep','no-cook'],
    ingredients:[{name:'medjool dates',amount:1,unit:'cup',category:'fruits'},{name:'rolled oats',amount:1,unit:'cup',category:'grains'},{name:'almond butter',amount:3,unit:'tbsp',category:'nuts'},{name:'chia seeds',amount:2,unit:'tbsp',category:'seeds'},{name:'cocoa powder',amount:2,unit:'tbsp',category:'baking'},{name:'vanilla extract',amount:1,unit:'tsp',category:'baking'}],
    instructions:['Blend dates until a paste forms.','Mix in oats, almond butter, chia seeds, cocoa, vanilla.','Roll into 12 equal balls.','Refrigerate 30 min before serving.','Store up to 1 week in fridge.'],
    nutrition:{calories:120,protein:3,carbs:18,fat:5,fiber:3}},

  r31: { id:'r31', name:'Greek Yogurt Dip & Crackers', emoji:'🫙', category:'snack', cuisine:'Mediterranean', prepTime:5, cookTime:0, servings:2, difficulty:'easy', tags:['high-protein','quick','no-cook'],
    ingredients:[{name:'Greek yogurt',amount:200,unit:'g',category:'dairy'},{name:'whole grain crackers',amount:12,unit:'pieces',category:'grains'},{name:'cucumber',amount:0.5,unit:'piece',category:'vegetables'},{name:'dill',amount:1,unit:'tsp',category:'herbs'},{name:'garlic powder',amount:0.25,unit:'tsp',category:'spices'}],
    instructions:['Mix yogurt with dill and garlic powder.','Dice cucumber and stir in.','Serve with crackers.'],
    nutrition:{calories:190,protein:12,carbs:24,fat:4,fiber:2}},

  r32: { id:'r32', name:'Avocado Chocolate Mousse', emoji:'🍫', category:'snack', cuisine:'Modern', prepTime:8, cookTime:0, servings:2, difficulty:'easy', tags:['vegan','healthy-dessert','no-cook'],
    ingredients:[{name:'ripe avocado',amount:2,unit:'pieces',category:'fruits'},{name:'cocoa powder',amount:3,unit:'tbsp',category:'baking'},{name:'maple syrup',amount:3,unit:'tbsp',category:'sweeteners'},{name:'vanilla extract',amount:1,unit:'tsp',category:'baking'},{name:'almond milk',amount:2,unit:'tbsp',category:'dairy'}],
    instructions:['Blend all ingredients until completely smooth.','Taste and adjust sweetness.','Spoon into glasses.','Chill 15 min before serving.'],
    nutrition:{calories:240,protein:4,carbs:28,fat:15,fiber:8}}
};

/* ── RECIPE INDEX FOR QUICK LOOKUP ──────────────────────── */
const RECIPE_LIST = Object.values(RECIPES);

/* ── GROCERY CATEGORIES (display order) ─────────────────── */
const GROCERY_ORDER = ['protein','grains','dairy','vegetables','fruits','oils','condiments','spices','herbs','nuts','seeds','sweeteners','baking','liquids','toppings','sweets','misc'];

/* ── CONSTANTS ──────────────────────────────────────────── */
const PLAN_KEY    = 'meal_plan_v1';
const RECIPE_KEY  = 'meal_recipes_v1';
const GROCERY_KEY = 'meal_grocery_checked_v1';
const MEAL_SLOTS  = ['breakfast','lunch','snack','dinner'];
const SLOT_ICONS  = { breakfast:'🌅', lunch:'☀️', snack:'🌤️', dinner:'🌙' };
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ── STATE ──────────────────────────────────────────────── */
let mealPlan        = {};
let groceryChecked  = {};
let currentView     = 'week';
let currentWeekStart= null;
let currentMonth    = null;
let selectedRecipe  = null;
let pendingSlot     = null; // { date, slot }
let groceryRange    = 'week';
let filterCategory  = 'all';
let searchQuery     = '';
let activeSideTab   = 'recipes';

/* ── INIT ───────────────────────────────────────────────── */
function init() {
  loadPlan();
  loadGroceryChecked();
  persistRecipes();

  const today = todayStr();
  currentWeekStart = getMonday(today);
  currentMonth     = today.slice(0, 7);

  renderNavUser();
  renderSidebar();
  renderMainView();
  bindEvents();

  if (window.location.hash === '#grocery') {
    switchSideTab('grocery');
  }
}

/* ── DATA PERSISTENCE ───────────────────────────────────── */
function loadPlan() {
  try { mealPlan = JSON.parse(localStorage.getItem(PLAN_KEY) || '{}'); } catch { mealPlan = {}; }
}
function savePlan() { localStorage.setItem(PLAN_KEY, JSON.stringify(mealPlan)); }

function loadGroceryChecked() {
  try { groceryChecked = JSON.parse(localStorage.getItem(GROCERY_KEY) || '{}'); } catch { groceryChecked = {}; }
}
function saveGroceryChecked() { localStorage.setItem(GROCERY_KEY, JSON.stringify(groceryChecked)); }

function persistRecipes() {
  // Cache recipe data for dashboard grocery preview
  const map = {};
  RECIPE_LIST.forEach(r => { map[r.id] = { name: r.name, emoji: r.emoji, ingredients: r.ingredients }; });
  localStorage.setItem(RECIPE_KEY, JSON.stringify(map));
}

/* ── PLAN HELPERS ───────────────────────────────────────── */
function setMeal(date, slot, recipeId) {
  if (!mealPlan[date]) mealPlan[date] = {};
  if (recipeId) mealPlan[date][slot] = recipeId;
  else { delete mealPlan[date][slot]; if (!Object.keys(mealPlan[date]).length) delete mealPlan[date]; }
  savePlan();
}

function getMeal(date, slot) {
  const id = mealPlan[date] && mealPlan[date][slot];
  if (!id) return null;
  if (id.startsWith('custom:')) return { emoji: '✏️', name: id.slice(7), prepTime: 0, cookTime: 0, isCustom: true };
  return RECIPES[id] || null;
}

/* ── DATE UTILS ─────────────────────────────────────────── */
function todayStr() { return new Date().toISOString().slice(0,10); }
function dateObj(s) { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function offsetDate(s,n) { const d=dateObj(s); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function getMonday(s) { const d=dateObj(s),day=d.getDay(); d.setDate(d.getDate()-day+(day===0?-6:1)); return d.toISOString().slice(0,10); }
function getWeekDates(mon) { return Array.from({length:7},(_,i)=>offsetDate(mon,i)); }
function formatMonthYear(ym) { const [y,m]=ym.split('-'); return MONTH_NAMES[parseInt(m)-1]+' '+y; }

function getMonthDates(ym) {
  const [y,m] = ym.split('-').map(Number);
  const first = new Date(y,m-1,1), last = new Date(y,m,0);
  const startDay = first.getDay();
  const dates = [];
  // pad before
  for (let i=startDay===0?6:startDay-1; i>0; i--) { const d=new Date(first); d.setDate(d.getDate()-i); dates.push({str:d.toISOString().slice(0,10),other:true}); }
  // month days
  for (let d=new Date(first); d<=last; d.setDate(d.getDate()+1)) dates.push({str:new Date(d).toISOString().slice(0,10),other:false});
  // pad after
  const remaining = 7 - (dates.length % 7); if (remaining<7) { for (let i=1;i<=remaining;i++){const d=new Date(last);d.setDate(last.getDate()+i);dates.push({str:d.toISOString().slice(0,10),other:true});} }
  return dates;
}

/* ── NAV USER ───────────────────────────────────────────── */
function renderNavUser() {
  const user = Auth.getUser();
  if (!user) return;
  const el = document.getElementById('navUserName');
  if (el) el.textContent = user.isGuest ? 'Guest' : user.name.split(' ')[0];
}

/* ── SIDEBAR ────────────────────────────────────────────── */
function renderSidebar() {
  renderRecipePanel();
  renderGroceryPanel();
}

function renderRecipePanel() {
  const query = searchQuery.toLowerCase();
  const list  = RECIPE_LIST.filter(r => {
    const matchCat   = filterCategory === 'all' || r.category === filterCategory;
    const matchQuery = !query || r.name.toLowerCase().includes(query) || r.tags.some(t=>t.includes(query));
    return matchCat && matchQuery;
  });

  document.getElementById('recipeList').innerHTML = list.length
    ? list.map(recipeCardHTML).join('')
    : '<div style="color:var(--text3);text-align:center;padding:2rem;font-size:0.85rem;">No recipes found.</div>';

  document.querySelectorAll('.recipe-card').forEach(el => {
    el.addEventListener('click', () => openRecipeModal(el.dataset.id));
    el.addEventListener('dragstart', e => { e.dataTransfer.setData('recipeId', el.dataset.id); });
  });
}

function recipeCardHTML(r) {
  return `<div class="recipe-card" data-id="${r.id}" draggable="true">
    <div class="recipe-emoji">${r.emoji}</div>
    <div class="recipe-info">
      <div class="recipe-name">${r.name}</div>
      <div class="recipe-meta">${r.prepTime+r.cookTime} min · ${r.servings} serving${r.servings>1?'s':''}</div>
      <span class="recipe-cat-tag tag-${r.category}">${r.category}</span>
    </div>
  </div>`;
}

function renderGroceryPanel() {
  const dates = groceryRange === 'week'
    ? getWeekDates(currentWeekStart)
    : getMonthDates(currentMonth).filter(d=>!d.other).map(d=>d.str);

  const ingredientMap = {};
  dates.forEach(dt => {
    const day = mealPlan[dt] || {};
    MEAL_SLOTS.forEach(slot => {
      const rId = day[slot]; if (!rId) return;
      const r = RECIPES[rId]; if (!r) return;
      r.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase() + '_' + ing.unit;
        if (ingredientMap[key]) ingredientMap[key].amount += ing.amount;
        else ingredientMap[key] = { ...ing };
      });
    });
  });

  const items = Object.values(ingredientMap);
  const groceryPanel = document.getElementById('groceryPanel');

  if (items.length === 0) {
    groceryPanel.innerHTML = `
      <div class="grocery-week-select" id="groceryRangeBar"></div>
      <div class="grocery-empty">Plan some meals to see your grocery list here.</div>`;
    renderGroceryRangeBar();
    return;
  }

  const grouped = {};
  items.forEach(item => {
    const cat = item.category || 'misc';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const sortedCats = GROCERY_ORDER.filter(c => grouped[c]);
  const otherCats  = Object.keys(grouped).filter(c => !GROCERY_ORDER.includes(c));

  let html = '<div class="grocery-week-select" id="groceryRangeBar"></div>';
  [...sortedCats, ...otherCats].forEach(cat => {
    html += `<div class="grocery-section-title">${cat.charAt(0).toUpperCase()+cat.slice(1)}</div>`;
    grouped[cat].forEach(item => {
      const key  = item.name.toLowerCase()+'_'+item.unit;
      const done = groceryChecked[key];
      const amt  = Number.isInteger(item.amount) ? item.amount : item.amount.toFixed(1);
      html += `<div class="grocery-item${done?' checked':''}" data-key="${key}">
        <input type="checkbox" ${done?'checked':''}>
        <span>${item.name}</span>
        <span class="grocery-amount">${amt} ${item.unit}</span>
      </div>`;
    });
  });

  html += `<button class="grocery-export-btn" id="exportGroceryBtn">📋 Export Grocery List</button>`;
  groceryPanel.innerHTML = html;

  renderGroceryRangeBar();

  groceryPanel.querySelectorAll('.grocery-item').forEach(el => {
    el.querySelector('input').addEventListener('change', e => {
      const key = el.dataset.key;
      groceryChecked[key] = e.target.checked;
      el.classList.toggle('checked', e.target.checked);
      saveGroceryChecked();
    });
  });

  document.getElementById('exportGroceryBtn')?.addEventListener('click', exportGroceryList);
}

function renderGroceryRangeBar() {
  const bar = document.getElementById('groceryRangeBar');
  if (!bar) return;
  bar.innerHTML = `
    <button class="gw-btn${groceryRange==='week'?' active':''}" data-range="week">This Week</button>
    <button class="gw-btn${groceryRange==='month'?' active':''}" data-range="month">This Month</button>`;
  bar.querySelectorAll('.gw-btn').forEach(btn => {
    btn.addEventListener('click', () => { groceryRange = btn.dataset.range; renderGroceryPanel(); });
  });
}

function exportGroceryList() {
  const dates = groceryRange === 'week'
    ? getWeekDates(currentWeekStart)
    : getMonthDates(currentMonth).filter(d=>!d.other).map(d=>d.str);

  const ingredientMap = {};
  dates.forEach(dt => {
    const day = mealPlan[dt]||{};
    MEAL_SLOTS.forEach(slot => {
      const r = RECIPES[day[slot]]; if (!r) return;
      r.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase()+'_'+ing.unit;
        if (ingredientMap[key]) ingredientMap[key].amount += ing.amount;
        else ingredientMap[key] = { ...ing };
      });
    });
  });

  const lines = ['GROCERY LIST', '============', ''];
  const grouped = {};
  Object.values(ingredientMap).forEach(i => { const c=i.category||'misc'; if(!grouped[c])grouped[c]=[]; grouped[c].push(i); });
  [...GROCERY_ORDER,...Object.keys(grouped).filter(c=>!GROCERY_ORDER.includes(c))].filter(c=>grouped[c]).forEach(cat => {
    lines.push(cat.toUpperCase()); grouped[cat].forEach(i => { const a=Number.isInteger(i.amount)?i.amount:i.amount.toFixed(1); lines.push(`  - ${i.name}: ${a} ${i.unit}`); }); lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href=url; a.download=`grocery-list-${todayStr()}.txt`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('✅ Grocery list exported!');
}

/* ── MAIN VIEWS ─────────────────────────────────────────── */
function renderMainView() {
  if (currentView === 'week') renderWeekView();
  else renderMonthView();
  document.getElementById('weekView').style.display  = currentView==='week'  ? 'block' : 'none';
  document.getElementById('monthView').style.display = currentView==='month' ? 'block' : 'none';
  updateViewTitle();
}

function updateViewTitle() {
  const el = document.getElementById('viewTitle');
  if (currentView === 'week') {
    const dates = getWeekDates(currentWeekStart);
    const start = dateObj(dates[0]), end = dateObj(dates[6]);
    el.textContent = `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
  } else {
    el.textContent = formatMonthYear(currentMonth);
  }
}

/* ── WEEK VIEW ──────────────────────────────────────────── */
function renderWeekView() {
  const dates = getWeekDates(currentWeekStart);
  const today = todayStr();
  const grid  = document.getElementById('weekGrid');

  grid.innerHTML = dates.map(dt => {
    const d      = dateObj(dt);
    const isToday= dt === today;
    const cols   = MEAL_SLOTS.map(slot => {
      const recipe = getMeal(dt, slot);
      return slotHTML(dt, slot, recipe);
    }).join('');

    return `<div class="day-column">
      <div class="day-header${isToday?' is-today':''}">
        <div class="day-name">${DAY_SHORT[d.getDay()]}</div>
        <div class="day-num">${d.getDate()}</div>
      </div>
      ${cols}
    </div>`;
  }).join('');

  // Bind slot events
  grid.querySelectorAll('.meal-slot').forEach(el => {
    el.addEventListener('click', () => { if (!el.classList.contains('has-recipe')) openSlotPicker(el.dataset.date, el.dataset.slot); });
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('drag-over');
      const rId = e.dataTransfer.getData('recipeId');
      if (rId) { assignRecipe(el.dataset.date, el.dataset.slot, rId); }
    });
  });

  grid.querySelectorAll('.slot-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setMeal(btn.dataset.date, btn.dataset.slot, null);
      renderWeekView(); renderGroceryPanel();
    });
  });
}

function slotHTML(date, slot, recipe) {
  if (recipe) {
    const timeRow = recipe.isCustom ? '' : `<div class="slot-time">${recipe.prepTime+recipe.cookTime} min</div>`;
    return `<div class="meal-slot has-recipe" data-date="${date}" data-slot="${slot}">
      <button class="slot-remove" data-date="${date}" data-slot="${slot}" title="Remove">✕</button>
      <div class="slot-label">${SLOT_ICONS[slot]} ${slot}</div>
      <span class="slot-emoji">${recipe.emoji}</span>
      <div class="slot-name">${recipe.name}</div>
      ${timeRow}
    </div>`;
  }
  return `<div class="meal-slot" data-date="${date}" data-slot="${slot}">
    <div class="slot-label">${SLOT_ICONS[slot]} ${slot}</div>
    <div class="slot-empty">+ Add</div>
  </div>`;
}

/* ── MONTH VIEW ─────────────────────────────────────────── */
function renderMonthView() {
  const dates = getMonthDates(currentMonth);
  const today = todayStr();
  const grid  = document.getElementById('monthGrid');

  grid.innerHTML = dates.map(({ str, other }) => {
    const d      = dateObj(str);
    const isToday= str === today;
    const day    = mealPlan[str] || {};
    const meals  = MEAL_SLOTS.map(s => {
      const id = day[s]; if (!id) return '';
      const r = id.startsWith('custom:') ? { emoji: '✏️', name: id.slice(7) } : RECIPES[id];
      return r ? `<div class="mc-pill">${r.emoji} ${r.name}</div>` : '';
    }).filter(Boolean).join('');

    return `<div class="month-cell${isToday?' is-today':''}${other?' other-month':''}" data-date="${str}">
      <div class="mc-date">${d.getDate()}</div>
      <div class="mc-meal-pills">${meals}</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.month-cell').forEach(el => {
    el.addEventListener('click', () => {
      // jump to week view for this date
      currentWeekStart = getMonday(el.dataset.date);
      currentView = 'week';
      document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view==='week'));
      renderMainView();
    });
  });
}

/* ── RECIPE MODAL ───────────────────────────────────────── */
function openRecipeModal(recipeId) {
  const r = RECIPES[recipeId];
  if (!r) return;
  selectedRecipe = r;

  document.getElementById('modalEmoji').textContent  = r.emoji;
  document.getElementById('modalTitle').textContent  = r.name;
  document.getElementById('modalPrepTime').textContent = r.prepTime + ' min';
  document.getElementById('modalCookTime').textContent = r.cookTime + ' min';
  document.getElementById('modalServings').textContent = r.servings;
  document.getElementById('modalCalories').textContent = r.nutrition.calories;
  document.getElementById('modalProtein').textContent  = r.nutrition.protein + 'g';
  document.getElementById('modalCarbs').textContent    = r.nutrition.carbs + 'g';
  document.getElementById('modalFat').textContent      = r.nutrition.fat + 'g';
  document.getElementById('modalFiber').textContent    = r.nutrition.fiber + 'g';

  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = [`<span class="modal-tag tag-${r.category}">${r.category}</span>`,
    ...r.tags.map(t=>`<span class="modal-tag" style="background:var(--surface2);color:var(--text2)">${t}</span>`)].join('');

  document.getElementById('modalIngredients').innerHTML = r.ingredients.map(ing =>
    `<li class="ingredient-item"><span class="ing-amount">${Number.isInteger(ing.amount)?ing.amount:ing.amount.toFixed(1)} ${ing.unit}</span> ${ing.name}</li>`
  ).join('');

  document.getElementById('modalInstructions').innerHTML = r.instructions.map(step =>
    `<li class="instruction-item">${step}</li>`
  ).join('');

  // Assign buttons - show slots for current week
  const dates = getWeekDates(currentWeekStart);
  const assignSlots = document.getElementById('assignSlots');
  assignSlots.innerHTML = dates.map(dt => {
    const d = dateObj(dt);
    return MEAL_SLOTS.map(slot =>
      `<button class="assign-slot-btn" data-date="${dt}" data-slot="${slot}">${DAY_SHORT[d.getDay()]} ${SLOT_ICONS[slot]} ${slot}</button>`
    ).join('');
  }).join('');

  assignSlots.querySelectorAll('.assign-slot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      assignRecipe(btn.dataset.date, btn.dataset.slot, r.id);
      closeRecipeModal();
    });
  });

  document.getElementById('recipeModal').classList.add('open');
}

function closeRecipeModal() { document.getElementById('recipeModal').classList.remove('open'); selectedRecipe=null; }

/* ── SLOT PICKER MODAL ──────────────────────────────────── */
function openSlotPicker(date, slot) {
  pendingSlot = { date, slot };
  const d = dateObj(date);
  document.getElementById('slotPickerTitle').textContent = `${DAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  document.getElementById('slotPickerSub').textContent   = `Pick a recipe for ${SLOT_ICONS[slot]} ${slot}`;

  // Show filtered recipes for that slot category (or all)
  const preferred = RECIPE_LIST.filter(r => r.category === slot).slice(0, 4);
  const others    = RECIPE_LIST.filter(r => r.category !== slot).slice(0, 4);
  const show      = preferred.length >= 2 ? preferred.slice(0,4) : [...preferred, ...others].slice(0,4);

  document.getElementById('slotPickerGrid').innerHTML = show.map(r =>
    `<button class="slot-picker-btn" data-id="${r.id}">${r.emoji} ${r.name}</button>`
  ).join('');

  document.querySelectorAll('.slot-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      assignRecipe(pendingSlot.date, pendingSlot.slot, btn.dataset.id);
      closeSlotPicker();
    });
  });

  document.getElementById('slotCustomInput').value = '';
  document.getElementById('slotPickerModal').classList.add('open');
}

function closeSlotPicker() { document.getElementById('slotPickerModal').classList.remove('open'); pendingSlot=null; }

/* ── ASSIGN RECIPE ──────────────────────────────────────── */
function assignRecipe(date, slot, recipeId) {
  setMeal(date, slot, recipeId);
  renderWeekView();
  if (currentView==='month') renderMonthView();
  renderGroceryPanel();
  const r = RECIPES[recipeId];
  if (r) showToast(`${r.emoji} ${r.name} added to ${slot}`);
}

function assignCustomMeal(date, slot, name) {
  setMeal(date, slot, 'custom:' + name);
  renderWeekView();
  if (currentView==='month') renderMonthView();
  renderGroceryPanel();
  showToast(`✏️ "${name}" added to ${slot}`);
}

/* ── SIDEBAR TAB SWITCH ─────────────────────────────────── */
function switchSideTab(tab) {
  activeSideTab = tab;
  document.querySelectorAll('.sidebar-tab').forEach(el => el.classList.toggle('active', el.dataset.tab===tab));
  document.querySelectorAll('.sidebar-panel').forEach(el => el.classList.toggle('active', el.id===tab+'Panel'));
}

/* ── TOAST ──────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── EVENT BINDING ──────────────────────────────────────── */
function bindEvents() {
  // Sidebar tabs
  document.querySelectorAll('.sidebar-tab').forEach(el => {
    el.addEventListener('click', () => switchSideTab(el.dataset.tab));
  });

  // Search
  document.getElementById('recipeSearch').addEventListener('input', e => {
    searchQuery = e.target.value; renderRecipePanel();
  });

  // Filter pills
  document.querySelectorAll('.filter-pill').forEach(el => {
    el.addEventListener('click', () => {
      filterCategory = el.dataset.cat;
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p.dataset.cat===filterCategory));
      renderRecipePanel();
    });
  });

  // View toggle
  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view===currentView));
      renderMainView();
    });
  });

  // Week/Month navigation
  document.getElementById('prevPeriod').addEventListener('click', () => {
    if (currentView==='week') currentWeekStart = offsetDate(currentWeekStart, -7);
    else { const [y,m]=currentMonth.split('-').map(Number); const d=new Date(y,m-2,1); currentMonth=d.toISOString().slice(0,7); }
    renderMainView();
  });
  document.getElementById('nextPeriod').addEventListener('click', () => {
    if (currentView==='week') currentWeekStart = offsetDate(currentWeekStart, 7);
    else { const [y,m]=currentMonth.split('-').map(Number); const d=new Date(y,m,1); currentMonth=d.toISOString().slice(0,7); }
    renderMainView();
  });
  document.getElementById('todayBtn').addEventListener('click', () => {
    const today = todayStr();
    currentWeekStart = getMonday(today);
    currentMonth     = today.slice(0,7);
    renderMainView();
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeRecipeModal);
  document.getElementById('recipeModal').addEventListener('click', e => { if(e.target===document.getElementById('recipeModal')) closeRecipeModal(); });
  document.getElementById('slotPickerModal').addEventListener('click', e => { if(e.target===document.getElementById('slotPickerModal')) closeSlotPicker(); });
  document.getElementById('slotPickerCancel').addEventListener('click', closeSlotPicker);

  // Custom meal entry
  document.getElementById('slotCustomBtn').addEventListener('click', () => {
    const name = document.getElementById('slotCustomInput').value.trim();
    if (!name || !pendingSlot) return;
    assignCustomMeal(pendingSlot.date, pendingSlot.slot, name);
    closeSlotPicker();
  });
  document.getElementById('slotCustomInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const name = e.target.value.trim();
      if (!name || !pendingSlot) return;
      assignCustomMeal(pendingSlot.date, pendingSlot.slot, name);
      closeSlotPicker();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
