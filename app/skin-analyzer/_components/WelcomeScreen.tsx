"use client";

type Props = { onStart: () => void };

export default function WelcomeScreen({ onStart }: Props) {
  return (
    <section className="screen welcome-screen">
      <header className="brand-pill">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/skin-analyzer/assets/logo-plan-your-skin.png"
          alt="Plan Your Skin"
          className="brand-logo-img"
        />
      </header>

      <div className="welcome-hero">
        <div className="welcome-orb" />
        <h1 className="hero-headline">
          Rencana kulit <em>sehatmu</em> dimulai di sini.
        </h1>
        <p className="hero-sub">
          Lakukan smart scanning sekarang untuk membaca profil kulitmu dan dapatkan
          solusi perawatan yang tepat.
        </p>
      </div>

      <div className="welcome-features">
        <div className="feat">
          <span className="feat-dot" />
          <span>Real-Time Skin Mapping</span>
        </div>
        <div className="feat">
          <span className="feat-dot" />
          <span>468-Point Micro Detection</span>
        </div>
        <div className="feat">
          <span className="feat-dot" />
          <span>Auto-Capture Protocol</span>
        </div>
      </div>

      <button type="button" onClick={onStart} className="btn-primary">
        <span>Mulai Skin Mapping</span>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>

      <p className="disclaimer">
        Kamera hanya aktif saat pemindaian. Privasi dan data wajah kamu 100% aman.
      </p>
    </section>
  );
}
