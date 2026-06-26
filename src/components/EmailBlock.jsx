import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  Copy,
  GripVertical,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getBlockStyle } from "../email/design.js";
import { optimizeImage } from "../email/imageUtils.js";

const RICH_TEXT_FORMAT_EVENT = "brightletter:format-rich-text";
const ALIGN_COMMANDS = {
  justifyLeft: "left",
  justifyCenter: "center",
  justifyRight: "right",
  justifyFull: "justify",
};

function normalizeTextAlign(value, fallback = "left") {
  return ["left", "center", "right", "justify"].includes(value) ? value : fallback;
}

function getFieldAlign(props = {}, field, fallback = "left") {
  return normalizeTextAlign(props.fieldAligns?.[field], fallback);
}

function withFieldAlign(props = {}, field, align) {
  return {
    ...props,
    fieldAligns: {
      ...(props.fieldAligns ?? {}),
      [field]: normalizeTextAlign(align),
    },
  };
}

function escapeEditorText(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function legacyBodyHtml(body = "", listStyle = "none") {
  const lines = String(body).split("\n");

  if (listStyle === "bullet" || listStyle === "number") {
    const tag = listStyle === "number" ? "ol" : "ul";
    return `<${tag}>${lines
      .filter((line) => line.trim())
      .map((line) => `<li>${escapeEditorText(line)}</li>`)
      .join("")}</${tag}>`;
  }

  return `<p>${escapeEditorText(body).replaceAll("\n", "<br>")}</p>`;
}

function sanitizeEditorHtml(html = "") {
  const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const source = parsed.body.firstElementChild;
  const output = document.createElement("div");
  const allowed = new Set(["P", "DIV", "UL", "OL", "LI", "BR"]);

  function appendSafe(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent ?? ""));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    if (!allowed.has(node.tagName)) {
      [...node.childNodes].forEach((child) => appendSafe(child, parent));
      return;
    }

    const tag = node.tagName === "DIV" ? "p" : node.tagName.toLowerCase();
    const safeNode = document.createElement(tag);
    const textAlign = normalizeTextAlign(
      node.style?.textAlign || node.getAttribute?.("align"),
      "",
    );
    if (textAlign) {
      safeNode.style.textAlign = textAlign;
    }
    [...node.childNodes].forEach((child) => appendSafe(child, safeNode));
    parent.append(safeNode);
  }

  [...source.childNodes].forEach((node) => appendSafe(node, output));
  return output.innerHTML;
}

function EditableText({
  as: Component = "span",
  ariaLabel,
  children,
  className,
  deleteLabel,
  editorId,
  multiline = false,
  onAlignChange,
  onChange,
  onDelete,
  style,
}) {
  const Wrapper = Component === "span" ? "span" : "div";
  const editorRef = useRef(null);

  function rememberSelection() {
    if (!editorId) return;
    const selection = window.getSelection();
    if (
      editorRef.current &&
      selection?.rangeCount &&
      editorRef.current.contains(selection.getRangeAt(0).commonAncestorContainer)
    ) {
      document.documentElement.dataset.activeRichTextEditorId = editorId;
    }
  }

  useEffect(() => {
    function formatText(event) {
      if (event.detail?.editorId !== editorId || !editorRef.current) return;
      const align = ALIGN_COMMANDS[event.detail.command];
      if (!align) return;

      editorRef.current.focus();
      document.documentElement.dataset.activeRichTextEditorId = editorId;
      onAlignChange?.(align);
    }

    window.addEventListener(RICH_TEXT_FORMAT_EVENT, formatText);
    return () => window.removeEventListener(RICH_TEXT_FORMAT_EVENT, formatText);
  }, [editorId, onAlignChange]);

  return (
    <Wrapper className={`editable-field editable-field-${Component}`}>
      <Component
        aria-label={ariaLabel}
        className={`inline-editable ${className ?? ""}`}
        contentEditable
        data-rich-text-editor-id={editorId}
        onBlur={(event) => {
          const value = event.currentTarget.innerText.replace(/\u00a0/g, " ");
          onChange(multiline ? value : value.replace(/\n+/g, " ").trim());
        }}
        onClick={(event) => event.stopPropagation()}
        onFocus={rememberSelection}
        onKeyDown={(event) => {
          if (!multiline && event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        ref={editorRef}
        spellCheck
        style={style}
        suppressContentEditableWarning
      >
        {children}
      </Component>
      {onDelete && (
        <button
          aria-label={`Remove ${deleteLabel || ariaLabel}`}
          className="delete-editable-field"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          onMouseDown={(event) => event.preventDefault()}
          title={`Remove ${deleteLabel || ariaLabel}`}
          type="button"
        >
          <Trash2 size={12} />
        </button>
      )}
    </Wrapper>
  );
}

function EditableBody({
  ariaLabel,
  body,
  bodyHtml,
  className,
  deleteLabel,
  editorId,
  listStyle,
  onChange,
  onDelete,
  style,
}) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const sourceHtml = bodyHtml || legacyBodyHtml(body, listStyle);

  function rememberSelection() {
    const selection = window.getSelection();
    if (
      selection?.rangeCount &&
      editorRef.current?.contains(selection.getRangeAt(0).commonAncestorContainer)
    ) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
      document.documentElement.dataset.activeRichTextEditorId = editorId;
    }
  }

  function commit() {
    if (!editorRef.current) return;
    const html = sanitizeEditorHtml(editorRef.current.innerHTML);
    const text = editorRef.current.innerText.replace(/\u00a0/g, " ").trim();
    editorRef.current.innerHTML = html;
    onChange({ html, text });
  }

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = sourceHtml;
    }
  }, [sourceHtml]);

  useEffect(() => {
    function formatBody(event) {
      if (event.detail?.editorId !== editorId || !editorRef.current) return;

      editorRef.current.focus();
      const selection = window.getSelection();
      if (savedRangeRef.current && selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }

      if (event.detail.command === "paragraph") {
        if (document.queryCommandState("insertUnorderedList")) {
          document.execCommand("insertUnorderedList");
        }
        if (document.queryCommandState("insertOrderedList")) {
          document.execCommand("insertOrderedList");
        }
        document.execCommand("formatBlock", false, "p");
      } else if (ALIGN_COMMANDS[event.detail.command]) {
        document.execCommand(event.detail.command, false);
      } else {
        document.execCommand(event.detail.command);
      }

      rememberSelection();
      commit();
    }

    window.addEventListener(RICH_TEXT_FORMAT_EVENT, formatBody);
    return () => window.removeEventListener(RICH_TEXT_FORMAT_EVENT, formatBody);
  });

  return (
    <div className="editable-field editable-field-rich">
      <div
        aria-label={ariaLabel}
        className={`inline-editable rich-text-body ${className ?? ""}`}
        contentEditable
        data-rich-text-editor-id={editorId}
        onBlur={() => {
          rememberSelection();
          commit();
        }}
        onClick={(event) => event.stopPropagation()}
        onFocus={rememberSelection}
        onInput={rememberSelection}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        ref={editorRef}
        spellCheck
        style={style}
        suppressContentEditableWarning
      />
      {onDelete && (
        <button
          aria-label={`Remove ${deleteLabel || ariaLabel}`}
          className="delete-editable-field"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          onMouseDown={(event) => event.preventDefault()}
          title={`Remove ${deleteLabel || ariaLabel}`}
          type="button"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

function HeaderLogoUpload({ props, style, onChange }) {
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  async function uploadLogo(file) {
    setIsLoading(true);
    try {
      const logoImage = await optimizeImage(file);
      onChange({ ...props, logoImage });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        aria-label={props.logoImage ? "Change header logo" : "Upload header logo"}
        className={`email-logo-upload ${props.logoImage ? "has-image" : ""}`}
        disabled={isLoading}
        onClick={(event) => {
          event.stopPropagation();
          inputRef.current?.click();
        }}
        type="button"
      >
        {props.logoImage ? (
          <img
            alt={props.logoAlt}
            src={props.logoImage}
            style={{ width: style.logoWidth }}
          />
        ) : (
          <>
            <ImagePlus size={17} />
            <span>Logo</span>
          </>
        )}
      </button>
      <input
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadLogo(file);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
    </>
  );
}

function CanvasImageUpload({
  alt,
  className = "",
  emptyLabel,
  onChange,
  style,
  value,
}) {
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  async function uploadImage(file) {
    setIsLoading(true);
    try {
      onChange(await optimizeImage(file));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`canvas-image-upload ${className} ${value ? "has-image" : ""}`}
      style={style}
    >
      <button
        aria-label={value ? `Change ${emptyLabel}` : `Upload ${emptyLabel}`}
        disabled={isLoading}
        onClick={(event) => {
          event.stopPropagation();
          inputRef.current?.click();
        }}
        type="button"
      >
        {value ? (
          <img alt={alt} src={value} />
        ) : (
          <>
            <ImagePlus size={20} />
            <span>{emptyLabel}</span>
          </>
        )}
      </button>
      <input
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadImage(file);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}

function ColumnContentPreview({ content, brand, onChange, onDelete, style }) {
  const p = content.props;
  const update = (key, value) =>
    onChange({ ...content, props: { ...p, [key]: value } });
  const updateFieldAlign = (field, align) =>
    onChange({ ...content, props: withFieldAlign(p, field, align) });
  const textFormatProps = (field, fallback = "left") => ({
    editorId: `${content.id}:${field}`,
    onAlignChange: (align) => updateFieldAlign(field, align),
    style: { textAlign: getFieldAlign(p, field, fallback) },
  });
  const items = Array.isArray(p.items) ? p.items : [];
  const updateItem = (index, value) =>
    update(
      "items",
      items.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );

  switch (content.type) {
    case "text":
      return (
        <div className="column-content-text">
          {p.eyebrow && (
            <EditableText
              ariaLabel="Column eyebrow"
              deleteLabel="eyebrow"
              editorId={`${content.id}:eyebrow`}
              onAlignChange={(align) => updateFieldAlign("eyebrow", align)}
              onChange={(value) => update("eyebrow", value)}
              onDelete={() => update("eyebrow", "")}
              style={{
                color: brand.accentColor,
                fontSize: style.eyebrowSize,
                textAlign: getFieldAlign(p, "eyebrow"),
              }}
            >
              {p.eyebrow}
            </EditableText>
          )}
          {p.heading && (
            <EditableText
              ariaLabel="Column heading"
              as="strong"
              deleteLabel="heading"
              editorId={`${content.id}:heading`}
              onAlignChange={(align) => updateFieldAlign("heading", align)}
              onChange={(value) => update("heading", value)}
              onDelete={() => update("heading", "")}
              style={{
                color: style.headingColor,
                fontSize: style.columnHeadingSize,
                textAlign: getFieldAlign(p, "heading"),
              }}
            >
              {p.heading}
            </EditableText>
          )}
          {p.body && (
            <EditableBody
              ariaLabel="Column body"
              body={p.body}
              bodyHtml={p.bodyHtml}
              deleteLabel="body"
              editorId={`${content.id}:body`}
              listStyle={p.listStyle}
              onChange={({ html, text }) =>
                onChange({
                  ...content,
                  props: { ...p, body: text, bodyHtml: html, listStyle: "none" },
                })
              }
              onDelete={() =>
                onChange({
                  ...content,
                  props: { ...p, body: "", bodyHtml: "", listStyle: "none" },
                })
              }
              style={{
                color: style.bodyColor,
                fontSize: style.baseFontSize,
                textAlign: getFieldAlign(p, "body"),
              }}
            />
          )}
        </div>
      );
    case "panel":
      return (
        <section className="column-content-panel">
          <button
            aria-label={`Delete ${p.title || "content panel"}`}
            className="delete-content-panel"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            type="button"
          >
            <Trash2 size={13} />
          </button>
          {p.title && (
            <EditableText
              ariaLabel="Panel title"
              as="strong"
              deleteLabel="panel title"
              {...textFormatProps("panelTitle")}
              onChange={(value) => update("title", value)}
              onDelete={() => update("title", "")}
              style={{
                ...textFormatProps("panelTitle").style,
                color: style.headingColor,
                fontSize: style.columnHeadingSize,
              }}
            >
              {p.title}
            </EditableText>
          )}
          {p.badge && (
            <EditableText
              ariaLabel="Panel badge"
              className="column-panel-badge"
              deleteLabel="badge"
              {...textFormatProps("badge")}
              onChange={(value) => update("badge", value)}
              onDelete={() => update("badge", "")}
              style={{ ...textFormatProps("badge").style, color: brand.primaryColor }}
            >
              {p.badge}
            </EditableText>
          )}
          {(p.image || p.showImagePlaceholder) && (
            <CanvasImageUpload
              alt={p.imageAlt}
              className="column-panel-image"
              emptyLabel="panel image"
              onChange={(value) => update("image", value)}
              value={p.image}
            />
          )}
          {p.body && (
            <EditableText
              ariaLabel="Panel body"
              as="p"
              deleteLabel="panel body"
              multiline
              {...textFormatProps("panelBody")}
              onChange={(value) => update("body", value)}
              onDelete={() => update("body", "")}
              style={{
                ...textFormatProps("panelBody").style,
                color: style.bodyColor,
                fontSize: style.baseFontSize,
              }}
            >
              {p.body}
            </EditableText>
          )}
          {p.itemType === "bullets" && (
            <ul>
              {items.map((item, index) => (
                <li key={`bullet-${index}`}>
                  <EditableText
                    ariaLabel={`Panel note ${index + 1}`}
                    {...textFormatProps(`bullet-${index}`)}
                    onChange={(value) => updateItem(index, value)}
                    onDelete={() =>
                      update("items", items.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    {item}
                  </EditableText>
                </li>
              ))}
            </ul>
          )}
          {p.itemType === "pairs" && (
            <div className="column-panel-rows">
              {items.map((item, index) => (
                <div key={`pair-${index}`}>
                  <EditableText
                    ariaLabel={`Panel name ${index + 1}`}
                    as="strong"
                    {...textFormatProps(`pair-name-${index}`)}
                    onChange={(value) =>
                      updateItem(index, { ...item, name: value })
                    }
                    onDelete={() => updateItem(index, { ...item, name: "" })}
                  >
                    {item.name}
                  </EditableText>
                  <EditableText
                    ariaLabel={`Panel detail ${index + 1}`}
                    {...textFormatProps(`pair-detail-${index}`)}
                    onChange={(value) =>
                      updateItem(index, { ...item, coverage: value })
                    }
                    onDelete={() => updateItem(index, { ...item, coverage: "" })}
                  >
                    {item.coverage}
                  </EditableText>
                </div>
              ))}
            </div>
          )}
          {p.itemType === "meetings" && (
            <div className="column-panel-rows meetings">
              {items.map((item, index) => (
                <div key={`meeting-${index}`}>
                  <EditableText
                    ariaLabel={`Meeting time ${index + 1}`}
                    as="strong"
                    {...textFormatProps(`meeting-time-${index}`)}
                    onChange={(value) =>
                      updateItem(index, { ...item, time: value })
                    }
                    onDelete={() => updateItem(index, { ...item, time: "" })}
                  >
                    {item.time}
                  </EditableText>
                  <EditableText
                    ariaLabel={`Meeting student ${index + 1}`}
                    {...textFormatProps(`meeting-student-${index}`)}
                    onChange={(value) =>
                      updateItem(index, { ...item, student: value })
                    }
                    onDelete={() => updateItem(index, { ...item, student: "" })}
                  >
                    {item.student}
                  </EditableText>
                  <EditableText
                    ariaLabel={`Meeting owner ${index + 1}`}
                    {...textFormatProps(`meeting-owner-${index}`)}
                    onChange={(value) =>
                      updateItem(index, { ...item, owner: value })
                    }
                    onDelete={() => updateItem(index, { ...item, owner: "" })}
                  >
                    {item.owner}
                  </EditableText>
                </div>
              ))}
            </div>
          )}
          {p.itemType === "links" && (
            <div className="column-panel-links">
              {items.map((item, index) => (
                <EditableText
                  ariaLabel={`Panel link ${index + 1}`}
                  key={`link-${index}`}
                  {...textFormatProps(`link-${index}`)}
                  onChange={(value) =>
                    updateItem(index, { ...item, label: value })
                  }
                  onDelete={() =>
                    update("items", items.filter((_, itemIndex) => itemIndex !== index))
                  }
                  style={{
                    ...textFormatProps(`link-${index}`).style,
                    color: brand.primaryColor,
                  }}
                >
                  {item.label}
                </EditableText>
              ))}
            </div>
          )}
          {p.itemType !== "none" && !items.length && (
            <span className="column-panel-empty">Add items in Settings.</span>
          )}
        </section>
      );
    case "image":
      return (
        <figure className="column-content-image">
          <CanvasImageUpload
            alt={p.alt}
            emptyLabel="column image"
            onChange={(value) => update("src", value)}
            value={p.src}
          />
          {p.caption && (
            <EditableText
              ariaLabel="Column image caption"
              as="figcaption"
              deleteLabel="caption"
              {...textFormatProps("caption")}
              onChange={(value) => update("caption", value)}
              onDelete={() => update("caption", "")}
            >
              {p.caption}
            </EditableText>
          )}
        </figure>
      );
    case "button":
      return (
        <div className={`column-content-button align-${p.align}`}>
          {p.text && (
            <EditableText
              ariaLabel="Column button label"
              className={p.style === "outline" ? "outline" : ""}
              deleteLabel="button label"
              {...textFormatProps("buttonText")}
              onChange={(value) => update("text", value)}
              onDelete={() => update("text", "")}
              style={{
                ...textFormatProps("buttonText").style,
                backgroundColor:
                  p.style === "outline" ? style.columnBackgroundColor : brand.primaryColor,
                borderColor: brand.primaryColor,
                color: p.style === "outline" ? brand.primaryColor : "#FFFFFF",
                fontSize: style.buttonFontSize,
              }}
            >
              {p.text}
            </EditableText>
          )}
        </div>
      );
    case "divider":
      return <div className="column-content-divider" style={{ backgroundColor: p.color }} />;
    case "spacer":
      return <div className="column-content-spacer" style={{ height: p.height }} />;
    default:
      return null;
  }
}

function StaffMemoPreview({ block, brand, style }) {
  const p = block.props;
  const update = (key, value) => block.onPropsChange({ ...p, [key]: value });
  const updateFieldAlign = (field, align) =>
    block.onPropsChange(withFieldAlign(p, field, align));
  const textFormatProps = (field, fallback = "left") => ({
    editorId: `${block.id}:${field}`,
    onAlignChange: (align) => updateFieldAlign(field, align),
    style: { textAlign: getFieldAlign(p, field, fallback) },
  });
  const updateArrayItem = (key, index, value) =>
    update(
      key,
      p[key].map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  const typographyStyle = {
    fontFamily: `${style.fontFamily}, Arial, sans-serif`,
    letterSpacing: `${style.letterSpacing}px`,
  };

  return (
    <div
      className="staff-memo"
      style={{
        ...typographyStyle,
        "--memo-body-size": `${style.bodySize}px`,
        "--memo-card-radius": `${style.cardRadius}px`,
        "--memo-heading-color": style.headingColor,
        "--memo-heading-size": `${style.headingSize}px`,
        "--memo-panel-background": style.panelBackgroundColor,
        "--memo-panel-border": style.panelBorderColor,
        backgroundColor: style.backgroundColor,
        color: style.bodyColor,
      }}
    >
      <div
        className="staff-memo-masthead"
        style={{ backgroundColor: brand.primaryColor }}
      >
        <CanvasImageUpload
          alt="Memo header"
          className="memo-header-image"
          emptyLabel="Header image"
          onChange={(value) => update("headerImage", value)}
          value={p.headerImage}
        />
        <div>
          <EditableText
            ariaLabel="Memo title"
            as="h2"
            {...textFormatProps("memoTitle")}
            onChange={(value) => update("memoTitle", value)}
          >
            {p.memoTitle}
          </EditableText>
          <EditableText
            ariaLabel="Memo date range"
            {...textFormatProps("dateRange")}
            onChange={(value) => update("dateRange", value)}
          >
            {p.dateRange}
          </EditableText>
        </div>
      </div>

      <section className="staff-memo-opening">
        <span className="memo-section-kicker" style={{ color: brand.accentColor }}>
          From the desk of leadership
        </span>
        <EditableText
          ariaLabel="Opening message"
          as="p"
          className="memo-opening-message"
          multiline
          {...textFormatProps("openingMessage")}
          onChange={(value) => update("openingMessage", value)}
        >
          {p.openingMessage || "Click to add this week’s opening message for staff."}
        </EditableText>
        <div className="memo-signature">
          <EditableText
            ariaLabel="Signature name"
            as="strong"
            {...textFormatProps("signatureName")}
            onChange={(value) => update("signatureName", value)}
          >
            {p.signatureName || "Signature name"}
          </EditableText>
          <EditableText
            ariaLabel="Signature title"
            {...textFormatProps("signatureTitle")}
            onChange={(value) => update("signatureTitle", value)}
          >
            {p.signatureTitle || "Signature title"}
          </EditableText>
        </div>
        <div
          className="memo-vision"
          style={{ borderLeftColor: brand.accentColor }}
        >
          <span>Vision for the week</span>
          <EditableText
            ariaLabel="Vision statement"
            as="p"
            multiline
            {...textFormatProps("visionStatement")}
            onChange={(value) => update("visionStatement", value)}
          >
            {p.visionStatement || "Click to add the weekly vision or focus statement."}
          </EditableText>
        </div>
      </section>

      <div className="staff-memo-columns" style={{ gap: style.gap }}>
        <div className="memo-logistics-column">
          <section className="memo-panel">
            <h3>Notes for the week</h3>
            {p.notesForWeek.length ? (
              <ul>
                {p.notesForWeek.map((note, index) => (
                  <li key={`note-${index}`}>
                    <EditableText
                      ariaLabel={`Weekly note ${index + 1}`}
                      multiline
                      {...textFormatProps(`notesForWeek-${index}`)}
                      onChange={(value) => updateArrayItem("notesForWeek", index, value)}
                    >
                      {note}
                    </EditableText>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="memo-empty-list">Add weekly notes in Settings.</p>
            )}
          </section>

          <section className="memo-panel">
            <div className="memo-panel-heading">
              <h3>Schedule</h3>
              <EditableText
                ariaLabel="Week type"
                className="memo-week-badge"
                {...textFormatProps("weekType")}
                onChange={(value) => update("weekType", value)}
                style={{
                  ...textFormatProps("weekType").style,
                  backgroundColor: brand.accentColor,
                }}
              >
                {p.weekType}
              </EditableText>
            </div>
            <CanvasImageUpload
              alt="Weekly schedule"
              className="memo-schedule-image"
              emptyLabel="Schedule image"
              onChange={(value) => update("scheduleImage", value)}
              value={p.scheduleImage}
            />
          </section>
        </div>

        <div className="memo-logistics-column">
          <section className="memo-panel">
            <h3>Staff absences</h3>
            {p.staffAbsences.length ? (
              <div className="memo-table">
                {p.staffAbsences.map((absence, index) => (
                  <div className="memo-table-row" key={`absence-${index}`}>
                    <EditableText
                      ariaLabel={`Absence name ${index + 1}`}
                      as="strong"
                      {...textFormatProps(`staffAbsences-name-${index}`)}
                      onChange={(value) =>
                        updateArrayItem("staffAbsences", index, {
                          ...absence,
                          name: value,
                        })
                      }
                    >
                      {absence.name}
                    </EditableText>
                    <EditableText
                      ariaLabel={`Absence coverage ${index + 1}`}
                      {...textFormatProps(`staffAbsences-coverage-${index}`)}
                      onChange={(value) =>
                        updateArrayItem("staffAbsences", index, {
                          ...absence,
                          coverage: value,
                        })
                      }
                    >
                      {absence.coverage}
                    </EditableText>
                  </div>
                ))}
              </div>
            ) : (
              <p className="memo-empty-list">Add absences in Settings.</p>
            )}
          </section>

          <section className="memo-panel">
            <h3>IEP meetings</h3>
            {p.iepMeetings.length ? (
              <div className="memo-table memo-meetings">
                {p.iepMeetings.map((meeting, index) => (
                  <div className="memo-table-row" key={`meeting-${index}`}>
                    <EditableText
                      ariaLabel={`IEP time ${index + 1}`}
                      as="strong"
                      {...textFormatProps(`iepMeetings-time-${index}`)}
                      onChange={(value) =>
                        updateArrayItem("iepMeetings", index, {
                          ...meeting,
                          time: value,
                        })
                      }
                    >
                      {meeting.time}
                    </EditableText>
                    <EditableText
                      ariaLabel={`IEP student ${index + 1}`}
                      {...textFormatProps(`iepMeetings-student-${index}`)}
                      onChange={(value) =>
                        updateArrayItem("iepMeetings", index, {
                          ...meeting,
                          student: value,
                        })
                      }
                    >
                      {meeting.student}
                    </EditableText>
                    <EditableText
                      ariaLabel={`IEP owner ${index + 1}`}
                      {...textFormatProps(`iepMeetings-owner-${index}`)}
                      onChange={(value) =>
                        updateArrayItem("iepMeetings", index, {
                          ...meeting,
                          owner: value,
                        })
                      }
                    >
                      {meeting.owner}
                    </EditableText>
                  </div>
                ))}
              </div>
            ) : (
              <p className="memo-empty-list">Add IEP meetings in Settings.</p>
            )}
          </section>

          <section className="memo-panel">
            <h3>Important links</h3>
            {p.importantLinks.length ? (
              <div className="memo-links">
                {p.importantLinks.map((link, index) => (
                  <EditableText
                    ariaLabel={`Important link label ${index + 1}`}
                    className="memo-link"
                    key={`link-${index}`}
                    {...textFormatProps(`importantLinks-${index}`)}
                    onChange={(value) =>
                      updateArrayItem("importantLinks", index, {
                        ...link,
                        label: value,
                      })
                    }
                    style={{
                      ...textFormatProps(`importantLinks-${index}`).style,
                      color: brand.primaryColor,
                    }}
                  >
                    {link.label}
                  </EditableText>
                ))}
              </div>
            ) : (
              <p className="memo-empty-list">Add important links in Settings.</p>
            )}
          </section>
        </div>
      </div>

      <footer className="staff-memo-footer">
        <CanvasImageUpload
          alt="Footer logo"
          className="memo-footer-logo"
          emptyLabel="Footer logo"
          onChange={(value) => update("footerLogo", value)}
          value={p.footerLogo}
        />
        <span>Staff Weekly Memo · Internal Communication</span>
      </footer>
    </div>
  );
}

function BlockPreview({ block, brand }) {
  const p = block.props;
  const s = getBlockStyle(block, brand);
  const update = (key, value) => block.onPropsChange({ ...p, [key]: value });
  const updateFieldAlign = (field, align) =>
    block.onPropsChange(withFieldAlign(p, field, align));
  const textFormatProps = (field, fallback = "left") => ({
    editorId: `${block.id}:${field}`,
    onAlignChange: (align) => updateFieldAlign(field, align),
    style: { textAlign: getFieldAlign(p, field, fallback) },
  });
  const sectionPadding = `${s.paddingTop}px ${s.paddingX}px ${s.paddingBottom}px`;
  const typographyStyle = {
    fontFamily: `${s.fontFamily}, Arial, sans-serif`,
    letterSpacing: `${s.letterSpacing}px`,
  };

  switch (block.type) {
    case "staffMemo":
      return <StaffMemoPreview block={block} brand={brand} style={s} />;
    case "header":
      return (
        <div
          className="email-header"
          style={{
            ...typographyStyle,
            backgroundColor: s.backgroundColor,
            padding: sectionPadding,
          }}
        >
          <div className="email-brand-lockup">
            <HeaderLogoUpload onChange={block.onPropsChange} props={p} style={s} />
            {p.logoText && (
              <EditableText
                ariaLabel="Logo text"
                as="strong"
                deleteLabel="logo text"
                editorId={`${block.id}:logoText`}
                onAlignChange={(align) => updateFieldAlign("logoText", align)}
                onChange={(value) => update("logoText", value)}
                onDelete={() => update("logoText", "")}
                style={{
                  color: s.logoColor,
                  fontSize: s.logoSize,
                  textAlign: getFieldAlign(p, "logoText"),
                }}
              >
                {p.logoText}
              </EditableText>
            )}
          </div>
          {p.issue && (
            <EditableText
              ariaLabel="Issue label"
              deleteLabel="issue label"
              editorId={`${block.id}:issue`}
              onAlignChange={(align) => updateFieldAlign("issue", align)}
              onChange={(value) => update("issue", value)}
              onDelete={() => update("issue", "")}
              style={{ color: s.issueColor, textAlign: getFieldAlign(p, "issue", "right") }}
            >
              {p.issue}
            </EditableText>
          )}
        </div>
      );
    case "hero":
      return (
        <div
          className="email-hero"
          style={{ ...typographyStyle, backgroundColor: s.backgroundColor }}
        >
          <CanvasImageUpload
            alt=""
            className="email-hero-image"
            emptyLabel="hero image"
            onChange={(value) => update("image", value)}
            style={{ "--canvas-image-height": `${s.imageHeight}px` }}
            value={p.image}
          />
          <div className="email-hero-copy" style={{ padding: sectionPadding }}>
            {p.eyebrow && (
              <EditableText
                ariaLabel="Hero eyebrow"
                as="p"
                className="email-eyebrow"
                deleteLabel="eyebrow"
                editorId={`${block.id}:eyebrow`}
                onAlignChange={(align) => updateFieldAlign("eyebrow", align)}
                onChange={(value) => update("eyebrow", value)}
                onDelete={() => update("eyebrow", "")}
                style={{
                  color: brand.accentColor,
                  textAlign: getFieldAlign(p, "eyebrow"),
                }}
              >
                {p.eyebrow}
              </EditableText>
            )}
            {p.title && (
              <EditableText
                ariaLabel="Hero headline"
                as="h2"
                deleteLabel="headline"
                editorId={`${block.id}:title`}
                multiline
                onAlignChange={(align) => updateFieldAlign("title", align)}
                onChange={(value) => update("title", value)}
                onDelete={() => update("title", "")}
                style={{
                  color: s.headingColor,
                  fontSize: s.headingSize,
                  textAlign: getFieldAlign(p, "title"),
                }}
              >
                {p.title}
              </EditableText>
            )}
            {p.body && (
              <EditableText
                ariaLabel="Hero body"
                as="p"
                deleteLabel="body"
                editorId={`${block.id}:body`}
                multiline
                onAlignChange={(align) => updateFieldAlign("body", align)}
                onChange={(value) => update("body", value)}
                onDelete={() => update("body", "")}
                style={{
                  color: s.bodyColor,
                  fontSize: s.bodySize,
                  textAlign: getFieldAlign(p, "body"),
                }}
              >
                {p.body}
              </EditableText>
            )}
            {p.buttonText && (
              <EditableText
                ariaLabel="Hero button label"
                className="email-cta"
                deleteLabel="button"
                editorId={`${block.id}:buttonText`}
                onAlignChange={(align) => updateFieldAlign("buttonText", align)}
                onChange={(value) => update("buttonText", value)}
                onDelete={() => update("buttonText", "")}
                style={{
                  backgroundColor: s.buttonColor,
                  borderRadius: s.buttonRadius,
                  color: s.buttonTextColor,
                  fontSize: s.buttonFontSize,
                  textAlign: getFieldAlign(p, "buttonText"),
                }}
              >
                {p.buttonText}
              </EditableText>
            )}
          </div>
        </div>
      );
    case "text":
      return (
        <div
          className="email-text"
          style={{
            ...typographyStyle,
            backgroundColor: s.backgroundColor,
            padding: sectionPadding,
          }}
        >
          {p.eyebrow && (
            <EditableText
              ariaLabel="Text eyebrow"
              as="p"
              className="email-eyebrow"
              deleteLabel="eyebrow"
              {...textFormatProps("eyebrow")}
              onChange={(value) => update("eyebrow", value)}
              onDelete={() => update("eyebrow", "")}
              style={{ ...textFormatProps("eyebrow").style, color: brand.accentColor }}
            >
              {p.eyebrow}
            </EditableText>
          )}
          {p.heading && (
            <EditableText
              ariaLabel="Text heading"
              as="h3"
              deleteLabel="heading"
              {...textFormatProps("heading")}
              onChange={(value) => update("heading", value)}
              onDelete={() => update("heading", "")}
              style={{
                ...textFormatProps("heading").style,
                color: s.headingColor,
                fontSize: s.headingSize,
              }}
            >
              {p.heading}
            </EditableText>
          )}
          {p.body && (
            <EditableBody
              ariaLabel="Text body"
              body={p.body}
              bodyHtml={p.bodyHtml}
              deleteLabel="body"
              editorId={`${block.id}:body`}
              listStyle={p.listStyle}
              onChange={({ html, text }) =>
                block.onPropsChange({
                  ...p,
                  body: text,
                  bodyHtml: html,
                  listStyle: "none",
                })
              }
              onDelete={() =>
                block.onPropsChange({
                  ...p,
                  body: "",
                  bodyHtml: "",
                  listStyle: "none",
                })
              }
              style={{
                color: s.bodyColor,
                fontSize: s.bodySize,
                textAlign: getFieldAlign(p, "body"),
              }}
            />
          )}
        </div>
      );
    case "image":
      return (
        <figure
          className="email-image"
          style={{
            ...typographyStyle,
            backgroundColor: s.backgroundColor,
            padding: sectionPadding,
          }}
        >
          <CanvasImageUpload
            alt={p.alt}
            emptyLabel="image"
            onChange={(value) => update("src", value)}
            value={p.src}
          />
          {p.caption && (
            <EditableText
              ariaLabel="Image caption"
              as="figcaption"
              deleteLabel="caption"
              {...textFormatProps("caption")}
              onChange={(value) => update("caption", value)}
              onDelete={() => update("caption", "")}
              style={{
                ...textFormatProps("caption").style,
                color: s.captionColor,
                fontSize: s.captionSize,
              }}
            >
              {p.caption}
            </EditableText>
          )}
        </figure>
      );
    case "button":
      return (
        <div
          className={`email-button-row align-${p.align}`}
          style={{
            ...typographyStyle,
            backgroundColor: s.backgroundColor,
            padding: sectionPadding,
          }}
        >
          {p.text && (
            <EditableText
              ariaLabel="Button label"
              className={`email-button ${p.style === "outline" ? "outline" : ""}`}
              deleteLabel="button label"
              {...textFormatProps("buttonText")}
              onChange={(value) => update("text", value)}
              onDelete={() => update("text", "")}
              style={{
                ...textFormatProps("buttonText").style,
                backgroundColor:
                  p.style === "outline" ? s.backgroundColor : s.buttonColor,
                borderColor: s.buttonColor,
                borderRadius: s.borderRadius,
                color: p.style === "outline" ? s.buttonColor : s.textColor,
                fontSize: s.fontSize,
                padding: `${s.innerPaddingY}px ${s.innerPaddingX}px`,
              }}
            >
              {p.text}
            </EditableText>
          )}
        </div>
      );
    case "columns":
      {
        const [leftWidth, rightWidth] =
          p.ratio === "33-67"
            ? ["1fr", "2fr"]
            : p.ratio === "67-33"
              ? ["2fr", "1fr"]
              : ["1fr", "1fr"];
        return (
          <div
            className="email-columns flexible-columns"
            style={{
              ...typographyStyle,
              backgroundColor: s.backgroundColor,
              padding: sectionPadding,
            }}
          >
            {p.heading && (
              <EditableText
              ariaLabel="Columns heading"
              as="h3"
              deleteLabel="section heading"
              {...textFormatProps("heading")}
              onChange={(value) => update("heading", value)}
              onDelete={() => update("heading", "")}
              style={{
                ...textFormatProps("heading").style,
                color: s.headingColor,
                fontSize: s.headingSize,
              }}
            >
                {p.heading}
              </EditableText>
            )}
            <div
              className="email-column-grid flexible-column-grid"
              style={{
                gap: s.gap,
                gridTemplateColumns: `${leftWidth} ${rightWidth}`,
              }}
            >
              {p.columns.map((column, columnIndex) => (
                <div
                  className="content-column"
                  key={column.id}
                  style={{
                    backgroundColor: s.columnBackgroundColor,
                    borderColor: s.columnBorderColor,
                    borderRadius: s.columnRadius,
                  }}
                >
                  {column.blocks.length ? (
                    column.blocks.map((content) => (
                      <ColumnContentPreview
                        brand={brand}
                        content={content}
                        key={content.id}
                        onDelete={() =>
                          update(
                            "columns",
                            p.columns.map((item, index) =>
                              index === columnIndex
                                ? {
                                    ...item,
                                    blocks: item.blocks.filter(
                                      (blockItem) => blockItem.id !== content.id,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        onChange={(nextContent) =>
                          update(
                            "columns",
                            p.columns.map((item, index) =>
                              index === columnIndex
                                ? {
                                    ...item,
                                    blocks: item.blocks.map((blockItem) =>
                                      blockItem.id === content.id
                                        ? nextContent
                                        : blockItem,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        style={s}
                      />
                    ))
                  ) : (
                    <div className="empty-content-column">Empty column</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
    case "calendar":
      return (
        <div
          className="email-columns email-calendar"
          style={{
            ...typographyStyle,
            backgroundColor: s.backgroundColor,
            padding: sectionPadding,
          }}
        >
          {p.logoImage && (
            <CanvasImageUpload
              alt={p.logoAlt}
              className="email-footer-logo"
              emptyLabel="footer logo"
              onChange={(value) => update("logoImage", value)}
              value={p.logoImage}
            />
          )}
          {p.heading && (
            <EditableText
              ariaLabel="Calendar heading"
              as="h3"
              deleteLabel="calendar heading"
              {...textFormatProps("heading")}
              onChange={(value) => update("heading", value)}
              onDelete={() => update("heading", "")}
              style={{
                ...textFormatProps("heading").style,
                color: s.headingColor,
                fontSize: s.headingSize,
              }}
            >
              {p.heading}
            </EditableText>
          )}
          <div className="email-column-grid calendar-grid">
            {[
              [p.leftTitle, p.leftEyebrow, p.leftBody],
              [p.rightTitle, p.rightEyebrow, p.rightBody],
            ].map(([title, eyebrow, body], index) => {
              const prefix = index === 0 ? "left" : "right";
              return (
              <div
                className="date-card"
                key={index}
                style={{
                  backgroundColor: s.cardBackgroundColor,
                  borderColor: s.cardBorderColor,
                  borderRadius: s.cardRadius,
                }}
              >
                {title && (
                  <EditableText
                    ariaLabel={`${index === 0 ? "First" : "Second"} calendar date`}
                    as="strong"
                    deleteLabel="date"
                    {...textFormatProps(`${prefix}Title`)}
                    onChange={(value) => update(`${prefix}Title`, value)}
                    onDelete={() => update(`${prefix}Title`, "")}
                    style={{
                      ...textFormatProps(`${prefix}Title`).style,
                      color: s.dateColor,
                      fontSize: s.dateSize,
                    }}
                  >
                    {title}
                  </EditableText>
                )}
                {eyebrow && (
                  <span style={{ color: brand.accentColor, fontSize: s.labelSize }}>
                    <CalendarDays size={11} />
                    <EditableText
                      ariaLabel={`${index === 0 ? "First" : "Second"} calendar label`}
                      deleteLabel="date label"
                      {...textFormatProps(`${prefix}Eyebrow`)}
                      onChange={(value) => update(`${prefix}Eyebrow`, value)}
                      onDelete={() => update(`${prefix}Eyebrow`, "")}
                    >
                      {eyebrow}
                    </EditableText>
                  </span>
                )}
                {body && (
                  <EditableText
                    ariaLabel={`${index === 0 ? "First" : "Second"} calendar details`}
                    as="p"
                    deleteLabel="date details"
                    multiline
                    {...textFormatProps(`${prefix}Body`)}
                    onChange={(value) => update(`${prefix}Body`, value)}
                    onDelete={() => update(`${prefix}Body`, "")}
                    style={{
                      ...textFormatProps(`${prefix}Body`).style,
                      color: s.bodyColor,
                      fontSize: s.baseFontSize,
                    }}
                  >
                    {body}
                  </EditableText>
                )}
              </div>
              );
            })}
          </div>
        </div>
      );
    case "divider":
      return (
        <div
          className="email-divider"
          style={{ backgroundColor: s.backgroundColor, padding: sectionPadding }}
        >
          <span style={{ backgroundColor: p.color, height: s.thickness }} />
        </div>
      );
    case "spacer":
      return (
        <div
          className="email-spacer"
          style={{
            ...typographyStyle,
            backgroundColor: s.backgroundColor,
            height: Number(p.height) || 32,
          }}
        >
          <span>{p.height}px space</span>
        </div>
      );
    case "footer":
      return (
        <div
          className="email-footer"
          style={{
            ...typographyStyle,
            backgroundColor: s.backgroundColor,
            padding: sectionPadding,
          }}
        >
          {p.schoolName && (
            <EditableText
              ariaLabel="Footer school name"
              as="strong"
              deleteLabel="school name"
              {...textFormatProps("schoolName", s.align)}
              onChange={(value) => update("schoolName", value)}
              onDelete={() => update("schoolName", "")}
              style={{
                ...textFormatProps("schoolName", s.align).style,
                color: s.headingColor,
                fontSize: s.headingSize,
              }}
            >
              {p.schoolName}
            </EditableText>
          )}
          {p.address && (
            <EditableText
              ariaLabel="Footer address"
              as="p"
              deleteLabel="address"
              {...textFormatProps("address", s.align)}
              onChange={(value) => update("address", value)}
              onDelete={() => update("address", "")}
              style={{
                ...textFormatProps("address", s.align).style,
                color: s.bodyColor,
                fontSize: s.bodySize,
              }}
            >
              {p.address}
            </EditableText>
          )}
          {(p.phone || p.website) && (
            <p className="footer-contact" style={{ color: s.bodyColor, fontSize: s.bodySize }}>
              {p.phone && (
                <EditableText
                  ariaLabel="Footer phone"
                  deleteLabel="phone"
                  {...textFormatProps("phone", s.align)}
                  onChange={(value) => update("phone", value)}
                  onDelete={() => update("phone", "")}
                >
                  {p.phone}
                </EditableText>
              )}
              {p.phone && p.website && <span aria-hidden="true"> · </span>}
              {p.website && (
                <EditableText
                  ariaLabel="Footer website"
                  deleteLabel="website"
                  {...textFormatProps("website", s.align)}
                  onChange={(value) => update("website", value)}
                  onDelete={() => update("website", "")}
                >
                  {p.website}
                </EditableText>
              )}
            </p>
          )}
          {((p.preferencesText ?? "Manage preferences") ||
            (p.unsubscribeText ?? "Unsubscribe")) && (
            <span className="footer-links" style={{ color: s.bodyColor, fontSize: s.bodySize }}>
              {(p.preferencesText ?? "Manage preferences") && (
                <EditableText
                  ariaLabel="Footer preferences link"
                  deleteLabel="preferences link"
                  {...textFormatProps("preferencesText", s.align)}
                  onChange={(value) => update("preferencesText", value)}
                  onDelete={() => update("preferencesText", "")}
                >
                  {p.preferencesText ?? "Manage preferences"}
                </EditableText>
              )}
              {(p.preferencesText ?? "Manage preferences") &&
                (p.unsubscribeText ?? "Unsubscribe") && (
                  <span aria-hidden="true"> · </span>
                )}
              {(p.unsubscribeText ?? "Unsubscribe") && (
                <EditableText
                  ariaLabel="Footer unsubscribe link"
                  deleteLabel="unsubscribe link"
                  {...textFormatProps("unsubscribeText", s.align)}
                  onChange={(value) => update("unsubscribeText", value)}
                  onDelete={() => update("unsubscribeText", "")}
                >
                  {p.unsubscribeText ?? "Unsubscribe"}
                </EditableText>
              )}
            </span>
          )}
        </div>
      );
    default:
      return null;
  }
}

export default function EmailBlock({
  block,
  brand,
  isSelected,
  onDelete,
  onDuplicate,
  onBlockChange,
  onSelect,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  return (
    <article
      className={`canvas-block ${isSelected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="block-toolbar">
        <button
          aria-label="Drag to reorder"
          className="drag-handle"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </button>
        <div className="block-toolbar-actions">
          <button aria-label="Duplicate block" onClick={onDuplicate} type="button">
            <Copy size={14} />
          </button>
          <button aria-label="Delete block" onClick={onDelete} type="button">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <BlockPreview
        block={{ ...block, onPropsChange: onBlockChange }}
        brand={brand}
      />
    </article>
  );
}
