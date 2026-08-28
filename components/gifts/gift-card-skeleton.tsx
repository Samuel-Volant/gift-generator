import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function GiftCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-3 border-t">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </CardFooter>
    </Card>
  )
}
