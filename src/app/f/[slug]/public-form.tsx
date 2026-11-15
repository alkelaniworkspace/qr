"use client";

import { FormView, type PublicFormData } from "@/components/forms/form-view";
import { submitForm } from "./actions";

export function PublicForm({ form }: { form: PublicFormData }) {
  return <FormView form={form} onSubmit={(answers) => submitForm(form.slug, answers)} />;
}
