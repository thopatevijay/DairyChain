'use client';
import dynamic from 'next/dynamic';

// Dynamically import the component with SSR disabled
const DairySupplyChain = dynamic(
  () => import('./components/DairySupplyChain'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="flex justify-center items-center w-screen h-screen bg-gray-900">
      <DairySupplyChain />
    </main>
  );
}