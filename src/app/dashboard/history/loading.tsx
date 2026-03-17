export default function LoadingHistory() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2"></div>
          <div className="h-4 w-64 bg-slate-100 rounded"></div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
        </div>
      </div>

      {/* Control Bar Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 p-1">
         <div className="relative w-full sm:max-w-xs">
           <div className="h-10 w-full bg-slate-100 rounded-xl border border-slate-200"></div>
         </div>
         <div className="flex gap-2">
            <div className="h-10 w-24 bg-slate-100 rounded-xl"></div>
            <div className="h-10 w-24 bg-slate-100 rounded-xl"></div>
         </div>
      </div>
      
      {/* Table Skeleton */}
      <div className="card overflow-hidden">
         <div className="min-w-full divide-y divide-secondary-border">
            {/* Table Header */}
            <div className="bg-slate-50 flex items-center p-4">
               <div className="w-1/3 h-4 bg-slate-200 rounded mx-2"></div>
               <div className="w-1/4 h-4 bg-slate-200 rounded mx-2"></div>
               <div className="w-1/6 h-4 bg-slate-200 rounded mx-2"></div>
               <div className="w-1/6 h-4 bg-slate-200 rounded mx-2"></div>
            </div>
            {/* Rows */}
            {[1,2,3,4,5].map(i => (
               <div key={i} className="flex items-center p-4">
                 <div className="w-1/3 flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0"></div>
                   <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                      <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                   </div>
                 </div>
                 <div className="w-1/4 px-2"><div className="h-4 w-24 bg-slate-100 rounded"></div></div>
                 <div className="w-1/6 px-2"><div className="h-4 w-16 bg-slate-100 rounded"></div></div>
                 <div className="w-1/6 px-2"><div className="h-6 w-20 bg-slate-200 rounded-full"></div></div>
                 <div className="w-10 px-2"><div className="h-8 w-8 bg-slate-100 rounded-lg"></div></div>
               </div>
            ))}
         </div>
      </div>
    </div>
  )
}
