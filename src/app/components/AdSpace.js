'use client';


export default function AdSpace({
  ad = {
    image: '/adv.jpg',
    href: '#',
    label: 'Advertisement',
    alt: 'Sponsored',
  },
  orientation = 'horizontal', // 'horizontal' | 'vertical'
  className = '',
}) {
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 ${className}`}
    >
      <span className="absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        {ad.label || 'Advertisement'}
      </span>
      <a
        href={ad.href || '#'}
        target={ad.href && ad.href !== '#' ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={ad.image}
          alt={ad.alt || 'Advertisement'}
          className={`w-full object-cover ${isVertical ? 'h-64 md:h-80' : 'h-28 md:h-36'}`}
        />
      </a>
    </div>
  );
}
