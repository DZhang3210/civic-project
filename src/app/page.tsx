"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect } from "react";

type NumberResponse = {
  numbers: number[];
  nextPage: number;
  hasMore: boolean;
};

async function fetchNumbers(page: number): Promise<NumberResponse> {
  const res = await fetch(`/api/numbers?page=${page}`);
  if (!res.ok) {
    throw new Error("Failed to fetch numbers");
  }
  return res.json();
}

export default function Home() {
  const parentRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["numbers"],
      queryFn: ({ pageParam = 1 }) => fetchNumbers(pageParam),
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.nextPage : undefined,
      initialPageParam: 1,
    });

  const allNumbers = data?.pages.flatMap((page) => page.numbers) ?? [];

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allNumbers.length + 1 : allNumbers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  const items = rowVirtualizer.getVirtualItems();

  // Add effect to fetch next page when reaching the bottom
  useEffect(() => {
    const [lastItem] = [...items].reverse();
    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= allNumbers.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    items,
    hasNextPage,
    isFetchingNextPage,
    allNumbers.length,
    fetchNextPage,
  ]);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-1">Infinite Integer List</h1>
      <h2 className="text-sm mb-4">
        Latency is simulated to demonstrate pagination
      </h2>
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border rounded-lg max-w-2xl mx-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {items.map((virtualRow) => {
            const isLoaderRow = virtualRow.index > allNumbers.length - 1;
            const number = allNumbers[virtualRow.index];

            return (
              <div
                key={virtualRow.index}
                className={`absolute top-0 left-0 w-full ${
                  virtualRow.index % 2 ? "bg-gray-400" : "bg-gray-500"
                }`}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  hasNextPage ? (
                    <div className="flex justify-center items-center h-full gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading more...</span>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      Nothing more to load
                    </div>
                  )
                ) : (
                  <div className="flex items-center h-full px-4 justify-center">
                    Number: {number}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
