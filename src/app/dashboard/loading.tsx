export default function LoadingDashboard() {
  return (
    <div className="space-y-6 lg:space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2"></div>
          <div className="h-4 w-64 bg-slate-100 rounded"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {[1,2,3,4].map(i => (
            <div key={i} className="card p-5 border border-slate-100">
               <div className="w-12 h-12 bg-slate-100 rounded-2xl mb-4"></div>
               <div className="h-8 w-16 bg-slate-200 rounded mb-2"></div>
               <div className="h-3 w-28 bg-slate-100 rounded"></div>
            </div>
         ))}
      </div>
      
      {/* Content Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
         <div className="lg:col-span-2 space-y-4">
            <div className="h-6 w-40 bg-slate-200 rounded"></div>
            <div className="card p-5 space-y-4">
              {[1,2,3].map(i => (
                 <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0"></div>
                    <div className="space-y-2 flex-1">
                       <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                       <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                    </div>
                 </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  )
}
