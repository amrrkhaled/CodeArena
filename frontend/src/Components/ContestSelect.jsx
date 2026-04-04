import { useEffect, useMemo, useRef, useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import "../style/ContestSelect.css";

const ContestSelect = ({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Choose contest",
  emptyLabel = "No contests",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const normalizedOptions = useMemo(
    () =>
      (options || []).map((option) => ({
        ...option,
        id: option?.id,
        label:
          option?.name ||
          option?.title ||
          option?.contest_name ||
          (option?.id ? `Contest #${option.id}` : "Untitled contest"),
      })),
    [options]
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => String(option.id) === String(value)),
    [normalizedOptions, value]
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (nextValue) => {
    onChange({ target: { value: String(nextValue) } });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`contest-select ${className}`.trim()}>
      {label && (
        <label className="contest-select-label" htmlFor={id}>
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        className={`contest-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`contest-select-value ${selectedOption ? "" : "placeholder"}`}>
          {selectedOption?.label || placeholder}
        </span>
        <KeyboardArrowDownIcon className={`contest-select-arrow ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div className="contest-select-menu" role="listbox" aria-labelledby={id}>
          {normalizedOptions.length === 0 ? (
            <div className="contest-select-empty">{emptyLabel}</div>
          ) : (
            normalizedOptions.map((option) => {
              const isSelected = String(option.id) === String(value);

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`contest-select-option ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(option.id)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{option.label}</span>
                  {isSelected && <CheckIcon className="contest-select-check" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ContestSelect;
