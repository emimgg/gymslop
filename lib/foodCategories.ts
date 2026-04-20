// Shared food category config — used by FoodDatabase browser and the meal logging modal.

export type FoodCatKey =
  | 'carnes_rojas' | 'carnes_blancas' | 'pescados' | 'huevos_lacteos'
  | 'proteinas_vegetales' | 'carbohidratos' | 'verduras' | 'frutas'
  | 'grasas' | 'fiambres' | 'snacks' | 'bebidas' | 'condimentos' | 'personalizados';

export const CATEGORY_ORDER: FoodCatKey[] = [
  'carnes_rojas', 'carnes_blancas', 'pescados', 'huevos_lacteos',
  'proteinas_vegetales', 'carbohidratos', 'verduras', 'frutas',
  'grasas', 'fiambres', 'snacks', 'bebidas', 'condimentos', 'personalizados',
];

export const CATEGORY_EMOJI: Record<FoodCatKey, string> = {
  carnes_rojas: '🥩', carnes_blancas: '🍗', pescados: '🐟', huevos_lacteos: '🥚',
  proteinas_vegetales: '🌱', carbohidratos: '🍚', verduras: '🥦', frutas: '🍎',
  grasas: '🥑', fiambres: '🧀', snacks: '🍫', bebidas: '🍺', condimentos: '🧴', personalizados: '⭐',
};

// All class strings written verbatim so Tailwind JIT picks them up.
export const CAT_STYLES: Record<FoodCatKey, { text: string; border: string; bg: string; headerBg: string; badge: string; dot: string }> = {
  carnes_rojas:        { text: 'text-red-400',     border: 'border-red-400/40',     bg: 'bg-red-400/10',     headerBg: 'bg-red-400/5',     badge: 'bg-red-400/15 text-red-400 border border-red-400/30',         dot: 'bg-red-400'     },
  carnes_blancas:      { text: 'text-orange-400',  border: 'border-orange-400/40',  bg: 'bg-orange-400/10',  headerBg: 'bg-orange-400/5',  badge: 'bg-orange-400/15 text-orange-400 border border-orange-400/30', dot: 'bg-orange-400'  },
  pescados:            { text: 'text-blue-400',    border: 'border-blue-400/40',    bg: 'bg-blue-400/10',    headerBg: 'bg-blue-400/5',    badge: 'bg-blue-400/15 text-blue-400 border border-blue-400/30',       dot: 'bg-blue-400'    },
  huevos_lacteos:      { text: 'text-yellow-400',  border: 'border-yellow-400/40',  bg: 'bg-yellow-400/10',  headerBg: 'bg-yellow-400/5',  badge: 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30', dot: 'bg-yellow-400'  },
  proteinas_vegetales: { text: 'text-green-500',   border: 'border-green-500/40',   bg: 'bg-green-500/10',   headerBg: 'bg-green-500/5',   badge: 'bg-green-500/15 text-green-500 border border-green-500/30',    dot: 'bg-green-500'   },
  carbohidratos:       { text: 'text-amber-400',   border: 'border-amber-400/40',   bg: 'bg-amber-400/10',   headerBg: 'bg-amber-400/5',   badge: 'bg-amber-400/15 text-amber-400 border border-amber-400/30',    dot: 'bg-amber-400'   },
  verduras:            { text: 'text-emerald-400', border: 'border-emerald-400/40', bg: 'bg-emerald-400/10', headerBg: 'bg-emerald-400/5', badge: 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30', dot: 'bg-emerald-400' },
  frutas:              { text: 'text-pink-400',    border: 'border-pink-400/40',    bg: 'bg-pink-400/10',    headerBg: 'bg-pink-400/5',    badge: 'bg-pink-400/15 text-pink-400 border border-pink-400/30',       dot: 'bg-pink-400'    },
  grasas:              { text: 'text-cyan-400',    border: 'border-cyan-400/40',    bg: 'bg-cyan-400/10',    headerBg: 'bg-cyan-400/5',    badge: 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30',       dot: 'bg-cyan-400'    },
  fiambres:            { text: 'text-purple-400',  border: 'border-purple-400/40',  bg: 'bg-purple-400/10',  headerBg: 'bg-purple-400/5',  badge: 'bg-purple-400/15 text-purple-400 border border-purple-400/30', dot: 'bg-purple-400'  },
  snacks:              { text: 'text-rose-400',    border: 'border-rose-400/40',    bg: 'bg-rose-400/10',    headerBg: 'bg-rose-400/5',    badge: 'bg-rose-400/15 text-rose-400 border border-rose-400/30',       dot: 'bg-rose-400'    },
  bebidas:             { text: 'text-slate-300',   border: 'border-slate-400/40',   bg: 'bg-slate-400/10',   headerBg: 'bg-slate-400/5',   badge: 'bg-slate-400/15 text-slate-300 border border-slate-400/30',    dot: 'bg-slate-400'   },
  condimentos:         { text: 'text-lime-400',    border: 'border-lime-400/40',    bg: 'bg-lime-400/10',    headerBg: 'bg-lime-400/5',    badge: 'bg-lime-400/15 text-lime-400 border border-lime-400/30',       dot: 'bg-lime-400'    },
  personalizados:      { text: 'text-violet-400',  border: 'border-violet-400/40',  bg: 'bg-violet-400/10',  headerBg: 'bg-violet-400/5',  badge: 'bg-violet-400/15 text-violet-400 border border-violet-400/30', dot: 'bg-violet-400'  },
};

export const FOOD_CATEGORY_MAP: Record<string, FoodCatKey> = {
  // Carnes rojas
  'Vacío': 'carnes_rojas', 'Picanha': 'carnes_rojas', 'Asado de Tira': 'carnes_rojas',
  'Costilla': 'carnes_rojas', 'Entraña': 'carnes_rojas', 'Colita de Cuadril': 'carnes_rojas',
  'Matambre': 'carnes_rojas', 'Ground Beef (lean)': 'carnes_rojas',
  // Carnes blancas
  'Pechuga de Pollo': 'carnes_blancas', 'Bondiola de cerdo': 'carnes_blancas',
  'Paleta de cerdo': 'carnes_blancas', 'Lomo de cerdo': 'carnes_blancas', 'Chorizo crudo': 'carnes_blancas',
  // Pescados
  'Salmón': 'pescados', 'Tuna (canned in water)': 'pescados',
  'Tilapia': 'pescados', 'Camarón': 'pescados',
  // Huevos y lácteos
  'Egg (whole)': 'huevos_lacteos', 'Egg White': 'huevos_lacteos',
  'Greek Yogurt (plain 0%)': 'huevos_lacteos', 'Cottage Cheese': 'huevos_lacteos',
  'Whole Milk': 'huevos_lacteos', 'Whey Protein Powder': 'huevos_lacteos',
  'Cheddar Cheese': 'huevos_lacteos',
  'Queso cremoso': 'huevos_lacteos', 'Queso pategrás': 'huevos_lacteos',
  'Queso mozzarella': 'huevos_lacteos', 'Queso provolone': 'huevos_lacteos', 'Queso parmesano': 'huevos_lacteos',
  // Carbohidratos
  'Arroz Blanco': 'carbohidratos', 'Arroz Integral': 'carbohidratos',
  'Avena': 'carbohidratos', 'Pasta': 'carbohidratos',
  'Quinoa': 'carbohidratos', 'Whole Wheat Bread': 'carbohidratos',
  'White Bread': 'carbohidratos', 'Galletitas de arroz': 'carbohidratos', 'Granola': 'carbohidratos',
  // Verduras
  'Broccoli': 'verduras', 'Spinach': 'verduras', 'Mixed Salad Greens': 'verduras',
  'Batata': 'verduras', 'Papa': 'verduras',
  // Frutas
  'Banana': 'frutas', 'Apple': 'frutas', 'Blueberries': 'frutas',
  'Jugo de naranja natural': 'frutas',
  // Grasas saludables
  'Avocado': 'grasas', 'Almonds': 'grasas', 'Peanut Butter': 'grasas',
  'Olive Oil': 'grasas', 'Aceite de girasol': 'grasas',
  // Fiambres y embutidos
  'Morcilla': 'fiambres', 'Salame': 'fiambres', 'Pepperoni': 'fiambres',
  'Chorizo colorado': 'fiambres', 'Mortadela': 'fiambres', 'Panceta': 'fiambres',
  // Snacks y dulces
  'Chocolate negro 70%': 'snacks', 'Chocolate con leche': 'snacks',
  'Dulce de leche': 'snacks', 'Alfajor de maicena': 'snacks',
  'Maní con chocolate': 'snacks', 'Turrón': 'snacks',
  // Bebidas
  'Cerveza rubia lager': 'bebidas', 'Cerveza negra stout': 'bebidas',
  'Vino tinto': 'bebidas', 'Vino blanco': 'bebidas', 'Fernet': 'bebidas',
  'Coca Cola': 'bebidas', 'Coca Cola Zero': 'bebidas', 'Gatorade': 'bebidas',
  'Monster Energy': 'bebidas',
  // Condimentos
  'Mayonesa': 'condimentos', 'Ketchup': 'condimentos', 'Mostaza': 'condimentos',
  'Salsa de soja': 'condimentos', 'Salsa de tomate': 'condimentos', 'Chimichurri': 'condimentos',
};

export function getCategoryForFood(food: { name: string; isCustom?: boolean }): FoodCatKey {
  if (food.isCustom) return 'personalizados';
  return FOOD_CATEGORY_MAP[food.name] ?? 'personalizados';
}
