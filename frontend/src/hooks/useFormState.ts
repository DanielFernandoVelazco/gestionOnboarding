import { useState, useCallback } from 'react';

interface UseFormStateOptions<T> {
    initialValues: T;
    onSubmit: (values: T) => Promise<void>;
    validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export function useFormState<T extends Record<string, any>>({
    initialValues,
    onSubmit,
    validate,
}: UseFormStateOptions<T>) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const handleChange = useCallback(
        (field: keyof T) => (value: any) => {
            setValues((prev) => ({ ...prev, [field]: value }));
            // Clear error for this field when user starts typing
            if (errors[field]) {
                setErrors((prev) => ({ ...prev, [field]: undefined }));
            }
        },
        [errors]
    );

    const handleSubmit = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            setSubmitError('');

            // Validate
            if (validate) {
                const validationErrors = validate(values);
                if (Object.keys(validationErrors).length > 0) {
                    setErrors(validationErrors);
                    return;
                }
            }

            setLoading(true);
            try {
                await onSubmit(values);
                setValues(initialValues); // Reset form on success
            } catch (error: any) {
                setSubmitError(error.message || 'Error al procesar la solicitud');
            } finally {
                setLoading(false);
            }
        },
        [values, onSubmit, validate, initialValues]
    );

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setSubmitError('');
    }, [initialValues]);

    return {
        values,
        setValues,
        errors,
        loading,
        submitError,
        handleChange,
        handleSubmit,
        reset,
    };
}