import { Restaurant } from "@/types";

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "The Pizza Palace",
    location: "123 Main Street, Newcastle",
    opening: "10:00 AM",
    closing: "11:00 PM",
    menu: [
      { id: "1", name: "Margherita Pizza", price: 12.99, description: "Classic cheese and tomato", category: "Pizzas" },
      { id: "2", name: "Pepperoni Pizza", price: 14.99, description: "With fresh pepperoni", category: "Pizzas" },
      { id: "3", name: "Vegetarian Pizza", price: 13.99, description: "Fresh vegetables", category: "Pizzas" },
      { id: "4", name: "BBQ Chicken Pizza", price: 15.99, description: "Chicken with BBQ sauce", category: "Pizzas" },
      { id: "5", name: "Meat Feast Pizza", price: 16.99, description: "Loaded with meats", category: "Pizzas" },
      { id: "6", name: "Garlic Bread", price: 5.99, description: "Crispy and golden", category: "Sides" },
      { id: "7", name: "Cheesy Garlic Bread", price: 6.99, description: "With melted cheese", category: "Sides" },
      { id: "8", name: "Caesar Salad", price: 8.99, description: "With homemade dressing", category: "Salads" },
      { id: "9", name: "Greek Salad", price: 9.99, description: "Fresh Mediterranean veggies", category: "Salads" },
      { id: "10", name: "Coca Cola", price: 2.99, description: "330ml can", category: "Drinks" },
      { id: "11", name: "Sprite", price: 2.99, description: "330ml can", category: "Drinks" },
      { id: "12", name: "Orange Juice", price: 3.99, description: "Freshly squeezed", category: "Drinks" },
    ],
    categories: [
      {
        name: "Pizzas",
        items: [
          { id: "1", name: "Margherita Pizza", price: 12.99, description: "Classic cheese and tomato", category: "Pizzas" },
          { id: "2", name: "Pepperoni Pizza", price: 14.99, description: "With fresh pepperoni", category: "Pizzas" },
          { id: "3", name: "Vegetarian Pizza", price: 13.99, description: "Fresh vegetables", category: "Pizzas" },
          { id: "4", name: "BBQ Chicken Pizza", price: 15.99, description: "Chicken with BBQ sauce", category: "Pizzas" },
          { id: "5", name: "Meat Feast Pizza", price: 16.99, description: "Loaded with meats", category: "Pizzas" },
        ]
      },
      {
        name: "Sides",
        items: [
          { id: "6", name: "Garlic Bread", price: 5.99, description: "Crispy and golden", category: "Sides" },
          { id: "7", name: "Cheesy Garlic Bread", price: 6.99, description: "With melted cheese", category: "Sides" },
        ]
      },
      {
        name: "Salads",
        items: [
          { id: "8", name: "Caesar Salad", price: 8.99, description: "With homemade dressing", category: "Salads" },
          { id: "9", name: "Greek Salad", price: 9.99, description: "Fresh Mediterranean veggies", category: "Salads" },
        ]
      },
      {
        name: "Drinks",
        items: [
          { id: "10", name: "Coca Cola", price: 2.99, description: "330ml can", category: "Drinks" },
          { id: "11", name: "Sprite", price: 2.99, description: "330ml can", category: "Drinks" },
          { id: "12", name: "Orange Juice", price: 3.99, description: "Freshly squeezed", category: "Drinks" },
        ]
      }
    ],
  },

  {
    id: "2",
    name: "Burger Express",
    location: "456 King Road, Newcastle",
    opening: "11:00 AM",
    closing: "10:00 PM",
    menu: [
      { id: "1", name: "Classic Burger", price: 9.99, description: "Beef patty with all the trimmings", category: "Burgers" },
      { id: "2", name: "Double Cheeseburger", price: 12.99, description: "Two patties, double cheese", category: "Burgers" },
      { id: "3", name: "Chicken Burger", price: 10.99, description: "Crispy fried chicken", category: "Burgers" },
      { id: "4", name: "Veggie Burger", price: 9.99, description: "Plant-based patty", category: "Burgers" },
      { id: "5", name: "French Fries", price: 4.99, description: "Golden and crispy", category: "Sides" },
      { id: "6", name: "Onion Rings", price: 5.99, description: "Crispy battered rings", category: "Sides" },
      { id: "7", name: "Milkshake", price: 5.99, description: "Vanilla, chocolate, or strawberry", category: "Drinks" },
      { id: "8", name: "Soft Drink", price: 2.99, description: "Coke, Sprite, or Fanta", category: "Drinks" },
      { id: "9", name: "Coffee", price: 3.99, description: "Freshly brewed", category: "Drinks" },
    ],
    categories: [
      {
        name: "Burgers",
        items: [
          { id: "1", name: "Classic Burger", price: 9.99, description: "Beef patty with all the trimmings", category: "Burgers" },
          { id: "2", name: "Double Cheeseburger", price: 12.99, description: "Two patties, double cheese", category: "Burgers" },
          { id: "3", name: "Chicken Burger", price: 10.99, description: "Crispy fried chicken", category: "Burgers" },
          { id: "4", name: "Veggie Burger", price: 9.99, description: "Plant-based patty", category: "Burgers" },
        ]
      },
      {
        name: "Sides",
        items: [
          { id: "5", name: "French Fries", price: 4.99, description: "Golden and crispy", category: "Sides" },
          { id: "6", name: "Onion Rings", price: 5.99, description: "Crispy battered rings", category: "Sides" },
        ]
      },
      {
        name: "Drinks",
        items: [
          { id: "7", name: "Milkshake", price: 5.99, description: "Vanilla, chocolate, or strawberry", category: "Drinks" },
          { id: "8", name: "Soft Drink", price: 2.99, description: "Coke, Sprite, or Fanta", category: "Drinks" },
          { id: "9", name: "Coffee", price: 3.99, description: "Freshly brewed", category: "Drinks" },
        ]
      }
    ],
  },

  {
    id: "3",
    name: "Sushi Master",
    location: "789 Queen Street, Newcastle",
    opening: "12:00 PM",
    closing: "10:30 PM",
    menu: [
      { id: "1", name: "California Roll", price: 10.99, description: "Crab, avocado, cucumber", category: "Rolls" },
      { id: "2", name: "Spicy Tuna Roll", price: 11.99, description: "Tuna with spicy mayo", category: "Rolls" },
      { id: "3", name: "Salmon Sushi", price: 12.99, description: "Fresh Atlantic salmon", category: "Sushi" },
      { id: "4", name: "Tuna Sushi", price: 13.99, description: "Fresh yellowfin tuna", category: "Sushi" },
      { id: "5", name: "Miso Soup", price: 4.99, description: "Traditional soy broth", category: "Soups" },
      { id: "6", name: "Edamame", price: 5.99, description: "Steamed soybeans with salt", category: "Appetizers" },
      { id: "7", name: "Gyoza", price: 7.99, description: "Pan-fried dumplings", category: "Appetizers" },
      { id: "8", name: "Green Tea", price: 3.99, description: "Traditional Japanese tea", category: "Drinks" },
      { id: "9", name: "Sake", price: 8.99, description: "Japanese rice wine", category: "Drinks" },
    ],
    categories: [
      {
        name: "Rolls",
        items: [
          { id: "1", name: "California Roll", price: 10.99, description: "Crab, avocado, cucumber", category: "Rolls" },
          { id: "2", name: "Spicy Tuna Roll", price: 11.99, description: "Tuna with spicy mayo", category: "Rolls" },
        ]
      },
      {
        name: "Sushi",
        items: [
          { id: "3", name: "Salmon Sushi", price: 12.99, description: "Fresh Atlantic salmon", category: "Sushi" },
          { id: "4", name: "Tuna Sushi", price: 13.99, description: "Fresh yellowfin tuna", category: "Sushi" },
        ]
      },
      {
        name: "Soups",
        items: [
          { id: "5", name: "Miso Soup", price: 4.99, description: "Traditional soy broth", category: "Soups" },
        ]
      },
      {
        name: "Appetizers",
        items: [
          { id: "6", name: "Edamame", price: 5.99, description: "Steamed soybeans with salt", category: "Appetizers" },
          { id: "7", name: "Gyoza", price: 7.99, description: "Pan-fried dumplings", category: "Appetizers" },
        ]
      },
      {
        name: "Drinks",
        items: [
          { id: "8", name: "Green Tea", price: 3.99, description: "Traditional Japanese tea", category: "Drinks" },
          { id: "9", name: "Sake", price: 8.99, description: "Japanese rice wine", category: "Drinks" },
        ]
      }
    ],
  },

  {
    id: "4",
    name: "The Curry House",
    location: "321 Princess Street, Newcastle",
    opening: "5:00 PM",
    closing: "11:00 PM",
    menu: [
      { id: "1", name: "Chicken Tikka Masala", price: 13.99, description: "Creamy tomato sauce", category: "Main Courses" },
      { id: "2", name: "Lamb Biryani", price: 14.99, description: "Fragrant basmati rice", category: "Rice Dishes" },
      { id: "3", name: "Vegetable Curry", price: 11.99, description: "Mixed vegetables in sauce", category: "Main Courses" },
      { id: "4", name: "Butter Chicken", price: 13.99, description: "Rich and creamy", category: "Main Courses" },
      { id: "5", name: "Naan Bread", price: 3.99, description: "Freshly baked flatbread", category: "Breads" },
      { id: "6", name: "Garlic Naan", price: 4.99, description: "With garlic and butter", category: "Breads" },
      { id: "7", name: "Samosa", price: 4.99, description: "Crispy pastry pockets", category: "Appetizers" },
      { id: "8", name: "Pakora", price: 5.99, description: "Vegetable fritters", category: "Appetizers" },
      { id: "9", name: "Mango Lassi", price: 4.99, description: "Sweet yogurt drink", category: "Drinks" },
      { id: "10", name: "Chai Tea", price: 3.99, description: "Spiced Indian tea", category: "Drinks" },
    ],
    categories: [
      {
        name: "Main Courses",
        items: [
          { id: "1", name: "Chicken Tikka Masala", price: 13.99, description: "Creamy tomato sauce", category: "Main Courses" },
          { id: "3", name: "Vegetable Curry", price: 11.99, description: "Mixed vegetables in sauce", category: "Main Courses" },
          { id: "4", name: "Butter Chicken", price: 13.99, description: "Rich and creamy", category: "Main Courses" },
        ]
      },
      {
        name: "Rice Dishes",
        items: [
          { id: "2", name: "Lamb Biryani", price: 14.99, description: "Fragrant basmati rice", category: "Rice Dishes" },
        ]
      },
      {
        name: "Breads",
        items: [
          { id: "5", name: "Naan Bread", price: 3.99, description: "Freshly baked flatbread", category: "Breads" },
          { id: "6", name: "Garlic Naan", price: 4.99, description: "With garlic and butter", category: "Breads" },
        ]
      },
      {
        name: "Appetizers",
        items: [
          { id: "7", name: "Samosa", price: 4.99, description: "Crispy pastry pockets", category: "Appetizers" },
          { id: "8", name: "Pakora", price: 5.99, description: "Vegetable fritters", category: "Appetizers" },
        ]
      },
      {
        name: "Drinks",
        items: [
          { id: "9", name: "Mango Lassi", price: 4.99, description: "Sweet yogurt drink", category: "Drinks" },
          { id: "10", name: "Chai Tea", price: 3.99, description: "Spiced Indian tea", category: "Drinks" },
        ]
      }
    ],
  },

  {
    id: "5",
    name: "Veggie Delight",
    location: "555 Northumberland Street, Newcastle",
    opening: "9:00 AM",
    closing: "9:00 PM",
    menu: [
      { id: "1", name: "Buddha Bowl", price: 11.99, description: "Quinoa, veggies, tahini dressing", category: "Bowls" },
      { id: "2", name: "Vegan Burger", price: 10.99, description: "Plant-based patty", category: "Burgers" },
      { id: "3", name: "Acai Bowl", price: 9.99, description: "With granola and berries", category: "Breakfast" },
      { id: "4", name: "Green Juice", price: 6.99, description: "Apple, celery, ginger", category: "Drinks" },
      { id: "5", name: "Falafel Wrap", price: 8.99, description: "Chickpea falafel with tahini", category: "Wraps" },
      { id: "6", name: "Avocado Toast", price: 7.99, description: "Smashed avocado on sourdough", category: "Breakfast" },
      { id: "7", name: "Smoothie Bowl", price: 8.99, description: "Mixed berries and banana", category: "Breakfast" },
      { id: "8", name: "Kale Salad", price: 9.99, description: "Massaged kale with lemon", category: "Salads" },
      { id: "9", name: "Coconut Water", price: 3.99, description: "Fresh young coconut", category: "Drinks" },
      { id: "10", name: "Herbal Tea", price: 4.99, description: "Chamomile or peppermint", category: "Drinks" },
    ],
    categories: [
      {
        name: "Breakfast",
        items: [
          { id: "3", name: "Acai Bowl", price: 9.99, description: "With granola and berries", category: "Breakfast" },
          { id: "6", name: "Avocado Toast", price: 7.99, description: "Smashed avocado on sourdough", category: "Breakfast" },
          { id: "7", name: "Smoothie Bowl", price: 8.99, description: "Mixed berries and banana", category: "Breakfast" },
        ]
      },
      {
        name: "Bowls",
        items: [
          { id: "1", name: "Buddha Bowl", price: 11.99, description: "Quinoa, veggies, tahini dressing", category: "Bowls" },
        ]
      },
      {
        name: "Burgers",
        items: [
          { id: "2", name: "Vegan Burger", price: 10.99, description: "Plant-based patty", category: "Burgers" },
        ]
      },
      {
        name: "Wraps",
        items: [
          { id: "5", name: "Falafel Wrap", price: 8.99, description: "Chickpea falafel with tahini", category: "Wraps" },
        ]
      },
      {
        name: "Salads",
        items: [
          { id: "8", name: "Kale Salad", price: 9.99, description: "Massaged kale with lemon", category: "Salads" },
        ]
      },
      {
        name: "Drinks",
        items: [
          { id: "4", name: "Green Juice", price: 6.99, description: "Apple, celery, ginger", category: "Drinks" },
          { id: "9", name: "Coconut Water", price: 3.99, description: "Fresh young coconut", category: "Drinks" },
          { id: "10", name: "Herbal Tea", price: 4.99, description: "Chamomile or peppermint", category: "Drinks" },
        ]
      }
    ],
  },

  {
    id: "6",
    name: "London Steakhouse",
    location: "22 Oxford Street, London",
    opening: "1:00 PM",
    closing: "11:30 PM",
    menu: [
      { id: "1", name: "Ribeye Steak", price: 24.99, description: "Grilled ribeye with herbs", category: "Steaks" },
      { id: "2", name: "Sirloin Steak", price: 22.99, description: "Tender sirloin cut", category: "Steaks" },
      { id: "3", name: "Steak Sandwich", price: 15.99, description: "Steak with caramelized onions", category: "Sandwiches" },
      { id: "4", name: "Mashed Potatoes", price: 6.99, description: "Creamy butter mash", category: "Sides" },
      { id: "5", name: "House Salad", price: 7.99, description: "Fresh greens with vinaigrette", category: "Salads" },
    ],
    categories: [
      {
        name: "Steaks",
        items: [
          { id: "1", name: "Ribeye Steak", price: 24.99, description: "Grilled ribeye with herbs", category: "Steaks" },
          { id: "2", name: "Sirloin Steak", price: 22.99, description: "Tender sirloin cut", category: "Steaks" },
        ]
      },
      {
        name: "Sandwiches",
        items: [
          { id: "3", name: "Steak Sandwich", price: 15.99, description: "Steak with caramelized onions", category: "Sandwiches" },
        ]
      },
      {
        name: "Sides",
        items: [
          { id: "4", name: "Mashed Potatoes", price: 6.99, description: "Creamy butter mash", category: "Sides" },
        ]
      },
      {
        name: "Salads",
        items: [
          { id: "5", name: "House Salad", price: 7.99, description: "Fresh greens with vinaigrette", category: "Salads" },
        ]
      }
    ],
  },

  {
    id: "7",
    name: "NYC Deli",
    location: "120 Broadway, New York",
    opening: "8:00 AM",
    closing: "9:00 PM",
    menu: [
      { id: "1", name: "Pastrami Sandwich", price: 13.99, description: "Classic NYC pastrami", category: "Sandwiches" },
      { id: "2", name: "Bagel with Cream Cheese", price: 4.99, description: "Fresh baked bagel", category: "Breakfast" },
      { id: "3", name: "Turkey Club", price: 12.99, description: "Turkey, bacon, lettuce, tomato", category: "Sandwiches" },
      { id: "4", name: "Chicken Soup", price: 6.99, description: "Homestyle chicken soup", category: "Soups" },
      { id: "5", name: "Cheesecake", price: 7.99, description: "New York style cheesecake", category: "Desserts" },
    ],
    categories: [
      {
        name: "Breakfast",
        items: [
          { id: "2", name: "Bagel with Cream Cheese", price: 4.99, description: "Fresh baked bagel", category: "Breakfast" },
        ]
      },
      {
        name: "Sandwiches",
        items: [
          { id: "1", name: "Pastrami Sandwich", price: 13.99, description: "Classic NYC pastrami", category: "Sandwiches" },
          { id: "3", name: "Turkey Club", price: 12.99, description: "Turkey, bacon, lettuce, tomato", category: "Sandwiches" },
        ]
      },
      {
        name: "Soups",
        items: [
          { id: "4", name: "Chicken Soup", price: 6.99, description: "Homestyle chicken soup", category: "Soups" },
        ]
      },
      {
        name: "Desserts",
        items: [
          { id: "5", name: "Cheesecake", price: 7.99, description: "New York style cheesecake", category: "Desserts" },
        ]
      }
    ],
  },

  {
    id: "8",
    name: "Tokyo Ramen Bar",
    location: "15 Shibuya Street, Tokyo",
    opening: "11:00 AM",
    closing: "11:00 PM",
    menu: [
      { id: "1", name: "Tonkotsu Ramen", price: 11.99, description: "Rich pork broth ramen", category: "Ramen" },
      { id: "2", name: "Shoyu Ramen", price: 10.99, description: "Soy sauce flavored broth", category: "Ramen" },
      { id: "3", name: "Gyoza", price: 6.99, description: "Pan-fried dumplings", category: "Appetizers" },
      { id: "4", name: "Tempura", price: 8.99, description: "Lightly battered seafood", category: "Appetizers" },
      { id: "5", name: "Matcha Ice Cream", price: 5.99, description: "Green tea flavored dessert", category: "Desserts" },
    ],
    categories: [
      {
        name: "Ramen",
        items: [
          { id: "1", name: "Tonkotsu Ramen", price: 11.99, description: "Rich pork broth ramen", category: "Ramen" },
          { id: "2", name: "Shoyu Ramen", price: 10.99, description: "Soy sauce flavored broth", category: "Ramen" },
        ]
      },
      {
        name: "Appetizers",
        items: [
          { id: "3", name: "Gyoza", price: 6.99, description: "Pan-fried dumplings", category: "Appetizers" },
          { id: "4", name: "Tempura", price: 8.99, description: "Lightly battered seafood", category: "Appetizers" },
        ]
      },
      {
        name: "Desserts",
        items: [
          { id: "5", name: "Matcha Ice Cream", price: 5.99, description: "Green tea flavored dessert", category: "Desserts" },
        ]
      }
    ],
  },
  {
    id: "9",
    name: "Paris Café Bistro",
    location: "18 Rue Rivoli, Paris",
    opening: "7:30 AM",
    closing: "10:00 PM",
    menu: [
      { id: "1", name: "Croissant", price: 3.99, description: "Buttery French pastry", category: "Breakfast" },
      { id: "2", name: "Quiche Lorraine", price: 9.99, description: "Savory egg and bacon tart", category: "Main Courses" },
      { id: "3", name: "French Onion Soup", price: 8.99, description: "Classic onion soup with cheese", category: "Soups" },
      { id: "4", name: "Crepes", price: 7.99, description: "Thin pancakes with fillings", category: "Desserts" },
      { id: "5", name: "Espresso", price: 2.99, description: "Strong Italian coffee", category: "Drinks" },
    ],
    categories: [
      {
        name: "Breakfast",
        items: [
          { id: "1", name: "Croissant", price: 3.99, description: "Buttery French pastry", category: "Breakfast" },
        ]
      },
      {
        name: "Main Courses",
        items: [
          { id: "2", name: "Quiche Lorraine", price: 9.99, description: "Savory egg and bacon tart", category: "Main Courses" },
        ]
      },
      {
        name: "Soups",
        items: [
          { id: "3", name: "French Onion Soup", price: 8.99, description: "Classic onion soup with cheese", category: "Soups" },
        ]
      },
      {
        name: "Desserts",
        items: [
          { id: "4", name: "Crepes", price: 7.99, description: "Thin pancakes with fillings", category: "Desserts" },
        ]
      },
      {
        name: "Drinks",
        items: [
          { id: "5", name: "Espresso", price: 2.99, description: "Strong Italian coffee", category: "Drinks" },
        ]
      }
    ],
  },
  {
  id: "10",
  name: "Mediterranean Grill",
  location: "45 Sunset Blvd, Los Angeles",
  opening: "11:00 AM",
  closing: "10:00 PM",
  menu: [
    { id: "1", name: "Chicken Shawarma", price: 11.99, description: "Grilled chicken wrap", category: "Wraps" },
    { id: "2", name: "Falafel Plate", price: 9.99, description: "Crispy chickpea balls", category: "Main Courses" },
    { id: "3", name: "Hummus & Pita", price: 6.99, description: "Creamy dip with bread", category: "Appetizers" },
    { id: "4", name: "Greek Salad", price: 8.99, description: "Feta, olives, veggies", category: "Salads" },
    { id: "5", name: "Lemonade", price: 3.99, description: "Fresh squeezed", category: "Drinks" },
  ],
  categories: [
    { name: "Wraps", items: [
      { id: "1", name: "Chicken Shawarma", price: 11.99, description: "Grilled chicken wrap", category: "Wraps" },
    ]},
    { name: "Main Courses", items: [
      { id: "2", name: "Falafel Plate", price: 9.99, description: "Crispy chickpea balls", category: "Main Courses" },
    ]},
    { name: "Appetizers", items: [
      { id: "3", name: "Hummus & Pita", price: 6.99, description: "Creamy dip with bread", category: "Appetizers" },
    ]},
    { name: "Salads", items: [
      { id: "4", name: "Greek Salad", price: 8.99, description: "Feta, olives, veggies", category: "Salads" },
    ]},
    { name: "Drinks", items: [
      { id: "5", name: "Lemonade", price: 3.99, description: "Fresh squeezed", category: "Drinks" },
    ]},
  ],
},

{
  id: "11",
  name: "Berlin Brat Haus",
  location: "Alexanderplatz, Berlin",
  opening: "10:00 AM",
  closing: "11:00 PM",
  menu: [
    { id: "1", name: "Bratwurst", price: 9.99, description: "German sausage", category: "Main Courses" },
    { id: "2", name: "Currywurst", price: 8.99, description: "Sausage with curry ketchup", category: "Main Courses" },
    { id: "3", name: "Pretzel", price: 4.99, description: "Soft baked pretzel", category: "Sides" },
    { id: "4", name: "Potato Salad", price: 5.99, description: "Classic German style", category: "Sides" },
    { id: "5", name: "Beer", price: 6.99, description: "Local German brew", category: "Drinks" },
  ],
  categories: [
    { name: "Main Courses", items: [
      { id: "1", name: "Bratwurst", price: 9.99, description: "German sausage", category: "Main Courses" },
      { id: "2", name: "Currywurst", price: 8.99, description: "Sausage with curry ketchup", category: "Main Courses" },
    ]},
    { name: "Sides", items: [
      { id: "3", name: "Pretzel", price: 4.99, description: "Soft baked pretzel", category: "Sides" },
      { id: "4", name: "Potato Salad", price: 5.99, description: "Classic German style", category: "Sides" },
    ]},
    { name: "Drinks", items: [
      { id: "5", name: "Beer", price: 6.99, description: "Local German brew", category: "Drinks" },
    ]},
  ],
},

{
  id: "12",
  name: "Seoul Street Kitchen",
  location: "Gangnam, Seoul",
  opening: "12:00 PM",
  closing: "11:30 PM",
  menu: [
    { id: "1", name: "Bibimbap", price: 10.99, description: "Rice with veggies and egg", category: "Main Courses" },
    { id: "2", name: "Korean BBQ", price: 14.99, description: "Grilled marinated meat", category: "Main Courses" },
    { id: "3", name: "Kimchi", price: 4.99, description: "Fermented cabbage", category: "Sides" },
    { id: "4", name: "Tteokbokki", price: 7.99, description: "Spicy rice cakes", category: "Street Food" },
    { id: "5", name: "Soju", price: 6.99, description: "Korean spirit", category: "Drinks" },
  ],
  categories: [
    { name: "Main Courses", items: [
      { id: "1", name: "Bibimbap", price: 10.99, description: "Rice with veggies and egg", category: "Main Courses" },
      { id: "2", name: "Korean BBQ", price: 14.99, description: "Grilled marinated meat", category: "Main Courses" },
    ]},
    { name: "Sides", items: [
      { id: "3", name: "Kimchi", price: 4.99, description: "Fermented cabbage", category: "Sides" },
    ]},
    { name: "Street Food", items: [
      { id: "4", name: "Tteokbokki", price: 7.99, description: "Spicy rice cakes", category: "Street Food" },
    ]},
    { name: "Drinks", items: [
      { id: "5", name: "Soju", price: 6.99, description: "Korean spirit", category: "Drinks" },
    ]},
  ],
},

{
  id: "13",
  name: "Sydney Seafood Co.",
  location: "Darling Harbour, Sydney",
  opening: "11:00 AM",
  closing: "10:30 PM",
  menu: [
    { id: "1", name: "Grilled Salmon", price: 16.99, description: "Fresh Atlantic salmon", category: "Seafood" },
    { id: "2", name: "Fish & Chips", price: 12.99, description: "Classic battered fish", category: "Seafood" },
    { id: "3", name: "Prawn Cocktail", price: 10.99, description: "Chilled prawns", category: "Appetizers" },
    { id: "4", name: "Caesar Salad", price: 8.99, description: "Crisp lettuce with dressing", category: "Salads" },
    { id: "5", name: "White Wine", price: 7.99, description: "Australian wine", category: "Drinks" },
  ],
  categories: [
    { name: "Seafood", items: [
      { id: "1", name: "Grilled Salmon", price: 16.99, description: "Fresh Atlantic salmon", category: "Seafood" },
      { id: "2", name: "Fish & Chips", price: 12.99, description: "Classic battered fish", category: "Seafood" },
    ]},
    { name: "Appetizers", items: [
      { id: "3", name: "Prawn Cocktail", price: 10.99, description: "Chilled prawns", category: "Appetizers" },
    ]},
    { name: "Salads", items: [
      { id: "4", name: "Caesar Salad", price: 8.99, description: "Crisp lettuce with dressing", category: "Salads" },
    ]},
    { name: "Drinks", items: [
      { id: "5", name: "White Wine", price: 7.99, description: "Australian wine", category: "Drinks" },
    ]},
  ],
},
];