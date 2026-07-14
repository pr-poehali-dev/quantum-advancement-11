import LandingHeader from "@/components/landing/LandingHeader"
import HeroBackground from "@/components/landing/HeroBackground"
import HeroContent from "@/components/landing/HeroContent"
import Footer from "@/components/Footer"

export default function Index() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <LandingHeader />

      <div className="relative flex-1 overflow-hidden">
        <HeroBackground />
        <HeroContent />
      </div>

      <Footer />
    </div>
  )
}