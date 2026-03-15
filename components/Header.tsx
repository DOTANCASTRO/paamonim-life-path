'use client';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.paamonim.org/wp-content/uploads/2022/05/Group-49.png"
          alt="פעמונים"
          className="h-10 object-contain"
        />
      </div>
      <div className="text-xs text-gray-400 font-medium tracking-wide">
        Castro Lab
      </div>
    </header>
  );
}
