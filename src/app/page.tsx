import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import FoodCategories from "@/components/sections/FoodCategories";
import FeaturedRestaurants from "@/components/sections/FeaturedRestaurants";
import RestaurantsGrid from "@/components/sections/RestaurantsGrid";
import HowItWorks from "@/components/sections/HowItWorks";
import StatsSection from "@/components/sections/StatsSection";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Testimonials from "@/components/sections/Testimonials";
import AppCTA from "@/components/sections/AppCTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Category chips — "What are you craving?" */}
        <FoodCategories />

        {/* 3. Featured restaurants (dark section, per-location) */}
        <FeaturedRestaurants />

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
