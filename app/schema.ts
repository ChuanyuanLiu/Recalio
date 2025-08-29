export type ConsultSession = {
  session: {
    session_id: string;
    session_name: string;
    patient: {
      name: string;
      gender: string | null;
      dob: string | null;
    };
    audio: unknown[]; // adjust type if you know audio structure
    clinician_notes: unknown[]; // adjust type if you know notes structure
    consult_note: {
      status: "CREATED" | "DRAFT" | "FINALIZED" | string; // expand if you know enum values
      result: string;
      heading: string;
      brain: "LEFT" | "RIGHT" | "BOTH" | string | null;
      voice_style: string | null;
      generation_method: "TEMPLATE" | "FREEFORM" | string;
      template_id: string | null;
      ai_command_id: string | null;
      ai_command_text: string | null;
      feedback: string | null;
      dictation_cleanup_mode: string | null;
    };
    duration: number;
    created_at: string; // ISO datetime
    updated_at: string; // ISO datetime
    language_code: string;
    output_language_code: string;
    documents: unknown[] | null; // adjust type if documents structure is known
    ehr_appt_id: string | null;
    ehr_provider: string | null;
    ehr_patient_id: string | null;
  };
};

export type Token = {
  token: string,
  expiration_time: string
}
