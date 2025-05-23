import { createContext, useCallback, useState } from "react";

export const StepContext = createContext({
  step: 1,
  changeStep: (step: number) => {},
});

export const StepProvider = ({ children }: { children: React.ReactNode }) => {
  const [step, setStep] = useState(1);

  const changeStep = useCallback(
    (newStep: number) => {
      setStep(newStep);
    },
    []
  );

  return (
    <StepContext.Provider value={{ step, changeStep }}>
      {children}
    </StepContext.Provider>
  );
};
