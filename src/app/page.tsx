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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
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
    <main className="min-h-screen p-8 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">
          Infinite Integer List
        </h1>
        <h2 className="text-sm text-gray-300 mb-6">
          Latency is simulated to demonstrate pagination
        </h2>
        <div
          ref={parentRef}
          className="h-[600px] overflow-auto rounded-xl shadow-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700"
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
                  className={`absolute top-0 left-0 w-full transition-colors duration-200 ${
                    virtualRow.index % 2
                      ? "bg-gray-700/50 hover:bg-gray-700/70"
                      : "bg-gray-800/50 hover:bg-gray-800/70"
                  }`}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    hasNextPage ? (
                      <div className="flex justify-center items-center h-full gap-3">
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-400 font-medium">
                          Loading more...
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full text-gray-400">
                        Nothing more to load
                      </div>
                    )
                  ) : (
                    <div className="flex items-center h-full px-4 justify-center">
                      <div className="text-white text-lg font-medium">
                        Number: <span className="text-blue-400">{number}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
