import type { TemplateField } from "@/lib/api-contracts";

type FieldValue = string | number | boolean;

type TemplateFieldsProps = {
  fields: TemplateField[];
  values: Record<string, FieldValue>;
  onChange: (id: string, value: FieldValue) => void;
};

export function TemplateFields({ fields, values, onChange }: TemplateFieldsProps) {
  return fields.map((field) => {
    const label = field.label ?? field.id;
    const value = values[field.id] ?? (field.type === "boolean" ? false : "");
    const describedBy = field.helpText ? `${field.id}-help` : undefined;
    const shared = {
      id: field.id,
      required: field.type === "boolean" ? undefined : field.required,
      "aria-describedby": describedBy,
    };

    let input;
    switch (field.type) {
      case "textarea":
        input = <textarea {...shared} maxLength={field.maxLength} placeholder={field.placeholder} value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />;
        break;
      case "select":
        input = (
          <select {...shared} value={String(value)} onChange={(event) => onChange(field.id, event.target.value)}>
            <option value="" disabled>Selecione</option>
            {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        );
        break;
      case "boolean":
        input = <input {...shared} checked={Boolean(value)} type="checkbox" onChange={(event) => onChange(field.id, event.target.checked)} />;
        break;
      case "number":
        input = <input {...shared} placeholder={field.placeholder} type="number" value={String(value)} onChange={(event) => onChange(field.id, event.target.value === "" ? "" : Number(event.target.value))} />;
        break;
      case "url":
        input = <input {...shared} maxLength={field.maxLength} placeholder={field.placeholder} type="url" value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />;
        break;
      case "color":
        input = <input {...shared} maxLength={7} pattern="^#[0-9a-fA-F]{6}$" type="text" value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />;
        break;
      case "date":
        input = <input {...shared} type="date" value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />;
        break;
      default:
        input = <input {...shared} maxLength={field.maxLength} placeholder={field.placeholder} type="text" value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />;
    }

    return (
      <div className={`form-field${field.type === "boolean" ? " form-field--checkbox" : ""}`} key={field.id}>
        {field.type === "boolean" ? (
          <label htmlFor={field.id}>{input}<span>{label}{field.required ? " *" : ""}</span></label>
        ) : (
          <>
            <label htmlFor={field.id}>{label}{field.required ? " *" : ""}</label>
            {input}
          </>
        )}
        {field.helpText && <p className="form-field__help" id={describedBy}>{field.helpText}</p>}
      </div>
    );
  });
}
