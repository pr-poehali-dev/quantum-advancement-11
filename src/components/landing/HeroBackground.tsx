export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <img
        src="https://cdn.poehali.dev/projects/1a5ec0e8-88b9-4062-a5e2-e2ec44d19777/files/a2e10f3e-873c-4a36-b235-971e6d5f6359.jpg"
        alt=""
        className="w-full h-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-choco-950/70 via-choco-950/50 to-choco-950" />
      <div className="absolute inset-0 bg-choco-950/30" />
    </div>
  )
}
