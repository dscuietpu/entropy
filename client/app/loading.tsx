import { LoadingState } from "@/components/ui/loading-state";

export default function GlobalLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="py-12 sm:py-16">
        <LoadingState
          title="Loading page"
          description="We are fetching the latest hospital, equipment, and coordination data for this view."
          fullHeight
        />
      </div>
    </div>
  );
}
