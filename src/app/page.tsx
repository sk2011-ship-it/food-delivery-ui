import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import FoodCategories from "@/components/sections/FoodCategories";
import FeaturedRestaurants from "@/components/sections/FeaturedRestaurants";
import FeaturedDishes from "@/components/sections/FeaturedDishes";
import RestaurantsGrid from "@/components/sections/RestaurantsGrid";
import HowItWorks from "@/components/sections/HowItWorks";
import StatsSection from "@/components/sections/StatsSection";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Testimonials from "@/components/sections/Testimonials";
import AppCTA from "@/components/sections/AppCTA";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar />
      <main>
        {/* 1. Hero */}
        <HeroSection />

        {user ? (
          <>
            {/* Logged in: Featured Restaurants first, then Categories */}
            <FeaturedRestaurants />
            <FoodCategories />
          </>
        ) : (
          <>
            {/* Guest: Categories first, then Featured Restaurants */}
            <FoodCategories />
            <FeaturedRestaurants />
          </>
        )}

        {/* 3.5 Featured dishes */}
        <FeaturedDishes />

        {/* 4. All restaurants for this location */}
        <RestaurantsGrid />

        {/* 5. How it works */}
        <HowItWorks />

        {/* 6. Stats + Why choose us */}
        <StatsSection />
        <WhyChooseUs />

        {/* 7. Social proof + CTA */}
        <Testimonials />
        <AppCTA />
      </main>
      <Footer />
    </>
  );
}
