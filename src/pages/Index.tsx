import LandingHeader from "@/components/landing/LandingHeader"
import HeroBackground from "@/components/landing/HeroBackground"
import HeroContent from "@/components/landing/HeroContent"

export default function Index() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <LandingHeader />

      <div className="relative flex-1 overflow-hidden">
        <HeroBackground />
        <HeroContent />
      </div>
    </div>
  )
}
