/**
 * Menu data keyed by restaurant ID.
 * Swap individual entries for DB calls once menus table is ready.
 */

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  popular?: boolean;
  veg?: boolean;
}

export interface MenuSection {
  category: string;
  emoji: string;
  items: MenuItem[];
}

const MENUS: Record<string, MenuSection[]> = {
  /* ── NEWCASTLE EATS ── */
  "nce-01": [
    {
      category: "Starters",
      emoji: "🥗",
      items: [
        { id: "n01-s1", name: "Garlic Dough Balls", description: "6 warm dough balls with garlic butter & herb dip", price: "£5.50", popular: true, veg: true },
        { id: "n01-s2", name: "Bruschetta", description: "Toasted ciabatta with tomatoes, basil & balsamic", price: "£5.00", veg: true },
        { id: "n01-s3", name: "Chicken Wings", description: "Crispy wings tossed in BBQ or hot sauce", price: "£7.50" },
      ],
    },
    {
      category: "Pizzas",
      emoji: "🍕",
      items: [
        { id: "n01-p1", name: "Margherita", description: "San Marzano tomato, fior di latte mozzarella, fresh basil", price: "£11.50", popular: true, veg: true },
        { id: "n01-p2", name: "Pepperoni Feast", description: "Double pepperoni, mozzarella, tomato sauce", price: "£13.50", popular: true },
        { id: "n01-p3", name: "BBQ Chicken", description: "Smoky BBQ base, grilled chicken, red onion, sweetcorn", price: "£13.00" },
        { id: "n01-p4", name: "Veggie Supreme", description: "Roasted peppers, mushrooms, olives, spinach, mozzarella", price: "£12.00", veg: true },
        { id: "n01-p5", name: "Meat Feast", description: "Pepperoni, beef, chicken, sausage, mozzarella", price: "£15.00" },
      ],
    },
    {
      category: "Sides",
      emoji: "🍟",
      items: [
        { id: "n01-sd1", name: "Chunky Chips", description: "Skin-on fries with sea salt", price: "£3.50", veg: true },
        { id: "n01-sd2", name: "Coleslaw", description: "House-made creamy coleslaw", price: "£2.50", veg: true },
        { id: "n01-sd3", name: "Garlic Bread", description: "Toasted baguette with garlic butter", price: "£3.00", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "n01-d1", name: "Coca-Cola", description: "330ml can", price: "£2.00" },
        { id: "n01-d2", name: "Lemonade", description: "330ml can", price: "£2.00" },
        { id: "n01-d3", name: "Water", description: "500ml still or sparkling", price: "£1.50", veg: true },
      ],
    },
  ],

  "nce-02": [
    {
      category: "Starters",
      emoji: "🧅",
      items: [
        { id: "n02-s1", name: "Onion Rings", description: "Beer-battered crispy onion rings with dipping sauce", price: "£4.50", veg: true },
        { id: "n02-s2", name: "Loaded Nachos", description: "Tortilla chips with cheese, jalapeños, salsa & sour cream", price: "£6.50", veg: true },
        { id: "n02-s3", name: "Chicken Strips", description: "Crispy southern-fried chicken tenders with honey mustard", price: "£6.00", popular: true },
      ],
    },
    {
      category: "Burgers",
      emoji: "🍔",
      items: [
        { id: "n02-b1", name: "Classic Smash", description: "Double smashed beef patty, American cheese, pickles, onions", price: "£10.50", popular: true },
        { id: "n02-b2", name: "BBQ Bacon Burger", description: "Beef patty, streaky bacon, BBQ sauce, crispy onions", price: "£12.00", popular: true },
        { id: "n02-b3", name: "Crispy Chicken Burger", description: "Panko chicken breast, slaw, sriracha mayo", price: "£11.00" },
        { id: "n02-b4", name: "Veggie Burger", description: "Beyond Meat patty, lettuce, tomato, vegan mayo", price: "£10.00", veg: true },
      ],
    },
    {
      category: "Sides",
      emoji: "🍟",
      items: [
        { id: "n02-sd1", name: "Skin-on Fries", description: "Crispy seasoned fries", price: "£3.00", veg: true },
        { id: "n02-sd2", name: "Mac & Cheese Bites", description: "Crispy battered mac & cheese balls", price: "£4.50", veg: true },
        { id: "n02-sd3", name: "Sweet Potato Fries", description: "With chipotle dip", price: "£3.50", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "n02-d1", name: "Milkshake", description: "Vanilla, chocolate or strawberry", price: "£4.50" },
        { id: "n02-d2", name: "Soft Drink", description: "Coke, Fanta or Sprite 330ml", price: "£2.00" },
        { id: "n02-d3", name: "Water", description: "500ml still", price: "£1.50" },
      ],
    },
  ],

  "nce-03": [
    {
      category: "Starters",
      emoji: "🥟",
      items: [
        { id: "n03-s1", name: "Edamame", description: "Steamed salted edamame beans", price: "£4.00", popular: true, veg: true },
        { id: "n03-s2", name: "Gyoza (6pcs)", description: "Pan-fried pork & vegetable dumplings with ponzu", price: "£6.50" },
        { id: "n03-s3", name: "Miso Soup", description: "Traditional white miso with tofu & wakame", price: "£3.50", veg: true },
      ],
    },
    {
      category: "Sushi Rolls",
      emoji: "🍣",
      items: [
        { id: "n03-r1", name: "California Roll (8pcs)", description: "Crab, avocado & cucumber with sesame", price: "£9.50", popular: true },
        { id: "n03-r2", name: "Spicy Tuna Roll (8pcs)", description: "Fresh tuna, spicy mayo, cucumber", price: "£11.00", popular: true },
        { id: "n03-r3", name: "Dragon Roll (8pcs)", description: "Prawn tempura, avocado on top, eel sauce", price: "£13.00" },
        { id: "n03-r4", name: "Veggie Roll (8pcs)", description: "Avocado, cucumber, carrot, pickled radish", price: "£8.50", veg: true },
      ],
    },
    {
      category: "Sashimi & Nigiri",
      emoji: "🐟",
      items: [
        { id: "n03-n1", name: "Salmon Nigiri (2pcs)", description: "Fresh Atlantic salmon on seasoned rice", price: "£5.50" },
        { id: "n03-n2", name: "Tuna Sashimi (5pcs)", description: "Premium yellowfin tuna slices", price: "£9.00" },
        { id: "n03-n3", name: "Sashimi Platter", description: "Chef's selection of 12 pieces of fresh sashimi", price: "£18.00", popular: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🍵",
      items: [
        { id: "n03-d1", name: "Green Tea", description: "Sencha hot green tea", price: "£2.50", veg: true },
        { id: "n03-d2", name: "Ramune", description: "Japanese soda — original or melon", price: "£3.00" },
        { id: "n03-d3", name: "Mango Juice", description: "Chilled mango nectar", price: "£2.50" },
      ],
    },
  ],

  "nce-04": [
    {
      category: "Starters",
      emoji: "🫓",
      items: [
        { id: "n04-s1", name: "Poppadoms & Chutneys", description: "Crispy poppadoms with mango chutney & mint raita", price: "£3.00", veg: true },
        { id: "n04-s2", name: "Samosa (2pcs)", description: "Crispy vegetable samosas with tamarind dip", price: "£4.50", veg: true },
        { id: "n04-s3", name: "Chicken Tikka Starter", description: "Marinated chicken tikka bites from the tandoor", price: "£7.00", popular: true },
      ],
    },
    {
      category: "Curries",
      emoji: "🍛",
      items: [
        { id: "n04-c1", name: "Chicken Tikka Masala", description: "Classic creamy tomato-based curry with tender chicken", price: "£12.50", popular: true },
        { id: "n04-c2", name: "Lamb Rogan Josh", description: "Slow-cooked lamb in Kashmiri spices", price: "£13.50" },
        { id: "n04-c3", name: "Saag Paneer", description: "Spinach and Indian cottage cheese curry", price: "£10.50", veg: true },
        { id: "n04-c4", name: "Prawn Madras", description: "Hot & fiery prawn curry with coconut", price: "£13.00" },
      ],
    },
    {
      category: "Breads & Rice",
      emoji: "🫓",
      items: [
        { id: "n04-b1", name: "Garlic Naan", description: "Freshly baked in tandoor with garlic butter", price: "£3.00", veg: true },
        { id: "n04-b2", name: "Pilau Rice", description: "Fragrant basmati rice with whole spices", price: "£3.50", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "n04-d1", name: "Mango Lassi", description: "Chilled yoghurt & mango drink", price: "£3.50", veg: true },
        { id: "n04-d2", name: "Still Water", description: "500ml", price: "£1.50" },
      ],
    },
  ],

  "nce-05": [
    {
      category: "Starters",
      emoji: "🥢",
      items: [
        { id: "n05-s1", name: "Spring Rolls (4pcs)", description: "Crispy vegetable spring rolls with sweet chilli", price: "£5.00", veg: true },
        { id: "n05-s2", name: "Prawn Toast (4pcs)", description: "Sesame-coated prawn toast, deep fried golden", price: "£5.50", popular: true },
        { id: "n05-s3", name: "Wonton Soup", description: "Pork wontons in clear chicken broth", price: "£5.50" },
      ],
    },
    {
      category: "Mains",
      emoji: "🍜",
      items: [
        { id: "n05-m1", name: "Beef Chow Mein", description: "Stir-fried egg noodles with beef & vegetables", price: "£10.50", popular: true },
        { id: "n05-m2", name: "Sweet & Sour Chicken", description: "Crispy chicken balls in classic sweet & sour sauce", price: "£10.00", popular: true },
        { id: "n05-m3", name: "Crispy Aromatic Duck (half)", description: "Served with pancakes, cucumber & hoisin sauce", price: "£18.00" },
        { id: "n05-m4", name: "Tofu & Vegetable Stir-fry", description: "Seasonal veg & tofu in garlic sauce", price: "£9.00", veg: true },
      ],
    },
    {
      category: "Rice",
      emoji: "🍚",
      items: [
        { id: "n05-r1", name: "Egg Fried Rice", description: "Wok-tossed rice with egg & spring onion", price: "£3.50", veg: true },
        { id: "n05-r2", name: "Special Fried Rice", description: "Rice with chicken, prawn, egg & peas", price: "£4.50" },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "n05-d1", name: "Jasmine Tea", description: "Pot of fragrant jasmine tea", price: "£2.50", veg: true },
        { id: "n05-d2", name: "Soft Drink", description: "Coke, Sprite or Fanta 330ml", price: "£2.00" },
      ],
    },
  ],

  "nce-06": [
    {
      category: "Bowls & Salads",
      emoji: "🥗",
      items: [
        { id: "n06-b1", name: "Quinoa Power Bowl", description: "Quinoa, roasted veg, chickpeas, tahini dressing", price: "£10.50", popular: true, veg: true },
        { id: "n06-b2", name: "Grilled Chicken Salad", description: "Mixed leaves, chicken, avocado, cherry tomatoes", price: "£11.00", popular: true },
        { id: "n06-b3", name: "Falafel Wrap", description: "Crispy falafel, hummus, tabbouleh in flatbread", price: "£8.50", veg: true },
      ],
    },
    {
      category: "Juices & Smoothies",
      emoji: "🥤",
      items: [
        { id: "n06-j1", name: "Green Smoothie", description: "Spinach, banana, apple, ginger & lemon", price: "£5.00", veg: true },
        { id: "n06-j2", name: "Berry Blast", description: "Mixed berries, yoghurt, honey & oat milk", price: "£5.00", veg: true },
        { id: "n06-j3", name: "Cold-Pressed OJ", description: "Freshly pressed orange juice", price: "£3.50", veg: true },
      ],
    },
    {
      category: "Snacks",
      emoji: "🫐",
      items: [
        { id: "n06-s1", name: "Hummus & Crudités", description: "House hummus with carrot, celery & peppers", price: "£5.50", veg: true },
        { id: "n06-s2", name: "Granola Bar", description: "Oat & honey bar with seeds", price: "£2.50", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "☕",
      items: [
        { id: "n06-d1", name: "Oat Flat White", description: "Double espresso with oat milk", price: "£3.50", veg: true },
        { id: "n06-d2", name: "Herbal Tea", description: "Peppermint, chamomile or ginger", price: "£2.50", veg: true },
      ],
    },
  ],

  /* ── KILKEEL EATS ── */
  "kke-01": [
    {
      category: "Starters",
      emoji: "🦐",
      items: [
        { id: "k01-s1", name: "Prawn Cocktail", description: "Atlantic prawns with Marie Rose sauce & brown bread", price: "£7.50", popular: true },
        { id: "k01-s2", name: "Fishcake", description: "Homemade cod & potato fishcake with tartare sauce", price: "£6.50", popular: true },
        { id: "k01-s3", name: "Crab Claws (6pcs)", description: "Garlic butter crab claws with crusty bread", price: "£9.00" },
      ],
    },
    {
      category: "Fish & Chips",
      emoji: "🐟",
      items: [
        { id: "k01-f1", name: "Classic Cod & Chips", description: "Large Atlantic cod in light batter with chips & mushy peas", price: "£12.50", popular: true },
        { id: "k01-f2", name: "Haddock & Chips", description: "Fresh haddock fillet, golden batter, chips", price: "£12.00", popular: true },
        { id: "k01-f3", name: "Scampi & Chips", description: "Breaded wholetail scampi with tartare sauce", price: "£11.50" },
      ],
    },
    {
      category: "Seafood Mains",
      emoji: "🦞",
      items: [
        { id: "k01-m1", name: "Grilled Salmon", description: "Atlantic salmon fillet with lemon butter & seasonal veg", price: "£15.00" },
        { id: "k01-m2", name: "Seafood Chowder & Bread", description: "Creamy chowder with cod, prawns & mussels", price: "£11.00", popular: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "k01-d1", name: "Sparkling Water", description: "330ml", price: "£1.50" },
        { id: "k01-d2", name: "Soft Drink", description: "Coke, Fanta or 7Up 330ml", price: "£2.00" },
        { id: "k01-d3", name: "Orange Juice", description: "Freshly squeezed 250ml", price: "£2.50" },
      ],
    },
  ],

  "kke-02": [
    {
      category: "Starters",
      emoji: "🍲",
      items: [
        { id: "k02-s1", name: "Vegetable Soup & Soda Bread", description: "Homemade vegetable broth with freshly baked soda bread", price: "£5.50", popular: true, veg: true },
        { id: "k02-s2", name: "Black Pudding Stack", description: "Grilled Clonakilty black pudding with caramelised onion", price: "£6.00" },
      ],
    },
    {
      category: "Mains",
      emoji: "🍖",
      items: [
        { id: "k02-m1", name: "Ulster Fry", description: "Sausages, bacon, eggs, black pudding, soda & potato bread", price: "£11.00", popular: true },
        { id: "k02-m2", name: "Irish Stew", description: "Slow-cooked lamb with root vegetables & barley", price: "£13.00", popular: true },
        { id: "k02-m3", name: "Beef & Guinness Pie", description: "Rich beef stew in shortcrust pastry with colcannon", price: "£13.50" },
        { id: "k02-m4", name: "Chicken & Leek Casserole", description: "Creamy chicken with leeks & herb dumplings", price: "£12.50" },
      ],
    },
    {
      category: "Sides",
      emoji: "🥔",
      items: [
        { id: "k02-sd1", name: "Colcannon", description: "Mashed potato with cabbage & butter", price: "£3.50", veg: true },
        { id: "k02-sd2", name: "Soda Bread", description: "Two slices of homemade soda bread", price: "£2.00", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "☕",
      items: [
        { id: "k02-d1", name: "Barry's Tea", description: "A proper Irish cuppa with milk", price: "£2.00", veg: true },
        { id: "k02-d2", name: "Soft Drink", description: "330ml can", price: "£2.00" },
      ],
    },
  ],

  "kke-03": [
    {
      category: "Starters",
      emoji: "🥑",
      items: [
        { id: "k03-s1", name: "Guacamole & Chips", description: "Freshly made guacamole with tortilla chips", price: "£5.50", popular: true, veg: true },
        { id: "k03-s2", name: "Queso Dip", description: "Warm cheese dip with jalapeños & tortilla chips", price: "£5.00", veg: true },
        { id: "k03-s3", name: "Elote (Corn)", description: "Mexican street corn with cotija, chilli & lime", price: "£4.50", veg: true },
      ],
    },
    {
      category: "Tacos (3pcs)",
      emoji: "🌮",
      items: [
        { id: "k03-t1", name: "Carne Asada Tacos", description: "Grilled beef, onion, coriander, salsa verde in soft tortilla", price: "£10.00", popular: true },
        { id: "k03-t2", name: "Al Pastor Tacos", description: "Marinated pork, pineapple, red onion, coriander", price: "£10.00", popular: true },
        { id: "k03-t3", name: "Fish Tacos", description: "Crispy battered cod, lime slaw, chipotle mayo", price: "£10.50" },
        { id: "k03-t4", name: "Veggie Tacos", description: "Roasted peppers, black beans, corn, avocado", price: "£9.00", veg: true },
      ],
    },
    {
      category: "Burritos",
      emoji: "🌯",
      items: [
        { id: "k03-b1", name: "Chicken Burrito", description: "Grilled chicken, rice, black beans, cheese, sour cream", price: "£11.50", popular: true },
        { id: "k03-b2", name: "Beef Burrito", description: "Seasoned beef, rice, pico de gallo, jalapeños, cheese", price: "£12.00" },
        { id: "k03-b3", name: "Veggie Burrito", description: "Roasted veg, beans, rice, guacamole, cheese", price: "£10.00", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "k03-d1", name: "Horchata", description: "Chilled rice milk with cinnamon", price: "£3.50", veg: true },
        { id: "k03-d2", name: "Agua Fresca", description: "Watermelon or hibiscus", price: "£3.00", veg: true },
        { id: "k03-d3", name: "Soft Drink", description: "330ml can", price: "£2.00" },
      ],
    },
  ],

  "kke-04": [
    {
      category: "Starters",
      emoji: "🫓",
      items: [
        { id: "k04-s1", name: "Poppadoms & Chutney", description: "With mango chutney & mint raita", price: "£3.00", veg: true },
        { id: "k04-s2", name: "Onion Bhaji (3pcs)", description: "Crispy spiced onion fritters", price: "£5.00", popular: true, veg: true },
      ],
    },
    {
      category: "Mains",
      emoji: "🍛",
      items: [
        { id: "k04-m1", name: "Butter Chicken", description: "Mild creamy tomato curry with tender chicken", price: "£12.00", popular: true },
        { id: "k04-m2", name: "Lamb Vindaloo", description: "Hot & spicy slow-cooked lamb curry", price: "£13.00" },
        { id: "k04-m3", name: "Dal Makhani", description: "Slow-cooked black lentils in butter & cream", price: "£9.50", veg: true },
      ],
    },
    {
      category: "Breads",
      emoji: "🫓",
      items: [
        { id: "k04-b1", name: "Peshwari Naan", description: "Sweet coconut & almond stuffed naan", price: "£3.50", veg: true },
        { id: "k04-b2", name: "Plain Naan", description: "Freshly baked in tandoor", price: "£2.50", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "k04-d1", name: "Lassi", description: "Sweet or salted yoghurt drink", price: "£3.00", veg: true },
        { id: "k04-d2", name: "Still Water", description: "500ml", price: "£1.50" },
      ],
    },
  ],

  "kke-05": [
    {
      category: "Starters",
      emoji: "🧅",
      items: [
        { id: "k05-s1", name: "Mozzarella Sticks (5pcs)", description: "Breaded mozzarella with marinara dip", price: "£5.50", veg: true },
        { id: "k05-s2", name: "Chicken Wings (8pcs)", description: "Choice of BBQ, buffalo or plain with blue cheese dip", price: "£8.00", popular: true },
      ],
    },
    {
      category: "Burgers",
      emoji: "🍔",
      items: [
        { id: "k05-b1", name: "The Kilkeel Classic", description: "Beef patty, cheese, pickles, mustard, ketchup", price: "£10.50", popular: true },
        { id: "k05-b2", name: "Double Stack", description: "Two smashed beef patties, double cheese, special sauce", price: "£13.00", popular: true },
        { id: "k05-b3", name: "Spicy Chicken Fillet", description: "Crispy chicken, sriracha slaw, pickled cucumber", price: "£11.00" },
      ],
    },
    {
      category: "Sides",
      emoji: "🍟",
      items: [
        { id: "k05-sd1", name: "Loaded Fries", description: "Cheese sauce, bacon bits & jalapeños", price: "£5.00" },
        { id: "k05-sd2", name: "Regular Fries", description: "Classic salted fries", price: "£3.00", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "k05-d1", name: "Milkshake", description: "Vanilla, chocolate or strawberry", price: "£4.50" },
        { id: "k05-d2", name: "Soft Drink", description: "330ml can", price: "£2.00" },
      ],
    },
  ],

  "kke-06": [
    {
      category: "Waffles",
      emoji: "🧇",
      items: [
        { id: "k06-w1", name: "Nutella Waffle", description: "Belgian waffle with Nutella, banana & whipped cream", price: "£8.50", popular: true, veg: true },
        { id: "k06-w2", name: "Lotus Biscoff Waffle", description: "Waffle with Biscoff spread, cookie crumble & ice cream", price: "£9.00", popular: true, veg: true },
        { id: "k06-w3", name: "Strawberry & Cream", description: "Waffle with fresh strawberries, chantilly cream", price: "£8.00", veg: true },
      ],
    },
    {
      category: "Crepes",
      emoji: "🥞",
      items: [
        { id: "k06-c1", name: "Lemon & Sugar Crepe", description: "Classic thin crepe with fresh lemon & sugar", price: "£6.00", veg: true },
        { id: "k06-c2", name: "Chocolate Hazelnut Crepe", description: "Nutella, roasted hazelnuts, vanilla ice cream", price: "£7.50", veg: true },
      ],
    },
    {
      category: "Ice Cream",
      emoji: "🍦",
      items: [
        { id: "k06-i1", name: "Sundae", description: "3 scoops of ice cream with sauce & toppings", price: "£6.50", veg: true },
        { id: "k06-i2", name: "Dessert Box", description: "Brownie, cookie, ice cream & sauce of your choice", price: "£9.00", popular: true, veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "☕",
      items: [
        { id: "k06-d1", name: "Hot Chocolate", description: "Creamy hot chocolate with marshmallows", price: "£3.50", veg: true },
        { id: "k06-d2", name: "Iced Latte", description: "Espresso over ice with milk", price: "£3.50" },
      ],
    },
  ],

  /* ── DOWNPATRICK EATS ── */
  "dpe-01": [
    {
      category: "Starters",
      emoji: "🥗",
      items: [
        { id: "d01-s1", name: "Caesar Salad", description: "Cos lettuce, croutons, parmesan, caesar dressing", price: "£7.50", veg: true },
        { id: "d01-s2", name: "Garlic Mushrooms", description: "Pan-fried in garlic butter, served on toasted sourdough", price: "£6.50", veg: true },
        { id: "d01-s3", name: "Chicken Liver Pâté", description: "With toasted brioche & onion marmalade", price: "£7.00", popular: true },
      ],
    },
    {
      category: "Grills",
      emoji: "🥩",
      items: [
        { id: "d01-g1", name: "8oz Sirloin Steak", description: "Grilled to your liking with chips & peppercorn sauce", price: "£22.00", popular: true },
        { id: "d01-g2", name: "St Patrick's Burger", description: "8oz beef patty, Irish cheddar, smoked bacon, brioche bun", price: "£13.50", popular: true },
        { id: "d01-g3", name: "Half Rack Ribs", description: "Slow-cooked baby back ribs with BBQ glaze & coleslaw", price: "£16.00", popular: true },
        { id: "d01-g4", name: "Grilled Chicken Supreme", description: "Corn-fed chicken breast, roasted veg, herb jus", price: "£14.50" },
      ],
    },
    {
      category: "Sides",
      emoji: "🥔",
      items: [
        { id: "d01-sd1", name: "Chunky Chips", description: "Triple-cooked chips with sea salt", price: "£3.50", veg: true },
        { id: "d01-sd2", name: "Creamy Mash", description: "Butter mashed potato with chives", price: "£3.50", veg: true },
        { id: "d01-sd3", name: "Dressed Leaves", description: "Mixed salad with lemon vinaigrette", price: "£3.00", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "d01-d1", name: "Still Water", description: "330ml", price: "£1.50" },
        { id: "d01-d2", name: "Soft Drink", description: "Coke, 7Up, Fanta 330ml", price: "£2.00" },
        { id: "d01-d3", name: "Fresh OJ", description: "250ml freshly squeezed", price: "£2.50" },
      ],
    },
  ],

  "dpe-02": [
    {
      category: "Mezze",
      emoji: "🫙",
      items: [
        { id: "d02-m1", name: "Mezze Platter (2 person)", description: "Hummus, baba ganoush, falafel, olives, pitta", price: "£14.00", popular: true, veg: true },
        { id: "d02-m2", name: "Hummus & Pitta", description: "Smooth hummus with warm pitta bread", price: "£6.00", veg: true },
        { id: "d02-m3", name: "Stuffed Vine Leaves (6pcs)", description: "Rice-stuffed dolmades with yoghurt dip", price: "£6.50", veg: true },
      ],
    },
    {
      category: "Wraps",
      emoji: "🌯",
      items: [
        { id: "d02-w1", name: "Grilled Halloumi Wrap", description: "Halloumi, roasted peppers, rocket, tzatziki in flatbread", price: "£10.00", popular: true, veg: true },
        { id: "d02-w2", name: "Chicken Shawarma Wrap", description: "Marinated chicken, garlic sauce, pickles, salad", price: "£11.00", popular: true },
        { id: "d02-w3", name: "Falafel Wrap", description: "Crispy falafel, hummus, cucumber, tomato, hot sauce", price: "£9.50", veg: true },
      ],
    },
    {
      category: "Salads",
      emoji: "🥗",
      items: [
        { id: "d02-s1", name: "Greek Salad", description: "Tomato, cucumber, olives, feta, red onion, oregano", price: "£8.50", veg: true },
        { id: "d02-s2", name: "Fattoush", description: "Lebanese bread salad with pomegranate & sumac dressing", price: "£8.00", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "d02-d1", name: "Ayran", description: "Chilled salted yoghurt drink", price: "£2.50", veg: true },
        { id: "d02-d2", name: "Mint Lemonade", description: "Fresh lemon, mint & sugar", price: "£3.00", veg: true },
        { id: "d02-d3", name: "Soft Drink", description: "330ml can", price: "£2.00" },
      ],
    },
  ],

  "dpe-03": [
    {
      category: "Breakfast",
      emoji: "🍳",
      items: [
        { id: "d03-b1", name: "Full American Breakfast", description: "Pancakes, bacon, eggs, hash browns, maple syrup", price: "£11.50", popular: true },
        { id: "d03-b2", name: "Avocado Toast", description: "Sourdough with smashed avocado, poached eggs, chilli", price: "£9.00", popular: true, veg: true },
        { id: "d03-b3", name: "Granola & Yoghurt", description: "House granola with Greek yoghurt & fresh berries", price: "£7.00", veg: true },
      ],
    },
    {
      category: "Mains",
      emoji: "🌭",
      items: [
        { id: "d03-m1", name: "Loaded Hot Dog", description: "Beef frankfurter, caramelised onions, mustard, relish", price: "£9.50", popular: true },
        { id: "d03-m2", name: "Mac & Cheese", description: "Creamy 4-cheese sauce, panko breadcrumb topping", price: "£9.00", popular: true, veg: true },
        { id: "d03-m3", name: "BBQ Pulled Pork Bun", description: "Slow-cooked pulled pork, pickled slaw, toasted brioche", price: "£11.00" },
        { id: "d03-m4", name: "Club Sandwich", description: "Triple-decker with chicken, bacon, egg, lettuce, tomato", price: "£10.50" },
      ],
    },
    {
      category: "Shakes",
      emoji: "🥛",
      items: [
        { id: "d03-s1", name: "Classic Milkshake", description: "Vanilla, chocolate, strawberry or salted caramel", price: "£5.50", popular: true },
        { id: "d03-s2", name: "Oreo Shake", description: "Vanilla ice cream blended with Oreo cookies", price: "£6.00" },
      ],
    },
    {
      category: "Drinks",
      emoji: "☕",
      items: [
        { id: "d03-d1", name: "Filter Coffee", description: "Freshly brewed house blend", price: "£2.50" },
        { id: "d03-d2", name: "Soft Drink", description: "330ml can", price: "£2.00" },
        { id: "d03-d3", name: "Still Water", description: "500ml", price: "£1.50" },
      ],
    },
  ],

  "dpe-04": [
    {
      category: "Starters",
      emoji: "🥟",
      items: [
        { id: "d04-s1", name: "Spring Rolls (4pcs)", description: "Crispy vegetable rolls with sweet chilli dip", price: "£4.50", veg: true },
        { id: "d04-s2", name: "Corn Soup", description: "Egg-drop corn soup with crispy wontons", price: "£4.50", veg: true },
      ],
    },
    {
      category: "Mains",
      emoji: "🍜",
      items: [
        { id: "d04-m1", name: "Beef Chow Mein", description: "Stir-fried noodles with beef, beansprouts & veg", price: "£10.00", popular: true },
        { id: "d04-m2", name: "Crispy Chilli Chicken", description: "Fried chicken strips in sticky chilli sauce", price: "£10.50", popular: true },
        { id: "d04-m3", name: "Sweet & Sour Pork", description: "Cantonese-style pork balls in tangy sauce with rice", price: "£10.00" },
      ],
    },
    {
      category: "Rice & Noodles",
      emoji: "🍚",
      items: [
        { id: "d04-r1", name: "Egg Fried Rice", description: "Wok-tossed with egg & spring onion", price: "£3.50", veg: true },
        { id: "d04-r2", name: "Singapore Noodles", description: "Rice vermicelli, prawn, egg, curry powder", price: "£9.50" },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "d04-d1", name: "Green Tea", description: "Chilled or hot", price: "£2.00", veg: true },
        { id: "d04-d2", name: "Soft Drink", description: "330ml can", price: "£2.00" },
      ],
    },
  ],

  "dpe-05": [
    {
      category: "Starters",
      emoji: "🥗",
      items: [
        { id: "d05-s1", name: "Garlic Bread", description: "Baguette with herb garlic butter", price: "£3.50", veg: true },
        { id: "d05-s2", name: "Burrata", description: "Fresh burrata with cherry tomatoes & basil oil", price: "£8.50", popular: true, veg: true },
      ],
    },
    {
      category: "Pizzas",
      emoji: "🍕",
      items: [
        { id: "d05-p1", name: "Paddy's Special", description: "Beef, potato slices, Irish cheddar, caramelised onion", price: "£14.00", popular: true },
        { id: "d05-p2", name: "Napolitana", description: "Anchovies, olives, capers, tomato, mozzarella", price: "£12.50" },
        { id: "d05-p3", name: "Four Cheese", description: "Mozzarella, gorgonzola, parmesan, ricotta", price: "£13.00", veg: true },
        { id: "d05-p4", name: "Prawn & Pesto", description: "Tiger prawns, basil pesto, cherry tomatoes, rocket", price: "£14.50" },
      ],
    },
    {
      category: "Sides",
      emoji: "🥗",
      items: [
        { id: "d05-sd1", name: "Rosemary Wedges", description: "Crispy potato wedges with aioli", price: "£4.00", veg: true },
        { id: "d05-sd2", name: "Rocket & Parmesan Salad", description: "With lemon dressing", price: "£4.50", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "d05-d1", name: "Italian Soda", description: "Flavoured sparkling water — citrus or berry", price: "£2.50", veg: true },
        { id: "d05-d2", name: "Still Water", description: "500ml", price: "£1.50" },
      ],
    },
  ],

  "dpe-06": [
    {
      category: "Breakfast",
      emoji: "🍳",
      items: [
        { id: "d06-b1", name: "Smashed Avo & Eggs", description: "Sourdough, guacamole, poached eggs, dukkah", price: "£9.50", popular: true, veg: true },
        { id: "d06-b2", name: "Honey Granola Bowl", description: "House granola, Greek yoghurt, seasonal fruit, honey", price: "£7.50", veg: true, popular: true },
        { id: "d06-b3", name: "Eggs Benedict", description: "Toasted muffin, ham, poached eggs, hollandaise", price: "£10.00" },
      ],
    },
    {
      category: "Coffees",
      emoji: "☕",
      items: [
        { id: "d06-c1", name: "Flat White", description: "Double ristretto with silky micro-foam milk", price: "£3.50", popular: true },
        { id: "d06-c2", name: "Oat Cappuccino", description: "Espresso with oat milk foam & cocoa dust", price: "£4.00" },
        { id: "d06-c3", name: "Cold Brew", description: "12-hour cold-steeped black coffee over ice", price: "£4.50" },
      ],
    },
    {
      category: "Light Bites",
      emoji: "🥐",
      items: [
        { id: "d06-l1", name: "Butter Croissant", description: "Freshly baked all-butter croissant", price: "£3.00", veg: true },
        { id: "d06-l2", name: "Banana Bread", description: "Slice of house banana bread with butter", price: "£3.50", veg: true },
      ],
    },
    {
      category: "Drinks",
      emoji: "🥤",
      items: [
        { id: "d06-d1", name: "Fresh Juice", description: "Orange, apple or mixed berry", price: "£3.50", veg: true },
        { id: "d06-d2", name: "Sparkling Water", description: "330ml", price: "£1.50" },
      ],
    },
  ],
};

export function getMenu(restaurantId: string): MenuSection[] {
  return MENUS[restaurantId] ?? [];
}
