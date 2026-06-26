export const blockCatalog = [
  {
    type: "header",
    label: "Header",
    description: "Logo and issue label",
  },
  {
    type: "hero",
    label: "Hero",
    description: "Feature story with CTA",
  },
  {
    type: "text",
    label: "Text",
    description: "Heading and body copy",
  },
  {
    type: "image",
    label: "Image",
    description: "Full-width photo",
  },
  {
    type: "button",
    label: "Button",
    description: "Primary call to action",
  },
  {
    type: "columns",
    label: "Columns",
    description: "Flexible side-by-side content",
  },
  {
    type: "calendar",
    label: "Calendar",
    description: "Dates and event cards",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visual separator",
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Add breathing room",
  },
  {
    type: "footer",
    label: "Footer",
    description: "Contact and unsubscribe",
  },
];

export const staffMemoFields = {
  memoTitle: "MSA Weekly Memo",
  dateRange: "06.01.26 - 06.05.26",
  headerImage: "",
  openingMessage: "",
  signatureName: "",
  signatureTitle: "",
  visionStatement: "",
  notesForWeek: [],
  weekType: "A Week",
  scheduleImage: "",
  staffAbsences: [],
  iepMeetings: [],
  importantLinks: [],
  footerLogo: "",
};

function memoPanel(id, title, itemType, items = [], extra = {}) {
  return {
    id,
    type: "panel",
    props: {
      title,
      body: "",
      badge: "",
      image: "",
      imageAlt: title,
      itemType,
      items,
      ...extra,
    },
  };
}

export function createEditableStaffMemoBlocks(fields = staffMemoFields) {
  return [
    {
      id: "memo-header",
      type: "header",
      props: {
        logoText: fields.memoTitle,
        logoImage: fields.headerImage,
        logoAlt: fields.memoTitle,
        issue: fields.dateRange,
      },
      fieldBindings: {
        logoText: "memoTitle",
        logoImage: "headerImage",
        issue: "dateRange",
      },
      blockStyle: {
        backgroundColor: "#173B57",
        logoColor: "#FFFFFF",
        issueColor: "#DCE8F0",
      },
    },
    {
      id: "memo-opening",
      type: "text",
      props: {
        eyebrow: "FROM THE DESK OF LEADERSHIP",
        heading: "Opening message",
        body:
          fields.openingMessage ||
          "Click to add this week’s opening message for staff.",
        align: "left",
      },
      fieldBindings: { body: "openingMessage" },
      blockStyle: { paddingBottom: 22 },
    },
    {
      id: "memo-signature",
      type: "text",
      props: {
        eyebrow: "SIGNATURE",
        heading: fields.signatureName || "Signature name",
        body: fields.signatureTitle || "Signature title",
        align: "left",
      },
      fieldBindings: {
        heading: "signatureName",
        body: "signatureTitle",
      },
      blockStyle: { paddingTop: 18, paddingBottom: 18 },
    },
    {
      id: "memo-vision",
      type: "text",
      props: {
        eyebrow: "VISION FOR THE WEEK",
        heading: "Our shared focus",
        body:
          fields.visionStatement ||
          "Click to add the weekly vision or focus statement.",
        align: "left",
      },
      fieldBindings: { body: "visionStatement" },
      blockStyle: {
        backgroundColor: "#F5F7F9",
        paddingTop: 22,
        paddingBottom: 22,
      },
    },
    {
      id: "memo-logistics",
      type: "columns",
      props: {
        heading: "Weekly logistics",
        ratio: "50-50",
        columns: [
          {
            id: "memo-left-column",
            blocks: [
              memoPanel(
                "memo-notes",
                "Notes for the week",
                "bullets",
                fields.notesForWeek,
                { fieldBindings: { items: "notesForWeek" } },
              ),
              memoPanel("memo-schedule", "Schedule", "none", [], {
                badge: fields.weekType,
                image: fields.scheduleImage,
                showImagePlaceholder: true,
                fieldBindings: {
                  badge: "weekType",
                  image: "scheduleImage",
                },
              }),
            ],
          },
          {
            id: "memo-right-column",
            blocks: [
              memoPanel(
                "memo-absences",
                "Staff absences",
                "pairs",
                fields.staffAbsences,
                { fieldBindings: { items: "staffAbsences" } },
              ),
              memoPanel(
                "memo-iep",
                "IEP meetings",
                "meetings",
                fields.iepMeetings,
                { fieldBindings: { items: "iepMeetings" } },
              ),
              memoPanel(
                "memo-links",
                "Important links",
                "links",
                fields.importantLinks,
                { fieldBindings: { items: "importantLinks" } },
              ),
            ],
          },
        ],
      },
      blockStyle: {
        backgroundColor: "#FFFFFF",
        columnBackgroundColor: "#F5F7F9",
        columnBorderColor: "#DCE3E8",
        columnRadius: 6,
        gap: 16,
      },
    },
    {
      id: "memo-footer",
      type: "footer",
      props: {
        schoolName: "MSA",
        address: "Staff Weekly Memo · Internal Communication",
        phone: "",
        website: "",
        logoImage: fields.footerLogo,
        logoAlt: "MSA footer logo",
      },
      fieldBindings: { logoImage: "footerLogo" },
      blockStyle: { backgroundColor: "#173B57" },
    },
  ];
}

export const staffMemoDesign = {
  id: "staff-weekly-memo-two-column-logistics",
  name: "Staff Weekly Memo — Two Column Logistics",
  subject: "MSA Weekly Memo | 06.01.26 - 06.05.26",
  preheader: "Weekly staff notes, schedules, absences, meetings, and links.",
  updatedAt: "Just now",
  templateKey: "staff-weekly-memo-two-column-logistics",
  fields: JSON.parse(JSON.stringify(staffMemoFields)),
  brand: {
    name: "MSA",
    primaryColor: "#173B57",
    accentColor: "#D9A441",
    backgroundColor: "#E9EEF2",
    textColor: "#263746",
    fontFamily: "Arial",
    baseFontSizePt: 10.5,
  },
  blocks: createEditableStaffMemoBlocks(),
};

export const starterDesign = {
  id: "northstar-weekly",
  name: "Northstar Weekly",
  subject: "A bright start to the week at Northstar",
  preheader: "Dates, celebrations, and everything families need this week.",
  updatedAt: "Just now",
  brand: {
    name: "Northstar Academy",
    primaryColor: "#16324F",
    accentColor: "#F5A623",
    backgroundColor: "#EEF2F6",
    textColor: "#263442",
    fontFamily: "Arial",
    baseFontSizePt: 11,
  },
  blocks: [
    {
      id: "header-1",
      type: "header",
      props: {
        logoText: "NORTHSTAR",
        logoImage: "",
        logoAlt: "Northstar Academy",
        issue: "FAMILY WEEKLY · MAY 18",
      },
    },
    {
      id: "hero-1",
      type: "hero",
      props: {
        eyebrow: "THIS WEEK AT NORTHSTAR",
        title: "Big ideas start with a little curiosity.",
        body: "From the science lab to the soccer field, our students are asking brave questions and building brilliant things.",
        buttonText: "See what’s happening",
        buttonUrl: "https://example.org/news",
        align: "left",
        image:
          "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=85",
      },
    },
    {
      id: "text-1",
      type: "text",
      props: {
        eyebrow: "A NOTE FROM THE PRINCIPAL",
        heading: "Hello, Northstar families!",
        body: "This week is full of moments worth celebrating. Our fifth graders are presenting their community projects, spring clubs are wrapping up, and Field Day is almost here. Thank you for showing up with such care and energy.",
        align: "left",
      },
    },
    {
      id: "calendar-1",
      type: "calendar",
      props: {
        heading: "Circle these dates",
        leftTitle: "23",
        leftEyebrow: "MAY · THURSDAY",
        leftBody: "Spring Arts Night\n6:00–7:30 PM",
        rightTitle: "27",
        rightEyebrow: "MAY · MONDAY",
        rightBody: "No School\nMemorial Day",
      },
    },
    {
      id: "button-1",
      type: "button",
      props: {
        text: "View the full school calendar",
        url: "https://example.org/calendar",
        align: "center",
        style: "outline",
      },
    },
    {
      id: "divider-1",
      type: "divider",
      props: {
        color: "#DCE4EB",
      },
    },
    {
      id: "footer-1",
      type: "footer",
      props: {
        schoolName: "Northstar Academy",
        address: "1250 Brightway Avenue · Portland, OR 97205",
        phone: "(503) 555-0142",
        website: "northstaracademy.org",
      },
    },
  ],
};

const defaults = {
  header: {
    logoText: "NORTHSTAR",
    logoImage: "",
    logoAlt: "School logo",
    issue: "FAMILY UPDATE · THIS WEEK",
  },
  hero: {
    eyebrow: "SCHOOL SPOTLIGHT",
    title: "Give your story a strong opening.",
    body: "Add a clear, welcoming introduction for families and staff.",
    buttonText: "Learn more",
    buttonUrl: "https://example.org",
    align: "left",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=85",
  },
  text: {
    eyebrow: "SCHOOL UPDATE",
    heading: "Add a thoughtful heading",
    body: "Use this space for the details your community needs. Keep paragraphs short, direct, and easy to scan.",
    align: "left",
  },
  image: {
    src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=85",
    alt: "Students learning together",
    caption: "A moment from this week at school.",
  },
  button: {
    text: "Call to action",
    url: "https://example.org",
    align: "center",
    style: "filled",
  },
  columns: {
    heading: "Explore more",
    ratio: "50-50",
    columns: [
      {
        id: "left-column",
        blocks: [
          {
            id: "column-text-left",
            type: "text",
            props: {
              eyebrow: "STUDENT LIFE",
              heading: "Learning beyond the classroom",
              body: "Share a short story, useful update, or important message here.",
              align: "left",
              listStyle: "none",
            },
          },
        ],
      },
      {
        id: "right-column",
        blocks: [
          {
            id: "column-text-right",
            type: "text",
            props: {
              eyebrow: "COMMUNITY",
              heading: "A place for every family",
              body: "Each column can hold its own mix of text, images, buttons, and spacing.",
              align: "left",
              listStyle: "none",
            },
          },
        ],
      },
    ],
  },
  calendar: {
    heading: "Important dates",
    leftTitle: "01",
    leftEyebrow: "UPCOMING",
    leftBody: "Add your first event\nTime and location",
    rightTitle: "02",
    rightEyebrow: "COMING SOON",
    rightBody: "Add your second event\nTime and location",
  },
  divider: {
    color: "#DCE4EB",
  },
  spacer: {
    height: 32,
  },
  footer: {
    schoolName: "Northstar Academy",
    address: "1250 Brightway Avenue · Portland, OR 97205",
    phone: "(503) 555-0142",
    website: "northstaracademy.org",
    preferencesText: "Manage preferences",
    unsubscribeText: "Unsubscribe",
    logoImage: "",
    logoAlt: "School footer logo",
  },
};

const styleDefaults = {
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
    paddingBottom: 20,
    paddingX: 36,
    logoColor: "#16324F",
    issueColor: "#788692",
    logoSize: 20,
    logoWidth: 56,
  },
  hero: {
    backgroundColor: "#16324F",
    paddingTop: 34,
    paddingBottom: 40,
    paddingX: 42,
    imageHeight: 245,
    headingColor: "#FFFFFF",
    bodyColor: "#DDE7F0",
    headingSize: 34,
    bodySize: 15,
    buttonColor: "#F5A623",
    buttonTextColor: "#16324F",
    buttonRadius: 4,
  },
  text: {
    backgroundColor: "#FFFFFF",
    paddingTop: 42,
    paddingBottom: 34,
    paddingX: 44,
    headingColor: "#16324F",
    bodyColor: "#263442",
    headingSize: 25,
    bodySize: 15,
  },
  image: {
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: 24,
    paddingX: 36,
    borderRadius: 6,
    captionColor: "#788692",
    captionSize: 11,
  },
  button: {
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: 34,
    paddingX: 36,
    buttonColor: "#16324F",
    textColor: "#FFFFFF",
    borderRadius: 4,
    fontSize: 13,
    innerPaddingX: 20,
    innerPaddingY: 12,
  },
  columns: {
    backgroundColor: "#F8FAFC",
    paddingTop: 28,
    paddingBottom: 28,
    paddingX: 36,
    headingColor: "#16324F",
    headingSize: 22,
    columnBackgroundColor: "#FFFFFF",
    columnBorderColor: "#E8ECEF",
    columnRadius: 0,
    gap: 12,
    bodyColor: "#263442",
  },
  calendar: {
    backgroundColor: "#F8FAFC",
    paddingTop: 28,
    paddingBottom: 28,
    paddingX: 36,
    headingColor: "#16324F",
    headingSize: 22,
    cardBackgroundColor: "#FFFFFF",
    cardBorderColor: "#E8ECEF",
    dateColor: "#16324F",
    bodyColor: "#263442",
    cardRadius: 0,
  },
  divider: {
    backgroundColor: "#FFFFFF",
    paddingTop: 0,
    paddingBottom: 0,
    paddingX: 36,
    thickness: 1,
  },
  spacer: {
    backgroundColor: "#FFFFFF",
  },
  footer: {
    backgroundColor: "#16324F",
    paddingTop: 30,
    paddingBottom: 30,
    paddingX: 36,
    headingColor: "#FFFFFF",
    bodyColor: "#C9D7E2",
    headingSize: 14,
    bodySize: 11,
    align: "center",
  },
};

export function getBlockStyle(block, brand) {
  const defaultsForType = styleDefaults[block.type] ?? {};
  const typographyScale = (Number(brand.baseFontSizePt) || 11) / 11;
  const brandAwareDefaults = {
    ...defaultsForType,
    baseFontSize: Math.round(13 * typographyScale * 10) / 10,
    eyebrowSize: Math.round(10 * typographyScale * 10) / 10,
    columnHeadingSize: Math.round(18 * typographyScale * 10) / 10,
    buttonFontSize: Math.round(13 * typographyScale * 10) / 10,
    dateSize: Math.round(31 * typographyScale * 10) / 10,
    labelSize: Math.round(10 * typographyScale * 10) / 10,
    fontFamily: brand.fontFamily,
    letterSpacing: 0,
  };

  ["logoSize", "headingSize", "bodySize", "captionSize", "fontSize"].forEach(
    (key) => {
      if (typeof brandAwareDefaults[key] === "number") {
        brandAwareDefaults[key] =
          Math.round(brandAwareDefaults[key] * typographyScale * 10) / 10;
      }
    },
  );

  if (block.type === "header") {
    brandAwareDefaults.logoColor = brand.primaryColor;
  }

  if (block.type === "hero") {
    brandAwareDefaults.backgroundColor = brand.primaryColor;
    brandAwareDefaults.buttonColor = brand.accentColor;
    brandAwareDefaults.buttonTextColor = brand.primaryColor;
  }

  if (block.type === "text") {
    brandAwareDefaults.headingColor = brand.primaryColor;
    brandAwareDefaults.bodyColor = brand.textColor;
  }

  if (block.type === "button") {
    brandAwareDefaults.buttonColor = brand.primaryColor;
  }

  if (block.type === "columns") {
    brandAwareDefaults.headingColor = brand.primaryColor;
    brandAwareDefaults.bodyColor = brand.textColor;
  }

  if (block.type === "calendar") {
    brandAwareDefaults.headingColor = brand.primaryColor;
    brandAwareDefaults.dateColor = brand.primaryColor;
    brandAwareDefaults.bodyColor = brand.textColor;
  }

  if (block.type === "footer") {
    brandAwareDefaults.backgroundColor = brand.primaryColor;
  }

  return {
    ...brandAwareDefaults,
    ...(block.blockStyle ?? {}),
  };
}

export const columnContentCatalog = [
  { type: "text", label: "Text" },
  { type: "panel", label: "Content panel" },
  { type: "image", label: "Image" },
  { type: "button", label: "Button" },
  { type: "divider", label: "Divider" },
  { type: "spacer", label: "Spacer" },
];

const columnContentDefaults = {
  text: {
    eyebrow: "COLUMN CONTENT",
    heading: "Add a heading",
    body: "Add useful supporting copy for families and staff.",
    align: "left",
    listStyle: "none",
  },
  panel: {
    title: "Content panel",
    body: "Add useful information here.",
    badge: "",
    image: "",
    imageAlt: "Content panel image",
    showImagePlaceholder: false,
    itemType: "none",
    items: [],
    fieldBindings: {},
  },
  image: {
    src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=900&q=85",
    alt: "School community",
    caption: "",
  },
  button: {
    text: "Learn more",
    url: "https://example.org",
    align: "left",
    style: "filled",
  },
  divider: {
    color: "#DCE4EB",
  },
  spacer: {
    height: 24,
  },
};

export function createColumnContent(type) {
  return {
    id: `column-${type}-${crypto.randomUUID()}`,
    type,
    props: { ...columnContentDefaults[type] },
  };
}

export function migrateDesign(source) {
  const design = JSON.parse(JSON.stringify(source));
  design.brand = {
    ...starterDesign.brand,
    ...(design.brand ?? {}),
  };
  design.blocks = (design.blocks ?? []).flatMap((block) => {
    if (block.type === "staffMemo") {
      return createEditableStaffMemoBlocks(block.props);
    }

    const hasLegacyDates =
      block.type === "columns" &&
      ("leftTitle" in (block.props ?? {}) ||
        "rightTitle" in (block.props ?? {}) ||
        "leftEyebrow" in (block.props ?? {}));

    if (hasLegacyDates) {
      return {
        ...block,
        type: "calendar",
      };
    }

    if (block.type === "columns" && !Array.isArray(block.props?.columns)) {
      return {
        ...block,
        props: JSON.parse(JSON.stringify(defaults.columns)),
      };
    }

    return {
      ...block,
      props: {
        ...(defaults[block.type] ?? {}),
        ...(block.props ?? {}),
      },
    };
  });
  return design;
}

export function synchronizeDesignFields(source) {
  const design = JSON.parse(JSON.stringify(source));
  if (!design.fields) return design;

  design.blocks.forEach((block) => {
    Object.entries(block.fieldBindings ?? {}).forEach(([propKey, fieldKey]) => {
      design.fields[fieldKey] = block.props?.[propKey];
    });

    if (block.type === "columns") {
      (block.props?.columns ?? []).forEach((column) => {
        (column.blocks ?? []).forEach((content) => {
          Object.entries(content.props?.fieldBindings ?? {}).forEach(
            ([propKey, fieldKey]) => {
              design.fields[fieldKey] = content.props?.[propKey];
            },
          );
        });
      });
    }
  });

  return design;
}

export function createBlock(type) {
  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    props: JSON.parse(JSON.stringify(defaults[type])),
    blockStyle: {},
  };
}
