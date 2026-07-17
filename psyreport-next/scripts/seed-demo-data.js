const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function daysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function birthDateWithUpcomingBirthday(age, daysUntilBirthday) {
  const today = new Date();
  const nextBirthday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntilBirthday);
  const birth = new Date(nextBirthday.getFullYear() - age, nextBirthday.getMonth(), nextBirthday.getDate());
  return birth;
}

async function upsertUser({ email, name, password, role, dni }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role,
      dni,
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role,
      dni,
    },
  });
}

async function ensurePatient(userId, data) {
  const existing = await prisma.patient.findFirst({
    where: { userId, name: data.name, deletedAt: null },
  });

  if (existing) {
    return prisma.patient.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.patient.create({ data: { userId, ...data } });
}

function content(meta, fields) {
  return JSON.stringify({ meta, fields });
}

async function createReportWithVersion(userId, patient, input) {
  const report = await prisma.report.create({
    data: {
      userId,
      patientId: patient.id,
      title: input.title,
      type: input.patientCategory,
      reportKind: input.reportKind,
      patientCategory: input.patientCategory,
      status: input.status,
      content: content(
        { kind: input.reportKind, category: input.patientCategory },
        {
          prof_nombre: "Profesional Demo",
          prof_dni: "12345678A",
          prof_centro: "Centro Psicologico Emotiva",
          prof_fecha: new Date().toISOString().slice(0, 10),
          pac_nombre: patient.name,
          pac_dni: patient.dni || "",
          pac_birth_date: patient.birthDate ? patient.birthDate.toISOString().slice(0, 10) : "",
          pac_age: input.age || "",
          guardian_name: patient.guardianName || "",
          guardian_dni: patient.guardianDni || "",
          consult_reason: input.consultReason,
          assessment_methods: input.assessmentMethods || "Entrevista psicologica, observacion conductual y registro clinico.",
          behavioral_observation: input.behavioralObservation || "Paciente colaborador durante las sesiones.",
          relevant_data: input.relevantData || "",
          results_summary: input.resultsSummary || "",
          area_school: input.areaSchool || "",
          clinical_impression: input.clinicalImpression || "",
          recommendations: input.recommendations || "",
          progress_summary: input.progressSummary || "",
          background: input.background || "",
          therapy_goals: input.therapyGoals || "",
          session_count: input.sessionCount ? String(input.sessionCount) : "",
          signature_name: "Profesional Demo",
        }
      ),
    },
  });

  await prisma.reportVersion.create({
    data: {
      reportId: report.id,
      version: 1,
      title: report.title,
      type: report.type,
      status: report.status,
      content: report.content,
      createdByUserId: userId,
    },
  });
}

async function createDemoDataForUser(user) {
  await prisma.reportVersion.deleteMany({ where: { createdByUserId: user.id } });
  await prisma.report.deleteMany({ where: { userId: user.id } });
  await prisma.appointment.deleteMany({ where: { userId: user.id } });
  await prisma.patient.deleteMany({ where: { userId: user.id } });

  const patients = {
    child: await ensurePatient(user.id, {
      name: "Lucas Perez",
      email: "lucas.familia@example.local",
      phone: "600111222",
      dni: "12345678Z",
      birthDate: birthDateWithUpcomingBirthday(8, 2),
      description: "Ninos",
      patientType: "infantil",
      status: "activo",
      active: true,
      guardianName: "Marta Perez",
      guardianDni: "87654321X",
      guardianPhone: "600222333",
      guardianEmail: "marta.perez@example.local",
      clinicalAlerts: "Cumpleanos cercano. Confirmar asistencia antes de la proxima sesion.",
      color: "bg-blue-500",
    }),
    teen: await ensurePatient(user.id, {
      name: "Angela Ruiz",
      email: "angela.teen@example.local",
      phone: "600333444",
      dni: "23456789B",
      birthDate: birthDateWithUpcomingBirthday(16, 6),
      description: "Adolescentes",
      patientType: "adolescente",
      status: "pausa",
      active: false,
      guardianName: "Laura Ruiz",
      guardianDni: "76543210C",
      guardianPhone: "600444555",
      color: "bg-indigo-500",
    }),
    childToday: await ensurePatient(user.id, {
      name: "Sofia Lopez",
      email: "sofia.familia@example.local",
      phone: "600121212",
      dni: "33445566G",
      birthDate: birthDateWithUpcomingBirthday(10, 0),
      description: "Ninos",
      patientType: "infantil",
      status: "activo",
      active: true,
      guardianName: "Elena Lopez",
      guardianDni: "66554433H",
      guardianPhone: "600343434",
      clinicalAlerts: "Cumpleanos hoy. Confirmar con familia si acude a consulta.",
      color: "bg-cyan-500",
    }),
    adult: await ensurePatient(user.id, {
      name: "Carlos Martin",
      email: "carlos.adulto@example.local",
      phone: "600555666",
      dni: "34567890D",
      birthDate: birthDateWithUpcomingBirthday(34, 40),
      description: "Adultos",
      patientType: "adulto",
      status: "activo",
      active: true,
      color: "bg-sky-500",
    }),
    couple: await ensurePatient(user.id, {
      name: "Paula y Sergio",
      email: "pareja@example.local",
      phone: "600777888",
      dni: "45678901E",
      description: "Parejas",
      patientType: "pareja",
      status: "activo",
      active: true,
      color: "bg-violet-500",
    }),
    family: await ensurePatient(user.id, {
      name: "Familia Navarro",
      email: "familia.navarro@example.local",
      phone: "600999000",
      dni: "56789012F",
      description: "Familia",
      patientType: "familia",
      status: "pasivo",
      active: false,
      clinicalAlerts: "Familia en seguimiento discontinuo. Revisar si reactivan proceso.",
      color: "bg-cyan-500",
    }),
  };

  await createReportWithVersion(user.id, patients.child, {
    title: "Historia clinica Ninos - Lucas Perez",
    reportKind: "historia_clinica",
    patientCategory: "infantil",
    status: "Finalizado",
    age: "8",
    consultReason: "Baja tolerancia a la frustracion y dificultades en contexto escolar.",
    clinicalImpression: "Necesita apoyo en regulacion emocional y habilidades de espera.",
    recommendations: "Coordinar con familia y colegio.",
  });

  await createReportWithVersion(user.id, patients.child, {
    title: "Informe Ninos - Lucas Perez",
    reportKind: "informe",
    patientCategory: "infantil",
    status: "Finalizado",
    age: "8",
    consultReason: "Evaluacion emocional infantil.",
    resultsSummary: "Presenta dificultades de regulacion emocional, especialmente ante cambios de rutina.",
    areaSchool: "Se observan dificultades de adaptacion y seguimiento de consignas en aula.",
    clinicalImpression: "Perfil compatible con desregulacion emocional leve.",
    recommendations: "Mantener apoyos visuales y anticipacion de cambios.",
  });

  await createReportWithVersion(user.id, patients.childToday, {
    title: "Informe Ninos - Sofia Lopez",
    reportKind: "informe",
    patientCategory: "infantil",
    status: "Completado",
    age: "10",
    consultReason: "Seguimiento emocional infantil y contexto escolar.",
    resultsSummary: "Se observan avances en expresion emocional y mayor tolerancia a la espera.",
    areaSchool: "El colegio reporta mejor adaptacion en aula y menos oposicion conductual.",
    clinicalImpression: "Evolucion favorable con necesidad de mantenimiento.",
    recommendations: "Mantener pautas de anticipacion y refuerzo positivo.",
  });

  await createReportWithVersion(user.id, patients.teen, {
    title: "Reporte Adolescentes - Angela Ruiz",
    reportKind: "registro",
    patientCategory: "adolescente",
    status: "Borrador",
    age: "16",
    consultReason: "Seguimiento breve de 8 sesiones.",
    background: "Dificultades de ansiedad social y evitacion escolar.",
    sessionCount: 8,
    therapyGoals: "Trabajar exposicion gradual y habilidades sociales.",
    progressSummary: "Mejora parcial en participacion y expresion emocional.",
    clinicalImpression: "Proceso en pausa pendiente de reactivacion.",
  });

  await createReportWithVersion(user.id, patients.adult, {
    title: "Historia clinica Adultos - Carlos Martin",
    reportKind: "historia_clinica",
    patientCategory: "adulto",
    status: "Finalizado",
    age: "34",
    consultReason: "Ansiedad sostenida, dificultades de descanso y estres laboral.",
    clinicalImpression: "Necesidad de intervencion en ansiedad y reorganizacion de habitos.",
  });

  await createReportWithVersion(user.id, patients.adult, {
    title: "Informe Adultos - Carlos Martin",
    reportKind: "informe",
    patientCategory: "adulto",
    status: "Completado",
    age: "34",
    consultReason: "Informe psicologico de evolucion.",
    resultsSummary: "Los resultados sugieren sintomatologia ansiosa moderada y agotamiento laboral.",
    clinicalImpression: "Se recomienda continuar tratamiento y trabajo en regulacion.",
    recommendations: "Rutina de sueno, pausas activas y reestructuracion cognitiva.",
  });

  await createReportWithVersion(user.id, patients.couple, {
    title: "Historia clinica Parejas - Paula y Sergio",
    reportKind: "historia_clinica",
    patientCategory: "pareja",
    status: "Finalizado",
    consultReason: "Conflictos de comunicacion y toma de decisiones.",
    clinicalImpression: "Necesitan trabajo en escucha mutua y reparacion de conflicto.",
  });

  await createReportWithVersion(user.id, patients.family, {
    title: "Reporte Familia - Familia Navarro",
    reportKind: "registro",
    patientCategory: "familia",
    status: "Completado",
    consultReason: "Seguimiento de dinamica familiar.",
    sessionCount: 6,
    progressSummary: "Se observaron mejoras parciales en normas y rutinas familiares.",
    clinicalImpression: "Proceso cerrado temporalmente por acuerdo familiar.",
    recommendations: "Reactivar si reaparecen conflictos de convivencia.",
  });

  await prisma.appointment.createMany({
    data: [
      {
        userId: user.id,
        patientId: patients.child.id,
        title: "Sesion infantil de seguimiento",
        type: "Presencial",
        status: "programada",
        date: daysFromToday(1),
      },
      {
        userId: user.id,
        patientId: patients.adult.id,
        title: "Videoconsulta adulto",
        type: "Videoconsulta",
        status: "programada",
        provider: "jitsi",
        roomName: `Emotiva-${patients.adult.id.slice(0, 8)}`,
        meetingUrl: `https://meet.jit.si/Emotiva-${patients.adult.id.slice(0, 8)}`,
        date: daysFromToday(2),
      },
    ],
  });
}

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@example.local";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "Owner1234";
  const demoEmail = process.env.SEED_DEMO_EMAIL || "demo@psyreport.es";
  const demoPassword = process.env.SEED_DEMO_PASSWORD || "Demo1234";

  const owner = await upsertUser({
    email: ownerEmail,
    name: "Responsable del Centro",
    password: ownerPassword,
    role: "ADMIN",
    dni: "11223344A",
  });

  const demo = await upsertUser({
    email: demoEmail,
    name: "Profesional Demo",
    password: demoPassword,
    role: "ADMIN",
    dni: "22334455B",
  });

  await createDemoDataForUser(owner);
  await createDemoDataForUser(demo);

  console.log("Seed demo completado.");
  console.log("Owner:", owner.email, ownerPassword);
  console.log("Demo:", demo.email, demoPassword);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
