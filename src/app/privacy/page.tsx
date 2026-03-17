import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, FileText, Database, Mail, Clock, AlertTriangle } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[#5b8fd4] font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
          {/* Header */}
          <div className="flex items-center gap-5 mb-10 pb-8 border-b border-slate-100">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-[#5b8fd4]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800">Política de Privacidad</h1>
              <p className="text-slate-500 font-medium mt-1">Última actualización: 17 de marzo de 2026</p>
              <p className="text-slate-400 text-sm mt-0.5">En cumplimiento del RGPD (UE) 2016/679 y la LOPD-GDD (Ley Orgánica 3/2018)</p>
            </div>
          </div>

          <div className="space-y-8 text-slate-600 leading-relaxed">

            {/* 1. Responsable */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4 text-[#5b8fd4]" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">1. Responsable del Tratamiento</h2>
              </div>
              <div className="bg-slate-50 rounded-xl p-5 text-sm space-y-2 border border-slate-100">
                <p><strong className="text-slate-700">Denominación social:</strong> Centro Psicológico Emotiva</p>
                <p><strong className="text-slate-700">NIF:</strong> Pendiente de actualización</p>
                <p><strong className="text-slate-700">Domicilio:</strong> Calle Mayor 45, 2º Izquierda, 28013 Madrid, España</p>
                <p><strong className="text-slate-700">Correo electrónico:</strong> privacidad@emotivapsicologia.es</p>
                <p><strong className="text-slate-700">Teléfono:</strong> +34 91 123 45 67</p>
                <p><strong className="text-slate-700">Actividad:</strong> Prestación de servicios de psicología clínica especializada en personas menores de edad, adolescentes y familias.</p>
              </div>
            </section>

            {/* 2. Finalidad */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">2. Finalidad del Tratamiento</h2>
              </div>
              <p className="mb-3">El software <strong>Emotiva System</strong> trata los datos personales para las siguientes finalidades:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li><strong>Gestión del historial clínico electrónico</strong> de pacientes atendidos en el centro, incluyendo informes psicológicos, evaluaciones, anamnesis y notas de sesión.</li>
                <li><strong>Coordinación de agenda y citas</strong> entre profesionales y pacientes/tutores legales.</li>
                <li><strong>Comunicación interna</strong> entre los profesionales del equipo para garantizar la continuidad asistencial.</li>
                <li><strong>Cumplimiento de obligaciones legales</strong> derivadas de la legislación sanitaria aplicable (Ley 41/2002 de Autonomía del Paciente) y normativas de protección de datos.</li>
                <li><strong>Videoconsulta clínica</strong> a través de la plataforma integrada, con cifrado punto a punto.</li>
              </ul>
            </section>

            {/* 3. Base jurídica */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">3. Base Jurídica del Tratamiento</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-700 shrink-0">Art. 6.1.b RGPD:</span>
                  <span>Ejecución de la relación contractual terapéutica y prestación del servicio clínico.</span>
                </div>
                <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-700 shrink-0">Art. 6.1.c RGPD:</span>
                  <span>Cumplimiento de obligaciones legales (legislación sanitaria, fiscal y de seguridad social).</span>
                </div>
                <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-700 shrink-0">Art. 9.2.h RGPD:</span>
                  <span>Tratamiento de categorías especiales de datos (datos de salud) para fines de diagnóstico, asistencia sanitaria y gestión de sistemas y servicios de asistencia sanitaria y social.</span>
                </div>
              </div>
            </section>

            {/* 4. Categorías de datos */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">4. Categorías de Datos Tratados</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="font-bold text-orange-700 mb-2">🔴 Datos Sensibles (Art. 9 RGPD)</p>
                  <ul className="space-y-1 text-orange-700/80">
                    <li>Historiales psicológicos y psiquiátricos</li>
                    <li>Informes diagnósticos y evaluaciones</li>
                    <li>Notas de sesión y evolución clínica</li>
                    <li>Datos de salud mental de menores</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-700 mb-2">⚪ Datos Identificativos</p>
                  <ul className="space-y-1 text-slate-600">
                    <li>Nombre y apellidos del paciente y/o tutor</li>
                    <li>DNI/NIE, fecha de nacimiento</li>
                    <li>Email y teléfono de contacto</li>
                    <li>Datos del profesional (nº colegiado)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Conservación */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">5. Plazo de Conservación</h2>
              </div>
              <p className="text-sm">De acuerdo con la Ley 41/2002 de Autonomía del Paciente y la normativa autonómica aplicable, <strong>la documentación clínica se conservará durante un mínimo de 5 años</strong> desde la última asistencia prestada. Los datos de menores se conservarán hasta que el menor cumpla la mayoría de edad y un mínimo adicional de 5 años. Transcurridos los plazos legales, los datos serán eliminados o anonimizados de forma segura.</p>
            </section>

            {/* 6. Destinatarios */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">6. Destinatarios y Cesiones</h2>
              <p className="text-sm mb-3"><strong>Centro Psicológico Emotiva no cede ni vende datos a terceros con fines comerciales.</strong> Únicamente se realizarán comunicaciones cuando:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Exista <strong>obligación legal</strong> (autoridades judiciales, sanitarias o administrativas).</li>
                <li>Sea necesario para la <strong>derivación a otro especialista</strong>, con consentimiento del paciente/tutor.</li>
                <li>Prestadores de servicios tecnológicos (<strong>encargados del tratamiento</strong>) bajo acuerdo DPA conforme al Art. 28 RGPD (infraestructura cloud de base de datos con sede en la UE).</li>
              </ul>
            </section>

            {/* 7. Medidas de seguridad */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#5b8fd4]" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">7. Medidas de Seguridad Técnicas</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Cifrado de contraseñas mediante <strong>bcrypt (factor 10)</strong> — las contraseñas no son recuperables.</li>
                <li>Sesiones gestionadas mediante cookies <strong>HTTP-Only</strong> con expiración automática, inaccesibles desde JavaScript (protección XSS).</li>
                <li>Transmisión de datos cifrada mediante <strong>TLS 1.3 / HTTPS</strong>.</li>
                <li>Base de datos con acceso restringido por IP y autenticación de certificado cliente (<strong>PostgreSQL en entorno cloud EU</strong>).</li>
                <li>Conexión de videoconsulta con <strong>cifrado extremo a extremo</strong>.</li>
                <li>Auditoría de accesos y registros de actividad almacenados.</li>
              </ul>
            </section>

            {/* 8. Derechos */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">8. Derechos del Interesado (ARCO+P)</h2>
              </div>
              <p className="text-sm mb-4">De acuerdo con los artículos 15-22 del RGPD y los artículos 12-18 de la LOPD-GDD, el interesado puede ejercer los siguientes derechos:</p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                {[
                  { r: "Acceso", d: "Conocer qué datos suyos tratamos." },
                  { r: "Rectificación", d: "Corregir datos inexactos o incompletos." },
                  { r: "Supresión", d: "Solicitar la eliminación de sus datos ('derecho al olvido')." },
                  { r: "Oposición", d: "Oponerse al tratamiento en determinados supuestos." },
                  { r: "Limitación", d: "Restringir el tratamiento de sus datos." },
                  { r: "Portabilidad", d: "Recibir sus datos en formato estructurado y legible." },
                ].map(({ r, d }) => (
                  <div key={r} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-700">{r}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{d}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm bg-blue-50 p-4 rounded-xl border border-blue-100">
                Para ejercer sus derechos, envíe un escrito con copia de su DNI/NIE a:{" "}
                <a href="mailto:privacidad@emotivapsicologia.es" className="text-[#5b8fd4] font-bold hover:underline">
                  privacidad@emotivapsicologia.es
                </a>
                {" "}o a la dirección postal indicada en el apartado 1. Tiene derecho a presentar reclamación ante la{" "}
                <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[#5b8fd4] font-bold hover:underline">
                  Agencia Española de Protección de Datos (AEPD)
                </a>.
              </p>
            </section>

            {/* 9. Menores */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">9. Protección de Datos de Menores</h2>
              </div>
              <p className="text-sm">El Centro Psicológico Emotiva está especializado en la atención a niños y adolescentes. El tratamiento de datos de menores de 14 años requiere el <strong>consentimiento expreso de los padres o tutores legales</strong>, conforme al Art. 8 RGPD y el Art. 7 LOPD-GDD. Para menores de entre 14 y 18 años, se recabará también el consentimiento del propio menor cuando sea posible. En caso de riesgo para el menor, podrán realizarse comunicaciones a las autoridades competentes sin necesidad de consentimiento previo (Art. 45 LOPD-GDD).</p>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
              Esta política puede actualizarse. La versión vigente siempre estará disponible en esta página.
              <br />Centro Psicológico Emotiva · C/ Mayor 45, 28013 Madrid · privacidad@emotivapsicologia.es
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
