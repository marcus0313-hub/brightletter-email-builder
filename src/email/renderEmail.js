import mjml2html from "mjml-browser";
import { getBlockStyle } from "./design.js";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function richText(value = "") {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function formattedText(value = "", listStyle = "none") {
  if (listStyle === "none") return richText(value);

  const tag = listStyle === "number" ? "ol" : "ul";
  const items = String(value)
    .split("\n")
    .filter((item) => item.trim())
    .map(
      (item) =>
        `<li style="display:list-item;margin:0 0 7px;">${escapeHtml(item)}</li>`,
    )
    .join("");

  const marker = listStyle === "number" ? "decimal" : "disc";
  return `<${tag} style="padding-left:20px;margin:0;list-style-type:${marker};list-style-position:outside;">${items}</${tag}>`;
}

function normalizeAlign(value, fallback = "left") {
  return ["left", "center", "right", "justify"].includes(value) ? value : fallback;
}

function fieldAlign(props = {}, field, fallback = "left") {
  return normalizeAlign(props.fieldAligns?.[field], fallback);
}

function richBody(props) {
  if (!props.bodyHtml) {
    return formattedText(props.body, props.listStyle);
  }

  if (typeof DOMParser === "undefined" || typeof document === "undefined") {
    return String(props.bodyHtml)
      .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(?!\/?(?:p|div|ul|ol|li|br)\b)[^>]+>/gi, "")
      .replace(/<(p|div|ul|ol|li|br)\b[^>]*>/gi, "<$1>")
      .replace(/<\/div>/gi, "</p>")
      .replace(/<div>/gi, '<p style="margin:0 0 12px;">')
      .replace(/<p>/gi, '<p style="margin:0 0 12px;">')
      .replace(
        /<ul>/gi,
        '<ul style="padding-left:20px;margin:0 0 12px;list-style-type:disc;list-style-position:outside;">',
      )
      .replace(
        /<ol>/gi,
        '<ol style="padding-left:20px;margin:0 0 12px;list-style-type:decimal;list-style-position:outside;">',
      )
      .replace(/<li>/gi, '<li style="display:list-item;margin:0 0 7px;">');
  }

  const parsed = new DOMParser().parseFromString(
    `<div>${String(props.bodyHtml)}</div>`,
    "text/html",
  );
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
    const align = normalizeAlign(
      node.style?.textAlign || node.getAttribute?.("align"),
      "",
    );

    if (tag === "p") {
      safeNode.setAttribute(
        "style",
        `margin:0 0 12px;${align ? `text-align:${align};` : ""}`,
      );
    } else if (tag === "ul" || tag === "ol") {
      safeNode.setAttribute(
        "style",
        `padding-left:20px;margin:0 0 12px;list-style-type:${tag === "ol" ? "decimal" : "disc"};list-style-position:outside;${align ? `text-align:${align};` : ""}`,
      );
    } else if (tag === "li") {
      safeNode.setAttribute(
        "style",
        `display:list-item;margin:0 0 7px;${align ? `text-align:${align};` : ""}`,
      );
    }

    [...node.childNodes].forEach((child) => appendSafe(child, safeNode));
    parent.append(safeNode);
  }

  [...source.childNodes].forEach((node) => appendSafe(node, output));
  return output.innerHTML;
}

function renderMemoItems(items, renderItem, emptyText) {
  if (!Array.isArray(items) || !items.length) {
    return `<div style="color:#77838d;font-style:italic;">${escapeHtml(emptyText)}</div>`;
  }
  return items.map(renderItem).join("");
}

function renderColumnContent(content, brand, style) {
  const p = content.props;
  const typography = `font-family="${escapeHtml(style.fontFamily)}, Arial, sans-serif" letter-spacing="${style.letterSpacing}px"`;

  switch (content.type) {
    case "text":
      return `
        ${p.eyebrow ? `<mj-text ${typography} padding="0 0 7px" align="${fieldAlign(p, "eyebrow")}" font-size="${style.eyebrowSize}px" font-weight="700" color="${brand.accentColor}">${escapeHtml(p.eyebrow)}</mj-text>` : ""}
        ${p.heading ? `<mj-text ${typography} padding="0 0 9px" align="${fieldAlign(p, "heading")}" font-size="${style.columnHeadingSize}px" line-height="${Math.round(style.columnHeadingSize * 1.28)}px" font-weight="700" color="${style.headingColor}">${escapeHtml(p.heading)}</mj-text>` : ""}
        ${p.body ? `<mj-text ${typography} padding="0 0 16px" align="${fieldAlign(p, "body")}" font-size="${style.baseFontSize}px" line-height="${Math.round(style.baseFontSize * 1.55)}px" color="${style.bodyColor}">${richBody(p)}</mj-text>` : ""}`;
    case "panel": {
      const items = Array.isArray(p.items) ? p.items : [];
      const empty = `<div style="color:#77838d;font-style:italic;">Add items in Brightletter Settings.</div>`;
      let itemHtml = "";

      if (p.itemType === "bullets") {
        itemHtml = items.length
          ? `<ul style="padding-left:18px;margin:10px 0 0;">${items
              .map((item) => `<li style="margin:0 0 7px;">${richText(item)}</li>`)
              .join("")}</ul>`
          : empty;
      } else if (p.itemType === "pairs") {
        itemHtml = items.length
          ? items
              .map(
                (item) =>
                  `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid ${style.columnBorderColor};"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.coverage)}</span></div>`,
              )
              .join("")
          : empty;
      } else if (p.itemType === "meetings") {
        itemHtml = items.length
          ? items
              .map(
                (item) =>
                  `<div style="padding:8px 0;border-bottom:1px solid ${style.columnBorderColor};"><strong>${escapeHtml(item.time)}</strong><br />${escapeHtml(item.student)} · ${escapeHtml(item.owner)}</div>`,
              )
              .join("")
          : empty;
      } else if (p.itemType === "links") {
        itemHtml = items.length
          ? items
              .map(
                (item) =>
                  `<a href="${escapeHtml(item.url)}" style="display:block;margin:0 0 8px;color:${brand.primaryColor};font-weight:700;text-decoration:underline;">${escapeHtml(item.label)}</a>`,
              )
              .join("")
          : empty;
      }

      return `
        <mj-text ${typography} padding="0 0 14px" font-size="${style.baseFontSize}px" line-height="${Math.round(style.baseFontSize * 1.55)}px" color="${style.bodyColor}">
          <div style="padding:16px;background:#FFFFFF;border:1px solid ${style.columnBorderColor};border-radius:${style.columnRadius}px;">
            ${p.title ? `<div style="margin:0 0 10px;color:${style.headingColor};font-size:${style.columnHeadingSize}px;line-height:1.25;font-weight:700;">${escapeHtml(p.title)}</div>` : ""}
            ${p.badge ? `<div style="display:inline-block;padding:4px 7px;margin:0 0 10px;border-radius:999px;background:${brand.accentColor};color:${brand.primaryColor};font-size:${style.eyebrowSize}px;font-weight:700;">${escapeHtml(p.badge)}</div>` : ""}
            ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.imageAlt)}" width="100%" style="display:block;width:100%;height:auto;margin:0 0 10px;border:0;border-radius:4px;" />` : ""}
            ${p.body ? `<div style="margin:0 0 10px;">${richText(p.body)}</div>` : ""}
            ${itemHtml}
          </div>
        </mj-text>`;
    }
    case "image":
      return `
        ${p.src ? `<mj-image padding="0 0 8px" border-radius="4px" src="${escapeHtml(p.src)}" alt="${escapeHtml(p.alt)}" />` : ""}
        ${p.caption ? `<mj-text ${typography} padding="0 0 14px" font-size="${style.eyebrowSize}px" line-height="${Math.round(style.eyebrowSize * 1.5)}px" color="${style.bodyColor}">${escapeHtml(p.caption)}</mj-text>` : ""}`;
    case "button": {
      const isOutline = p.style === "outline";
      return p.text
        ? `<mj-button ${typography} padding="0 0 16px" align="${p.align}" background-color="${isOutline ? style.columnBackgroundColor : brand.primaryColor}" color="${isOutline ? brand.primaryColor : "#FFFFFF"}" border="${isOutline ? `1px solid ${brand.primaryColor}` : "none"}" border-radius="4px" font-size="${style.buttonFontSize}px" font-weight="700" inner-padding="10px 16px" href="${escapeHtml(p.url)}">${escapeHtml(p.text)}</mj-button>`
        : "";
    }
    case "divider":
      return `<mj-divider padding="4px 0 16px" border-width="1px" border-color="${p.color}" />`;
    case "spacer":
      return `<mj-spacer height="${Number(p.height) || 24}px" />`;
    default:
      return "";
  }
}

function renderBlock(block, brand) {
  const p = block.props;
  const s = getBlockStyle(block, brand);
  const accent = brand.accentColor;
  const sectionPadding = `${s.paddingTop}px ${s.paddingX}px ${s.paddingBottom}px`;
  const typography = `font-family="${escapeHtml(s.fontFamily)}, Arial, sans-serif" letter-spacing="${s.letterSpacing}px"`;

  switch (block.type) {
    case "staffMemo": {
      const panelStyle = `margin:0 0 14px;padding:18px;background:${s.panelBackgroundColor};border:1px solid ${s.panelBorderColor};border-radius:${s.cardRadius}px;color:${s.bodyColor};font-family:${escapeHtml(s.fontFamily)},Arial,sans-serif;font-size:${s.bodySize}px;line-height:1.55;`;
      const panelHeadingStyle = `margin:0 0 12px;color:${s.headingColor};font-size:${Math.max(15, Math.round(s.headingSize * 0.62))}px;line-height:1.25;`;
      const notes = renderMemoItems(
        p.notesForWeek,
        (note) => `<li style="margin:0 0 8px;">${richText(note)}</li>`,
        "No weekly notes added.",
      );
      const absences = renderMemoItems(
        p.staffAbsences,
        (absence) => `
          <tr>
            <td style="padding:8px 8px 8px 0;border-bottom:1px solid ${s.panelBorderColor};font-weight:700;vertical-align:top;">${escapeHtml(absence.name)}</td>
            <td style="padding:8px 0;border-bottom:1px solid ${s.panelBorderColor};vertical-align:top;">${escapeHtml(absence.coverage)}</td>
          </tr>`,
        "No staff absences added.",
      );
      const meetings = renderMemoItems(
        p.iepMeetings,
        (meeting) => `
          <tr>
            <td style="padding:8px 8px 8px 0;border-bottom:1px solid ${s.panelBorderColor};font-weight:700;vertical-align:top;">${escapeHtml(meeting.time)}</td>
            <td style="padding:8px;border-bottom:1px solid ${s.panelBorderColor};vertical-align:top;">${escapeHtml(meeting.student)}</td>
            <td style="padding:8px 0 8px 8px;border-bottom:1px solid ${s.panelBorderColor};vertical-align:top;">${escapeHtml(meeting.owner)}</td>
          </tr>`,
        "No IEP meetings added.",
      );
      const links = renderMemoItems(
        p.importantLinks,
        (link) => `
          <a href="${escapeHtml(link.url)}" style="display:block;margin:0 0 8px;color:${brand.primaryColor};font-weight:700;text-decoration:underline;">${escapeHtml(link.label)}</a>`,
        "No important links added.",
      );

      return `
        <mj-section padding="24px 30px" background-color="${brand.primaryColor}">
          ${
            p.headerImage
              ? `<mj-column width="24%">
                  <mj-image padding="0 16px 0 0" align="left" src="${escapeHtml(p.headerImage)}" alt="Memo header" />
                </mj-column>`
              : ""
          }
          <mj-column width="${p.headerImage ? "76%" : "100%"}">
            <mj-text ${typography} padding="0 0 5px" font-size="${s.headingSize}px" line-height="${Math.round(s.headingSize * 1.2)}px" font-weight="800" color="#FFFFFF">${escapeHtml(p.memoTitle)}</mj-text>
            <mj-text ${typography} padding="0" font-size="${s.bodySize}px" font-weight="700" color="#DCE8F0">${escapeHtml(p.dateRange)}</mj-text>
          </mj-column>
        </mj-section>
        <mj-section padding="30px 36px 22px" background-color="${s.backgroundColor}">
          <mj-column>
            <mj-text ${typography} padding="0 0 8px" font-size="${s.eyebrowSize}px" font-weight="800" color="${accent}">FROM THE DESK OF LEADERSHIP</mj-text>
            <mj-text ${typography} padding="0 0 16px" font-size="${s.bodySize}px" line-height="${Math.round(s.bodySize * 1.65)}px" color="${s.bodyColor}">${richText(p.openingMessage || "Add this week’s opening message for staff.")}</mj-text>
            <mj-text ${typography} padding="0 0 18px" font-size="${s.bodySize}px" line-height="${Math.round(s.bodySize * 1.5)}px" color="${s.bodyColor}"><strong>${escapeHtml(p.signatureName || "Signature name")}</strong><br />${escapeHtml(p.signatureTitle || "Signature title")}</mj-text>
            <mj-text ${typography} padding="0" font-size="${s.bodySize}px" line-height="${Math.round(s.bodySize * 1.55)}px" color="${s.bodyColor}"><div style="padding:14px 16px;border-left:4px solid ${accent};background:${s.panelBackgroundColor};"><strong style="color:${s.headingColor};">Vision for the week</strong><br />${richText(p.visionStatement || "Add the weekly vision or focus statement.")}</div></mj-text>
          </mj-column>
        </mj-section>
        <mj-section padding="8px ${Math.max(16, 36 - s.gap / 2)}px 30px" background-color="${s.backgroundColor}">
          <mj-column width="50%" padding="0 ${s.gap / 2}px">
            <mj-text padding="0">
              <div style="${panelStyle}">
                <h3 style="${panelHeadingStyle}">Notes for the week</h3>
                ${Array.isArray(p.notesForWeek) && p.notesForWeek.length ? `<ul style="padding-left:18px;margin:0;">${notes}</ul>` : notes}
              </div>
            </mj-text>
            <mj-text padding="0">
              <div style="${panelStyle}">
                <h3 style="${panelHeadingStyle}">Schedule <span style="float:right;padding:3px 8px;border-radius:999px;background:${accent};color:${brand.primaryColor};font-size:10px;">${escapeHtml(p.weekType)}</span></h3>
              </div>
            </mj-text>
            ${p.scheduleImage ? `<mj-image padding="0" border-radius="${s.cardRadius}px" src="${escapeHtml(p.scheduleImage)}" alt="Weekly schedule" />` : ""}
          </mj-column>
          <mj-column width="50%" padding="0 ${s.gap / 2}px">
            <mj-text padding="0">
              <div style="${panelStyle}">
                <h3 style="${panelHeadingStyle}">Staff absences</h3>
                ${Array.isArray(p.staffAbsences) && p.staffAbsences.length ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:${s.bodySize}px;">${absences}</table>` : absences}
              </div>
              <div style="${panelStyle}">
                <h3 style="${panelHeadingStyle}">IEP meetings</h3>
                ${Array.isArray(p.iepMeetings) && p.iepMeetings.length ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:${s.bodySize}px;">${meetings}</table>` : meetings}
              </div>
              <div style="${panelStyle}">
                <h3 style="${panelHeadingStyle}">Important links</h3>
                ${links}
              </div>
            </mj-text>
          </mj-column>
        </mj-section>
        <mj-section padding="20px 36px" background-color="${brand.primaryColor}">
          ${
            p.footerLogo
              ? `<mj-column width="24%">
                  <mj-image padding="0 16px 0 0" align="left" src="${escapeHtml(p.footerLogo)}" alt="Footer logo" />
                </mj-column>`
              : ""
          }
          <mj-column width="${p.footerLogo ? "76%" : "100%"}">
            <mj-text ${typography} padding="0" align="${p.footerLogo ? "right" : "center"}" font-size="${Math.max(10, s.bodySize - 1)}px" color="#DCE8F0">Staff Weekly Memo · Internal Communication</mj-text>
          </mj-column>
        </mj-section>`;
    }
    case "header":
      return `
        <mj-section padding="${sectionPadding}" background-color="${s.backgroundColor}">
          ${
            p.logoImage
              ? `<mj-column width="14%">
                  <mj-image padding="0 10px 0 0" align="left" width="${s.logoWidth}px" src="${escapeHtml(p.logoImage)}" alt="${escapeHtml(p.logoAlt)}" />
                </mj-column>`
              : ""
          }
          <mj-column width="${p.logoImage ? "41%" : "55%"}">
            ${p.logoText ? `<mj-text ${typography} padding="7px 0 0" align="${fieldAlign(p, "logoText")}" font-size="${s.logoSize}px" font-weight="800" color="${s.logoColor}">${escapeHtml(p.logoText)}</mj-text>` : ""}
          </mj-column>
          <mj-column width="45%">
            ${p.issue ? `<mj-text ${typography} padding="3px 0 0" align="${fieldAlign(p, "issue", "right")}" font-size="10px" font-weight="700" color="${s.issueColor}">${escapeHtml(p.issue)}</mj-text>` : ""}
          </mj-column>
        </mj-section>`;
    case "hero": {
      const eyebrowAlign = fieldAlign(p, "eyebrow");
      const titleAlign = fieldAlign(p, "title");
      const bodyAlign = fieldAlign(p, "body");
      const buttonAlign = fieldAlign(p, "buttonText") === "justify" ? "left" : fieldAlign(p, "buttonText");
      return `
        ${p.image ? `<mj-section
          padding="0"
          background-color="${s.backgroundColor}"
          background-url="${escapeHtml(p.image)}"
          background-size="cover"
          background-position="center center"
          background-repeat="no-repeat"
        >
          <mj-column>
            <mj-spacer height="${s.imageHeight}px" />
          </mj-column>
        </mj-section>` : ""}
        <mj-section padding="${sectionPadding}" background-color="${s.backgroundColor}">
          <mj-column>
            ${p.eyebrow ? `<mj-text ${typography} padding="0 0 12px" align="${eyebrowAlign}" font-size="${s.eyebrowSize}px" font-weight="700" color="${accent}">${escapeHtml(p.eyebrow)}</mj-text>` : ""}
            ${p.title ? `<mj-text ${typography} padding="0 0 14px" align="${titleAlign}" font-size="${s.headingSize}px" line-height="${Math.round(s.headingSize * 1.2)}px" font-weight="700" color="${s.headingColor}">${escapeHtml(p.title)}</mj-text>` : ""}
            ${p.body ? `<mj-text ${typography} padding="0 0 22px" align="${bodyAlign}" font-size="${s.bodySize}px" line-height="${Math.round(s.bodySize * 1.6)}px" color="${s.bodyColor}">${richText(p.body)}</mj-text>` : ""}
            ${p.buttonText ? `<mj-button ${typography} padding="0" align="${buttonAlign}" background-color="${s.buttonColor}" color="${s.buttonTextColor}" border-radius="${s.buttonRadius}px" font-size="${s.buttonFontSize}px" font-weight="700" inner-padding="13px 22px" href="${escapeHtml(p.buttonUrl)}">${escapeHtml(p.buttonText)}</mj-button>` : ""}
          </mj-column>
        </mj-section>`;
    }
    case "text":
      return `
        <mj-section padding="${sectionPadding}" background-color="${s.backgroundColor}">
          <mj-column>
            ${p.eyebrow ? `<mj-text ${typography} padding="0 0 10px" align="${fieldAlign(p, "eyebrow")}" font-size="${s.eyebrowSize}px" font-weight="700" color="${accent}">${escapeHtml(p.eyebrow)}</mj-text>` : ""}
            ${p.heading ? `<mj-text ${typography} padding="0 0 14px" align="${fieldAlign(p, "heading")}" font-size="${s.headingSize}px" line-height="${Math.round(s.headingSize * 1.28)}px" font-weight="700" color="${s.headingColor}">${escapeHtml(p.heading)}</mj-text>` : ""}
            ${p.body ? `<mj-text ${typography} padding="0" align="${fieldAlign(p, "body")}" font-size="${s.bodySize}px" line-height="${Math.round(s.bodySize * 1.66)}px" color="${s.bodyColor}">${richBody(p)}</mj-text>` : ""}
          </mj-column>
        </mj-section>`;
    case "image":
      return `
        <mj-section padding="${sectionPadding}" background-color="${s.backgroundColor}">
          <mj-column>
            ${p.src ? `<mj-image padding="0" border-radius="${s.borderRadius}px" src="${escapeHtml(p.src)}" alt="${escapeHtml(p.alt)}" />` : ""}
            ${p.caption ? `<mj-text ${typography} padding="10px 0 0" font-size="${s.captionSize}px" line-height="${Math.round(s.captionSize * 1.55)}px" color="${s.captionColor}">${escapeHtml(p.caption)}</mj-text>` : ""}
          </mj-column>
        </mj-section>`;
    case "button": {
      const isOutline = p.style === "outline";
      return p.text ? `
        <mj-section padding="${sectionPadding}" background-color="${s.backgroundColor}">
          <mj-column>
            <mj-button ${typography} align="${p.align}" background-color="${isOutline ? s.backgroundColor : s.buttonColor}" color="${isOutline ? s.buttonColor : s.textColor}" border="${isOutline ? `1px solid ${s.buttonColor}` : "none"}" border-radius="${s.borderRadius}px" font-size="${s.fontSize}px" font-weight="700" inner-padding="${s.innerPaddingY}px ${s.innerPaddingX}px" href="${escapeHtml(p.url)}">${escapeHtml(p.text)}</mj-button>
          </mj-column>
        </mj-section>` : "";
    }
    case "columns": {
      const widths =
        p.ratio === "33-67"
          ? ["33.333%", "66.667%"]
          : p.ratio === "67-33"
            ? ["66.667%", "33.333%"]
            : ["50%", "50%"];
      const columnPadding = Math.max(0, s.gap / 2);
      return `
        ${p.heading ? `<mj-section padding="${s.paddingTop}px ${s.paddingX}px 12px" background-color="${s.backgroundColor}">
          <mj-column>
            <mj-text ${typography} padding="0 0 16px" font-size="${s.headingSize}px" font-weight="700" color="${s.headingColor}">${escapeHtml(p.heading)}</mj-text>
          </mj-column>
        </mj-section>` : ""}
        <mj-section padding="0 ${Math.max(0, s.paddingX - columnPadding)}px ${s.paddingBottom}px" background-color="${s.backgroundColor}">
          ${p.columns
            .map(
              (column, index) => `
                <mj-column width="${widths[index]}" padding="0 ${columnPadding}px" background-color="${s.columnBackgroundColor}" border="1px solid ${s.columnBorderColor}" border-radius="${s.columnRadius}px">
                  <mj-spacer height="18px" />
                  ${column.blocks.map((content) => renderColumnContent(content, brand, s)).join("\n")}
                  <mj-spacer height="2px" />
                </mj-column>`,
            )
            .join("\n")}
        </mj-section>`;
    }
    case "calendar":
      return `
        ${p.heading ? `<mj-section padding="${s.paddingTop}px ${s.paddingX}px 12px" background-color="${s.backgroundColor}">
          <mj-column>
            <mj-text ${typography} padding="0 0 16px" font-size="${s.headingSize}px" font-weight="700" color="${s.headingColor}">${escapeHtml(p.heading)}</mj-text>
          </mj-column>
        </mj-section>` : ""}
        <mj-section padding="0 ${Math.max(0, s.paddingX - 8)}px ${s.paddingBottom}px" background-color="${s.backgroundColor}">
          <mj-column width="50%" padding="8px">
            <mj-text padding="0">
              <div style="padding:20px;background-color:${s.cardBackgroundColor};border:1px solid ${s.cardBorderColor};border-radius:${s.cardRadius}px;font-family:${escapeHtml(s.fontFamily)},Arial,sans-serif;letter-spacing:${s.letterSpacing}px;font-size:${s.dateSize}px;font-weight:800;color:${s.dateColor};">
                ${p.leftTitle ? `${escapeHtml(p.leftTitle)}<br/>` : ""}${p.leftEyebrow ? `<span style="font-size:${s.labelSize}px;letter-spacing:1px;color:${accent};">${escapeHtml(p.leftEyebrow)}</span><br/>` : ""}${p.leftBody ? `<span style="font-size:${s.baseFontSize}px;line-height:${Math.round(s.baseFontSize * 1.55)}px;font-weight:400;color:${s.bodyColor};">${richText(p.leftBody)}</span>` : ""}
              </div>
            </mj-text>
          </mj-column>
          <mj-column width="50%" padding="8px">
            <mj-text padding="0">
              <div style="padding:20px;background-color:${s.cardBackgroundColor};border:1px solid ${s.cardBorderColor};border-radius:${s.cardRadius}px;font-family:${escapeHtml(s.fontFamily)},Arial,sans-serif;letter-spacing:${s.letterSpacing}px;font-size:${s.dateSize}px;font-weight:800;color:${s.dateColor};">
                ${p.rightTitle ? `${escapeHtml(p.rightTitle)}<br/>` : ""}${p.rightEyebrow ? `<span style="font-size:${s.labelSize}px;letter-spacing:1px;color:${accent};">${escapeHtml(p.rightEyebrow)}</span><br/>` : ""}${p.rightBody ? `<span style="font-size:${s.baseFontSize}px;line-height:${Math.round(s.baseFontSize * 1.55)}px;font-weight:400;color:${s.bodyColor};">${richText(p.rightBody)}</span>` : ""}
              </div>
            </mj-text>
          </mj-column>
        </mj-section>`;
    case "divider":
      return `
        <mj-section padding="${sectionPadding}" background-color="${s.backgroundColor}">
          <mj-column><mj-divider padding="0" border-width="${s.thickness}px" border-color="${p.color}" /></mj-column>
        </mj-section>`;
    case "spacer":
      return `
        <mj-section padding="0" background-color="${s.backgroundColor}">
          <mj-column><mj-spacer height="${Number(p.height) || 32}px" /></mj-column>
        </mj-section>`;
    case "footer":
      return `
        <mj-section padding="${sectionPadding}" background-color="${s.backgroundColor}">
          ${
            p.logoImage
              ? `<mj-column width="22%">
                  <mj-image padding="0 14px 0 0" align="left" width="72px" src="${escapeHtml(p.logoImage)}" alt="${escapeHtml(p.logoAlt)}" />
                </mj-column>`
              : ""
          }
          <mj-column width="${p.logoImage ? "78%" : "100%"}">
            ${p.schoolName ? `<mj-text ${typography} padding="0 0 8px" align="${s.align}" font-size="${s.headingSize}px" font-weight="700" color="${s.headingColor}">${escapeHtml(p.schoolName)}</mj-text>` : ""}
            <mj-text ${typography} padding="0" align="${s.align}" font-size="${s.bodySize}px" line-height="${Math.round(s.bodySize * 1.7)}px" color="${s.bodyColor}">${p.address ? `${escapeHtml(p.address)}<br/>` : ""}${p.phone ? escapeHtml(p.phone) : ""}${p.phone && p.website ? " · " : ""}${p.website ? escapeHtml(p.website) : ""}${(p.phone || p.website) && ((p.preferencesText ?? "Manage preferences") || (p.unsubscribeText ?? "Unsubscribe")) ? "<br/>" : ""}${(p.preferencesText ?? "Manage preferences") ? `<a href="https://example.org/preferences" style="color:${s.bodyColor};">${escapeHtml(p.preferencesText ?? "Manage preferences")}</a>` : ""}${(p.preferencesText ?? "Manage preferences") && (p.unsubscribeText ?? "Unsubscribe") ? " · " : ""}${(p.unsubscribeText ?? "Unsubscribe") ? `<a href="https://example.org/unsubscribe" style="color:${s.bodyColor};">${escapeHtml(p.unsubscribeText ?? "Unsubscribe")}</a>` : ""}</mj-text>
          </mj-column>
        </mj-section>`;
    default:
      return "";
  }
}

export function designToMjml(design) {
  const { brand } = design;
  const baseFontSizePx =
    Math.round((Number(brand.baseFontSizePt) || 11) * (4 / 3) * 10) / 10;
  return `
    <mjml>
      <mj-head>
        <mj-title>${escapeHtml(design.subject)}</mj-title>
        <mj-preview>${escapeHtml(design.preheader)}</mj-preview>
        <mj-attributes>
          <mj-all font-family="${escapeHtml(brand.fontFamily)}, Arial, sans-serif" />
          <mj-text color="${brand.textColor}" font-size="${baseFontSizePx}px" />
        </mj-attributes>
        <mj-style inline="inline">
          a { color: inherit; }
        </mj-style>
      </mj-head>
      <mj-body background-color="${brand.backgroundColor}" width="620px">
        ${design.blocks.map((block) => renderBlock(block, brand)).join("\n")}
      </mj-body>
    </mjml>`;
}

export async function compileDesign(design) {
  const mjml = designToMjml(design);
  const result = await mjml2html(mjml, {
    validationLevel: "soft",
    minify: false,
  });

  return {
    html: result.html,
    errors: result.errors ?? [],
    mjml,
  };
}
