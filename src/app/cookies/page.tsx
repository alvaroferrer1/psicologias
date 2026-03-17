import Link from "next/link";
import { ArrowLeft, Cookie, ToggleLeft, ShieldCheck, AlertTriangle } from "lucide-react";

export default function CookiesPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[#5b8fd4] font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
          {/* Header */}
          <div className="flex items-center gap-5 mb-10 pb-8 border-b border-slate-100">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
              <Cookie className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800">Política de Cookies</h1>
              <p className="text-slate-500 font-medium mt-1">Última actualización: 17 de marzo de 2026</p>
              <p className="text-slate-400 text-sm mt-0.5">
                Conforme al Art. 22.2 LSSI-CE, el RGPD (UE) 2016/679 y la Directiva ePrivacy 2009/136/CE
              </p>
            </div>
          </div>

          <div className="space-y-8 text-slate-600 leading-relaxed">

            {/* Intro */}
            <section>
              <p className="text-sm">
                <strong>Centro Psicológico Emotiva</strong> (en adelante <em>"Emotiva System"</em>), titular del software de gestión clínica psicológica, informa al usuario sobre el uso de cookies en esta aplicación web conforme a la legislación vigente.
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#5b8fd4] shrink-0 mt-0.5" />
                <p><strong>Importante:</strong> Por tratarse de un entorno que gestiona datos clínicos psicológicos de especial sensibilidad, <strong>Emotiva System no utiliza</strong> cookies de análisis, publicidad ni rastreo de ningún tipo. Solo se emplean las cookies estrictamente necesarias para el funcionamiento del servicio.</p>
              </div>
            </section>

            {/* ¿Qué son? */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">1. ¿Qué son las cookies?</h2>
              <p className="text-sm">Las cookies son pequeños ficheros de texto que un sitio web almacena en el navegador del usuario cuando accede a él. Permiten que el sitio recuerde información sobre su visita, como el idioma elegido o el estado de su sesión. No contienen virus ni código ejecutable.</p>
            </section>

            {/* Tabla de cookies */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4">2. Relación de Cookies Utilizadas</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border border-slate-200">
                      <th className="p-3 text-left font-bold text-slate-700 border-b border-slate-200">Nombre</th>
                      <th className="p-3 text-left font-bold text-slate-700 border-b border-slate-200">Tipo</th>
                      <th className="p-3 text-left font-bold text-slate-700 border-b border-slate-200">Finalidad</th>
                      <th className="p-3 text-left font-bold text-slate-700 border-b border-slate-200">Duración</th>
                      <th className="p-3 text-left font-bold text-slate-700 border-b border-slate-200">Titular</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs font-bold text-slate-700">psyreport_session</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Necesaria</span></td>
                      <td className="p-3 text-slate-600">Mantiene la sesión autenticada del profesional. Cookie <strong>HTTP-Only</strong>: no accesible desde JavaScript (protección XSS). Sin ella no es posible acceder al panel clínico.</td>
                      <td className="p-3 text-slate-600">Sesión / 8 horas (modo seguro) o 7 días (recordar sesión)</td>
                      <td className="p-3 text-slate-600">Emotiva System</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs font-bold text-slate-700">emotiva_cookies_accepted</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Necesaria</span></td>
                      <td className="p-3 text-slate-600">Almacena la preferencia del usuario sobre el aviso de cookies para no mostrarlo nuevamente durante el periodo indicado.</td>
                      <td className="p-3 text-slate-600">1 año</td>
                      <td className="p-3 text-slate-600">Emotiva System</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-3">* Cookie &quot;Necesaria&quot;: su desactivación impide el correcto funcionamiento del servicio.</p>
            </section>

            {/* Cookies NO utilizadas */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4">3. Cookies que NO Utilizamos</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  { icon: "❌", label: "Cookies de análisis", desc: "Google Analytics, Matomo, Hotjar u similares." },
                  { icon: "❌", label: "Cookies publicitarias", desc: "Google AdSense, Meta Pixel, LinkedIn Insight." },
                  { icon: "❌", label: "Cookies de redes sociales", desc: "Twitter/X, Facebook, Instagram, TikTok." },
                  { icon: "❌", label: "Cookies de rastreo o perfilado", desc: "Ningún sistema de seguimiento de comportamiento." },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <p className="font-bold text-slate-700 text-[13px]">{label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Gestión */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                  <ToggleLeft className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">4. Cómo Gestionar las Cookies</h2>
              </div>
              <p className="text-sm mb-4">El usuario puede configurar su navegador para bloquear o eliminar cookies. A continuación, los enlaces a las instrucciones de los principales navegadores:</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {[
                  { name: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
                  { name: "Mozilla Firefox", url: "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" },
                  { name: "Microsoft Edge", url: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge" },
                  { name: "Apple Safari", url: "https://support.apple.com/es-es/guide/safari/sfri11471/mac" },
                ].map(({ name, url }) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-[#5b8fd4]/40 hover:bg-blue-50 transition-colors flex items-center gap-2 font-semibold text-slate-700 hover:text-[#5b8fd4]">
                    <span>→</span> {name}
                  </a>
                ))}
              </div>
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p><strong>Atención:</strong> Si deshabilita las cookies de sesión desde su navegador, no podrá iniciar sesión en Emotiva System, ya que estas son imprescindibles para la autenticación segura. Para cerrar sesión correctamente, utilice el botón <strong className="text-red-600">&quot;Cerrar sesión&quot;</strong> dentro del panel.</p>
              </div>
            </section>

            {/* Consentimiento */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">5. Base Legal y Consentimiento</h2>
              <p className="text-sm">Conforme al Art. 22.2 de la Ley 34/2002 (LSSI-CE), las cookies estrictamente necesarias para la prestación del servicio están exentas de la obligación de obtener consentimiento previo. No obstante, el usuario es informado de su uso mediante el banner de cookies que aparece en el primer acceso, pudiendo obtener información adicional a través de esta política.</p>
            </section>

            {/* Actualizaciones */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">6. Actualizaciones de esta Política</h2>
              <p className="text-sm">Centro Psicológico Emotiva se reserva el derecho a modificar esta política en cualquier momento para adaptarla a novedades legislativas, jurisprudenciales o técnicas. La versión actualizada estará siempre disponible en esta página con la fecha de última modificación indicada.</p>
            </section>

            {/* Contacto */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">7. Contacto</h2>
              <p className="text-sm">Para cualquier consulta sobre esta política o el ejercicio de sus derechos, puede dirigirse a:</p>
              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                <p><strong>Centro Psicológico Emotiva</strong></p>
                <p>Calle Mayor 45, 2º Izquierda, 28013 Madrid</p>
                <p>Email: <a href="mailto:privacidad@emotivapsicologia.es" className="text-[#5b8fd4] font-bold hover:underline">privacidad@emotivapsicologia.es</a></p>
              </div>
            </section>

            <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
              © 2026 Centro Psicológico Emotiva · Política de Cookies v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
