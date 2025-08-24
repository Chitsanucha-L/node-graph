import * as Select from "@radix-ui/react-select";
import { ChevronDown, ChevronUp } from "lucide-react";
import "./Dropdown.css";
export function Dropdown({ value, onChange, options, placeholder }) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="dropdown-trigger">
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown size={16} className="dropdown-icon" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="dropdown-content" position="popper">
          <Select.ScrollUpButton className="dropdown-scroll-btn">
            <ChevronUp size={16} />
          </Select.ScrollUpButton>

          <Select.Viewport className="dropdown-viewport">
            {options.map((opt) => (
              <Select.Item key={opt.value} value={opt.value} className="dropdown-item">
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>

          <Select.ScrollDownButton className="dropdown-scroll-btn">
            <ChevronDown size={16} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
