function InputField({
    label,
    name,
    type,
    placeholder,
    value,
    onChange
}) {

    return (

        <div className="mb-4">

            <label className="block mb-2 font-medium">
                {label}
            </label>

            <input
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full border rounded-lg p-3"
            />

        </div>

    );

}

export default InputField;