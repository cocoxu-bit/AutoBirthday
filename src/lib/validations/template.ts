import { z } from "zod";

export const templateFormSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100, "El título no puede superar los 100 caracteres"),
  content: z.string().min(1, "El contenido es requerido").max(2000, "El contenido no puede superar los 2000 caracteres"),
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;
