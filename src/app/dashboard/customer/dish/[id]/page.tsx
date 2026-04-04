import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChefHat, Store, Tag, ShoppingCart, Info, Sparkles } from "lucide-react";
import DishActions from "@/components/dashboard/customer/DishActions";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { restaurants, menuItems, featuredItems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SITES, DEFAULT_SITE } from "@/config/sites";

async function getDishDetails(id: string) {
  try {
    const [dish] = await db
      .select({
        id: menuItems.id,
        restaurantId: menuItems.restaurantId,
        restaurantName: restaurants.name,
        restaurantLocation: restaurants.location,
        name: menuItems.name,
        description: menuItems.description,
        category: menuItems.category,
        price: menuItems.price,
        status: menuItems.status,
        imageUrl: menuItems.imageUrl,
        isFeatured: sql<boolean>`CASE WHEN ${featuredItems.id} IS NOT NULL THEN true ELSE false END`.as("is_featured"),
      })
      .from(menuItems)
      .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
      .leftJoin(featuredItems, and(eq(featuredItems.entityId, menuItems.id), eq(featuredItems.type, 'dish'), eq(featuredItems.status, 'active')))
      .where(eq(menuItems.id, id));

    if (!dish) return null;

    return {
      ...dish,
      price: parseFloat(dish.price as unknown as string),
    };
  } catch (err) {
    console.error("Failed to fetch dish details:", err);
    return null;
  }
}

export default async function DishDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Guest-friendly — no requireRole
  await getCurrentUser(); // Soft check — won't redirect guests
  const { id } = await params;

  const dish = await getDishDetails(id);
  if (!dish) notFound();

  // Determine site theme based on location or default
  const siteKey = Object.keys(SITES).find(k => SITES[k as keyof typeof SITES].location === dish.restaurantLocation) || DEFAULT_SITE;
  const site = SITES[siteKey as keyof typeof SITES];
  const { gradientFrom, accent } = site.theme;

  const isUnavailable = dish.status === "unavailable";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      {/* Back Navigation */}
      <Link
        href="/dashboard/customer"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to discovery
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Left: Image Section */}
        <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl bg-gray-100 border border-gray-100">
          {dish.imageUrl ? (
            <Image
              src={dish.imageUrl}
              alt={dish.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="w-24 h-24 text-gray-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {isUnavailable && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 transform rotate-[-3deg]">
                <Info className="w-5 h-5 text-gray-900" />
                <span className="font-black text-gray-900 uppercase tracking-widest text-sm">Out of Stock</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Info Section */}
        <div className="flex flex-col justify-center lg:max-w-md">
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  {dish.category}
                </span>
                
                {/* Popular Choice Tag - ONLY IF FEATURED */}
                {dish.isFeatured && dish.status === "available" && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    <Sparkles className="w-3 h-3" />
                    Popular Choice
                  </span>
                )}
              </div>

              <h1 className="font-heading font-black text-3xl sm:text-4xl text-gray-900 leading-tight mb-4 capitalize tracking-tight">
                {dish.name}
              </h1>

              <div className="flex items-center gap-4 text-gray-500">
                <Link
                  href={`/dashboard/customer/restaurant/${dish.restaurantId}`}
                  className="flex items-center gap-2 hover:text-gray-900 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold underline decoration-gray-200 underline-offset-4 group-hover:decoration-gray-900 transition-all">
                    {dish.restaurantName}
                  </span>
                </Link>
                <span className="w-1 h-1 rounded-full bg-gray-200" />
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  £{dish.price.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="prose prose-sm prose-gray max-w-none pt-2 pb-4 border-b border-gray-100">
              <p className="text-gray-500 leading-relaxed text-base italic">
                "{dish.description || "A delicious signature dish prepared with the finest ingredients."}"
              </p>
            </div>

            {/* Hardcoded delivery sections completely removed as requested */}

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <DishActions 
                dish={dish} 
                siteTheme={{ gradientFrom, accent }} 
              />

              <Link
                href={`/dashboard/customer/restaurant/${dish.restaurantId}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 font-bold text-xs sm:text-sm shadow-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                View Menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
