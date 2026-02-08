import { AgentAction } from "@/types/agent";
import { usePortalStore } from "@/store/portal-store";
import { PortalView } from "@/types/portal";

export async function executeAction(
  action: AgentAction,
  containerRef: React.RefObject<HTMLElement | null>
): Promise<void> {
  const container = containerRef.current;
  if (!container) return;

  const { dispatch } = usePortalStore.getState();

  switch (action.action) {
    case "navigate": {
      const navMap: Record<string, PortalView> = {
        dashboard: { type: "dashboard" },
        tickets: { type: "ticket-list" },
        "ticket-list": { type: "ticket-list" },
        "new ticket": { type: "create-ticket" },
        "create-ticket": { type: "create-ticket" },
      };
      const view = navMap[action.value?.toLowerCase() ?? ""];
      if (view) dispatch({ type: "NAVIGATE", view });
      break;
    }
    case "click": {
      const el = findElement(container, action.target ?? "");
      if (el) (el as HTMLElement).click();
      break;
    }
    case "type": {
      const el = findElement(container, action.target ?? "");
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement
      ) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          el instanceof HTMLTextAreaElement
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype,
          "value"
        )?.set;
        nativeInputValueSetter?.call(el, action.value ?? "");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (el instanceof HTMLSelectElement) {
        el.value = action.value ?? "";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      break;
    }
    case "scroll": {
      container.scrollBy({
        top: action.value === "down" ? 300 : -300,
        behavior: "smooth",
      });
      break;
    }
  }
}

function findElement(
  container: HTMLElement,
  description: string
): Element | null {
  // 1. exact aria-label
  let el = container.querySelector(`[aria-label="${description}"]`);
  if (el) return el;

  // 2. aria-label contains (case-insensitive)
  const all = container.querySelectorAll("[aria-label]");
  for (const node of Array.from(all)) {
    if (
      node
        .getAttribute("aria-label")
        ?.toLowerCase()
        .includes(description.toLowerCase())
    ) {
      return node;
    }
  }

  // 3. data-action match
  el = container.querySelector(`[data-action="${description}"]`);
  if (el) return el;

  // 4. text content match
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT
  );
  while (walker.nextNode()) {
    const node = walker.currentNode as HTMLElement;
    if (
      node.textContent
        ?.trim()
        .toLowerCase()
        .includes(description.toLowerCase()) &&
      node.children.length === 0
    ) {
      return node;
    }
  }

  return null;
}
