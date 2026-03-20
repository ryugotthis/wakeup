import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <section className="flex flex-col items-center justify-center py-20">
        <Image
          src="/images/brand/wakeup-logo.png"
          alt="WakeUp"
          width={160}
          height={60}
          priority
        />

        <h1 className="mt-6 text-2xl font-semibold">Find your skin type</h1>
      </section>
    </main>
  );
}
