import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Archive,
  ArrowDown,
  ArrowUp,
  Blocks,
  CalendarDays,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Columns3,
  Copy,
  Download,
  Eye,
  FileText,
  GalleryHorizontalEnd,
  GripVertical,
  Heading,
  Image,
  ImagePlus,
  Laptop,
  LayoutTemplate,
  List,
  ListOrdered,
  Menu,
  Minus,
  Monitor,
  MoreHorizontal,
  MousePointerClick,
  Palette,
  PanelLeftClose,
  PanelRightClose,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Send,
  Settings2,
  Smartphone,
  Space,
  Type,
  Undo2,
  Upload,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  blockCatalog,
  columnContentCatalog,
  createBlock,
  createColumnContent,
  getBlockStyle,
  migrateDesign,
  staffMemoDesign,
  starterDesign,
  synchronizeDesignFields,
} from "../email/design.js";
import { compileDesign } from "../email/renderEmail.js";
import { pickGoogleDriveImage } from "../email/googleDrivePicker.js";
import { optimizeImage } from "../email/imageUtils.js";
import {
  deleteTemplateRecord,
  loadSavedTemplates,
  saveTemplateRecord,
} from "../email/templateStorage.js";
import EmailBlock from "./EmailBlock.jsx";

const iconMap = {
  header: Heading,
  hero: GalleryHorizontalEnd,
  text: Type,
  image: Image,
  button: MousePointerClick,
  columns: Columns3,
  calendar: CalendarDays,
  divider: Minus,
  spacer: Space,
  footer: Archive,
  staffMemo: FileText,
};

const templates = [
  {
    key: "weekly-update",
    name: "Weekly Update",
    category: "Newsletter",
    color: "#16324F",
    accent: "#F5A623",
  },
  {
    key: "event-invite",
    name: "Event Invite",
    category: "Announcement",
    color: "#4D2A6B",
    accent: "#F0B7A4",
  },
  {
    key: "attendance-nudge",
    name: "Attendance Nudge",
    category: "Campaign",
    color: "#174D42",
    accent: "#E8C55A",
  },
  {
    key: "staff-weekly-memo-two-column-logistics",
    name: "Staff Weekly Memo — Two Column Logistics",
    category: "Staff Operations",
    color: "#173B57",
    accent: "#D9A441",
    design: staffMemoDesign,
  },
];

const emailFontOptions = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Georgia",
  "Times New Roman",
  "Courier New",
];

function cloneStarter() {
  return migrateDesign(starterDesign);
}

function createSavedTemplateRecord(source, { forceNewId = false } = {}) {
  const design = synchronizeDesignFields(source);
  if (forceNewId) {
    design.id = `template-${crypto.randomUUID()}`;
  }

  return {
    id: design.id,
    name: design.name,
    category: "Saved template",
    color: design.brand.primaryColor,
    accent: design.brand.accentColor,
    design,
    savedAt: new Date().toISOString(),
    isSaved: true,
  };
}

function PaletteBlock({ item }) {
  const Icon = iconMap[item.type];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new:${item.type}`,
  });

  return (
    <button
      className={`palette-block ${isDragging ? "dragging" : ""}`}
      onClick={() => window.dispatchEvent(new CustomEvent("add-email-block", { detail: item.type }))}
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
    >
      <span className="palette-icon">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span>
        <strong>{item.label}</strong>
        <small>{item.description}</small>
      </span>
      <Plus className="palette-add" size={14} />
    </button>
  );
}

function Field({ label, value, onChange, multiline = false, type = "text" }) {
  const Component = multiline ? "textarea" : "input";
  return (
    <label className="field">
      <span>{label}</span>
      <Component
        onChange={(event) =>
          onChange(type === "number" ? Number(event.target.value) : event.target.value)
        }
        rows={multiline ? 4 : undefined}
        type={multiline ? undefined : type}
        value={value ?? ""}
      />
    </label>
  );
}

function SelectControl({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function GlobalTypographyControls({ brand, onBrandChange }) {
  return (
    <div className="global-typography-controls">
      <SelectControl
        label="Global font"
        onChange={(value) => onBrandChange("fontFamily", value)}
        options={emailFontOptions}
        value={brand.fontFamily}
      />
      <RangeControl
        label="Global text size"
        max={18}
        min={8}
        onChange={(value) => onBrandChange("baseFontSizePt", value)}
        step={0.5}
        unit="pt"
        value={brand.baseFontSizePt}
      />
      <p>Blocks with a custom text size keep their individual setting.</p>
    </div>
  );
}

function ImageSourceControl({ label = "Image", value, onChange }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDriveSetup, setShowDriveSetup] = useState(false);
  const driveConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    appId: import.meta.env.VITE_GOOGLE_APP_ID,
  };
  const driveConfigured = Boolean(driveConfig.clientId && driveConfig.apiKey);

  async function useImage(file, sourceName) {
    setIsLoading(true);
    setStatus(`Preparing ${sourceName}…`);
    try {
      const dataUrl = await optimizeImage(file);
      onChange(dataUrl);
      setStatus(`${sourceName} added`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function openGoogleDrive() {
    if (!driveConfigured) {
      setShowDriveSetup(true);
      return;
    }

    setIsLoading(true);
    setStatus("Connecting to Google Drive…");
    try {
      const result = await pickGoogleDriveImage(driveConfig);
      await useImage(
        new File([result.blob], result.name, { type: result.blob.type }),
        result.name,
      );
    } catch (error) {
      setStatus(error.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="image-source-control">
      <span className="control-label">{label}</span>
      <div className="image-source-preview">
        {value ? <img alt="" src={value} /> : <ImagePlus size={21} />}
        <div>
          <strong>{value ? "Image selected" : "Add an image"}</strong>
          <span>Upload from your device or choose from Drive.</span>
        </div>
      </div>
      <div className="image-source-actions">
        <button
          disabled={isLoading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Upload size={14} />
          Upload image
        </button>
        <button disabled={isLoading} onClick={openGoogleDrive} type="button">
          <Cloud size={14} />
          {driveConfigured ? "Choose from Drive" : "Set up Drive"}
        </button>
        {value && (
          <button
            className="remove-image-source"
            disabled={isLoading}
            onClick={() => {
              onChange("");
              setStatus("Image removed");
            }}
            type="button"
          >
            <Trash2 size={14} />
            Remove image
          </button>
        )}
      </div>
      <input
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) useImage(file, file.name);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <Field label="Or paste an image URL" onChange={onChange} value={value} />
      {driveConfigured && !status && (
        <p className="drive-privacy-note">
          Google sign-in opens only when you choose a Drive image. Brightletter
          can access only the file you select.
        </p>
      )}
      {status && (
        <p className={`asset-status ${status.includes("added") ? "success" : ""}`}>
          {status}
        </p>
      )}
      {showDriveSetup && (
        <div className="drive-setup">
          <button
            aria-label="Close Google Drive setup"
            onClick={() => setShowDriveSetup(false)}
            type="button"
          >
            <X size={13} />
          </button>
          <span>
            <Cloud size={15} />
          </span>
          <div>
            <strong>Google Drive setup required</strong>
            <p>
              The app owner must add the Google OAuth client ID, Picker API key,
              and Cloud project number to Vercel. Visitors do not need a
              Brightletter account.
            </p>
            <code>VITE_GOOGLE_CLIENT_ID · VITE_GOOGLE_API_KEY · VITE_GOOGLE_APP_ID</code>
          </div>
        </div>
      )}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          className={value === option.value ? "active" : ""}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ColumnContentEditor({
  content,
  isFirst,
  isLast,
  onChange,
  onDelete,
  onMoveDown,
  onMoveUp,
}) {
  const props = content.props;
  const update = (key, value) =>
    onChange({ ...content, props: { ...props, [key]: value } });

  return (
    <div className="column-content-editor">
      <div className="column-content-editor-head">
        <span>
          {content.type === "panel"
            ? props.title || "Content panel"
            : columnContentCatalog.find((item) => item.type === content.type)?.label}
        </span>
        <div>
          <button
            aria-label="Move content up"
            disabled={isFirst}
            onClick={onMoveUp}
            type="button"
          >
            <ArrowUp size={12} />
          </button>
          <button
            aria-label="Move content down"
            disabled={isLast}
            onClick={onMoveDown}
            type="button"
          >
            <ArrowDown size={12} />
          </button>
          <button
            aria-label={`Remove ${props.title || content.type} from column`}
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <AddRemovedFields
        fields={restorableColumnFields[content.type]}
        onRestore={update}
        props={props}
      />

      {content.type === "text" && (
        <>
          <InlineEditingNote />
          <RichTextControls editorId={content.id} />
        </>
      )}

      {content.type === "image" && (
        <>
          <ImageSourceControl
            label="Column image"
            onChange={(value) => update("src", value)}
            value={props.src}
          />
          <Field label="Alt text" onChange={(value) => update("alt", value)} value={props.alt} />
          <InlineEditingNote />
        </>
      )}

      {content.type === "panel" && (
        <>
          <InlineEditingNote />
          <Field
            label="Badge"
            onChange={(value) => update("badge", value)}
            value={props.badge}
          />
          <label className="field">
            <span>Panel content type</span>
            <select
              onChange={(event) => update("itemType", event.target.value)}
              value={props.itemType}
            >
              <option value="none">Freeform text</option>
              <option value="bullets">Bullet list</option>
              <option value="pairs">Two-column list</option>
              <option value="meetings">Meeting list</option>
              <option value="links">Link list</option>
            </select>
          </label>
          <ImageSourceControl
            label="Optional panel image"
            onChange={(value) => update("image", value)}
            value={props.image}
          />
          <Field
            label="Image alt text"
            onChange={(value) => update("imageAlt", value)}
            value={props.imageAlt}
          />
          <PanelItemsEditor props={props} update={update} />
        </>
      )}

      {content.type === "button" && (
        <>
          <InlineEditingNote />
          <Field label="Destination URL" onChange={(value) => update("url", value)} value={props.url} />
          <span className="control-label">Alignment</span>
          <Segmented
            onChange={(value) => update("align", value)}
            options={[
              { value: "left", label: "Left", icon: <AlignLeft size={13} /> },
              { value: "center", label: "Center", icon: <AlignCenter size={13} /> },
            ]}
            value={props.align}
          />
          <span className="control-label">Button style</span>
          <Segmented
            onChange={(value) => update("style", value)}
            options={[
              { value: "filled", label: "Filled" },
              { value: "outline", label: "Outline" },
            ]}
            value={props.style}
          />
        </>
      )}

      {content.type === "divider" && (
        <ColorControl
          label="Divider color"
          onChange={(value) => update("color", value)}
          value={props.color}
        />
      )}

      {content.type === "spacer" && (
        <RangeControl
          label="Height"
          min={8}
          max={120}
          onChange={(value) => update("height", value)}
          value={props.height}
        />
      )}
    </div>
  );
}

function PanelItemsEditor({ props, update }) {
  const items = Array.isArray(props.items) ? props.items : [];
  if (props.itemType === "none") return null;

  const schemas = {
    bullets: {
      addLabel: "Add note",
      create: () => "New note",
      fields: [{ key: null, label: "Note" }],
    },
    pairs: {
      addLabel: "Add absence",
      create: () => ({ name: "Staff member", coverage: "Coverage plan" }),
      fields: [
        { key: "name", label: "Name" },
        { key: "coverage", label: "Coverage" },
      ],
    },
    meetings: {
      addLabel: "Add meeting",
      create: () => ({ time: "Time", student: "Student", owner: "Owner" }),
      fields: [
        { key: "time", label: "Time" },
        { key: "student", label: "Student" },
        { key: "owner", label: "Owner" },
      ],
    },
    links: {
      addLabel: "Add link",
      create: () => ({ label: "Important resource", url: "https://example.org" }),
      fields: [
        { key: "label", label: "Label" },
        { key: "url", label: "URL" },
      ],
    },
  };
  const schema = schemas[props.itemType];
  if (!schema) return null;

  const updateItem = (index, key, value) =>
    update(
      "items",
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return key === null ? value : { ...item, [key]: value };
      }),
    );

  return (
    <div className="panel-items-editor">
      <span className="control-label">List items</span>
      {items.map((item, index) => (
        <div className="panel-item-editor" key={`${props.itemType}-${index}`}>
          {schema.fields.map((field) => (
            <Field
              key={field.key ?? "value"}
              label={field.label}
              onChange={(value) => updateItem(index, field.key, value)}
              value={field.key === null ? item : item[field.key]}
            />
          ))}
          <button
            className="remove-panel-item"
            onClick={() =>
              update(
                "items",
                items.filter((_, itemIndex) => itemIndex !== index),
              )
            }
            type="button"
          >
            <Trash2 size={12} />
            Remove item
          </button>
        </div>
      ))}
      <button
        className="add-memo-row"
        onClick={() => update("items", [...items, schema.create()])}
        type="button"
      >
        <Plus size={13} />
        {schema.addLabel}
      </button>
    </div>
  );
}

function ColumnEditor({ column, index, onChange }) {
  const [newType, setNewType] = useState("text");

  function updateContent(contentIndex, nextContent) {
    const blocks = [...column.blocks];
    blocks[contentIndex] = nextContent;
    onChange({ ...column, blocks });
  }

  function moveContent(contentIndex, direction) {
    const nextIndex = contentIndex + direction;
    if (nextIndex < 0 || nextIndex >= column.blocks.length) return;
    const blocks = arrayMove(column.blocks, contentIndex, nextIndex);
    onChange({ ...column, blocks });
  }

  return (
    <section className="column-editor">
      <div className="field-group-label">Column {index + 1}</div>
      {column.blocks.length ? (
        column.blocks.map((content, contentIndex) => (
          <ColumnContentEditor
            content={content}
            isFirst={contentIndex === 0}
            isLast={contentIndex === column.blocks.length - 1}
            key={content.id}
            onChange={(nextContent) => updateContent(contentIndex, nextContent)}
            onDelete={() =>
              onChange({
                ...column,
                blocks: column.blocks.filter((item) => item.id !== content.id),
              })
            }
            onMoveDown={() => moveContent(contentIndex, 1)}
            onMoveUp={() => moveContent(contentIndex, -1)}
          />
        ))
      ) : (
        <div className="empty-column-content">This column is empty.</div>
      )}
      <div className="add-column-content">
        <select
          aria-label={`New content type for column ${index + 1}`}
          onChange={(event) => setNewType(event.target.value)}
          value={newType}
        >
          {columnContentCatalog.map((item) => (
            <option key={item.type} value={item.type}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            onChange({
              ...column,
              blocks: [...column.blocks, createColumnContent(newType)],
            })
          }
          type="button"
        >
          <Plus size={13} />
          Add content
        </button>
      </div>
    </section>
  );
}

function ColorControl({ label, value, onChange }) {
  return (
    <label className="style-color-control">
      <span>{label}</span>
      <div>
        <input
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value}
        />
        <code>{value.toUpperCase()}</code>
      </div>
    </label>
  );
}

function RangeControl({ label, value, min = 0, max = 80, step = 1, unit = "px", onChange }) {
  return (
    <label className="range-control">
      <span>
        {label}
        <output>
          {value}
          {unit}
        </output>
      </span>
      <div>
        <input
          aria-label={label}
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          step={step}
          type="range"
          value={value}
        />
        <input
          aria-label={`${label} value`}
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          step={step}
          type="number"
          value={value}
        />
      </div>
    </label>
  );
}

function StyleSection({ title, children }) {
  return (
    <section className="style-section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function InlineEditingNote() {
  return (
    <div className="inline-editing-note">
      <Type size={16} />
      <div>
        <strong>Edit text on the canvas</strong>
        <p>Click to type. Hover a field to remove it, then restore it here if needed.</p>
      </div>
    </div>
  );
}

function RichTextControls({ editorId }) {
  function format(command) {
    const selection = window.getSelection();
    const selectedNode = selection?.rangeCount
      ? selection.getRangeAt(0).commonAncestorContainer
      : null;
    const selectedElement =
      selectedNode?.nodeType === Node.ELEMENT_NODE
        ? selectedNode
        : selectedNode?.parentElement;
    const selectedEditorId =
      selectedElement
        ?.closest?.("[data-rich-text-editor-id]")
        ?.getAttribute("data-rich-text-editor-id") ||
      document.documentElement.dataset.activeRichTextEditorId ||
      editorId;

    window.dispatchEvent(
      new CustomEvent("brightletter:format-rich-text", {
        detail: { command, editorId: selectedEditorId },
      }),
    );
  }

  const controls = [
    { command: "paragraph", label: "Paragraph", icon: <Type size={13} /> },
    {
      command: "insertUnorderedList",
      label: "Bullets",
      icon: <List size={13} />,
    },
    {
      command: "insertOrderedList",
      label: "Numbers",
      icon: <ListOrdered size={13} />,
    },
    { command: "justifyLeft", label: "Left", icon: <AlignLeft size={13} /> },
    { command: "justifyCenter", label: "Center", icon: <AlignCenter size={13} /> },
    { command: "justifyRight", label: "Right", icon: <AlignRight size={13} /> },
    { command: "justifyFull", label: "Justify", icon: <AlignJustify size={13} /> },
  ];

  return (
    <div className="rich-text-controls">
      <span className="control-label">Format selected text</span>
      <div>
        {controls.map((control) => (
          <button
            key={control.command}
            onClick={() => format(control.command)}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            {control.icon}
            {control.label}
          </button>
        ))}
      </div>
      <p>Click or highlight text on the canvas, then choose a format. Lists and alignment apply to the selected field or selected lines.</p>
    </div>
  );
}

const restorableBlockFields = {
  header: [
    { key: "logoText", label: "Logo text", value: "SCHOOL NAME" },
    { key: "issue", label: "Issue label", value: "FAMILY UPDATE · THIS WEEK" },
  ],
  hero: [
    { key: "eyebrow", label: "Eyebrow", value: "SCHOOL SPOTLIGHT" },
    { key: "title", label: "Headline", value: "Add a strong headline" },
    { key: "body", label: "Body", value: "Add supporting details here." },
    { key: "buttonText", label: "Button", value: "Learn more" },
  ],
  text: [
    { key: "eyebrow", label: "Eyebrow", value: "SCHOOL UPDATE" },
    { key: "heading", label: "Heading", value: "Add a thoughtful heading" },
    { key: "body", label: "Body", value: "Add your message here." },
  ],
  image: [{ key: "caption", label: "Caption", value: "Add a photo caption." }],
  button: [{ key: "text", label: "Button label", value: "Learn more" }],
  columns: [{ key: "heading", label: "Section heading", value: "Explore more" }],
  calendar: [
    { key: "heading", label: "Calendar heading", value: "Important dates" },
    { key: "leftTitle", label: "First date", value: "01" },
    { key: "leftEyebrow", label: "First label", value: "UPCOMING" },
    { key: "leftBody", label: "First details", value: "Add event details" },
    { key: "rightTitle", label: "Second date", value: "02" },
    { key: "rightEyebrow", label: "Second label", value: "COMING SOON" },
    { key: "rightBody", label: "Second details", value: "Add event details" },
  ],
  footer: [
    { key: "schoolName", label: "School name", value: "School name" },
    { key: "address", label: "Address", value: "School address" },
    { key: "phone", label: "Phone", value: "(000) 000-0000" },
    { key: "website", label: "Website", value: "school.org" },
    {
      key: "preferencesText",
      label: "Preferences link",
      value: "Manage preferences",
      fallback: "Manage preferences",
    },
    {
      key: "unsubscribeText",
      label: "Unsubscribe link",
      value: "Unsubscribe",
      fallback: "Unsubscribe",
    },
  ],
};

const restorableColumnFields = {
  text: [
    { key: "eyebrow", label: "Eyebrow", value: "HIGHLIGHT" },
    { key: "heading", label: "Heading", value: "Add a heading" },
    { key: "body", label: "Body", value: "Add supporting text." },
  ],
  panel: [
    { key: "title", label: "Panel title", value: "Content panel" },
    { key: "badge", label: "Badge", value: "UPDATE" },
    { key: "body", label: "Body", value: "Add panel details." },
  ],
  image: [{ key: "caption", label: "Caption", value: "Add a photo caption." }],
  button: [{ key: "text", label: "Button label", value: "Learn more" }],
};

function AddRemovedFields({ fields = [], props, onRestore }) {
  const removed = fields.filter(({ fallback, key }) => {
    const value = props[key] ?? fallback ?? "";
    return !String(value).trim();
  });

  if (!removed.length) return null;

  return (
    <div className="restore-fields">
      <span className="control-label">Add removed fields</span>
      <div>
        {removed.map((field) => (
          <button
            key={field.key}
            onClick={() => onRestore(field.key, field.value)}
            type="button"
          >
            <Plus size={12} />
            {field.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MemoArraySettings({ props, update }) {
  function updateItem(key, index, value) {
    update(
      key,
      props[key].map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function removeItem(key, index) {
    update(
      key,
      props[key].filter((_, itemIndex) => itemIndex !== index),
    );
  }

  return (
    <div className="memo-array-settings">
      <div className="field-group-label">Notes for week</div>
      {props.notesForWeek.map((note, index) => (
        <div className="memo-setting-row" key={`note-setting-${index}`}>
          <Field
            label={`Note ${index + 1}`}
            multiline
            onChange={(value) => updateItem("notesForWeek", index, value)}
            value={note}
          />
          <button
            aria-label={`Remove note ${index + 1}`}
            onClick={() => removeItem("notesForWeek", index)}
            type="button"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        className="add-memo-row"
        onClick={() => update("notesForWeek", [...props.notesForWeek, "New weekly note"])}
        type="button"
      >
        <Plus size={13} />
        Add note
      </button>

      <div className="field-group-label">Staff absences</div>
      {props.staffAbsences.map((absence, index) => (
        <div className="memo-setting-card" key={`absence-setting-${index}`}>
          <button
            aria-label={`Remove absence ${index + 1}`}
            onClick={() => removeItem("staffAbsences", index)}
            type="button"
          >
            <Trash2 size={13} />
          </button>
          <Field
            label="Staff member"
            onChange={(value) =>
              updateItem("staffAbsences", index, { ...absence, name: value })
            }
            value={absence.name}
          />
          <Field
            label="Coverage / notes"
            onChange={(value) =>
              updateItem("staffAbsences", index, { ...absence, coverage: value })
            }
            value={absence.coverage}
          />
        </div>
      ))}
      <button
        className="add-memo-row"
        onClick={() =>
          update("staffAbsences", [
            ...props.staffAbsences,
            { name: "Staff member", coverage: "Coverage plan" },
          ])
        }
        type="button"
      >
        <Plus size={13} />
        Add absence
      </button>

      <div className="field-group-label">IEP meetings</div>
      {props.iepMeetings.map((meeting, index) => (
        <div className="memo-setting-card" key={`iep-setting-${index}`}>
          <button
            aria-label={`Remove IEP meeting ${index + 1}`}
            onClick={() => removeItem("iepMeetings", index)}
            type="button"
          >
            <Trash2 size={13} />
          </button>
          <Field
            label="Time"
            onChange={(value) =>
              updateItem("iepMeetings", index, { ...meeting, time: value })
            }
            value={meeting.time}
          />
          <Field
            label="Student / meeting"
            onChange={(value) =>
              updateItem("iepMeetings", index, { ...meeting, student: value })
            }
            value={meeting.student}
          />
          <Field
            label="Owner"
            onChange={(value) =>
              updateItem("iepMeetings", index, { ...meeting, owner: value })
            }
            value={meeting.owner}
          />
        </div>
      ))}
      <button
        className="add-memo-row"
        onClick={() =>
          update("iepMeetings", [
            ...props.iepMeetings,
            { time: "Time", student: "Student / meeting", owner: "Owner" },
          ])
        }
        type="button"
      >
        <Plus size={13} />
        Add IEP meeting
      </button>

      <div className="field-group-label">Important links</div>
      {props.importantLinks.map((link, index) => (
        <div className="memo-setting-card" key={`link-setting-${index}`}>
          <button
            aria-label={`Remove important link ${index + 1}`}
            onClick={() => removeItem("importantLinks", index)}
            type="button"
          >
            <Trash2 size={13} />
          </button>
          <Field
            label="Link label"
            onChange={(value) =>
              updateItem("importantLinks", index, { ...link, label: value })
            }
            value={link.label}
          />
          <Field
            label="URL"
            onChange={(value) =>
              updateItem("importantLinks", index, { ...link, url: value })
            }
            value={link.url}
          />
        </div>
      ))}
      <button
        className="add-memo-row"
        onClick={() =>
          update("importantLinks", [
            ...props.importantLinks,
            { label: "Important resource", url: "https://example.org" },
          ])
        }
        type="button"
      >
        <Plus size={13} />
        Add link
      </button>
    </div>
  );
}

function Inspector({ block, brand, onBrandChange, onBlockChange }) {
  if (!block) {
    return (
      <div className="empty-inspector">
        <MousePointerClick size={25} />
        <h3>Select a block</h3>
        <p>Choose any section in the email to edit its content and style.</p>
      </div>
    );
  }

  const p = block.props;
  const update = (key, value) => onBlockChange({ ...p, [key]: value });

  return (
    <div className="inspector-fields">
      <div className="inspector-heading">
        <span className="inspector-type-icon">
          {(() => {
            const Icon = iconMap[block.type];
            return <Icon size={16} />;
          })()}
        </span>
        <div>
          <p>{block.type} block</p>
          <h3>{blockCatalog.find((item) => item.type === block.type)?.label}</h3>
        </div>
      </div>

      {block.type === "header" && (
        <>
          <InlineEditingNote />
          <RichTextControls editorId={block.id} />
          <ImageSourceControl
            label="School logo"
            onChange={(value) => update("logoImage", value)}
            value={p.logoImage}
          />
          <Field label="Logo alt text" onChange={(value) => update("logoAlt", value)} value={p.logoAlt} />
        </>
      )}

      {block.type === "staffMemo" && (
        <>
          <InlineEditingNote />
          <RichTextControls editorId={block.id} />
          <ImageSourceControl
            label="Header image"
            onChange={(value) => update("headerImage", value)}
            value={p.headerImage}
          />
          <ImageSourceControl
            label="Schedule image"
            onChange={(value) => update("scheduleImage", value)}
            value={p.scheduleImage}
          />
          <ImageSourceControl
            label="Footer logo"
            onChange={(value) => update("footerLogo", value)}
            value={p.footerLogo}
          />
          <MemoArraySettings props={p} update={update} />
        </>
      )}

      {block.type === "hero" && (
        <>
          <InlineEditingNote />
          <RichTextControls editorId={block.id} />
          <Field label="Button URL" onChange={(value) => update("buttonUrl", value)} value={p.buttonUrl} />
          <ImageSourceControl
            label="Hero image"
            onChange={(value) => update("image", value)}
            value={p.image}
          />
        </>
      )}

      {block.type === "text" && (
        <>
          <InlineEditingNote />
          <RichTextControls editorId={block.id} />
        </>
      )}

      {block.type === "image" && (
        <>
          <ImageSourceControl
            onChange={(value) => update("src", value)}
            value={p.src}
          />
          <Field label="Alt text" onChange={(value) => update("alt", value)} value={p.alt} />
          <InlineEditingNote />
          <RichTextControls editorId={block.id} />
        </>
      )}

      {block.type === "button" && (
        <>
          <InlineEditingNote />
          <RichTextControls editorId={block.id} />
          <Field label="Destination URL" onChange={(value) => update("url", value)} value={p.url} />
        </>
      )}

      {block.type === "columns" && (
        <>
          <InlineEditingNote />
          <span className="control-label">Column widths</span>
          <Segmented
            onChange={(value) => update("ratio", value)}
            options={[
              { value: "50-50", label: "50 / 50" },
              { value: "33-67", label: "33 / 67" },
              { value: "67-33", label: "67 / 33" },
            ]}
            value={p.ratio}
          />
          {p.columns.map((column, index) => (
            <ColumnEditor
              column={column}
              index={index}
              key={column.id}
              onChange={(nextColumn) =>
                update(
                  "columns",
                  p.columns.map((item, columnIndex) =>
                    columnIndex === index ? nextColumn : item,
                  ),
                )
              }
            />
          ))}
        </>
      )}

      {block.type === "calendar" && (
        <>
          <InlineEditingNote />
          <RichTextControls editorId={block.id} />
        </>
      )}

      {block.type === "divider" && (
        <label className="field color-field">
          <span>Divider color</span>
          <div>
            <input
              onChange={(event) => update("color", event.target.value)}
              type="color"
              value={p.color}
            />
            <code>{p.color}</code>
          </div>
        </label>
      )}

      {block.type === "spacer" && (
        <Field
          label="Height in pixels"
          onChange={(value) => update("height", value)}
          type="number"
          value={p.height}
        />
      )}

      {block.type === "footer" && (
        <>
          <InlineEditingNote />
          <RichTextControls editorId={block.id} />
          <ImageSourceControl
            label="Footer logo"
            onChange={(value) => update("logoImage", value)}
            value={p.logoImage}
          />
          <Field
            label="Logo alt text"
            onChange={(value) => update("logoAlt", value)}
            value={p.logoAlt}
          />
        </>
      )}

      <AddRemovedFields
        fields={restorableBlockFields[block.type]}
        onRestore={update}
        props={p}
      />

      <div className="brand-quick-edit">
        <p>
          <Palette size={14} />
          Brand defaults
        </p>
        <GlobalTypographyControls
          brand={brand}
          onBrandChange={onBrandChange}
        />
        <div className="color-pair">
          <label title="Primary color">
            <input
              onChange={(event) => onBrandChange("primaryColor", event.target.value)}
              type="color"
              value={brand.primaryColor}
            />
            Primary
          </label>
          <label title="Accent color">
            <input
              onChange={(event) => onBrandChange("accentColor", event.target.value)}
              type="color"
              value={brand.accentColor}
            />
            Accent
          </label>
        </div>
      </div>
    </div>
  );
}

function StyleInspector({
  block,
  brand,
  onBlockChange,
  onBlockStyleChange,
  onBrandChange,
}) {
  if (!block) {
    return (
      <div className="empty-inspector">
        <Palette size={25} />
        <h3>Select a block</h3>
        <p>Choose a section to adjust its colors, spacing, typography, and shape.</p>
      </div>
    );
  }

  const style = getBlockStyle(block, brand);
  const update = (key, value) =>
    onBlockStyleChange({ ...(block.blockStyle ?? {}), [key]: value });
  const updateProp = (key, value) =>
    onBlockChange({ ...block.props, [key]: value });
  const Icon = iconMap[block.type];
  const hasSpacing = block.type !== "spacer";
  const hasText = !["divider", "spacer"].includes(block.type);

  return (
    <div className="inspector-fields style-inspector">
      <div className="inspector-heading">
        <span className="inspector-type-icon">
          <Icon size={16} />
        </span>
        <div>
          <p>{block.type} block</p>
          <h3>{blockCatalog.find((item) => item.type === block.type)?.label} style</h3>
        </div>
        <button
          className="reset-style"
          onClick={() => onBlockStyleChange({})}
          title="Reset block style"
          type="button"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      <StyleSection title="Surface">
        <ColorControl
          label="Background"
          onChange={(value) => update("backgroundColor", value)}
          value={style.backgroundColor}
        />
        {block.type === "divider" && (
          <ColorControl
            label="Divider"
            onChange={(value) => updateProp("color", value)}
            value={block.props.color}
          />
        )}
      </StyleSection>

      {hasText && (
        <StyleSection title="Text defaults">
          <SelectControl
            label="Block font"
            onChange={(value) => update("fontFamily", value)}
            options={emailFontOptions}
            value={style.fontFamily}
          />
          <RangeControl
            label="Letter spacing"
            max={6}
            min={-1}
            onChange={(value) => update("letterSpacing", value)}
            step={0.1}
            value={style.letterSpacing}
          />
        </StyleSection>
      )}

      {hasSpacing && (
        <StyleSection title="Spacing">
          <RangeControl
            label="Top"
            max={96}
            onChange={(value) => update("paddingTop", value)}
            value={style.paddingTop}
          />
          <RangeControl
            label="Bottom"
            max={96}
            onChange={(value) => update("paddingBottom", value)}
            value={style.paddingBottom}
          />
          <RangeControl
            label="Sides"
            max={72}
            onChange={(value) => update("paddingX", value)}
            value={style.paddingX}
          />
        </StyleSection>
      )}

      {block.type === "header" && (
        <StyleSection title="Header">
          <ColorControl
            label="Logo"
            onChange={(value) => update("logoColor", value)}
            value={style.logoColor}
          />
          <ColorControl
            label="Issue text"
            onChange={(value) => update("issueColor", value)}
            value={style.issueColor}
          />
          <RangeControl
            label="Logo size"
            min={12}
            max={32}
            onChange={(value) => update("logoSize", value)}
            value={style.logoSize}
          />
          <RangeControl
            label="Logo image width"
            min={24}
            max={140}
            onChange={(value) => update("logoWidth", value)}
            value={style.logoWidth}
          />
        </StyleSection>
      )}

      {block.type === "hero" && (
        <>
          <StyleSection title="Typography">
            <ColorControl
              label="Headline"
              onChange={(value) => update("headingColor", value)}
              value={style.headingColor}
            />
            <ColorControl
              label="Body"
              onChange={(value) => update("bodyColor", value)}
              value={style.bodyColor}
            />
            <RangeControl
              label="Headline size"
              min={22}
              max={52}
              onChange={(value) => update("headingSize", value)}
              value={style.headingSize}
            />
            <RangeControl
              label="Body size"
              min={11}
              max={22}
              onChange={(value) => update("bodySize", value)}
              value={style.bodySize}
            />
          </StyleSection>
          <StyleSection title="Image">
            <RangeControl
              label="Image height"
              min={140}
              max={420}
              onChange={(value) => update("imageHeight", value)}
              value={style.imageHeight}
            />
          </StyleSection>
          <StyleSection title="Call to action">
            <ColorControl
              label="Button"
              onChange={(value) => update("buttonColor", value)}
              value={style.buttonColor}
            />
            <ColorControl
              label="Button text"
              onChange={(value) => update("buttonTextColor", value)}
              value={style.buttonTextColor}
            />
            <RangeControl
              label="Corner radius"
              max={24}
              onChange={(value) => update("buttonRadius", value)}
              value={style.buttonRadius}
            />
          </StyleSection>
        </>
      )}

      {block.type === "staffMemo" && (
        <>
          <StyleSection title="Memo typography">
            <ColorControl
              label="Headings"
              onChange={(value) => update("headingColor", value)}
              value={style.headingColor}
            />
            <ColorControl
              label="Body"
              onChange={(value) => update("bodyColor", value)}
              value={style.bodyColor}
            />
            <RangeControl
              label="Memo title size"
              min={20}
              max={44}
              onChange={(value) => update("headingSize", value)}
              value={style.headingSize}
            />
            <RangeControl
              label="Body size"
              min={10}
              max={20}
              onChange={(value) => update("bodySize", value)}
              value={style.bodySize}
            />
          </StyleSection>
          <StyleSection title="Logistics panels">
            <ColorControl
              label="Panel background"
              onChange={(value) => update("panelBackgroundColor", value)}
              value={style.panelBackgroundColor}
            />
            <ColorControl
              label="Panel border"
              onChange={(value) => update("panelBorderColor", value)}
              value={style.panelBorderColor}
            />
            <RangeControl
              label="Corner radius"
              max={24}
              onChange={(value) => update("cardRadius", value)}
              value={style.cardRadius}
            />
            <RangeControl
              label="Column gap"
              max={32}
              onChange={(value) => update("gap", value)}
              value={style.gap}
            />
          </StyleSection>
        </>
      )}

      {block.type === "text" && (
        <StyleSection title="Typography">
          <ColorControl
            label="Heading"
            onChange={(value) => update("headingColor", value)}
            value={style.headingColor}
          />
          <ColorControl
            label="Body"
            onChange={(value) => update("bodyColor", value)}
            value={style.bodyColor}
          />
          <RangeControl
            label="Heading size"
            min={16}
            max={42}
            onChange={(value) => update("headingSize", value)}
            value={style.headingSize}
          />
          <RangeControl
            label="Body size"
            min={11}
            max={22}
            onChange={(value) => update("bodySize", value)}
            value={style.bodySize}
          />
        </StyleSection>
      )}

      {block.type === "image" && (
        <StyleSection title="Image">
          <RangeControl
            label="Corner radius"
            max={32}
            onChange={(value) => update("borderRadius", value)}
            value={style.borderRadius}
          />
          <ColorControl
            label="Caption"
            onChange={(value) => update("captionColor", value)}
            value={style.captionColor}
          />
          <RangeControl
            label="Caption size"
            min={8}
            max={18}
            onChange={(value) => update("captionSize", value)}
            value={style.captionSize}
          />
        </StyleSection>
      )}

      {block.type === "button" && (
        <>
          <StyleSection title="Button">
            <ColorControl
              label="Button"
              onChange={(value) => update("buttonColor", value)}
              value={style.buttonColor}
            />
            <ColorControl
              label="Text"
              onChange={(value) => update("textColor", value)}
              value={style.textColor}
            />
            <RangeControl
              label="Corner radius"
              max={28}
              onChange={(value) => update("borderRadius", value)}
              value={style.borderRadius}
            />
            <RangeControl
              label="Font size"
              min={10}
              max={20}
              onChange={(value) => update("fontSize", value)}
              value={style.fontSize}
            />
            <RangeControl
              label="Horizontal padding"
              max={40}
              onChange={(value) => update("innerPaddingX", value)}
              value={style.innerPaddingX}
            />
            <RangeControl
              label="Vertical padding"
              max={24}
              onChange={(value) => update("innerPaddingY", value)}
              value={style.innerPaddingY}
            />
          </StyleSection>
          <StyleSection title="Placement">
            <Segmented
              onChange={(value) => updateProp("align", value)}
              options={[
                { value: "left", label: "Left", icon: <AlignLeft size={14} /> },
                { value: "center", label: "Center", icon: <AlignCenter size={14} /> },
              ]}
              value={block.props.align}
            />
          </StyleSection>
        </>
      )}

      {block.type === "columns" && (
        <>
          <StyleSection title="Typography">
            <ColorControl
              label="Heading"
              onChange={(value) => update("headingColor", value)}
              value={style.headingColor}
            />
            <ColorControl
              label="Content"
              onChange={(value) => update("bodyColor", value)}
              value={style.bodyColor}
            />
            <RangeControl
              label="Heading size"
              min={16}
              max={36}
              onChange={(value) => update("headingSize", value)}
              value={style.headingSize}
            />
          </StyleSection>
          <StyleSection title="Columns">
            <ColorControl
              label="Column background"
              onChange={(value) => update("columnBackgroundColor", value)}
              value={style.columnBackgroundColor}
            />
            <ColorControl
              label="Column border"
              onChange={(value) => update("columnBorderColor", value)}
              value={style.columnBorderColor}
            />
            <RangeControl
              label="Corner radius"
              max={24}
              onChange={(value) => update("columnRadius", value)}
              value={style.columnRadius}
            />
            <RangeControl
              label="Gap"
              max={32}
              onChange={(value) => update("gap", value)}
              value={style.gap}
            />
          </StyleSection>
        </>
      )}

      {block.type === "calendar" && (
        <>
          <StyleSection title="Typography">
            <ColorControl
              label="Heading"
              onChange={(value) => update("headingColor", value)}
              value={style.headingColor}
            />
            <ColorControl
              label="Dates"
              onChange={(value) => update("dateColor", value)}
              value={style.dateColor}
            />
            <ColorControl
              label="Details"
              onChange={(value) => update("bodyColor", value)}
              value={style.bodyColor}
            />
            <RangeControl
              label="Heading size"
              min={16}
              max={36}
              onChange={(value) => update("headingSize", value)}
              value={style.headingSize}
            />
          </StyleSection>
          <StyleSection title="Cards">
            <ColorControl
              label="Card background"
              onChange={(value) => update("cardBackgroundColor", value)}
              value={style.cardBackgroundColor}
            />
            <ColorControl
              label="Card border"
              onChange={(value) => update("cardBorderColor", value)}
              value={style.cardBorderColor}
            />
            <RangeControl
              label="Corner radius"
              max={24}
              onChange={(value) => update("cardRadius", value)}
              value={style.cardRadius}
            />
          </StyleSection>
        </>
      )}

      {block.type === "divider" && (
        <StyleSection title="Line">
          <RangeControl
            label="Thickness"
            min={1}
            max={8}
            onChange={(value) => update("thickness", value)}
            value={style.thickness}
          />
        </StyleSection>
      )}

      {block.type === "spacer" && (
        <StyleSection title="Space">
          <RangeControl
            label="Height"
            min={8}
            max={160}
            onChange={(value) => updateProp("height", value)}
            value={block.props.height}
          />
        </StyleSection>
      )}

      {block.type === "footer" && (
        <>
          <StyleSection title="Typography">
            <ColorControl
              label="School name"
              onChange={(value) => update("headingColor", value)}
              value={style.headingColor}
            />
            <ColorControl
              label="Details"
              onChange={(value) => update("bodyColor", value)}
              value={style.bodyColor}
            />
            <RangeControl
              label="School name size"
              min={10}
              max={24}
              onChange={(value) => update("headingSize", value)}
              value={style.headingSize}
            />
            <RangeControl
              label="Details size"
              min={8}
              max={18}
              onChange={(value) => update("bodySize", value)}
              value={style.bodySize}
            />
          </StyleSection>
        </>
      )}

      <StyleSection title="Brand defaults">
        <GlobalTypographyControls
          brand={brand}
          onBrandChange={onBrandChange}
        />
        <div className="color-pair">
          <label title="Primary color">
            <input
              onChange={(event) => onBrandChange("primaryColor", event.target.value)}
              type="color"
              value={brand.primaryColor}
            />
            Primary
          </label>
          <label title="Accent color">
            <input
              onChange={(event) => onBrandChange("accentColor", event.target.value)}
              type="color"
              value={brand.accentColor}
            />
            Accent
          </label>
        </div>
      </StyleSection>
    </div>
  );
}

function PreviewModal({ design, html, mjml, initialTab, onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [device, setDevice] = useState("desktop");

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="preview-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="modal-kicker">Previewing</span>
            <h2>{design.name}</h2>
          </div>
          <div className="modal-tabs">
            <button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")} type="button">
              <Eye size={15} />
              Preview
            </button>
            <button className={tab === "html" ? "active" : ""} onClick={() => setTab("html")} type="button">
              <Code2 size={15} />
              HTML
            </button>
            <button className={tab === "json" ? "active" : ""} onClick={() => setTab("json")} type="button">
              <FileText size={15} />
              JSON
            </button>
            <button className={tab === "mjml" ? "active" : ""} onClick={() => setTab("mjml")} type="button">
              <Blocks size={15} />
              MJML
            </button>
          </div>
          <button aria-label="Close preview" className="icon-button" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        {tab === "preview" ? (
          <div className="modal-preview-area">
            <div className="preview-device-switch">
              <button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} type="button">
                <Monitor size={15} />
                Desktop
              </button>
              <button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} type="button">
                <Smartphone size={15} />
                Mobile
              </button>
            </div>
            <div className={`iframe-shell ${device}`}>
              <iframe srcDoc={html} title={`${device} email preview`} />
            </div>
          </div>
        ) : (
          <pre className="code-preview">
            <code>
              {tab === "json"
                ? JSON.stringify(design, null, 2)
                : tab === "mjml"
                  ? mjml
                  : html}
            </code>
          </pre>
        )}
      </section>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast">
      <span>
        <Check size={14} />
      </span>
      {message}
    </div>
  );
}

export default function EmailBuilder() {
  const [design, setDesign] = useState(() => {
    try {
      const saved = localStorage.getItem("northstar-email-design");
      return saved ? migrateDesign(JSON.parse(saved)) : cloneStarter();
    } catch {
      return cloneStarter();
    }
  });
  const [selectedId, setSelectedId] = useState("hero-1");
  const [activeDrag, setActiveDrag] = useState(null);
  const [libraryTab, setLibraryTab] = useState("blocks");
  const [canvasDevice, setCanvasDevice] = useState("desktop");
  const [inspectorTab, setInspectorTab] = useState("style");
  const [modalTab, setModalTab] = useState(null);
  const [toast, setToast] = useState("");
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth > 900);
  const [rightOpen, setRightOpen] = useState(() => window.innerWidth > 900);
  const moreMenuRef = useRef(null);
  const projectMenuRef = useRef(null);
  const designRef = useRef(design);
  const historyRef = useRef(history);
  const { setNodeRef: setCanvasRef, isOver } = useDroppable({ id: "email-canvas" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedBlock = design.blocks.find((block) => block.id === selectedId);
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const [compiled, setCompiled] = useState({
    html: "",
    errors: [],
    mjml: "",
    isCompiling: true,
  });

  useLayoutEffect(() => {
    designRef.current = design;
  }, [design]);

  const setDesignWithoutHistory = useCallback((nextDesign) => {
    designRef.current = nextDesign;
    setDesign(nextDesign);
  }, []);

  const updateHistory = useCallback((nextHistory) => {
    historyRef.current = nextHistory;
    setHistory(nextHistory);
  }, []);

  const commitDesignChange = useCallback((updater) => {
    const current = designRef.current;
    const next =
      typeof updater === "function" ? updater(current) : updater;

    if (!next || JSON.stringify(current) === JSON.stringify(next)) {
      return current;
    }

    updateHistory({
      past: [...historyRef.current.past, current].slice(-50),
      future: [],
    });
    designRef.current = next;
    setDesign(next);
    return next;
  }, [updateHistory]);

  useEffect(() => {
    let cancelled = false;
    setCompiled((current) => ({ ...current, isCompiling: true }));

    compileDesign(synchronizeDesignFields(design))
      .then((result) => {
        if (!cancelled) setCompiled({ ...result, isCompiling: false });
      })
      .catch((error) => {
        if (!cancelled) {
          setCompiled({
            html: `<html><body><p>Email preview error: ${error.message}</p></body></html>`,
            errors: [error],
            mjml: "",
            isCompiling: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [design]);

  useEffect(() => {
    let cancelled = false;

    loadSavedTemplates().then(async (records) => {
      let nextRecords = records;
      if (!nextRecords.length) {
        try {
          const legacy = localStorage.getItem("northstar-email-design");
          if (legacy) {
            const migrated = createSavedTemplateRecord(
              migrateDesign(JSON.parse(legacy)),
            );
            await saveTemplateRecord(migrated);
            nextRecords = [migrated];
          }
        } catch {
          // A malformed legacy draft should not prevent the template library.
        }
      }

      if (!cancelled) {
        setSavedTemplates(
          nextRecords.map((record) => ({
            ...record,
            design: migrateDesign(record.design),
            isSaved: true,
          })),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function flash(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  const undoDesign = useCallback(() => {
    const currentHistory = historyRef.current;
    if (!currentHistory.past.length) return;

    const current = designRef.current;
    const previous = currentHistory.past[currentHistory.past.length - 1];
    updateHistory({
      past: currentHistory.past.slice(0, -1),
      future: [current, ...currentHistory.future].slice(0, 50),
    });
    designRef.current = previous;
    setDesign(previous);
    setSelectedId((currentSelectedId) =>
      previous.blocks.some((block) => block.id === currentSelectedId)
        ? currentSelectedId
        : previous.blocks[0]?.id ?? null,
    );
    flash("Undo");
  }, [updateHistory]);

  const redoDesign = useCallback(() => {
    const currentHistory = historyRef.current;
    if (!currentHistory.future.length) return;

    const current = designRef.current;
    const next = currentHistory.future[0];
    updateHistory({
      past: [...currentHistory.past, current].slice(-50),
      future: currentHistory.future.slice(1),
    });
    designRef.current = next;
    setDesign(next);
    setSelectedId((currentSelectedId) =>
      next.blocks.some((block) => block.id === currentSelectedId)
        ? currentSelectedId
        : next.blocks[0]?.id ?? null,
    );
    flash("Redo");
  }, [updateHistory]);

  useEffect(() => {
    function handleHistoryShortcut(event) {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undoDesign();
      }
      if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redoDesign();
      }
    }

    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [undoDesign, redoDesign]);

  function addBlock(type, index = design.blocks.length) {
    const block = createBlock(type);
    commitDesignChange((current) => {
      const blocks = [...current.blocks];
      blocks.splice(index, 0, block);
      return { ...current, blocks, updatedAt: "Just now" };
    });
    setSelectedId(block.id);
    if (window.innerWidth <= 900) {
      setLeftOpen(false);
      setRightOpen(true);
    }
  }

  function updateBlock(props) {
    commitDesignChange((current) => {
      const selected = current.blocks.find((block) => block.id === selectedId);
      return {
        ...current,
        ...(selected?.type === "staffMemo" ? { fields: props } : {}),
        blocks: current.blocks.map((block) =>
          block.id === selectedId ? { ...block, props } : block,
        ),
        updatedAt: "Just now",
      };
    });
  }

  function updateBlockStyle(blockStyle) {
    commitDesignChange((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === selectedId ? { ...block, blockStyle } : block,
      ),
      updatedAt: "Just now",
    }));
  }

  function updateBrand(key, value) {
    commitDesignChange((current) => ({
      ...current,
      brand: { ...current.brand, [key]: value },
      updatedAt: "Just now",
    }));
  }

  function deleteBlock(id) {
    commitDesignChange((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== id),
      updatedAt: "Just now",
    }));
    if (selectedId === id) setSelectedId(null);
  }

  function duplicateBlock(id) {
    commitDesignChange((current) => {
      const index = current.blocks.findIndex((block) => block.id === id);
      const source = current.blocks[index];
      const copy = {
        ...JSON.parse(JSON.stringify(source)),
        id: `${source.type}-${crypto.randomUUID()}`,
      };
      if (copy.type === "columns") {
        copy.props.columns = copy.props.columns.map((column) => ({
          ...column,
          id: `column-${crypto.randomUUID()}`,
          blocks: column.blocks.map((content) => ({
            ...content,
            id: `column-${content.type}-${crypto.randomUUID()}`,
          })),
        }));
      }
      const blocks = [...current.blocks];
      blocks.splice(index + 1, 0, copy);
      setSelectedId(copy.id);
      return { ...current, blocks, updatedAt: "Just now" };
    });
  }

  function onDragEnd({ active, over }) {
    setActiveDrag(null);
    if (!over) return;

    if (String(active.id).startsWith("new:")) {
      const type = String(active.id).replace("new:", "");
      const index = design.blocks.findIndex((block) => block.id === over.id);
      addBlock(type, index >= 0 ? index : design.blocks.length);
      return;
    }

    if (active.id !== over.id) {
      commitDesignChange((current) => {
        const oldIndex = current.blocks.findIndex((block) => block.id === active.id);
        const newIndex =
          over.id === "email-canvas"
            ? current.blocks.length - 1
            : current.blocks.findIndex((block) => block.id === over.id);
        return {
          ...current,
          blocks: arrayMove(current.blocks, oldIndex, newIndex),
          updatedAt: "Just now",
        };
      });
    }
  }

  async function saveDesign() {
    const synchronized = synchronizeDesignFields(design);
    const record = createSavedTemplateRecord(synchronized, { forceNewId: true });

    setIsSaving(true);
    try {
      await saveTemplateRecord(record);
      setDesignWithoutHistory(record.design);
      setSavedTemplates((current) => [
        record,
        ...current,
      ]);
      try {
        localStorage.setItem(
          "northstar-email-design",
          JSON.stringify(record.design),
        );
      } catch {
        // IndexedDB remains the durable template copy when localStorage is full.
      }
      flash("New template saved");
    } catch (error) {
      flash(error.message || "Template could not be saved");
    } finally {
      setIsSaving(false);
    }
  }

  async function renameSavedTemplate(template, nextName) {
    const cleanName = nextName.trim();
    if (!cleanName || cleanName === template.name) return;

    const renamed = {
      ...template,
      name: cleanName,
      design: {
        ...template.design,
        name: cleanName,
        updatedAt: "Just now",
      },
    };

    await saveTemplateRecord(renamed);
    setSavedTemplates((current) =>
      current.map((item) => (item.id === template.id ? renamed : item)),
    );

    if (designRef.current.id === template.id) {
      setDesignWithoutHistory({
        ...designRef.current,
        name: cleanName,
        updatedAt: "Just now",
      });
    }

    flash("Template renamed");
  }

  function downloadFile(contents, extension, type) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${design.name.toLowerCase().replaceAll(" ", "-")}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
    flash(`${extension.toUpperCase()} exported`);
  }

  function exportDesignJson() {
    downloadFile(
      JSON.stringify(synchronizeDesignFields(design), null, 2),
      "json",
      "application/json",
    );
  }

  function duplicateDesign() {
    const copy = migrateDesign(JSON.parse(JSON.stringify(design)));
    copy.id = `template-${crypto.randomUUID()}`;
    copy.name = `Copy of ${design.name}`;
    copy.updatedAt = "Just now";
    commitDesignChange(copy);
    setSelectedId(copy.blocks[0]?.id ?? null);
    setInspectorTab("content");
    flash("Email duplicated");
  }

  function startFresh() {
    if (!window.confirm("Start a new email and replace the current canvas?")) {
      return;
    }

    const next = cloneStarter();
    next.id = `template-${crypto.randomUUID()}`;
    next.updatedAt = "Just now";
    commitDesignChange(next);
    setSelectedId(next.blocks[0]?.id ?? null);
    setInspectorTab("content");
    flash("Fresh email started");
  }

  async function deleteSavedTemplate(template) {
    if (!window.confirm(`Delete "${template.name}" from My templates?`)) {
      return;
    }

    await deleteTemplateRecord(template.id);
    setSavedTemplates((current) => current.filter((item) => item.id !== template.id));

    if (design.id === template.id) {
      const unsaved = {
        ...migrateDesign(JSON.parse(JSON.stringify(design))),
        id: `template-${crypto.randomUUID()}`,
        updatedAt: "Just now",
      };
      setDesignWithoutHistory(unsaved);
      try {
        localStorage.setItem("northstar-email-design", JSON.stringify(unsaved));
      } catch {
        // Keeping the canvas live matters more than local draft mirroring.
      }
      flash("Saved template deleted; current canvas kept");
      return;
    }

    flash("Saved template deleted");
  }

  async function archiveCurrentDesign() {
    if (!window.confirm(`Archive "${design.name}" and remove it from open designs?`)) {
      return;
    }

    await deleteTemplateRecord(design.id);
    const remaining = savedTemplates.filter((item) => item.id !== design.id);
    setSavedTemplates(remaining);

    const next = remaining[0]?.design
      ? migrateDesign(remaining[0].design)
      : cloneStarter();
    setDesignWithoutHistory(next);
    setSelectedId(next.blocks[0]?.id ?? null);
    setInspectorTab("content");
    try {
      if (remaining[0]?.design) {
        localStorage.setItem("northstar-email-design", JSON.stringify(next));
      } else {
        localStorage.removeItem("northstar-email-design");
      }
    } catch {
      // Storage cleanup should not block archiving in the UI.
    }
    flash("Design archived");
  }

  function runMoreAction(action) {
    setMoreMenuOpen(false);
    action();
  }

  function applyTemplate(template) {
    const next = template.design ? migrateDesign(template.design) : cloneStarter();
    if (!template.isSaved) {
      next.id = `template-${crypto.randomUUID()}`;
      next.templateKey = template.key;
    }
    if (!template.design) {
      next.name = template.name;
      next.brand.primaryColor = template.color;
      next.brand.accentColor = template.accent;
      if (template.name === "Event Invite") {
        next.subject = "You’re invited: Northstar Spring Arts Night";
        next.blocks.find((block) => block.type === "hero").props.title =
          "An evening made by bright young minds.";
      }
      if (template.name === "Attendance Nudge") {
        next.subject = "Every school day is a chance to grow";
        next.blocks.find((block) => block.type === "hero").props.title =
          "Every day together makes a difference.";
      }
    }
    commitDesignChange(next);
    setSelectedId(next.blocks[0]?.id ?? null);
    setInspectorTab(template.design ? "content" : "style");
    setLibraryTab("blocks");
    flash(`${template.name} loaded`);
  }

  useEffect(() => {
    const listener = (event) => addBlock(event.detail);
    window.addEventListener("add-email-block", listener);
    return () => window.removeEventListener("add-email-block", listener);
  }, [design.blocks.length]);

  useEffect(() => {
    function closeMoreMenu(event) {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (
        event.type === "pointerdown" &&
        moreMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      setMoreMenuOpen(false);
    }

    if (!moreMenuOpen) return undefined;
    document.addEventListener("pointerdown", closeMoreMenu);
    document.addEventListener("keydown", closeMoreMenu);
    return () => {
      document.removeEventListener("pointerdown", closeMoreMenu);
      document.removeEventListener("keydown", closeMoreMenu);
    };
  }, [moreMenuOpen]);

  useEffect(() => {
    function closeProjectMenu(event) {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (
        event.type === "pointerdown" &&
        projectMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      setProjectMenuOpen(false);
    }

    if (!projectMenuOpen) return undefined;
    document.addEventListener("pointerdown", closeProjectMenu);
    document.addEventListener("keydown", closeProjectMenu);
    return () => {
      document.removeEventListener("pointerdown", closeProjectMenu);
      document.removeEventListener("keydown", closeProjectMenu);
    };
  }, [projectMenuOpen]);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragCancel={() => setActiveDrag(null)}
      onDragEnd={onDragEnd}
      onDragStart={({ active }) => setActiveDrag(active.id)}
      sensors={sensors}
    >
      <div className="builder-app">
        <header className="topbar">
          <div className="brand-mark">
            <div className="brand-symbol">
              <span />
              <span />
              <span />
            </div>
            <strong>Brightletter</strong>
          </div>

          <div className="document-title" ref={projectMenuRef}>
            <button className="mobile-only icon-button" onClick={() => setLeftOpen(!leftOpen)} type="button">
              <Menu size={18} />
            </button>
            <div>
              <input
                aria-label="Template name"
                onChange={(event) =>
                  commitDesignChange((current) => ({
                    ...current,
                    name: event.target.value,
                    updatedAt: "Just now",
                  }))
                }
                value={design.name}
              />
              <span>Saved {design.updatedAt}</span>
            </div>
            <button
              aria-expanded={projectMenuOpen}
              aria-haspopup="menu"
              aria-label="Open projects"
              className="document-switcher"
              onClick={(event) => {
                event.stopPropagation();
                setProjectMenuOpen((open) => !open);
              }}
              type="button"
            >
              <ChevronDown size={14} />
            </button>
            {projectMenuOpen && (
              <div className="project-menu" role="menu">
                <div className="project-menu-heading">
                  <strong>Open designs</strong>
                  <span>{savedTemplates.length} saved</span>
                </div>
                <button
                  className="project-menu-current"
                  onClick={() => setProjectMenuOpen(false)}
                  role="menuitem"
                  type="button"
                >
                  <FileText size={14} />
                  <span>
                    <strong>{design.name}</strong>
                    <small>Current canvas</small>
                  </span>
                </button>
                <span aria-hidden="true" className="more-actions-divider" />
                {savedTemplates.length ? (
                  savedTemplates.map((template) => (
                    <button
                      className={template.id === design.id ? "active" : ""}
                      key={template.id}
                      onClick={() => {
                        setProjectMenuOpen(false);
                        applyTemplate(template);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <LayoutTemplate size={14} />
                      <span>
                        <strong>{template.name}</strong>
                        <small>{template.id === design.id ? "Open now" : "Saved design"}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p>No saved designs yet. Save this email to keep it in the switcher.</p>
                )}
              </div>
            )}
          </div>

          <div className="topbar-tools">
            <div className="history-tools">
              <button
                aria-label="Undo"
                className="icon-button muted"
                disabled={!canUndo}
                onClick={undoDesign}
                title="Undo"
                type="button"
              >
                <Undo2 size={17} />
              </button>
              <button
                aria-label="Redo"
                className="icon-button muted"
                disabled={!canRedo}
                onClick={redoDesign}
                title="Redo"
                type="button"
              >
                <Redo2 size={17} />
              </button>
            </div>
            <button className="button ghost" onClick={() => setModalTab("preview")} type="button">
              <Eye size={16} />
              Preview
            </button>
            <button
              className="button ghost export-button"
              disabled={compiled.isCompiling}
              onClick={() => downloadFile(compiled.html, "html", "text/html")}
              type="button"
            >
              <Download size={16} />
              Export
            </button>
            <button
              className="button primary"
              disabled={isSaving}
              onClick={saveDesign}
              type="button"
            >
              <Save size={16} />
              {isSaving ? "Saving…" : "Save"}
            </button>
            <div className="more-actions" ref={moreMenuRef}>
              <button
                aria-expanded={moreMenuOpen}
                aria-haspopup="menu"
                aria-label="More actions"
                className="icon-button"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setMoreMenuOpen((open) => !open);
                }}
                type="button"
              >
                <MoreHorizontal size={18} />
              </button>
              {moreMenuOpen && (
                <div className="more-actions-menu" role="menu">
                  <button onClick={() => runMoreAction(() => setModalTab("preview"))} role="menuitem" type="button">
                    <Eye size={14} />
                    Preview email
                  </button>
                  <button onClick={() => runMoreAction(saveDesign)} role="menuitem" type="button">
                    <Save size={14} />
                    Save to My templates
                  </button>
                  <button onClick={() => runMoreAction(duplicateDesign)} role="menuitem" type="button">
                    <Copy size={14} />
                    Duplicate this email
                  </button>
                  <span aria-hidden="true" className="more-actions-divider" />
                  <button
                    disabled={compiled.isCompiling}
                    onClick={() => runMoreAction(() => downloadFile(compiled.html, "html", "text/html"))}
                    role="menuitem"
                    type="button"
                  >
                    <Download size={14} />
                    Export HTML
                  </button>
                  <button onClick={() => runMoreAction(exportDesignJson)} role="menuitem" type="button">
                    <Code2 size={14} />
                    Export design JSON
                  </button>
                  <span aria-hidden="true" className="more-actions-divider" />
                  <button
                    onClick={() =>
                      runMoreAction(() => {
                        setLibraryTab("templates");
                        setLeftOpen(true);
                      })
                    }
                    role="menuitem"
                    type="button"
                  >
                    <LayoutTemplate size={14} />
                    Open templates
                  </button>
                  <button className="danger" onClick={() => runMoreAction(archiveCurrentDesign)} role="menuitem" type="button">
                    <Archive size={14} />
                    Archive current design
                  </button>
                  <button className="danger" onClick={() => runMoreAction(startFresh)} role="menuitem" type="button">
                    <RotateCcw size={14} />
                    Start fresh
                  </button>
                </div>
              )}
            </div>
            <div className="avatar">MP</div>
          </div>
        </header>

        <main
          className={`workspace ${!leftOpen ? "left-closed" : ""} ${!rightOpen ? "right-closed" : ""}`}
        >
          <aside className="left-panel">
            <div className="panel-top">
              <div className="panel-tabs">
                <button className={libraryTab === "blocks" ? "active" : ""} onClick={() => setLibraryTab("blocks")} type="button">
                  <Blocks size={15} />
                  Blocks
                </button>
                <button className={libraryTab === "templates" ? "active" : ""} onClick={() => setLibraryTab("templates")} type="button">
                  <LayoutTemplate size={15} />
                  Templates
                </button>
              </div>
              <button aria-label="Close block library" className="panel-close" onClick={() => setLeftOpen(false)} type="button">
                <PanelLeftClose size={16} />
              </button>
            </div>

            {libraryTab === "blocks" ? (
              <div className="block-library">
                <div className="library-heading">
                  <div>
                    <h2>Content blocks</h2>
                    <p>Drag a block into your email</p>
                  </div>
                  <Plus size={15} />
                </div>
                <div className="palette-grid">
                  {blockCatalog.map((item) => (
                    <PaletteBlock item={item} key={item.type} />
                  ))}
                </div>
                <div className="tip-card">
                  <span>
                    <Send size={15} />
                  </span>
                  <div>
                    <strong>Built for inboxes</strong>
                    <p>Every block exports as responsive, email-safe HTML.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="template-library">
                <div className="library-heading saved-library-heading">
                  <div>
                    <h2>My templates</h2>
                    <p>Your saved and editable layouts</p>
                  </div>
                  <span>{savedTemplates.length}</span>
                </div>
                {savedTemplates.length ? (
                  savedTemplates.map((template) => (
                    <div
                      className="template-card saved-template-card"
                      key={template.id}
                    >
                      <div className="saved-template-open">
                        <button
                          aria-label={`Open ${template.name}`}
                          className="saved-template-thumbnail-button"
                          onClick={() => applyTemplate(template)}
                          type="button"
                        >
                          <span
                            className="template-thumbnail"
                            style={{
                              "--template-color": template.color,
                              "--template-accent": template.accent,
                            }}
                          >
                            <i />
                            <i />
                            <i />
                          </span>
                        </button>
                        <span>
                          <input
                            aria-label={`Rename ${template.name}`}
                            className="saved-template-name"
                            defaultValue={template.name}
                            onBlur={(event) =>
                              renameSavedTemplate(template, event.target.value)
                            }
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              event.stopPropagation();
                              if (event.key === "Enter") {
                                event.currentTarget.blur();
                              }
                              if (event.key === "Escape") {
                                event.currentTarget.value = template.name;
                                event.currentTarget.blur();
                              }
                            }}
                            type="text"
                          />
                          <button
                            className="saved-template-edit-open"
                            onClick={() => applyTemplate(template)}
                            type="button"
                          >
                            Saved template · Click to edit
                          </button>
                        </span>
                      </div>
                      <button
                        aria-label={`Delete ${template.name}`}
                        className="delete-saved-template"
                        onClick={() => deleteSavedTemplate(template)}
                        title="Delete saved template"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-saved-templates">
                    <Save size={17} />
                    <strong>No saved templates yet</strong>
                    <span>Edit any layout and press Save to add it here.</span>
                  </div>
                )}
                <div className="library-heading starter-library-heading">
                  <div>
                    <h2>Starter templates</h2>
                    <p>Start with a proven layout</p>
                  </div>
                </div>
                {templates.map((template) => (
                  <button className="template-card" key={template.name} onClick={() => applyTemplate(template)} type="button">
                    <span
                      className="template-thumbnail"
                      style={{
                        "--template-color": template.color,
                        "--template-accent": template.accent,
                      }}
                    >
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>
                      <strong>{template.name}</strong>
                      <small>{template.category}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {!leftOpen && (
            <button className="reopen-panel reopen-left" onClick={() => setLeftOpen(true)} type="button">
              <Blocks size={16} />
            </button>
          )}

          <section className="canvas-area">
            <div className="canvas-toolbar">
              <div className="canvas-device-switch">
                <button className={canvasDevice === "desktop" ? "active" : ""} onClick={() => setCanvasDevice("desktop")} type="button">
                  <Laptop size={15} />
                </button>
                <button className={canvasDevice === "mobile" ? "active" : ""} onClick={() => setCanvasDevice("mobile")} type="button">
                  <Smartphone size={15} />
                </button>
              </div>
              <span className="canvas-size">
                {canvasDevice === "desktop" ? "620 px" : "390 px"}
              </span>
              <button className="code-link" onClick={() => setModalTab("json")} type="button">
                <Code2 size={14} />
                Design JSON
              </button>
            </div>

            <div className="canvas-scroll" onClick={() => setSelectedId(null)}>
              <div
                className={`email-canvas ${canvasDevice} ${isOver ? "is-over" : ""}`}
                ref={setCanvasRef}
                style={{
                  backgroundColor: design.brand.backgroundColor,
                  fontFamily: `${design.brand.fontFamily}, Arial, sans-serif`,
                }}
              >
                <div className="preheader-bar">
                  <span>{design.preheader}</span>
                  <button type="button">View in browser</button>
                </div>
                <SortableContext
                  items={design.blocks.map((block) => block.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {design.blocks.map((block) => (
                    <EmailBlock
                      block={block}
                      brand={design.brand}
                      isSelected={selectedId === block.id}
                      key={block.id}
                      onDelete={(event) => {
                        event.stopPropagation();
                        deleteBlock(block.id);
                      }}
                      onDuplicate={(event) => {
                        event.stopPropagation();
                        duplicateBlock(block.id);
                      }}
                      onBlockChange={(props) => {
                        setSelectedId(block.id);
                        commitDesignChange((current) => {
                          const currentBlock = current.blocks.find(
                            (item) => item.id === block.id,
                          );
                          return {
                            ...current,
                            ...(currentBlock?.type === "staffMemo"
                              ? { fields: props }
                              : {}),
                            blocks: current.blocks.map((item) =>
                              item.id === block.id ? { ...item, props } : item,
                            ),
                            updatedAt: "Just now",
                          };
                        });
                      }}
                      onSelect={() => {
                        setSelectedId(block.id);
                        if (window.innerWidth <= 900) setRightOpen(true);
                      }}
                    />
                  ))}
                </SortableContext>
                <button className="add-block-inline" onClick={() => addBlock("text")} type="button">
                  <Plus size={15} />
                  Add block
                </button>
              </div>
            </div>
          </section>

          <aside className="right-panel">
            <div className="inspector-top">
              <div>
                <span>Properties</span>
                <h2>
                  {selectedBlock
                    ? inspectorTab === "style"
                      ? "Edit style"
                      : "Block settings"
                    : "Block settings"}
                </h2>
              </div>
              <button aria-label="Close properties" className="panel-close" onClick={() => setRightOpen(false)} type="button">
                <PanelRightClose size={16} />
              </button>
            </div>
            <div className="inspector-tabs">
              <button
                className={inspectorTab === "content" ? "active" : ""}
                onClick={() => setInspectorTab("content")}
                type="button"
              >
                <Settings2 size={14} />
                Settings
              </button>
              <button
                className={inspectorTab === "style" ? "active" : ""}
                onClick={() => setInspectorTab("style")}
                type="button"
              >
                <Palette size={14} />
                Style
              </button>
            </div>
            <div className="inspector-scroll">
              {inspectorTab === "content" ? (
                <Inspector
                  block={selectedBlock}
                  brand={design.brand}
                  onBlockChange={updateBlock}
                  onBrandChange={updateBrand}
                />
              ) : (
                <StyleInspector
                  block={selectedBlock}
                  brand={design.brand}
                  onBlockChange={updateBlock}
                  onBlockStyleChange={updateBlockStyle}
                  onBrandChange={updateBrand}
                />
              )}
            </div>
            <div className="email-meta">
              <button onClick={() => setModalTab("html")} type="button">
                <Code2 size={14} />
                Inspect export
              </button>
              <span>
                {compiled.isCompiling
                  ? "Compiling…"
                  : compiled.errors.length
                    ? `${compiled.errors.length} warnings`
                    : "Email ready"}
              </span>
            </div>
          </aside>

          {!rightOpen && (
            <button className="reopen-panel reopen-right" onClick={() => setRightOpen(true)} type="button">
              <Settings2 size={16} />
            </button>
          )}
        </main>

        {modalTab && (
          <PreviewModal
            design={synchronizeDesignFields(design)}
            html={compiled.html}
            initialTab={modalTab}
            mjml={compiled.mjml}
            onClose={() => setModalTab(null)}
          />
        )}
        <Toast message={toast} />
      </div>

      <DragOverlay>
        {activeDrag ? (
          <div className="drag-overlay">
            <GripVertical size={15} />
            {String(activeDrag).startsWith("new:")
              ? blockCatalog.find(
                  (item) => item.type === String(activeDrag).replace("new:", ""),
                )?.label
              : "Move block"}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
