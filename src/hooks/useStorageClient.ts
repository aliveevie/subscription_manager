import { ExtendedDelegation } from "@/types/delegation";

export default function useStorageClient() {
  function storeDelegation(delegation: ExtendedDelegation) {
    localStorage.setItem(
      delegation.delegate,
      JSON.stringify(delegation, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
  }

  function getDelegation(delegate: string): ExtendedDelegation | null {
    const delegation = localStorage.getItem(delegate);
    if (!delegation) {
      return null;
    }
    return JSON.parse(delegation);
  }

  return { storeDelegation, getDelegation };
}
