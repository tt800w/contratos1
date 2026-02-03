interface FormInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}

const FormInput = ({ label, placeholder, value, onChange, type = "text" }: FormInputProps) => {
  return (
    <div className="space-y-2">
      <label className="section-label">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input"
      />
    </div>
  );
};

export default FormInput;
