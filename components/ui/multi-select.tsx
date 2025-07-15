"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  FaCheck,
  FaTimesCircle,
  FaChevronDown,
  FaTimes,
  FaMagic,
} from "react-icons/fa";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva(
  "m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300",
  {
    variants: {
      variant: {
        default:
          "border-foreground/10 text-foreground bg-card hover:bg-card/80",
        secondary:
          "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        inverted: "inverted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  /**
   * An array of option objects to be displayed in the multi-select component.
   * Each option object has a label, value, and an optional icon.
   */
  options: {
    /** The text to display for the option. */
    label: string;
    /** The unique value associated with the option. */
    value: string;
    /** Optional icon component to display alongside the option. */
    icon?: React.ComponentType<{ className?: string }>;
  }[];

  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void;

  /** The default selected values when the component mounts. */
  defaultValue?: string[];

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string;

  /**
   * Animation duration in seconds for the visual effects (e.g., bouncing badges).
   * Optional, defaults to 0 (no animation).
   */
  animation?: number;

  /**
   * Maximum number of items to display. Extra selected items will be summarized.
   * Optional, defaults to 3.
   */
  maxCount?: number;

  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean;

  /**
   * If true, renders the multi-select component as a child of another component.
   * Optional, defaults to false.
   */

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string;

  /**
   * Callback for adding a new option.
   * Receives the new option object.
   */
  onAddOption?: (option: { label: string; value: string }) => void;

  /**
   * Callback for adding a new option and selecting it immediately.
   * Receives the new option object and a function to update selected values.
   */
  onAddAndSelectOption?: (
    option: { label: string; value: string },
    select: (values: string[]) => void,
  ) => void;
}

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      onAddOption,
      onAddAndSelectOption,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      animation = 0,
      maxCount = 3,
      modalPopover = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [newOptionValue, setNewOptionValue] = React.useState("");
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
      () => defaultValue,
    );
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isAnimating] = React.useState(false);

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = (option: string) => {
      const newSelectedValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      setSelectedValues([]);
      onValueChange([]);
    };

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev);
    };

    const clearExtraOptions = () => {
      const newSelectedValues = selectedValues.slice(0, maxCount);
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const toggleAll = () => {
      if (selectedValues.length === options.length) {
        handleClear();
      } else {
        const allValues = options.map((option) => option.value);
        setSelectedValues(allValues);
        onValueChange(allValues);
      }
    };

    const handleAddOption = () => {
      const trimmed = newOptionValue.trim();
      if (!trimmed) return;
      if (options.some((opt) => opt.value === trimmed)) return;
      const newOption = { label: trimmed, value: trimmed };
      if (onAddAndSelectOption) {
        onAddAndSelectOption(newOption, (values) => {
          setSelectedValues(values);
          onValueChange(values);
        });
        setNewOptionValue("");
      } else if (onAddOption) {
        onAddOption(newOption);
        const newSelected = [...selectedValues, trimmed];
        setSelectedValues(newSelected);
        onValueChange(newSelected);
        setNewOptionValue("");
      }
    };

    const handleAddOptionKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddOption();
      }
    };

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={modalPopover}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            {...props}
            onClick={handleTogglePopover}
            className={cn(
              "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit",
              className,
            )}
          >
            {selectedValues.length > 0 ? (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-wrap items-center">
                  {selectedValues.slice(0, maxCount).map((value) => {
                    const option = options.find((o) => o.value === value);
                    const IconComponent = option?.icon;
                    return (
                      <Badge
                        key={value}
                        className={cn(
                          multiSelectVariants({ variant, className }),
                        )}
                        style={{
                          animation: isAnimating
                            ? `bounce 0.5s ease-in-out ${animation}s`
                            : "none",
                        }}
                      >
                        {IconComponent && (
                          <IconComponent className="h-4 w-4 mr-2" />
                        )}
                        {option?.label}
                        <FaTimesCircle
                          className="ml-2 h-4 w-4 cursor-pointer"
                          onClick={(event: React.MouseEvent) => {
                            event.preventDefault();
                            toggleOption(value);
                          }}
                        />
                      </Badge>
                    );
                  })}
                  {selectedValues.length > maxCount && (
                    <Badge
                      className={cn(
                        "bg-transparent text-foreground border-foreground/10 hover:bg-transparent",
                        multiSelectVariants({ variant, className }),
                      )}
                    >
                      +{selectedValues.length - maxCount}
                      <FaTimesCircle
                        className="ml-2 h-4 w-4 cursor-pointer"
                        onClick={(event: React.MouseEvent) => {
                          event.preventDefault();
                          clearExtraOptions();
                        }}
                      />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <FaTimes
                    className="h-4 w-4 cursor-pointer"
                    onClick={(event: React.MouseEvent) => {
                      event.preventDefault();
                      handleClear();
                    }}
                  />
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <FaChevronDown className="h-4 w-4 cursor-pointer" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full mx-auto">
                <span className="text-sm text-muted-foreground mx-3">
                  {placeholder}
                </span>
                <FaChevronDown className="h-4 w-4 mx-4" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Select..."
              value={newOptionValue}
              onValueChange={setNewOptionValue}
              onKeyDown={handleInputKeyDown}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 space-y-2">
                  <p className="text-sm text-center">No results found.</p>
                  {(onAddOption || onAddAndSelectOption) && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newOptionValue}
                        onChange={(e) => setNewOptionValue(e.target.value)}
                        onKeyDown={handleAddOptionKeyDown}
                        className="flex-1 w-full px-2 py-1 text-sm border rounded-md"
                        placeholder="Add new option..."
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddOption}
                      >
                        <FaMagic className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleOption(option.value)}
                      style={{
                        pointerEvents: "auto",
                        opacity: 1,
                      }}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <FaCheck className="h-4 w-4" />
                      </div>
                      {option.icon && (
                        <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={toggleAll}
                  style={{
                    pointerEvents: "auto",
                    opacity: 1,
                  }}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selectedValues.length === options.length
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible",
                    )}
                  >
                    <FaCheck className="h-4 w-4" />
                  </div>
                  <span>Toggle All</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

MultiSelect.displayName = "MultiSelect";
