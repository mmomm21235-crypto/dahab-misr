"use client";

import type { GoldPrices } from "@/types";
import { GoldPriceCard } from "./GoldPriceCard";
import { GoldPriceCardSkeleton } from "@/components/shared/SkeletonCard";

interface PriceGridProps {
  prices: GoldPrices | null;
  isLoading: boolean;
}

export function PriceGrid({ prices, isLoading }: PriceGridProps) {
  if (isLoading || !prices) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children" role="list">
        {[...Array(4)].map((_, i) => (
          <div role="listitem" key={i}>
            <GoldPriceCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { price: prices.karat21, isHighlighted: true, delay: 0 },
    { price: prices.karat24, isHighlighted: false, delay: 60 },
    { price: prices.karat18, isHighlighted: false, delay: 120 },
    { price: prices.pound, isHighlighted: false, delay: 180 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list">
      {cards.map(({ price, isHighlighted, delay }) => (
        <div role="listitem" key={price.karat}>
          <GoldPriceCard
            price={price}
            isHighlighted={isHighlighted}
            animationDelay={delay}
          />
        </div>
      ))}
    </div>
  );
}
