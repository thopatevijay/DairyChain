'use client';
import MilkSupplyChain from './components/MilkSupplyChain';

export default function Home() {
  return (
    <main className="flex justify-center items-center w-screen h-screen bg-gray-900">
      {/* <DairySupplyChain /> */}
      <MilkSupplyChain />
    </main>
  );
}