import React, { useState, useRef, useEffect } from "react";
import { JSX } from "react";

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  ul: boolean;
  ol: boolean;
}

interface StyledDescriptionProps {
  label?: string;
}

export default function StyledDescription({
  label = "Description",
}: StyledDescriptionProps): JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    underline: false,
    ul: false,
    ol: false,
  });

  const LIST_BASE_CLASS = "text-black pl-4";
  const getListClassName = (type: "ul" | "ol") =>
    LIST_BASE_CLASS + (type === "ul" ? " list-disc" : " list-decimal");

  const createStyledList = (
    type: "ul" | "ol",
    sourceList?: HTMLUListElement | HTMLOListElement
  ) => {
    const list = document.createElement(type);
    list.className = getListClassName(type);
    (list as HTMLElement).style.listStylePosition = "outside";
    if (sourceList?.dataset?.split) {
      list.dataset.split = sourceList.dataset.split;
    }
    return list;
  };

  const rangeIntersectsNode = (range: Range, node: Node): boolean => {
    try {
      return range.intersectsNode(node);
    } catch {
      // Fallback for older browsers / edge cases.
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(node);
      return (
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
        range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
      );
    }
  };

  const getClosestLiAtSelection = (
    editor: HTMLDivElement,
    sel: Selection
  ): HTMLLIElement | null => {
    const node = sel.anchorNode || sel.focusNode;
    if (!node) return null;

    let el: Node | null =
      node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (el && el !== editor) {
      if (el instanceof HTMLLIElement) return el;
      el = el.parentNode;
    }
    return null;
  };

  const getSelectedListItems = (
    editor: HTMLDivElement,
    sel: Selection,
    range: Range
  ): HTMLLIElement[] => {
    if (range.collapsed) {
      const li = getClosestLiAtSelection(editor, sel);
      return li ? [li] : [];
    }

    const allLis = Array.from(editor.querySelectorAll("li"));
    const selected = allLis.filter((li) => rangeIntersectsNode(range, li));
    return selected;
  };

  const findTopLevelBlockAtSelection = (
    editor: HTMLDivElement,
    sel: Selection
  ): HTMLElement | null => {
    const node = sel.anchorNode || sel.focusNode;
    if (!node) return null;

    let el: Node | null =
      node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (el && el !== editor) {
      if (el instanceof HTMLElement && el.parentElement === editor) return el;
      el = el.parentNode;
    }
    return null;
  };

  const setCaretToEnd = (el: HTMLElement) => {
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const convertSelectedListItemsToType = (
    targetType: "ul" | "ol",
    selectedLis: HTMLLIElement[]
  ) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Group selected <li> nodes by their parent list (<ul>/<ol>).
    const byList = new Map<
      HTMLUListElement | HTMLOListElement,
      HTMLLIElement[]
    >();
    for (const li of selectedLis) {
      const list = li.closest("ul,ol") as
        | HTMLUListElement
        | HTMLOListElement
        | null;
      if (!list || !editor.contains(list)) continue;
      const existing = byList.get(list) || [];
      existing.push(li);
      byList.set(list, existing);
    }

    let caretTarget: HTMLLIElement | null = null;

    const processGroup = (
      list: HTMLUListElement | HTMLOListElement,
      firstLi: HTMLLIElement,
      lastLi: HTMLLIElement
    ) => {
      const parent = list.parentNode;
      if (!parent) return;

      const sourceType = list.tagName.toLowerCase() as "ul" | "ol";
      if (sourceType === targetType) return;

      const hasBefore = !!firstLi.previousSibling;
      const hasAfter = !!lastLi.nextSibling;

      const afterList = hasAfter
        ? (document.createElement(sourceType) as
            | HTMLUListElement
            | HTMLOListElement)
        : null;
      if (afterList) {
        afterList.className = list.className;
        (afterList as HTMLElement).style.listStylePosition = "outside";
        if (list.dataset?.split) afterList.dataset.split = list.dataset.split;
        while (lastLi.nextSibling) {
          afterList.appendChild(lastLi.nextSibling);
        }
      }

      const newList = createStyledList(targetType, list);

      // Move the selected range [firstLi..lastLi] into the new list.
      let current: ChildNode | null = firstLi;
      while (current) {
        const next: ChildNode | null = current.nextSibling;
        newList.appendChild(current);
        if (current === lastLi) break;
        current = next;
      }

      if (!caretTarget) {
        caretTarget = firstLi;
      }

      if (!hasBefore) {
        // New list takes the old list's position.
        parent.insertBefore(newList, list);
        if (afterList && afterList.childNodes.length > 0) {
          parent.insertBefore(afterList, list);
        }
        parent.removeChild(list);
      } else {
        // Keep the original list as the "before" list, then insert new/after lists after it.
        parent.insertBefore(newList, list.nextSibling);
        if (afterList && afterList.childNodes.length > 0) {
          parent.insertBefore(afterList, newList.nextSibling);
        }
        if (list.childNodes.length === 0) {
          parent.removeChild(list);
        }
      }
    };

    for (const [list, items] of byList.entries()) {
      const listItems = Array.from(list.children).filter(
        (n): n is HTMLLIElement => n instanceof HTMLLIElement
      );

      const indices = items
        .map((li) => listItems.indexOf(li))
        .filter((idx) => idx >= 0)
        .sort((a, b) => a - b);
      if (indices.length === 0) continue;

      // Create consecutive index groups, then process from the end to avoid disrupting earlier indices.
      const groups: Array<{ first: HTMLLIElement; last: HTMLLIElement }> = [];
      let startIndex = indices[0]!;
      let prevIndex = indices[0]!;
      for (let i = 1; i < indices.length; i++) {
        const idx = indices[i]!;
        if (idx === prevIndex + 1) {
          prevIndex = idx;
          continue;
        }
        groups.push({
          first: listItems[startIndex]!,
          last: listItems[prevIndex]!,
        });
        startIndex = idx;
        prevIndex = idx;
      }
      groups.push({
        first: listItems[startIndex]!,
        last: listItems[prevIndex]!,
      });

      for (let g = groups.length - 1; g >= 0; g--) {
        const group = groups[g];
        if (!group) continue;
        processGroup(list, group.first, group.last);
      }
    }

    editor.focus();
    if (caretTarget) {
      setCaretToEnd(caretTarget);
    }
    updateActiveFormats();
  };

  useEffect(() => {
    // Remove placeholder on focus if empty
    const editor = editorRef.current;

    const handleFocus = (): void => {
      if (editor && editor.textContent === "Type here...") {
        editor.textContent = "";
      }
    };

    const handleBlur = (): void => {
      if (editor && editor.textContent?.trim() === "") {
        editor.textContent = "Type here...";
        editor.style.color = "#9ca3af";
      }
    };

    const handleInput = (): void => {
      if (editor && editor.textContent?.trim() !== "") {
        editor.style.color = "#374151";
      }
    };

    editor?.addEventListener("focus", handleFocus);
    editor?.addEventListener("blur", handleBlur);
    editor?.addEventListener("input", handleInput);

    return () => {
      editor?.removeEventListener("focus", handleFocus);
      editor?.removeEventListener("blur", handleBlur);
      editor?.removeEventListener("input", handleInput);
    };
  }, []);

  const execCommand = (command: string, value?: string): void => {
    const editor = editorRef.current;

    // Clear placeholder if present
    if (editor && editor.textContent === "Type here...") {
      editor.textContent = "";
      editor.style.color = "#374151";
    }

    document.execCommand(command, false, value);
    editor?.focus();
    updateActiveFormats();
  };

  const insertList = (type: "ul" | "ol") => {
    const editor = editorRef.current;
    if (!editor) return;

    // Clear placeholder if present
    if (editor.textContent === "Type here...") {
      editor.textContent = "";
      editor.style.color = "#374151";
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Only operate when selection is inside the editor
    const common = range.commonAncestorContainer;
    if (!editor.contains(common)) {
      editor.focus();
      return;
    }

    // If the selection intersects any list items, ONLY convert those list items.
    const selectedLis = getSelectedListItems(editor, selection, range);
    if (selectedLis.length > 0) {
      convertSelectedListItemsToType(type, selectedLis);
      return;
    }

    // If there's no selected text, apply list formatting to the current cursor line only.
    const selectedText = selection.toString();
    if (!selectedText || selectedText.trim() === "") {
      const block = findTopLevelBlockAtSelection(editor, selection);

      const list = createStyledList(type);
      const li = document.createElement("li");

      if (block) {
        const html = block.innerHTML;
        li.innerHTML = html === "<br>" ? "" : html;
        list.appendChild(li);
        block.replaceWith(list);
      } else {
        // If we can't find a top-level block (e.g., caret directly in editor), insert an empty list item.
        li.innerHTML = "";
        list.appendChild(li);
        range.insertNode(list);
      }

      editor.focus();
      setCaretToEnd(li);
      updateActiveFormats();
      return;
    }

    // Split selection into items:
    // - If there are newlines, split by lines for both UL/OL (dataset.split = 'newline')
    // - Else if there are commas, split by comma (dataset.split = 'comma')
    // - Else treat the whole selection as a single item (dataset.split = 'none')
    let items: string[] = [];
    let splitMode: string = "none";
    if (/\r?\n/.test(selectedText)) {
      splitMode = "newline";
      items = selectedText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    } else if (selectedText.includes(",")) {
      splitMode = "comma";
      items = selectedText
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    } else {
      splitMode = "none";
      items = [selectedText.trim()];
    }

    if (items.length === 0) return;

    const list = createStyledList(type);
    // record how we split so toggling can revert correctly
    list.dataset.split = splitMode;

    for (const it of items) {
      const li = document.createElement("li");
      // use innerHTML so any inline formatting applied later is preserved in the DOM
      li.innerHTML = it;
      list.appendChild(li);
    }

    // Replace the selection contents with the created list
    range.deleteContents();
    // Insert the list node
    range.insertNode(list);

    // Move caret after the inserted list
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(list);
    newRange.collapse(true);
    selection.addRange(newRange);
    editor.focus();
    updateActiveFormats();
  };

  const unwrapList = (list: HTMLUListElement | HTMLOListElement) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Determine split mode used when creating list; default heuristics
    const splitMode =
      list.dataset.split ||
      (list.tagName.toLowerCase() === "ul" ? "space" : "newline");

    const items: string[] = Array.from(list.querySelectorAll("li")).map(
      (li) => li.innerHTML || ""
    );

    const frag = document.createDocumentFragment();
    if (splitMode === "comma") {
      // join with commas into a single HTML fragment preserving inline formatting
      const container = document.createElement("div");
      // add a space after commas for readability
      container.innerHTML = items.map((it) => it).join(", ");
      while (container.firstChild) {
        frag.appendChild(container.firstChild);
      }
    } else if (splitMode === "newline") {
      // join with line breaks using <div> per line so layout matches previous multi-line input
      items.forEach((it) => {
        const div = document.createElement("div");
        div.innerHTML = it;
        frag.appendChild(div);
      });
    } else {
      // none -> single item: append as a single fragment (preserve HTML)
      const container = document.createElement("div");
      container.innerHTML = items.join("");
      while (container.firstChild) {
        frag.appendChild(container.firstChild);
      }
    }

    // Replace list with fragment
    const parent = list.parentNode;
    if (!parent) return;
    parent.replaceChild(frag, list);

    // Move caret after replaced content
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    const range = document.createRange();
    // place caret at end of the parent element (after replaced content)
    const after = parent.lastChild || parent;
    try {
      range.setStartAfter(after as Node);
    } catch (e) {
      range.setStart(parent, parent.childNodes.length);
    }
    range.collapse(true);
    sel.addRange(range);
    editor.focus();
    updateActiveFormats();
  };

  const isSelectionInside = (tag: "ul" | "ol") => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return false;
    const node = sel.anchorNode || sel.focusNode;
    if (!node) return false;
    let el: Node | null =
      node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (el && el !== editor) {
      if (el instanceof Element && el.tagName.toLowerCase() === tag)
        return true;
      el = el.parentNode;
    }
    return false;
  };

  const updateActiveFormats = (): void => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: isSelectionInside("ul"),
      ol: isSelectionInside("ol"),
    });
  };

  const handleButtonClick = (command: string): void => {
    execCommand(command);
  };

  return (
    <>
      {/* Header */}
      <div className="px-3 py-2 -mb-1 -ml-2">
        <h3 className="text-[0.75rem] font-medium text-gray-700">{label}</h3>
      </div>
      <div className="w-[99%] mt-1 bg-white rounded-md border border-gray-200">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-2 py-1">
          <button
            type="button"
            onClick={() => handleButtonClick("bold")}
            className={`px-2 py-1 text-[0.75rem] font-semibold rounded hover:bg-gray-100 transition-colors ${
              activeFormats.bold ? "bg-gray-100" : ""
            }`}
            title="Bold"
          >
            Bold
          </button>
          <button
            type="button"
            onClick={() => handleButtonClick("italic")}
            className={`px-2 py-1 text-[0.75rem] italic rounded hover:bg-gray-100 transition-colors ${
              activeFormats.italic ? "bg-gray-100" : ""
            }`}
            title="Italic"
          >
            Italic
          </button>
          <button
            type="button"
            onClick={() => handleButtonClick("underline")}
            className={`px-2 py-1 text-[0.75rem] underline rounded hover:bg-gray-100 transition-colors ${
              activeFormats.underline ? "bg-gray-100" : ""
            }`}
            title="Underline"
          >
            Underline
          </button>
          <button
            type="button"
            onClick={() => insertList("ul")}
            className={`px-2 py-1 text-[0.75rem] rounded hover:bg-gray-100 transition-colors ${
              activeFormats.ul ? "bg-gray-100" : ""
            }`}
            title="Unordered List"
          >
            UL
          </button>
          <button
            type="button"
            onClick={() => insertList("ol")}
            className={`px-2 py-1 text-[0.75rem] rounded hover:bg-gray-100 transition-colors ${
              activeFormats.ol ? "bg-gray-100" : ""
            }`}
            title="Ordered List"
          >
            OL
          </button>
        </div>

        <hr className="mb-1 mr-2 ml-2 -mt-1 border-t border-gray-200" />

        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          className="px-3 py-2 min-h-[80px] text-[0.75rem] outline-none focus:ring-0"
          style={{ color: "#9ca3af" }}
          onMouseUp={updateActiveFormats}
          onKeyUp={updateActiveFormats}
          onSelect={updateActiveFormats}
          suppressContentEditableWarning
        >
          Type here...
        </div>
      </div>
    </>
  );
}
