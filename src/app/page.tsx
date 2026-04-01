import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import HowItWorks from "@/components/sections/HowItWorks";
import FoodCategories from "@/components/sections/FoodCategories";
import StatsSection from "@/components/sections/StatsSection";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Testimonials from "@/components/sections/Testimonials";
import AppCTA from "@/components/sections/AppCTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <FoodCategories />
        <StatsSection />
        <WhyChooseUs />
        <Testimonials />
        <AppCTA />
      </main>
      <Footer />
    </>
  );
}
