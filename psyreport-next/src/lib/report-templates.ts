export type PatientCategory = "infantil" | "adolescente" | "adulto" | "pareja" | "familia";
export type ReportKind = "historia_clinica" | "informe" | "registro";

export type ReportFieldType = "text" | "textarea" | "date" | "number" | "image";

export type ReportFieldDefinition = {
  key: string;
  label: string;
  type: ReportFieldType;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  helpText?: string;
};

export type ReportSectionDefinition = {
  id: string;
  title: string;
  description?: string;
  fields: ReportFieldDefinition[];
};

export type PdfReferenceTemplate = {
  kind: ReportKind;
  category: PatientCategory;
  referenceName: string;
};

export const PATIENT_CATEGORY_OPTIONS: Array<{ value: PatientCategory; label: string }> = [
  { value: "infantil", label: "Ninos" },
  { value: "adolescente", label: "Adolescentes" },
  { value: "adulto", label: "Adultos" },
  { value: "pareja", label: "Parejas" },
  { value: "familia", label: "Familia" },
];

export const REPORT_KIND_OPTIONS: Array<{ value: ReportKind; label: string; shortLabel: string }> = [
  { value: "historia_clinica", label: "Historia clinica", shortLabel: "Historia clinica" },
  { value: "informe", label: "Informe", shortLabel: "Informe" },
  { value: "registro", label: "Reporte", shortLabel: "Reporte" },
];

export const EMOTIVA_LEGAL_NOTICE =
  "Este documento carece de valor medico-legal y es para uso exclusivamente profesional.";

export function getPatientCategoryLabel(category?: string | null) {
  return PATIENT_CATEGORY_OPTIONS.find((option) => option.value === category)?.label || "Adultos";
}

export function getReportKindLabel(kind?: string | null) {
  return REPORT_KIND_OPTIONS.find((option) => option.value === kind)?.label || "Informe";
}

export function getDefaultReportTitle(kind: ReportKind, category: PatientCategory) {
  return `${getReportKindLabel(kind)} ${getPatientCategoryLabel(category)}`;
}

export function getPdfDocumentHeading(kind?: string | null) {
  switch (kind) {
    case "historia_clinica":
      return "HISTORIA CLINICA PSICOLOGICA";
    case "registro":
      return "REPORTE PSICOLOGICO";
    case "informe":
    default:
      return "INFORME PSICOLOGICO";
  }
}

export function getPdfReferenceTemplate(kind: ReportKind, category: PatientCategory): PdfReferenceTemplate {
  const referenceMatrix: Record<ReportKind, Record<PatientCategory, string>> = {
    historia_clinica: {
      infantil: "ANAMNESIS NINOS Y ADOLESCENTES. modelo (ninos)",
      adolescente: "ANAMNESIS NINOS Y ADOLESCENTES. modelo (adolescentes)",
      adulto: "Anamnesis_Adultos_Emotiva.pdf",
      pareja: "Anamnesis_Pareja_Emotiva.pdf",
      familia: "Historia clinica familia (estructura familiar)",
    },
    informe: {
      infantil: "Informe psicologico infantil",
      adolescente: "Informe psicologico adolescente",
      adulto: "INFORME PSICOLOGICO EVA - Angelo / ALIOSHA VILLEGAS",
      pareja: "Informe psicologico pareja",
      familia: "Informe psicologico familia",
    },
    registro: {
      infantil: "REPORTE DE DANIEL AIMARAA (estructura ninos)",
      adolescente: "REPORTE PSICOLOGICO T.A - Emmanuel",
      adulto: "REPORTE PSICOLOGICO - Tatiana Tovar",
      pareja: "Reporte psicologico pareja",
      familia: "Reporte psicologico familia",
    },
  };

  return {
    kind,
    category,
    referenceName: referenceMatrix[kind][category],
  };
}

function baseIdentityFields(): ReportSectionDefinition[] {
  return [
    {
      id: "filiacion",
      title: "I. Datos de filiacion",
      fields: [
        { key: "prof_nombre", label: "Psicologa evaluadora", type: "text", required: true },
        { key: "prof_dni", label: "DNI de la psicologa", type: "text", required: true },
        { key: "prof_centro", label: "Centro / clinica", type: "text", required: true },
        { key: "prof_fecha", label: "Fecha del documento", type: "date", required: true },
        { key: "pac_nombre", label: "Nombre del paciente", type: "text", required: true },
        { key: "pac_dni", label: "DNI / NIE del paciente", type: "text" },
        { key: "pac_birth_date", label: "Fecha de nacimiento", type: "date", required: true },
        { key: "pac_age", label: "Edad", type: "number", required: true },
        { key: "pac_address", label: "Direccion", type: "text" },
        { key: "pac_phone", label: "Telefono", type: "text" },
        { key: "pac_email", label: "Correo electronico", type: "text" },
        { key: "guardian_name", label: "Nombre del apoderado / representante legal", type: "text" },
        { key: "guardian_dni", label: "DNI del apoderado / representante legal", type: "text" },
        { key: "guardian_phone", label: "Telefono del apoderado", type: "text" },
      ],
    },
  ];
}

function closingSection(roman: string): ReportSectionDefinition {
  return {
    id: "cierre",
    title: `${roman}. Cierre y firma`,
    fields: [
      { key: "recommendations", label: "Recomendaciones", type: "textarea", rows: 4 },
      { key: "school_guidance", label: "Punto 6 - Coordinacion con colegio / centro educativo", type: "textarea", rows: 4 },
      { key: "signature_name", label: "Psicologa evaluadora", type: "text", required: true },
      { key: "signature_image", label: "Firma subida", type: "image" },
      { key: "institution_stamp_image", label: "Sello institucional", type: "image" },
    ],
  };
}

function childAnamnesisSections(): ReportSectionDefinition[] {
  return [
    ...baseIdentityFields(),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [
        { key: "consult_reason", label: "Motivo principal de consulta", type: "textarea", required: true, rows: 4 },
        { key: "current_problem", label: "Problema actual y evolucion", type: "textarea", rows: 4 },
      ],
    },
    {
      id: "desarrollo",
      title: "III. Desarrollo y antecedentes",
      fields: [
        { key: "pregnancy_birth", label: "Embarazo, parto y primeros cuidados", type: "textarea", rows: 4 },
        { key: "developmental_milestones", label: "Hitos del desarrollo", type: "textarea", rows: 4 },
        { key: "medical_history", label: "Antecedentes medicos relevantes", type: "textarea", rows: 4 },
        { key: "family_history", label: "Historia familiar relevante", type: "textarea", rows: 4 },
      ],
    },
    {
      id: "contextos",
      title: "IV. Contextos del menor",
      fields: [
        { key: "family_dynamics", label: "Dinamica familiar", type: "textarea", rows: 4 },
        { key: "school_context", label: "Escolaridad / colegio", type: "textarea", rows: 4 },
        { key: "socialization", label: "Socializacion, juego e intereses", type: "textarea", rows: 4 },
      ],
    },
    closingSection("V"),
  ];
}

function adolescentAnamnesisSections(): ReportSectionDefinition[] {
  return [
    ...baseIdentityFields(),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [
        { key: "consult_reason", label: "Motivo de consulta", type: "textarea", required: true, rows: 4 },
        { key: "current_problem", label: "Sintomas actuales y evolucion", type: "textarea", rows: 4 },
      ],
    },
    {
      id: "historia",
      title: "III. Historia evolutiva y personal",
      fields: [
        { key: "development_history", label: "Historia evolutiva", type: "textarea", rows: 4 },
        { key: "medical_history", label: "Antecedentes medicos y psicologicos", type: "textarea", rows: 4 },
        { key: "family_history", label: "Antecedentes familiares", type: "textarea", rows: 4 },
      ],
    },
    {
      id: "contextos",
      title: "IV. Areas de funcionamiento",
      fields: [
        { key: "school_context", label: "Area escolar / academica", type: "textarea", rows: 4 },
        { key: "social_context", label: "Area social", type: "textarea", rows: 4 },
        { key: "family_dynamics", label: "Area familiar", type: "textarea", rows: 4 },
        { key: "risk_factors", label: "Factores de riesgo / proteccion", type: "textarea", rows: 4 },
      ],
    },
    closingSection("V"),
  ];
}

function adultAnamnesisSections(): ReportSectionDefinition[] {
  return [
    ...baseIdentityFields(),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [
        { key: "consult_reason", label: "Cual es el motivo principal de su consulta?", type: "textarea", required: true, rows: 4 },
        { key: "problem_since", label: "Desde cuando presenta esta dificultad?", type: "text" },
        { key: "problem_triggers", label: "Que situaciones la agravan o la desencadenan?", type: "textarea", rows: 3 },
        { key: "attempted_solutions", label: "Que ha intentado hacer para solucionarlo?", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "problema_actual",
      title: "III. Problema actual",
      fields: [
        { key: "current_problem", label: "Descripcion del problema", type: "textarea", rows: 4 },
        { key: "problem_frequency", label: "Frecuencia e intensidad", type: "textarea", rows: 3 },
        { key: "daily_impact", label: "Como afecta su vida diaria?", type: "textarea", rows: 3 },
        { key: "previous_treatment", label: "Ha recibido tratamiento previo?", type: "textarea", rows: 3 },
        { key: "previous_diagnosis", label: "Diagnostico previo", type: "text" },
      ],
    },
    {
      id: "historia_personal",
      title: "IV. Historia personal",
      fields: [
        { key: "childhood_history", label: "Infancia", type: "textarea", rows: 3 },
        { key: "adolescence_history", label: "Adolescencia", type: "textarea", rows: 3 },
        { key: "adult_life_history", label: "Vida adulta", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "familiar",
      title: "V. Area familiar",
      fields: [
        { key: "family_composition", label: "Composicion familiar", type: "textarea", rows: 3 },
        { key: "partner_relationship", label: "Relacion con pareja", type: "textarea", rows: 3 },
        { key: "children_relationship", label: "Relacion con hijos", type: "textarea", rows: 3 },
        { key: "family_dynamics", label: "Dinamica familiar", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "laboral",
      title: "VI. Area laboral / academica",
      fields: [
        { key: "work_situation", label: "Situacion laboral", type: "textarea", rows: 3 },
        { key: "work_satisfaction", label: "Satisfaccion laboral", type: "textarea", rows: 3 },
        { key: "work_stress", label: "Estres laboral", type: "textarea", rows: 3 },
        { key: "work_relationships", label: "Relaciones en el trabajo", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "social",
      title: "VII. Area social",
      fields: [
        { key: "social_relationships", label: "Relaciones interpersonales", type: "textarea", rows: 3 },
        { key: "support_network", label: "Red de apoyo", type: "textarea", rows: 3 },
        { key: "social_activities", label: "Actividades sociales", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "salud",
      title: "VIII. Salud fisica y mental",
      fields: [
        { key: "health_status", label: "Estado de salud", type: "textarea", rows: 3 },
        { key: "diseases", label: "Enfermedades", type: "textarea", rows: 3 },
        { key: "medication", label: "Medicacion", type: "textarea", rows: 3 },
        { key: "psychiatric_history", label: "Antecedentes psiquiatricos", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "habitos",
      title: "IX. Habitos",
      fields: [
        { key: "sleep_habits", label: "Sueno", type: "textarea", rows: 2 },
        { key: "nutrition_habits", label: "Alimentacion", type: "textarea", rows: 2 },
        { key: "alcohol_use", label: "Consumo de alcohol", type: "textarea", rows: 2 },
        { key: "substance_use", label: "Consumo de sustancias", type: "textarea", rows: 2 },
        { key: "physical_activity", label: "Actividad fisica", type: "textarea", rows: 2 },
      ],
    },
    {
      id: "emocional",
      title: "X. Area emocional",
      fields: [
        { key: "mood_state", label: "Estado de animo", type: "textarea", rows: 2 },
        { key: "stress_management", label: "Manejo del estres", type: "textarea", rows: 2 },
        { key: "anxiety_signs", label: "Ansiedad", type: "textarea", rows: 2 },
        { key: "irritability", label: "Irritabilidad / impulsividad", type: "textarea", rows: 2 },
      ],
    },
    {
      id: "pareja",
      title: "XI. Area de pareja y sexualidad",
      fields: [
        { key: "sexual_relationship_status", label: "Estado de la relacion", type: "textarea", rows: 2 },
        { key: "sexual_satisfaction", label: "Satisfaccion", type: "textarea", rows: 2 },
        { key: "sexual_difficulties", label: "Dificultades", type: "textarea", rows: 2 },
      ],
    },
    {
      id: "expectativas",
      title: "XII. Expectativas de tratamiento",
      fields: [
        { key: "treatment_expectations", label: "Que espera lograr con la terapia?", type: "textarea", rows: 3 },
        { key: "personal_goals", label: "Objetivos personales", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "autodescripcion",
      title: "XIII. Auto descripcion",
      fields: [
        { key: "self_description", label: "Me considero", type: "textarea", rows: 3 },
        { key: "strengths", label: "Fortalezas", type: "textarea", rows: 3 },
        { key: "areas_to_improve", label: "Aspectos a mejorar", type: "textarea", rows: 3 },
        { key: "main_concerns", label: "Preocupaciones", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "observaciones",
      title: "XIV. Observaciones del evaluador",
      fields: [{ key: "evaluator_observations", label: "Observaciones", type: "textarea", rows: 4 }],
    },
  ];
}

function coupleAnamnesisSections(): ReportSectionDefinition[] {
  return [
    ...baseIdentityFields(),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [
        { key: "consult_reason", label: "Cual es el motivo principal de consulta?", type: "textarea", required: true, rows: 4 },
        { key: "who_decided_therapy", label: "Quien decidio acudir a terapia?", type: "text" },
        { key: "problem_since", label: "Desde cuando existen las dificultades?", type: "text" },
      ],
    },
    {
      id: "historia_relacion",
      title: "III. Historia de la relacion",
      fields: [
        { key: "how_met", label: "Como se conocieron?", type: "textarea", rows: 3 },
        { key: "relationship_stages", label: "Etapas importantes de la relacion", type: "textarea", rows: 3 },
        { key: "significant_moments", label: "Momentos significativos", type: "textarea", rows: 3 },
        { key: "relationship_at_start", label: "Como describirian su relacion al inicio?", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "problema_actual",
      title: "IV. Problema actual",
      fields: [
        { key: "current_problem", label: "Descripcion del problema", type: "textarea", rows: 4 },
        { key: "conflict_frequency", label: "Frecuencia de conflictos", type: "text" },
        { key: "discussion_topics", label: "Principales temas de discusion", type: "textarea", rows: 3 },
        { key: "conflict_resolution", label: "Como suelen resolver los conflictos?", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "comunicacion",
      title: "V. Comunicacion",
      fields: [
        { key: "communication_style", label: "Como es la comunicacion en la pareja?", type: "textarea", rows: 3 },
        { key: "mutual_listening", label: "Se escuchan mutuamente?", type: "textarea", rows: 2 },
        { key: "hostile_patterns", label: "Existen gritos, insultos o silencios prolongados?", type: "textarea", rows: 2 },
      ],
    },
    {
      id: "areas",
      title: "VI. Areas de pareja",
      fields: [
        { key: "affection_level", label: "Nivel de afecto y comprension", type: "textarea", rows: 3 },
        { key: "relationship_satisfaction", label: "Satisfaccion en la relacion", type: "textarea", rows: 3 },
        { key: "intimacy_frequency", label: "Frecuencia de intimidad", type: "textarea", rows: 2 },
        { key: "sexual_difficulties", label: "Dificultades sexuales", type: "textarea", rows: 2 },
        { key: "family_of_origin", label: "Relacion con familias de origen", type: "textarea", rows: 3 },
        { key: "third_party_interference", label: "Interferencia de terceros", type: "textarea", rows: 3 },
        { key: "money_management", label: "Manejo del dinero", type: "textarea", rows: 3 },
        { key: "financial_conflicts", label: "Conflictos economicos", type: "textarea", rows: 3 },
        { key: "parenting_style", label: "Estilo de crianza", type: "textarea", rows: 3 },
        { key: "parenting_disagreements", label: "Acuerdos o desacuerdos", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "antecedentes",
      title: "VII. Antecedentes y expectativas",
      fields: [
        { key: "psychological_history", label: "Antecedentes psicologicos", type: "textarea", rows: 3 },
        { key: "violence_history", label: "Antecedentes de violencia", type: "textarea", rows: 3 },
        { key: "substance_use", label: "Consumo de sustancias", type: "textarea", rows: 3 },
        { key: "therapy_goals", label: "Objetivos como pareja", type: "textarea", rows: 3 },
        { key: "individual_goals", label: "Objetivos individuales", type: "textarea", rows: 3 },
        { key: "therapist_observation", label: "Observacion del terapeuta", type: "textarea", rows: 4 },
      ],
    },
  ];
}

function familyAnamnesisSections(): ReportSectionDefinition[] {
  return [
    ...baseIdentityFields(),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [
        { key: "consult_reason", label: "Motivo de consulta familiar", type: "textarea", required: true, rows: 4 },
        { key: "family_structure", label: "Composicion y estructura familiar", type: "textarea", rows: 4 },
      ],
    },
    {
      id: "dinamica",
      title: "III. Dinamica familiar",
      fields: [
        { key: "family_relationships", label: "Vinculos, normas y roles", type: "textarea", rows: 4 },
        { key: "family_conflicts", label: "Conflictos y detonantes", type: "textarea", rows: 4 },
        { key: "support_network", label: "Red de apoyo", type: "textarea", rows: 4 },
      ],
    },
    {
      id: "objetivos",
      title: "IV. Objetivos terapeuticos",
      fields: [
        { key: "therapy_goals", label: "Objetivos del proceso", type: "textarea", rows: 4 },
        { key: "family_resources", label: "Fortalezas familiares", type: "textarea", rows: 4 },
      ],
    },
    closingSection("V"),
  ];
}

function reportAreasSection(): ReportSectionDefinition {
  return {
    id: "areas",
    title: "IV. Presentacion de resultados",
    description: "El texto del area clinica es obligatorio. Las demas areas e imagenes son opcionales.",
    fields: [
      { key: "results_summary", label: "Presentacion de resultados - Area clinica", type: "textarea", required: true, rows: 5 },
      { key: "results_summary_image", label: "Imagen opcional de area clinica", type: "image" },
      { key: "area_emotional", label: "Area emocional", type: "textarea", rows: 4 },
      { key: "area_emotional_image", label: "Imagen de area emocional", type: "image" },
      { key: "area_behavioral", label: "Area conductual", type: "textarea", rows: 4 },
      { key: "area_behavioral_image", label: "Imagen de area conductual", type: "image" },
      { key: "area_cognitive", label: "Area cognitiva", type: "textarea", rows: 4 },
      { key: "area_cognitive_image", label: "Imagen de area cognitiva", type: "image" },
      { key: "area_family", label: "Area familiar / relacional", type: "textarea", rows: 4 },
      { key: "area_family_image", label: "Imagen de area familiar / relacional", type: "image" },
      { key: "area_school", label: "Area escolar / academica", type: "textarea", rows: 4 },
      { key: "area_school_image", label: "Imagen de area escolar / academica", type: "image" },
      { key: "area_social", label: "Area social", type: "textarea", rows: 4 },
      { key: "area_social_image", label: "Imagen de area social", type: "image" },
    ],
  };
}

function adultGeneralDataSection(includeBirthDate: boolean): ReportSectionDefinition {
  return {
    id: "datos_generales",
    title: "I. Datos generales",
    fields: [
      { key: "pac_nombre", label: "Apellidos y nombres", type: "text", required: true },
      { key: "pac_sex", label: "Sexo", type: "text" },
      { key: "pac_age", label: "Edad", type: "number", required: true },
      ...(includeBirthDate ? [{ key: "pac_birth_date", label: "Fecha de nacimiento", type: "date" as const }] : []),
      { key: "pac_dni", label: "DNI / NIE", type: "text" },
      { key: "therapy_type", label: "Servicio / tipo de atencion", type: "text" },
      { key: "session_count", label: "Numero de sesiones", type: "number" },
      { key: "prof_fecha", label: "Fecha del documento", type: "date", required: true },
      { key: "signature_name", label: "Psicologa evaluadora", type: "text", required: true },
    ],
  };
}

function clinicalTestsSection(): ReportSectionDefinition {
  return {
    id: "pruebas",
    title: "III. Pruebas aplicadas",
    fields: [{ key: "assessment_methods", label: "Tecnicas e instrumentos utilizados", type: "textarea", rows: 5 }],
  };
}

function behavioralObservationSection(title = "IV. Observacion conductual"): ReportSectionDefinition {
  return {
    id: "observacion",
    title,
    fields: [{ key: "behavioral_observation", label: "Observacion conductual", type: "textarea", rows: 6, required: true }],
  };
}

function relevantDataSection(title = "V. Datos relevantes"): ReportSectionDefinition {
  return {
    id: "datos_relevantes",
    title,
    fields: [{ key: "relevant_data", label: "Datos relevantes", type: "textarea", rows: 5 }],
  };
}

function adultClinicalResultsSection(): ReportSectionDefinition {
  return {
    id: "resultados",
    title: "VI. Presentacion de resultados",
    description: "La presentacion respeta el orden por areas clinicas del modelo de informe.",
    fields: [
      { key: "results_summary", label: "Sintesis clinica principal", type: "textarea", required: true, rows: 6 },
      { key: "area_emotional", label: "Area emocional", type: "textarea", rows: 4 },
      { key: "area_behavioral", label: "Area conductual", type: "textarea", rows: 4 },
      { key: "area_cognitive", label: "Area cognitiva", type: "textarea", rows: 4 },
      { key: "area_family", label: "Area familiar / relacional", type: "textarea", rows: 4 },
      { key: "area_school", label: "Area academica / laboral", type: "textarea", rows: 4 },
      { key: "area_social", label: "Area social", type: "textarea", rows: 4 },
    ],
  };
}

function conclusionSection(title = "VII. Conclusiones clinicas"): ReportSectionDefinition {
  return {
    id: "conclusion",
    title,
    fields: [{ key: "clinical_impression", label: "Conclusiones", type: "textarea", required: true, rows: 5 }],
  };
}

function recommendationsSection(title = "VIII. Recomendaciones"): ReportSectionDefinition {
  return {
    id: "recomendaciones",
    title,
    fields: [
      { key: "recommendations", label: "Recomendaciones generales", type: "textarea", rows: 5 },
      { key: "recommendations_family", label: "Recomendaciones para la familia", type: "textarea", rows: 5 },
      { key: "school_guidance", label: "Indicaciones para colegio / entorno", type: "textarea", rows: 5 },
    ],
  };
}

function signatureSection(title = "IX. Firma"): ReportSectionDefinition {
  return {
    id: "firma",
    title,
    fields: [
      { key: "signature_name", label: "Psicologa evaluadora", type: "text", required: true },
      { key: "signature_image", label: "Firma subida", type: "image" },
      { key: "institution_stamp_image", label: "Sello institucional", type: "image" },
    ],
  };
}

function getAdultInformeSections(): ReportSectionDefinition[] {
  return [
    adultGeneralDataSection(false),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta", type: "textarea", required: true, rows: 5 }],
    },
    clinicalTestsSection(),
    behavioralObservationSection(),
    relevantDataSection(),
    adultClinicalResultsSection(),
    conclusionSection(),
    recommendationsSection("VIII. Recomendaciones y orientaciones"),
    signatureSection(),
  ];
}

function getChildInformeSections(): ReportSectionDefinition[] {
  return [
    adultGeneralDataSection(true),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta", type: "textarea", required: true, rows: 5 }],
    },
    clinicalTestsSection(),
    behavioralObservationSection(),
    relevantDataSection("V. Datos relevantes del menor y la familia"),
    {
      id: "resultados",
      title: "VI. Presentacion de resultados",
      fields: [
        { key: "results_summary", label: "Sintesis clinica", type: "textarea", required: true, rows: 6 },
        { key: "area_emotional", label: "Area emocional", type: "textarea", rows: 4 },
        { key: "area_behavioral", label: "Area conductual", type: "textarea", rows: 4 },
        { key: "area_family", label: "Area familiar", type: "textarea", rows: 4 },
        { key: "area_school", label: "Area escolar", type: "textarea", rows: 4 },
        { key: "area_social", label: "Area social", type: "textarea", rows: 4 },
      ],
    },
    conclusionSection(),
    recommendationsSection(),
    signatureSection(),
  ];
}

function getAdolescentInformeSections(): ReportSectionDefinition[] {
  return [
    adultGeneralDataSection(true),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta", type: "textarea", required: true, rows: 5 }],
    },
    clinicalTestsSection(),
    behavioralObservationSection(),
    relevantDataSection("V. Datos relevantes del adolescente"),
    {
      id: "resultados",
      title: "VI. Presentacion de resultados",
      fields: [
        { key: "results_summary", label: "Sintesis clinica", type: "textarea", required: true, rows: 6 },
        { key: "area_emotional", label: "Area emocional", type: "textarea", rows: 4 },
        { key: "area_behavioral", label: "Area conductual", type: "textarea", rows: 4 },
        { key: "area_cognitive", label: "Area cognitiva", type: "textarea", rows: 4 },
        { key: "area_family", label: "Area familiar", type: "textarea", rows: 4 },
        { key: "area_school", label: "Area academica", type: "textarea", rows: 4 },
        { key: "area_social", label: "Area social", type: "textarea", rows: 4 },
      ],
    },
    conclusionSection(),
    recommendationsSection(),
    signatureSection(),
  ];
}

function getCoupleInformeSections(): ReportSectionDefinition[] {
  return [
    adultGeneralDataSection(false),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta de la pareja", type: "textarea", required: true, rows: 5 }],
    },
    clinicalTestsSection(),
    behavioralObservationSection(),
    relevantDataSection("V. Datos relevantes de la relacion"),
    {
      id: "resultados",
      title: "VI. Presentacion de resultados",
      fields: [
        { key: "results_summary", label: "Sintesis clinica", type: "textarea", required: true, rows: 6 },
        { key: "area_emotional", label: "Area emocional", type: "textarea", rows: 4 },
        { key: "area_family", label: "Area vincular / relacional", type: "textarea", rows: 4 },
        { key: "area_social", label: "Area social", type: "textarea", rows: 4 },
      ],
    },
    conclusionSection(),
    recommendationsSection(),
    signatureSection(),
  ];
}

function getFamilyInformeSections(): ReportSectionDefinition[] {
  return [
    adultGeneralDataSection(false),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta familiar", type: "textarea", required: true, rows: 5 }],
    },
    clinicalTestsSection(),
    behavioralObservationSection(),
    relevantDataSection("V. Datos relevantes de la dinamica familiar"),
    {
      id: "resultados",
      title: "VI. Presentacion de resultados",
      fields: [
        { key: "results_summary", label: "Sintesis clinica", type: "textarea", required: true, rows: 6 },
        { key: "area_emotional", label: "Area emocional", type: "textarea", rows: 4 },
        { key: "area_family", label: "Area familiar / sistemica", type: "textarea", rows: 4 },
        { key: "area_social", label: "Area social", type: "textarea", rows: 4 },
      ],
    },
    conclusionSection(),
    recommendationsSection(),
    signatureSection(),
  ];
}

function getAdultRegistroSections(): ReportSectionDefinition[] {
  return [
    progressGeneralDataSection(false),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta", type: "textarea", required: true, rows: 5 }],
    },
    {
      id: "antecedente",
      title: "III. Antecedente",
      fields: [{ key: "background", label: "Antecedentes relevantes", type: "textarea", rows: 5 }],
    },
    {
      id: "objetivos",
      title: "IV. Objetivos",
      fields: [{ key: "therapy_goals", label: "Objetivos terapeuticos", type: "textarea", required: true, rows: 6 }],
    },
    behavioralObservationSection("V. Observacion conductual"),
    {
      id: "proceso",
      title: "VI. Proceso psicologico",
      fields: [{ key: "progress_summary", label: "Proceso psicologico", type: "textarea", required: true, rows: 8 }],
    },
    conclusionSection("VII. Conclusion"),
    recommendationsSection("VIII. Recomendaciones"),
    signatureSection("IX. Firma"),
  ];
}

function getAdolescentRegistroSections(): ReportSectionDefinition[] {
  return [
    progressGeneralDataSection(true),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta", type: "textarea", required: true, rows: 5 }],
    },
    {
      id: "antecedente",
      title: "III. Antecedente",
      fields: [{ key: "background", label: "Antecedentes relevantes", type: "textarea", rows: 5 }],
    },
    {
      id: "objetivos",
      title: "IV. Objetivos",
      fields: [{ key: "therapy_goals", label: "Objetivos terapeuticos", type: "textarea", required: true, rows: 6 }],
    },
    behavioralObservationSection("V. Observacion conductual"),
    {
      id: "proceso",
      title: "VI. Proceso psicologico",
      fields: [{ key: "progress_summary", label: "Proceso psicologico", type: "textarea", required: true, rows: 8 }],
    },
    conclusionSection("VII. Conclusion"),
    recommendationsSection("VIII. Recomendaciones"),
    signatureSection("IX. Firma"),
  ];
}

function getCoupleRegistroSections(): ReportSectionDefinition[] {
  return [
    ...baseIdentityFields(),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta de la pareja", type: "textarea", required: true, rows: 5 }],
    },
    {
      id: "antecedente",
      title: "III. Antecedente",
      fields: [{ key: "background", label: "Antecedentes relevantes de la relacion", type: "textarea", rows: 5 }],
    },
    {
      id: "objetivos",
      title: "IV. Objetivos",
      fields: [{ key: "therapy_goals", label: "Objetivos trabajados", type: "textarea", required: true, rows: 6 }],
    },
    behavioralObservationSection("V. Observacion conductual"),
    {
      id: "proceso",
      title: "VI. Proceso psicologico",
      fields: [{ key: "progress_summary", label: "Proceso psicologico de la pareja", type: "textarea", required: true, rows: 8 }],
    },
    conclusionSection("VII. Conclusion"),
    recommendationsSection("VIII. Recomendaciones"),
    signatureSection("IX. Firma"),
  ];
}

function getFamilyRegistroSections(): ReportSectionDefinition[] {
  return [
    ...baseIdentityFields(),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta familiar", type: "textarea", required: true, rows: 5 }],
    },
    {
      id: "antecedente",
      title: "III. Antecedente",
      fields: [{ key: "background", label: "Antecedentes relevantes de la familia", type: "textarea", rows: 5 }],
    },
    {
      id: "objetivos",
      title: "IV. Objetivos",
      fields: [{ key: "therapy_goals", label: "Objetivos trabajados", type: "textarea", required: true, rows: 6 }],
    },
    behavioralObservationSection("V. Observacion conductual"),
    {
      id: "proceso",
      title: "VI. Proceso psicologico",
      fields: [{ key: "progress_summary", label: "Proceso psicologico familiar", type: "textarea", required: true, rows: 8 }],
    },
    conclusionSection("VII. Conclusion"),
    recommendationsSection("VIII. Recomendaciones"),
    signatureSection("IX. Firma"),
  ];
}

function getChildProgressReportSections(): ReportSectionDefinition[] {
  return [
    {
      id: "filiacion",
      title: "I. Datos de filiacion",
      fields: [
        { key: "pac_nombre", label: "Apellidos y nombres", type: "text", required: true },
        { key: "pac_age", label: "Edad", type: "number", required: true },
        { key: "pac_sex", label: "Sexo", type: "text" },
        { key: "pac_birth_date", label: "Fecha de nacimiento", type: "date", required: true },
        { key: "pac_school_level", label: "Nivel educativo", type: "text" },
        { key: "therapy_type", label: "Tipo de terapia", type: "text" },
        { key: "therapy_start_date", label: "Fecha de inicio", type: "date" },
        { key: "therapy_end_date", label: "Fecha de termino", type: "date" },
        { key: "signature_name", label: "Psicologa evaluadora", type: "text", required: true },
      ],
    },
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta", type: "textarea", required: true, rows: 5 }],
    },
    {
      id: "antecedente",
      title: "III. Antecedente",
      fields: [{ key: "background", label: "Antecedentes relevantes", type: "textarea", rows: 5 }],
    },
    {
      id: "objetivos",
      title: "IV. Objetivos",
      fields: [{ key: "therapy_goals", label: "Objetivos terapeuticos", type: "textarea", rows: 6, required: true }],
    },
    {
      id: "observacion",
      title: "V. Observacion conductual",
      fields: [{ key: "behavioral_observation", label: "Observacion conductual", type: "textarea", rows: 6, required: true }],
    },
    {
      id: "proceso",
      title: "VI. Proceso psicologico",
      fields: [{ key: "progress_summary", label: "Proceso psicologico", type: "textarea", rows: 8, required: true }],
    },
    {
      id: "conclusion",
      title: "VII. Conclusion",
      fields: [{ key: "clinical_impression", label: "Conclusion", type: "textarea", rows: 5, required: true }],
    },
    {
      id: "recomendaciones",
      title: "VIII. Recomendaciones",
      fields: [
        { key: "recommendations_child", label: "Para el menor", type: "textarea", rows: 4 },
        { key: "recommendations_family", label: "Para la familia", type: "textarea", rows: 5 },
        { key: "school_guidance", label: "Para el colegio", type: "textarea", rows: 5 },
      ],
    },
    {
      id: "firma",
      title: "IX. Firma",
      fields: [
        { key: "signature_name", label: "Psicologa evaluadora", type: "text", required: true },
        { key: "signature_image", label: "Firma subida", type: "image" },
        { key: "institution_stamp_image", label: "Sello institucional", type: "image" },
      ],
    },
  ];
}

function progressGeneralDataSection(includeBirthDate: boolean): ReportSectionDefinition {
  return {
    id: "datos_generales",
    title: "I. Datos generales",
    fields: [
      { key: "pac_nombre", label: "Apellidos y nombres", type: "text", required: true },
      { key: "pac_sex", label: "Sexo", type: "text" },
      { key: "pac_age", label: "Edad", type: "number", required: true },
      ...(includeBirthDate ? [{ key: "pac_birth_date", label: "Fecha de nacimiento", type: "date" as const }] : []),
      { key: "pac_school_level", label: "Grado escolar / nivel educativo", type: "text" },
      { key: "therapy_type", label: "Servicio / tipo de terapia", type: "text" },
      { key: "session_count", label: "Numero de sesiones", type: "number" },
      { key: "therapy_start_date", label: "Fecha de inicio", type: "date" },
      { key: "prof_fecha", label: "Fecha de informe", type: "date", required: true },
      { key: "signature_name", label: "Psicologa encargada", type: "text", required: true },
    ],
  };
}

function getTherapeuticProgressSections(includeBirthDate: boolean): ReportSectionDefinition[] {
  return [
    progressGeneralDataSection(includeBirthDate),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta", type: "textarea", required: true, rows: 5 }],
    },
    {
      id: "observacion",
      title: "III. Observacion conductual",
      fields: [{ key: "behavioral_observation", label: "Observacion conductual", type: "textarea", required: true, rows: 6 }],
    },
    {
      id: "objetivos",
      title: "IV. Objetivos de la intervencion",
      fields: [{ key: "therapy_goals", label: "Objetivos de la intervencion", type: "textarea", required: true, rows: 7 }],
    },
    {
      id: "progreso",
      title: "V. Progreso terapeutico",
      fields: [{ key: "progress_summary", label: "Progreso terapeutico", type: "textarea", required: true, rows: 9 }],
    },
    {
      id: "recomendaciones",
      title: "VI. Recomendaciones",
      fields: [
        { key: "recommendations", label: "Recomendaciones", type: "textarea", rows: 6 },
        { key: "recommendations_family", label: "Recomendaciones para la familia", type: "textarea", rows: 5 },
      ],
    },
    {
      id: "firma",
      title: "VII. Firma",
      fields: [
        { key: "signature_name", label: "Psicologa de intervencion", type: "text", required: true },
        { key: "signature_image", label: "Firma subida", type: "image" },
        { key: "institution_stamp_image", label: "Sello institucional", type: "image" },
      ],
    },
  ];
}

function getStandardReportSections(): ReportSectionDefinition[] {
  return [
    ...baseIdentityFields(),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de la consulta", type: "textarea", required: true, rows: 4 }],
    },
    {
      id: "pruebas",
      title: "III. Pruebas aplicadas y observacion conductual",
      fields: [
        { key: "assessment_methods", label: "Tecnicas e instrumentos utilizados", type: "textarea", rows: 4 },
        { key: "behavioral_observation", label: "Observacion conductual", type: "textarea", rows: 5 },
        { key: "relevant_data", label: "Datos relevantes", type: "textarea", rows: 4 },
      ],
    },
    reportAreasSection(),
    {
      id: "conclusion",
      title: "V. Conclusiones clinicas",
      fields: [{ key: "clinical_impression", label: "Impresion clinica / conclusiones", type: "textarea", required: true, rows: 5 }],
    },
    {
      id: "colegio",
      title: "VI. Coordinacion con colegio / centro educativo",
      fields: [{ key: "school_guidance", label: "Indicaciones para colegio / centro educativo", type: "textarea", rows: 4 }],
    },
    {
      id: "firma",
      title: "VII. Firma",
      fields: [
        { key: "signature_name", label: "Psicologa evaluadora", type: "text", required: true },
        { key: "signature_image", label: "Firma subida", type: "image" },
        { key: "institution_stamp_image", label: "Sello institucional", type: "image" },
      ],
    },
  ];
}

function getRegistrySections(): ReportSectionDefinition[] {
  return [
    ...baseIdentityFields(),
    {
      id: "motivo",
      title: "II. Motivo de consulta",
      fields: [{ key: "consult_reason", label: "Motivo de consulta", type: "textarea", required: true, rows: 4 }],
    },
    {
      id: "antecedentes",
      title: "III. Antecedentes",
      fields: [{ key: "background", label: "Antecedentes relevantes", type: "textarea", rows: 4 }],
    },
    {
      id: "objetivos",
      title: "IV. Objetivos y sesiones",
      fields: [
        { key: "session_count", label: "Numero de sesiones realizadas", type: "number", required: true },
        { key: "therapy_goals", label: "Objetivos trabajados", type: "textarea", rows: 4 },
      ],
    },
    {
      id: "observacion",
      title: "V. Observacion conductual",
      fields: [{ key: "behavioral_observation", label: "Observacion conductual", type: "textarea", rows: 5 }],
    },
    {
      id: "proceso",
      title: "VI. Proceso psicologico",
      fields: [
        { key: "progress_summary", label: "Proceso psicologico / evolucion observada", type: "textarea", rows: 5, required: true },
        { key: "interventions_applied", label: "Intervenciones realizadas", type: "textarea", rows: 4 },
        { key: "session_observations", label: "Observaciones del proceso", type: "textarea", rows: 4 },
      ],
    },
    {
      id: "conclusion",
      title: "VII. Conclusion",
      fields: [{ key: "clinical_impression", label: "Conclusion", type: "textarea", rows: 4, required: true }],
    },
    {
      id: "recomendaciones",
      title: "VIII. Recomendaciones",
      fields: [{ key: "recommendations", label: "Recomendaciones", type: "textarea", rows: 4 }],
    },
    {
      id: "firma",
      title: "IX. Firma",
      fields: [
        { key: "signature_name", label: "Psicologa evaluadora", type: "text", required: true },
        { key: "signature_image", label: "Firma subida", type: "image" },
        { key: "institution_stamp_image", label: "Sello institucional", type: "image" },
      ],
    },
  ];
}

const REPORT_SECTION_MATRIX: Record<ReportKind, Record<PatientCategory, () => ReportSectionDefinition[]>> = {
  historia_clinica: {
    infantil: childAnamnesisSections,
    adolescente: adolescentAnamnesisSections,
    adulto: adultAnamnesisSections,
    pareja: coupleAnamnesisSections,
    familia: familyAnamnesisSections,
  },
  informe: {
    infantil: getChildInformeSections,
    adolescente: getAdolescentInformeSections,
    adulto: getAdultInformeSections,
    pareja: getCoupleInformeSections,
    familia: getFamilyInformeSections,
  },
  registro: {
    infantil: getChildProgressReportSections,
    adolescente: getAdolescentRegistroSections,
    adulto: getAdultRegistroSections,
    pareja: getCoupleRegistroSections,
    familia: getFamilyRegistroSections,
  },
};

export function getReportSections(kind: ReportKind, category: PatientCategory): ReportSectionDefinition[] {
  return REPORT_SECTION_MATRIX[kind][category]();
}

export function getRequiredFieldLabels(kind: ReportKind, category: PatientCategory) {
  return getReportSections(kind, category)
    .flatMap((section) => section.fields)
    .filter((field) => field.required)
    .map((field) => ({ key: field.key, name: field.label }));
}
