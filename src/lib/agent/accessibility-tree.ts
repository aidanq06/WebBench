export function extractAccessibilityTree(container: HTMLElement): string {
  const lines: string[] = [];

  function walk(el: HTMLElement, depth: number): void {
    const indent = "  ".repeat(depth);
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    const ariaLabel = el.getAttribute("aria-label");
    const dataAction = el.getAttribute("data-action");
    const text =
      el.childElementCount === 0 ? el.textContent?.trim() : null;
    const inputValue =
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? el.value
        : null;
    const inputPlaceholder =
      el instanceof HTMLInputElement ? el.placeholder : null;

    let desc = "";

    if (tag === "button" || role === "button") {
      desc = `[Button] "${ariaLabel || text}"`;
    } else if (tag === "a") {
      desc = `[Link] "${text}"`;
    } else if (tag === "input") {
      desc = `[Input] label="${ariaLabel || inputPlaceholder}" value="${inputValue}"`;
    } else if (tag === "textarea") {
      desc = `[Textarea] label="${ariaLabel}" value="${inputValue}"`;
    } else if (tag === "select") {
      const sel = el as HTMLSelectElement;
      desc = `[Select] label="${ariaLabel}" selected="${sel.options[sel.selectedIndex]?.text}"`;
    } else if (role === "row" || tag === "tr") {
      desc = `[Row] ${ariaLabel || text}`;
    } else if (["h1", "h2", "h3", "h4"].includes(tag)) {
      desc = `[${tag.toUpperCase()}] "${text}"`;
    } else if (tag === "nav") {
      desc = `[Nav]`;
    } else if (tag === "main" || role === "main") {
      desc = `[Main]`;
    } else if (tag === "label" && text) {
      desc = `[Label] "${text}"`;
    } else if (tag === "option") {
      desc = `[Option] "${text}"`;
    } else if (tag === "p" && text) {
      desc = `[Text] "${text.substring(0, 120)}"`;
    } else if (tag === "span" && text && depth > 3) {
      desc = `[Label] "${text}"`;
    } else {
      if (!ariaLabel && !text && !dataAction) {
        for (const child of Array.from(el.children)) {
          walk(child as HTMLElement, depth);
        }
        return;
      }
      if (ariaLabel) {
        desc = `[${tag}] "${ariaLabel}"`;
      } else if (text && text.length < 80) {
        desc = `[${tag}] "${text}"`;
      } else {
        for (const child of Array.from(el.children)) {
          walk(child as HTMLElement, depth);
        }
        return;
      }
    }

    if (dataAction) desc += ` {action: ${dataAction}}`;
    lines.push(`${indent}${desc}`);

    for (const child of Array.from(el.children)) {
      walk(child as HTMLElement, depth + 1);
    }
  }

  walk(container, 0);

  const result = lines.join("\n");
  return result.length > 3000
    ? result.substring(0, 3000) + "\n... (truncated)"
    : result;
}
