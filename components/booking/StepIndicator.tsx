import { CheckIcon } from "@phosphor-icons/react/dist/ssr";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps): React.ReactElement {
  const defaultLabels = ["Room", "Children", "Roommate", "Confirm"];
  const stepLabels = labels ?? defaultLabels;

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isComplete = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isComplete ? "bg-success text-white" : "",
                  isCurrent ? "bg-accent text-accent-foreground" : "",
                  !isComplete && !isCurrent ? "bg-surface-secondary text-muted border border-border" : "",
                ].join(" ")}
              >
                {isComplete ? <CheckIcon weight="bold" size={14} /> : step}
              </div>
              <span className="text-xs text-muted hidden md:block">{stepLabels[i]}</span>
            </div>
            {step < totalSteps && (
              <div className={["w-8 md:w-12 h-px", isComplete ? "bg-success" : "bg-border"].join(" ")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
