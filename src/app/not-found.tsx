import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-bg p-6">
      <div className="card w-full max-w-xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <SearchX className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-secondary-text">Página no encontrada</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Puede que el enlace esté roto o que el contenido ya no exista.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4" /> Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
