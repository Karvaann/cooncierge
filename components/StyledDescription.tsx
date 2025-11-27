import React, { useState, useRef, useEffect } from "react";
import { JSX } from "react";

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export default function StyledDescription(): JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    underline: false,
  });

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

  const updateActiveFormats = (): void => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  };

  const handleButtonClick = (command: string): void => {
    execCommand(command);
  };

  return (
    <>
      {/* Header */}
      <div className="px-3 py-2 -mt-4 -ml-2">
        <h3 className="text-[0.75rem] font-medium text-gray-700">
          Description
        </h3>
      </div>
      <div className="w-[46vw] mt-1 bg-white rounded-md border border-gray-200">
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
            onClick={() => handleButtonClick("insertUnorderedList")}
            className="px-2 py-1 text-[0.75rem] rounded hover:bg-gray-100 transition-colors"
            title="Unordered List"
          >
            UL
          </button>
          <button
            type="button"
            onClick={() => handleButtonClick("insertOrderedList")}
            className="px-2 py-1 text-[0.75rem] rounded hover:bg-gray-100 transition-colors"
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
