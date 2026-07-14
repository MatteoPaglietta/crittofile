// Sfondo dell'app, derivato da un'unica immagine sorgente (public/sfondo-mobile.jpg):
// - mobile: l'immagine (verticale) copre l'intero schermo così com'è;
// - desktop/tablet landscape: un dittico speculare della stessa foto (metà destra
//   dell'immagine + il suo mirror orizzontale) per ottenere una composizione
//   "wide" coerente, senza cuciture visibili al centro.
export default function BackgroundLayer() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[url('/sfondo-mobile.jpg')] bg-cover bg-center md:hidden" />

      <div className="absolute inset-0 hidden md:flex">
        <div className="h-full w-1/2 bg-[url('/sfondo-mobile.jpg')] bg-cover bg-right bg-no-repeat" />
        <div className="h-full w-1/2 -scale-x-100 bg-[url('/sfondo-mobile.jpg')] bg-cover bg-right bg-no-repeat" />
      </div>

      <div className="absolute inset-0 bg-slate-950/55" />
    </div>
  );
}
