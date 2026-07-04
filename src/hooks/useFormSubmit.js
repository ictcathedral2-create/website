import { useState } from "react";
import { submitForm } from "../db";

export function useFormSubmit(collection, initialData, requiredFields = []) {
  const [formData, setFormData] = useState(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const setField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const reset = () => {
    setFormData(initialData);
    setSubmitted(false);
    setError(null);
  };

  const handleSubmit = async (extra = {}) => {
    for (const field of requiredFields) {
      const value = formData[field];
      if (!value || (typeof value === "string" && !value.trim())) {
        setError(`Please fill in the required fields.`);
        return false;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitForm(collection, { ...formData, ...extra });
      setSubmitted(true);
      setFormData(initialData);
      return true;
    } catch (err) {
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { formData, setField, submitting, submitted, error, handleSubmit, reset };
}
