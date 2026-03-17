const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function upsertUser({ email, name, password, role, colegiado }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role,
      colegiado,
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role,
      colegiado,
    },
  });
}

async function createDemoDataForUser(user) {
  const existingPatients = await prisma.patient.count({
    where: { userId: user.id, deletedAt: null },
  });

  if (existingPatients > 0) {
    return;
  }

  const patient1 = await prisma.patient.create({
    data: {
      userId: user.id,
      name: "Paciente Ejemplo Uno",
      email: "familia.uno@example.local",
      phone: "600111222",
      description: "Caso demo de seguimiento emocional.",
      color: "bg-emerald-500",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      userId: user.id,
      name: "Paciente Ejemplo Dos",
      email: "familia.dos@example.local",
      phone: "600333444",
      description: "Caso demo de evaluacion inicial.",
      color: "bg-sky-500",
    },
  });

  const report1 = await prisma.report.create({
    data: {
      userId: user.id,
      patientId: patient1.id,
      title: "Informe evolutivo demo",
      type: "Seguimiento",
      status: "Borrador",
      content: JSON.stringify({
        prof_nombre: user.name,
        prof_colegiado: user.colegiado || "",
        prof_fecha: new Date().toISOString().slice(0, 10),
        pac_nombre: patient1.name,
        consult_motivo: "Caso de ejemplo para validar el flujo de trabajo.",
        eval_resumen: "Contenido de prueba sin datos reales.",
        hall_hallazgos: "Pendiente de valoracion clinica.",
        hall_plan: "Pendiente de plan de intervencion.",
        concl_conclusiones: "Borrador demostrativo.",
        concl_recomendaciones: "Usar solo con fines de prueba.",
        consentimiento: true,
      }),
    },
  });

  await prisma.reportVersion.create({
    data: {
      reportId: report1.id,
      version: 1,
      title: report1.title,
      type: report1.type,
      status: report1.status,
      content: report1.content,
      createdByUserId: user.id,
    },
  });

  await prisma.appointment.createMany({
    data: [
      {
        userId: user.id,
        patientId: patient1.id,
        title: "Sesion demo de seguimiento",
        type: "Presencial",
        status: "programada",
        date: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      {
        userId: user.id,
        patientId: patient2.id,
        title: "Videoconsulta demo",
        type: "Videoconsulta",
        status: "programada",
        provider: "jitsi",
        roomName: `Emotiva-${patient2.id.slice(0, 8)}`,
        meetingUrl: `https://meet.jit.si/Emotiva-${patient2.id.slice(0, 8)}`,
        date: new Date(Date.now() + 1000 * 60 * 60 * 48),
      },
    ],
  });
}

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@example.local";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || `Owner-${Math.random().toString(36).slice(2, 10)}`;
  const demoEmail = process.env.SEED_DEMO_EMAIL || "demo@psyreport.es";
  const demoPassword = process.env.SEED_DEMO_PASSWORD || "demo1234";

  const owner = await upsertUser({
    email: ownerEmail,
    name: "Responsable del Centro",
    password: ownerPassword,
    role: "ADMIN",
    colegiado: "0000",
  });

  const demo = await upsertUser({
    email: demoEmail,
    name: "Profesional Demo",
    password: demoPassword,
    role: "USER",
    colegiado: "M-12001",
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
