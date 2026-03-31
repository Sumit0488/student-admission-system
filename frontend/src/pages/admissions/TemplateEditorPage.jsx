import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  CheckCircle,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Minus,
  Type,
  Table2,
  Image,
  Upload,
  Move,
  Lock,
  Unlock,
  AlignCenter as CenterIcon,
} from 'lucide-react';
import { Rnd } from 'react-rnd';
import {
  getTemplate,
  createTemplate,
  updateTemplate,
  uploadPdfTemplate,
} from '../../services/admissionsApi';

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, toast: add };
}
function Toasts({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium pointer-events-auto
          ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {t.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

const toKey = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
const EMPTY_FIELD = {
  name: '',
  key: '',
  type: 'text',
  required: true,
  editable: true,
  regex: '',
  options: [],
};

function suggestType(name) {
  const n = name.toLowerCase();
  if (
    n.includes('date') ||
    n.includes('dob') ||
    n.includes('birth') ||
    n.includes('joining') ||
    n.includes('leaving') ||
    n.includes('admission')
  )
    return 'date';
  if (
    n.includes('year') ||
    n.includes('sem') ||
    n.includes('age') ||
    n.includes('count') ||
    n.includes('number') ||
    n.includes('no.') ||
    n.includes(' no')
  )
    return 'number';
  if (
    n.includes('status') ||
    n.includes('category') ||
    n.includes('caste') ||
    n.includes('gender') ||
    n.includes('religion') ||
    n.includes('class') ||
    n.includes('grade')
  )
    return 'dropdown';
  if (
    n.startsWith('is_') ||
    n.includes('boolean') ||
    n.includes('eligible') ||
    n.includes('hostel') ||
    n.includes('transport')
  )
    return 'boolean';
  if (
    n.includes('remark') ||
    n.includes('address') ||
    n.includes('note') ||
    n.includes('comment') ||
    n.includes('description') ||
    n.includes('reason')
  )
    return 'textarea';
  return 'text';
}
const TYPE_HINTS = {
  text: 'Name, USN, branch, phone, email',
  number: 'Year, semester, roll number',
  date: 'DOB, admission date, leaving date',
  boolean: 'Yes / No values',
  dropdown: 'Category, status, caste — add options →',
  textarea: 'Remarks, address, long text',
};
const toLabel = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const extractKeys = (html) => {
  const matches = [...html.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
};
const EDITOR_TABS = ['Notes', 'Layout', 'Preview'];

// ─── Page system ──────────────────────────────────────────────────────────────
const PAGE_SEP_RE = /<div[^>]*class="page-break"[^>]*>[\s\S]*?<\/div>/gi;
const PAGE_SEP_HTML =
  '<div class="page-break" contenteditable="false" ' +
  'style="margin:20px 0;border-top:2px dashed #93c5fd;text-align:center;' +
  'font-size:11px;color:#60a5fa;padding:6px 0;letter-spacing:2px;user-select:none;">' +
  '─── Page Break ───</div>';
const parseNotesToPages = (html) => {
  if (!html) return [''];
  const parts = html.split(PAGE_SEP_RE);
  return parts.length > 0 ? parts : [''];
};

// All keys available from the student schema — grouped by category
const SCHEMA_KEY_GROUPS = [
  {
    group: 'Identity',
    color: 'blue',
    keys: [
      { key: 'student_name', label: 'Student Name', hint: 'Full name of the student' },
      { key: 'usn', label: 'USN / Roll No', hint: 'Unique student number' },
      { key: 'father_name', label: 'Father Name', hint: 'student.fatherName' },
      { key: 'email', label: 'College Email', hint: 'Institutional email' },
      { key: 'phone', label: 'Phone', hint: 'student.phone (+91XXXXXXXXXX)' },
      { key: 'address', label: 'Full Address', hint: 'student.address' },
      { key: 'place', label: 'Place (city)', hint: 'Last part of address' },
    ],
  },
  {
    group: 'Personal Details',
    color: 'pink',
    keys: [
      { key: 'dob', label: 'DOB', hint: 'e.g. "15 March 2001"' },
      { key: 'dob_in_words', label: 'DOB in Words', hint: 'e.g. "15 March 2001"' },
      { key: 'date_of_birth', label: 'Date of Birth', hint: 'Alias for dob' },
      {
        key: 'date_of_birth_in_words',
        label: 'Date of Birth (in words)',
        hint: 'Alias for dob_in_words',
      },
      { key: 'gender', label: 'Gender', hint: 'student.gender' },
      { key: 'religion', label: 'Religion', hint: 'student.religion' },
      { key: 'caste', label: 'Caste / Category', hint: 'student.caste' },
    ],
  },
  {
    group: 'Academic',
    color: 'green',
    keys: [
      { key: 'branch', label: 'Branch (full name)', hint: 'e.g. Computer Science and Engineering' },
      { key: 'program', label: 'Program Code', hint: 'e.g. CSE, ECE, MECH' },
      { key: 'program_full_name', label: 'Program Full Name', hint: 'Same as Branch' },
      { key: 'department', label: 'Department', hint: 'Alias for Branch' },
      { key: 'degree', label: 'Degree', hint: 'e.g. BE, MBA, MCA' },
      { key: 'batch', label: 'Batch', hint: 'e.g. 2022-26' },
      { key: 'academic_year', label: 'Academic Year', hint: 'e.g. 2024-25' },
    ],
  },
  {
    group: 'Term / Semester',
    color: 'purple',
    keys: [
      { key: 'current_term', label: 'Current Term', hint: 'e.g. 3rd Semester' },
      { key: 'semester', label: 'Semester (number)', hint: 'e.g. 3' },
      { key: 'year', label: 'Year of Study', hint: 'e.g. 2nd Year' },
      { key: 'year_number', label: 'Year (number)', hint: 'e.g. 2' },
    ],
  },
  {
    group: 'Dates & Status',
    color: 'amber',
    keys: [
      { key: 'date_of_admission', label: 'Date of Admission', hint: 'student.admissionDate' },
      {
        key: 'date_of_leaving_the_institute',
        label: 'Date of Leaving',
        hint: 'student.lastJoiningDate',
      },
      { key: 'current_date', label: "Today's Date", hint: 'Auto — date of download' },
      { key: 'date', label: 'Date (alias)', hint: 'Same as current_date' },
      { key: 'status', label: 'Admission Status', hint: 'Live / Completed / etc.' },
    ],
  },
  {
    group: 'Certificate',
    color: 'slate',
    keys: [
      { key: 'ref_no', label: 'Reference No', hint: 'Certificate ref number' },
      { key: 'purpose', label: 'Purpose', hint: 'Reason for certificate' },
    ],
  },
];

// Flat list kept for autocomplete (unchanged usage)
const SCHEMA_KEYS = SCHEMA_KEY_GROUPS.flatMap((g) => g.keys);

// ─── Table grid picker ────────────────────────────────────────────────────────
const MAX_GRID = 8;
function TablePicker({ onSelect }) {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  return (
    <div
      className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl p-3 z-50"
      onMouseLeave={() => setHover({ r: 0, c: 0 })}
    >
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MAX_GRID}, 18px)`, gap: 3 }}>
        {Array.from({ length: MAX_GRID }).map((_, r) =>
          Array.from({ length: MAX_GRID }).map((__, c) => (
            <div
              key={`${r}-${c}`}
              onMouseEnter={() => setHover({ r, c })}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(r + 1, c + 1);
              }}
              className={`w-[18px] h-[18px] rounded-sm border cursor-pointer transition-colors
                ${
                  r <= hover.r && c <= hover.c
                    ? 'bg-blue-400 border-blue-500'
                    : 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600'
                }`}
            />
          ))
        )}
      </div>
      <p className="text-xs text-center text-gray-500 dark:text-slate-400 mt-2 font-medium">
        {hover.r + 1} × {hover.c + 1} Table
      </p>
    </div>
  );
}

// ─── Rich-text toolbar button ─────────────────────────────────────────────────
function TBtn({ icon: Icon, title, cmd, val, active }) {
  const exec = (e) => {
    e.preventDefault();
    document.execCommand(cmd, false, val || null);
  };
  return (
    <button
      onMouseDown={exec}
      title={title}
      className={`p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-slate-600
        ${active ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'text-gray-600 dark:text-slate-300'}`}
    >
      <Icon size={15} />
    </button>
  );
}

function TBtnCustom({ children, title, onMouseDown, active }) {
  return (
    <button
      onMouseDown={onMouseDown}
      title={title}
      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-slate-600
        ${active ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'text-gray-600 dark:text-slate-300'}`}
    >
      {children}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TemplateEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { toasts, toast } = useToast();

  const [activeTab, setActiveTab] = useState('Notes');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [autoStatus, setAutoStatus] = useState(''); // '' | 'saving' | 'saved'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [fields, setFields] = useState([]);

  const [autoSuggest, setAutoSuggest] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [autoComplete, setAutoComplete] = useState({
    show: false,
    prefix: '',
    keys: [],
    x: 0,
    y: 0,
  });
  const [tableToolbar, setTableToolbar] = useState({ show: false, x: 0, y: 0 });

  const [pdfUploading, setPdfUploading] = useState(false);
  const [images, setImages] = useState([]); // floating draggable images
  const [selectedImg, setSelectedImg] = useState(null); // id of selected image

  const pageRefs = useRef([]); // pageRefs.current[i] = DOM element for page i
  const autoTimer = useRef(null);
  const savedId = useRef(isNew ? null : id);
  const contentInitialized = useRef(false); // tracks whether page divs have been seeded with notes content
  const imgInputRef = useRef(null);
  const floatImgRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Helper: get the currently focused page's DOM element
  const getActiveEditor = () => pageRefs.current[activePage];

  // Serialize all page divs into a single notes string (page-break-separated)
  const serializePages = () =>
    Array.from({ length: pageCount }, (_, i) => pageRefs.current[i]?.innerHTML || '').join(
      PAGE_SEP_HTML
    );

  // Build the complete HTML structure exactly as requested
  const buildFullHtml = (rawNotes, currentImages) => {
    // ── Classify images into three groups ───────────────────────────────────
    // Banner : wide image near top (≥ 70% of 794px page width = 556px).
    //          Rendered FLUSH to all four page edges (compensates for padding).
    // Logo   : narrow image near top (y < 200, width < 556px).
    //          Rendered as an in-flow table: left-logo | gap | right-logo.
    // Body   : image lower on the page (y ≥ 200).
    //          Kept as position:absolute (decorative stamps, seals, etc.).
    const PAGE_W = 794;
    const BANNER_W = Math.round(PAGE_W * 0.7); // 556 px threshold
    const PAD_TOP = 60;
    const PAD_SIDE = 70;
    const sorted = [...(currentImages || [])].sort((a, b) => a.x - b.x);
    const headerImgs = sorted.filter((img) => img.y < 200);
    const bodyImgs = sorted.filter((img) => img.y >= 200);
    const bannerImgs = headerImgs.filter((img) => img.width >= BANNER_W);
    const logoImgs = headerImgs.filter((img) => img.width < BANNER_W);

    // Banner — negative margins cancel the .page padding so the image reaches
    // the physical edge of the page (top + left + right).
    const bannerHtml = bannerImgs
      .map(
        (img) =>
          `<div style="margin:-${PAD_TOP}px -${PAD_SIDE}px 12px -${PAD_SIDE}px;line-height:0;">` +
          `<img src="${img.src}" style="width:100%;display:block;" /></div>`
      )
      .join('');

    // Logo table — in-flow, left logo | empty centre | right logo
    let headerTableHtml = '';
    if (logoImgs.length >= 2) {
      const L = logoImgs[0];
      const R = logoImgs[logoImgs.length - 1];
      headerTableHtml =
        `<table style="width:100%;border:none;border-collapse:collapse;margin:0 0 6px 0;table-layout:fixed;"><tr>` +
        `<td style="border:none;padding:0;text-align:left;width:${L.width}px;vertical-align:middle;">` +
        `<img src="${L.src}" width="${L.width}" height="${L.height}" style="display:block;" /></td>` +
        `<td style="border:none;padding:0;"></td>` +
        `<td style="border:none;padding:0;text-align:right;width:${R.width}px;vertical-align:middle;">` +
        `<img src="${R.src}" width="${R.width}" height="${R.height}" style="display:block;margin-left:auto;" /></td>` +
        `</tr></table>`;
    } else if (logoImgs.length === 1) {
      const img = logoImgs[0];
      const side = img.x > PAGE_W / 2 ? 'right' : 'left';
      headerTableHtml =
        `<table style="width:100%;border:none;border-collapse:collapse;margin:0 0 6px 0;"><tr>` +
        `<td style="border:none;padding:0;text-align:${side};vertical-align:middle;">` +
        `<img src="${img.src}" width="${img.width}" height="${img.height}" ` +
        `style="display:block;${side === 'right' ? 'margin-left:auto;' : ''}" /></td></tr></table>`;
    }

    // Body images — absolute (seals, watermarks, decorative stamps)
    const imgsHtml = bodyImgs
      .map(
        (img) =>
          `<img src="${img.src}" style="position:absolute;left:${img.x}px;top:${img.y}px;` +
          `width:${img.width}px;height:${img.height}px;z-index:10;pointer-events:none;" />`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 794px;
      min-height: 1123px;   /* A4 height as minimum — content can grow beyond */
      height: auto;         /* let content dictate actual height               */
      margin: auto;
      padding: 60px 70px;
      box-sizing: border-box;
      position: relative;
      background: white;
      overflow: visible;    /* never clip — Puppeteer handles multi-page flow  */
      font-size: 14px;
      line-height: 1.7;
    }
    .center { text-align: center; }
    /* Table-based row is more reliable than flex in Puppeteer's print context.
       flex can squeeze the container width slightly, wrapping the right-side
       element (e.g. Date) onto a new line.  Table cells never wrap. */
    .row          { display: table; width: 100%; table-layout: fixed; }
    .row > *      { display: table-cell; vertical-align: top; white-space: nowrap; }
    .row > *:last-child { text-align: right; }
    .page-break { page-break-after: always; break-after: page; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; vertical-align: top; }
    th { background: #f8fafc; font-weight: 600; text-align: left; }
    /* Match editor paragraph spacing ([&_p]:my-1.5 = 6px top + 6px bottom).
       Also preserve empty-paragraph height so they don't collapse in print. */
    p { margin: 6px 0; }
    p:empty::before { content: '\\00a0'; }
  </style>
</head>
<body>
  <div class="page">
    ${imgsHtml}
    ${bannerHtml}
    ${headerTableHtml}
    ${rawNotes || ''}
  </div>
</body>
</html>`;
  };

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    getTemplate(id)
      .then(({ data }) => {
        const t = data.data;
        setName(t.name);
        setDescription(t.description || '');
        setNotes(t.notes || '');
        setStatus(t.status || 'DRAFT');
        setFields(t.fields || []);
        setImages(t.images || []);
        savedId.current = t._id;
        setPageCount(Math.max(1, parseNotesToPages(t.notes || '').length));
      })
      .catch(() => toast('Failed to load template', 'error'))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  // Sync all page divs → notes state (on blur)
  const syncPagesToState = () => {
    setNotes(serializePages());
  };

  // Populate page divs once after initial load.
  // Watches both `loading` and `notes` because they may arrive in separate React batches.
  // The contentInitialized guard prevents re-seeding on every keystroke.
  useEffect(() => {
    if (loading) {
      contentInitialized.current = false;
      return;
    }
    if (contentInitialized.current) return; // already seeded
    if (!isNew && !notes) return; // wait — notes hasn't arrived yet (different batch)
    contentInitialized.current = true;
    // rAF ensures the page divs are fully committed to the DOM before we write innerHTML
    requestAnimationFrame(() => {
      const pgs = parseNotesToPages(notes);
      pgs.forEach((html, i) => {
        if (pageRefs.current[i]) pageRefs.current[i].innerHTML = html;
      });
    });
  }, [loading, notes]); // eslint-disable-line

  // Auto-sync {{key}} placeholders from Notes → Layout fields
  useEffect(() => {
    const keys = extractKeys(notes);
    if (keys.length === 0) return;
    setFields((prev) => {
      const existingKeys = new Set(prev.map((f) => f.key));
      const newFields = keys
        .filter((k) => !existingKeys.has(k))
        .map((k) => ({
          name: toLabel(k),
          key: k,
          type: 'text',
          required: false,
          editable: true,
          regex: '',
          options: [],
        }));
      return newFields.length > 0 ? [...prev, ...newFields] : prev;
    });
  }, [notes]);

  // ── Auto-save (3 s debounce after changes) ────────────────────────────────
  const triggerAutoSave = useCallback(() => {
    if (!name.trim()) return;
    clearTimeout(autoTimer.current);
    setAutoStatus('saving');
    autoTimer.current = setTimeout(async () => {
      const currentNotes = serializePages();
      setNotes(currentNotes);
      const validFields = fields.filter((f) => f.name.trim() && f.key.trim());
      const payload = {
        name,
        description,
        notes: currentNotes,
        fullHtml: buildFullHtml(currentNotes, images),
        fields: validFields,
        images,
        status,
      };
      try {
        if (savedId.current && savedId.current !== 'new') {
          await updateTemplate(savedId.current, payload);
        } else {
          const { data } = await createTemplate(payload);
          savedId.current = data.data._id;
          navigate(`/admin/certificates/templates/${data.data._id}`, { replace: true });
        }
        setAutoStatus('saved');
        setTimeout(() => setAutoStatus(''), 2500);
      } catch {
        setAutoStatus('');
      }
    }, 3000);
  }, [name, description, fields, status, notes, navigate]); // eslint-disable-line

  // ── Manual save ───────────────────────────────────────────────────────────
  const handleSave = async (asStatus) => {
    if (!name.trim()) {
      toast('Template name is required', 'error');
      return;
    }
    clearTimeout(autoTimer.current);
    const currentNotes = serializePages();
    setNotes(currentNotes);
    const finalStatus = asStatus || status;
    const validFields = fields.filter((f) => f.name.trim() && f.key.trim());
    const payload = {
      name,
      description,
      notes: currentNotes,
      fullHtml: buildFullHtml(currentNotes, images),
      fields: validFields,
      images,
      status: finalStatus,
    };
    setSaving(true);
    try {
      if (isNew || !savedId.current) {
        const { data } = await createTemplate(payload);
        savedId.current = data.data._id;
        toast('Template created');
        navigate(`/admin/certificates/templates/${data.data._id}`, { replace: true });
      } else {
        await updateTemplate(savedId.current, payload);
        setStatus(finalStatus);
        toast('Template saved');
      }
      setAutoStatus('saved');
      setTimeout(() => setAutoStatus(''), 2500);
    } catch (err) {
      toast(err.response?.data?.error || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Field helpers ─────────────────────────────────────────────────────────
  const addField = () => setFields((p) => [...p, { ...EMPTY_FIELD }]);
  const removeField = (i) => setFields((p) => p.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) =>
    setFields((p) =>
      p.map((f, idx) => {
        if (idx !== i) return f;
        const u = { ...f, [key]: val };
        if (key === 'name' && toKey(f.key) === toKey(f.name)) u.key = toKey(val);
        return u;
      })
    );

  // Move overflow content from pageIdx to the next page
  const handlePageOverflow = (pageIdx) => {
    const page = pageRefs.current[pageIdx];
    if (!page || page.scrollHeight <= page.clientHeight) return;

    // Collect direct children that start at or below the page's visible bottom
    const pageRect = page.getBoundingClientRect();
    const threshold = pageRect.bottom - 4; // 4px tolerance
    const toMove = [];
    const kids = [...page.childNodes];

    let found = false;
    for (const child of kids) {
      if (found) {
        toMove.push(child);
        continue;
      }
      const rect = child.getBoundingClientRect?.();
      if (rect && rect.top >= threshold) {
        found = true;
        toMove.push(child);
      }
    }
    // If nothing found by position but page is still overflowing, take the last child
    if (toMove.length === 0 && kids.length > 1) toMove.push(kids[kids.length - 1]);
    if (toMove.length === 0) return;

    // Remove overflow nodes from current page
    toMove.forEach((n) => page.removeChild(n));

    // Ensure the next page exists
    const nextIdx = pageIdx + 1;
    if (nextIdx >= pageCount) setPageCount((p) => p + 1);
    setActivePage(nextIdx);

    // Defer until the new page div has rendered
    setTimeout(() => {
      const nextPage = pageRefs.current[nextIdx];
      if (!nextPage) return;
      // Prepend overflow nodes before existing content
      const first = nextPage.firstChild;
      toMove.forEach((n) => (first ? nextPage.insertBefore(n, first) : nextPage.appendChild(n)));
      // Focus and place cursor at end of moved content
      nextPage.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(nextPage);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      setNotes(serializePages());
    }, 30);
  };

  // Keyboard: Enter → <p>, Shift+Enter → <br>, Tab → spaces
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertParagraph');
      const idx = activePage;
      requestAnimationFrame(() => {
        const p = pageRefs.current[idx];
        if (p && p.scrollHeight > p.clientHeight) handlePageOverflow(idx);
      });
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br>');
      const idx = activePage;
      requestAnimationFrame(() => {
        const p = pageRefs.current[idx];
        if (p && p.scrollHeight > p.clientHeight) handlePageOverflow(idx);
      });
    }
  };

  // Insert a table at cursor
  const insertTable = (rows = 3, cols = 3) => {
    getActiveEditor()?.focus();
    const thead = `<tr>${Array(cols)
      .fill(0)
      .map(
        (_, i) =>
          `<th style="border:1px solid #cbd5e1;padding:8px 12px;background:#f8fafc;font-weight:600;text-align:left">Header ${i + 1}</th>`
      )
      .join('')}</tr>`;
    const tbody = Array(rows - 1)
      .fill(0)
      .map(
        () =>
          `<tr>${Array(cols)
            .fill(0)
            .map(
              () =>
                `<td style="border:1px solid #cbd5e1;padding:8px 12px;min-width:80px">&nbsp;</td>`
            )
            .join('')}</tr>`
      )
      .join('');
    const tableHtml = `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px"><thead>${thead}</thead><tbody>${tbody}</tbody></table><p></p>`;
    document.execCommand('insertHTML', false, tableHtml);
    setNotes(serializePages());
    triggerAutoSave();
  };

  // Insert an image (base64) at cursor
  const insertImage = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const editor = getActiveEditor();
      if (!editor) return;
      editor.focus();
      document.execCommand(
        'insertHTML',
        false,
        `<img src="${ev.target.result}" style="max-width:100%;height:auto;display:block;margin:8px 0;" />`
      );
      syncPagesToState();
    };
    reader.readAsDataURL(file);
  };

  // Insert a floating (draggable) image tracked in images[] state
  const insertFloatingImage = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      setImages((prev) => [
        ...prev,
        {
          id,
          src: ev.target.result,
          x: 60,
          y: 60,
          width: 200,
          height: 150,
          pageIndex: activePage,
          locked: false,
        },
      ]);
      setSelectedImg(id);
      triggerAutoSave();
    };
    reader.readAsDataURL(file);
  };

  const updateImage = (id, changes) =>
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...changes } : img)));

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedImg(null);
  };

  const centerImage = (id) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        return { ...img, x: Math.round((794 - img.width) / 2) };
      })
    );
  };

  // Upload a PDF and load its converted HTML into the editor
  const handlePdfUpload = async (file) => {
    if (!file) return;
    setPdfUploading(true);
    try {
      const { data } = await uploadPdfTemplate(file);
      if (!data.success) throw new Error(data.error || 'Conversion failed');

      // Inject the HTML into page 1 (reset to single page first)
      setPageCount(1);
      setNotes(data.html);
      // Also push directly into the DOM so the editor reflects it immediately
      requestAnimationFrame(() => {
        if (pageRefs.current[0]) {
          pageRefs.current[0].innerHTML = data.html;
          syncPagesToState();
        }
      });
      setActiveTab('Notes');
      if (data.warning) {
        toast(data.warning, 'error');
      } else {
        toast(
          `PDF imported — ${data.pages} page(s) converted. Review and adjust content.`,
          'success'
        );
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'PDF upload failed';
      toast(msg, 'error');
    } finally {
      setPdfUploading(false);
    }
  };

  // Add a new blank page after the current last page
  const addPage = () => {
    setNotes(serializePages()); // snapshot current content
    setPageCount((p) => p + 1);
    setActivePage(pageCount); // focus new page
    // New page initializes empty — no innerHTML needed
  };

  // Autocomplete detection — shared helper
  const detectAutoComplete = () => {
    const activeEl = getActiveEditor();
    if (!activeEl) return;
    const sel = window.getSelection();
    if (!sel?.rangeCount) {
      setAutoComplete((p) => ({ ...p, show: false }));
      return;
    }
    const range = sel.getRangeAt(0).cloneRange();
    const preRange = range.cloneRange();
    try {
      preRange.selectNodeContents(activeEl);
    } catch {
      return;
    }
    preRange.setEnd(range.endContainer, range.endOffset);
    const textBefore = preRange.toString();
    const match = textBefore.match(/\{\{([a-zA-Z0-9_]*)$/);
    if (match) {
      const prefix = match[1];
      const filtered = SCHEMA_KEYS.filter((k) => k.key.startsWith(prefix));
      if (filtered.length > 0) {
        range.collapse(true);
        const rect = range.getBoundingClientRect();
        setAutoComplete({ show: true, prefix, keys: filtered, x: rect.left, y: rect.bottom + 4 });
        return;
      }
    }
    setAutoComplete((p) => ({ ...p, show: false }));
  };

  // Per-page input handler
  const handlePageInput = (i) => {
    setActivePage(i);
    setNotes(serializePages());
    triggerAutoSave();
    detectAutoComplete();
    // Detect overflow from paste or other input
    requestAnimationFrame(() => {
      const p = pageRefs.current[i];
      if (p && p.scrollHeight > p.clientHeight) handlePageOverflow(i);
    });
  };

  // Complete a key from autocomplete suggestion
  const applyAutoComplete = (schemaKey) => {
    getActiveEditor()?.focus();
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const toDelete = autoComplete.prefix.length + 2; // {{ + prefix chars
    const newRange = document.createRange();
    newRange.setStart(range.endContainer, Math.max(0, range.endOffset - toDelete));
    newRange.setEnd(range.endContainer, range.endOffset);
    sel.removeAllRanges();
    sel.addRange(newRange);
    document.execCommand('insertText', false, `{{${schemaKey.key}}}`);
    setAutoComplete((p) => ({ ...p, show: false }));
    setNotes(serializePages());
    triggerAutoSave();
  };

  // ── Table editing helpers ─────────────────────────────────────────────────
  const findCellAtCursor = () => {
    const activeEl = getActiveEditor();
    const sel = window.getSelection();
    if (!sel?.rangeCount) return null;
    let node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && node !== activeEl) {
      if (node.tagName === 'TD' || node.tagName === 'TH') return node;
      node = node.parentElement;
    }
    return null;
  };

  const findTableAtCursor = () => {
    const activeEl = getActiveEditor();
    const cell = findCellAtCursor();
    if (cell) return cell.closest('table');
    const sel = window.getSelection();
    if (!sel?.rangeCount) return null;
    let node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && node !== activeEl) {
      if (node.tagName === 'TABLE') return node;
      node = node.parentElement;
    }
    return null;
  };

  const handleEditorClick = (_e) => {
    const table = findTableAtCursor();
    if (table) {
      const rect = table.getBoundingClientRect();
      setTableToolbar({ show: true, x: rect.left, y: rect.top - 44 });
    } else {
      setTableToolbar({ show: false, x: 0, y: 0 });
    }
  };

  const tableOp = (op) => {
    const cell = findCellAtCursor();
    const table = findTableAtCursor();
    if (!table) return;
    const row = cell?.closest('tr');
    const cols = table.rows[0]?.cells.length || 3;

    const newTd = () => {
      const td = document.createElement('td');
      td.style.cssText = 'border:1px solid #cbd5e1;padding:8px 12px;min-width:80px';
      td.innerHTML = '&nbsp;';
      return td;
    };
    const newTr = () => {
      const tr = document.createElement('tr');
      for (let i = 0; i < cols; i++) tr.appendChild(newTd());
      return tr;
    };

    switch (op) {
      case 'rowAbove':
        if (row) row.parentNode.insertBefore(newTr(), row);
        break;
      case 'rowBelow':
        if (row) row.parentNode.insertBefore(newTr(), row.nextSibling);
        break;
      case 'colLeft':
        if (cell)
          Array.from(table.rows).forEach((r) => r.insertBefore(newTd(), r.cells[cell.cellIndex]));
        break;
      case 'colRight':
        if (cell)
          Array.from(table.rows).forEach((r) => {
            const ref = r.cells[cell.cellIndex + 1];
            ref ? r.insertBefore(newTd(), ref) : r.appendChild(newTd());
          });
        break;
      case 'delRow':
        if (row && table.rows.length > 1) row.remove();
        break;
      case 'delCol':
        if (cell && cols > 1) {
          const ci = cell.cellIndex;
          Array.from(table.rows).forEach((r) => {
            if (r.cells[ci]) r.deleteCell(ci);
          });
        }
        break;
      case 'delTable':
        table.remove();
        setTableToolbar({ show: false, x: 0, y: 0 });
        break;
      default:
        break;
    }
    setNotes(serializePages());
    triggerAutoSave();
  };

  // Insert {{key}} into editor at cursor
  const insertKey = (key) => {
    getActiveEditor()?.focus();
    document.execCommand('insertText', false, `{{${key}}}`);
    setNotes(serializePages());
  };

  // Preview: replace {{key}} with highlighted sample
  const buildPreview = () => {
    const src = serializePages() || notes;
    let out = src;
    fields.forEach((f) => {
      if (f.key) {
        const sample =
          f.type === 'date' ? '[dd/mm/yyyy]' : f.type === 'number' ? '[0]' : `[${f.name || f.key}]`;
        out = out.replace(
          new RegExp(`\\{\\{${f.key}\\}\\}`, 'g'),
          `<mark style="background:#fef08a;color:#854d0e;border-radius:3px;padding:0 3px">${sample}</mark>`
        );
      }
    });
    out = out.replace(
      /\{\{([^}]+)\}\}/g,
      `<mark style="background:#fee2e2;color:#b91c1c;border-radius:3px;padding:0 3px">{{$1}}</mark>`
    );
    return out;
  };

  const inp = (err) =>
    `w-full px-3 py-2.5 text-sm rounded-xl border bg-gray-50 dark:bg-slate-700 dark:text-white
     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
     ${err ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'}`;

  if (loading)
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <>
      <Toasts toasts={toasts} />

      <div className="space-y-4 p-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/certificates')}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500">Certificates / Templates</p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isNew ? 'New Template' : name || 'Edit Template'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            {autoStatus === 'saving' && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Auto-saving...
              </span>
            )}
            {autoStatus === 'saved' && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={12} /> Saved
              </span>
            )}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                triggerAutoSave();
              }}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-600
                bg-gray-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="LIVE">LIVE</option>
            </select>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60 transition-colors"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── Meta ───────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  triggerAutoSave();
                }}
                placeholder="e.g. Study Certificate"
                className={inp(!name.trim())}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Description
              </label>
              <input
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  triggerAutoSave();
                }}
                placeholder="Short description"
                className={inp(false)}
              />
            </div>
          </div>
        </div>

        {/* ── Editor card ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center border-b border-gray-100 dark:border-slate-700 px-1 pt-1">
            {EDITOR_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  syncPagesToState();
                  setActiveTab(tab);
                }}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors relative
                  ${activeTab === tab ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
              >
                {tab === 'Notes' && <Type size={13} />}
                {tab === 'Layout' && <List size={13} />}
                {tab === 'Preview' && <Eye size={13} />}
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                )}
              </button>
            ))}
            {/* Upload PDF Template button */}
            <div className="ml-auto pr-2 pb-1">
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  handlePdfUpload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
              >
                {pdfUploading ? (
                  <>
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Converting...
                  </>
                ) : (
                  <>
                    <Upload size={12} /> Upload PDF Template
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── NOTES TAB ─────────────────────────────────────────────── */}
          <div style={{ display: activeTab === 'Notes' ? 'flex' : 'none' }} className="flex gap-0">
            {/* Editor column */}
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center flex-wrap gap-1 px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/30">
                <TBtn icon={Bold} title="Bold" cmd="bold" />
                <TBtn icon={Italic} title="Italic" cmd="italic" />
                <TBtn icon={Underline} title="Underline" cmd="underline" />
                <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1" />
                <TBtnCustom
                  title="Heading 1"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('formatBlock', false, 'h1');
                  }}
                >
                  H1
                </TBtnCustom>
                <TBtnCustom
                  title="Heading 2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('formatBlock', false, 'h2');
                  }}
                >
                  H2
                </TBtnCustom>
                <TBtnCustom
                  title="Paragraph"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand('formatBlock', false, 'p');
                  }}
                >
                  P
                </TBtnCustom>
                <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1" />
                <TBtn icon={AlignLeft} title="Align Left" cmd="justifyLeft" />
                <TBtn icon={AlignCenter} title="Align Center" cmd="justifyCenter" />
                <TBtn icon={AlignRight} title="Align Right" cmd="justifyRight" />
                <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1" />
                <TBtn icon={List} title="Bullet List" cmd="insertUnorderedList" />
                <TBtn icon={ListOrdered} title="Numbered List" cmd="insertOrderedList" />
                <TBtn icon={Minus} title="Horizontal Rule" cmd="insertHorizontalRule" />
                <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1" />
                {/* Table grid picker */}
                <div className="relative">
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowTablePicker((p) => !p);
                    }}
                    title="Insert Table"
                    className={`p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-slate-600
                        ${showTablePicker ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'text-gray-600 dark:text-slate-300'}`}
                  >
                    <Table2 size={15} />
                  </button>
                  {showTablePicker && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowTablePicker(false)}
                      />
                      <TablePicker
                        onSelect={(r, c) => {
                          insertTable(r, c);
                          setShowTablePicker(false);
                        }}
                      />
                    </>
                  )}
                </div>
                {/* Inline image (embedded in content) */}
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) insertImage(f);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  title="Insert Inline Image"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    imgInputRef.current?.click();
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300"
                >
                  <Image size={15} />
                </button>
                {/* Floating (draggable) image */}
                <input
                  ref={floatImgRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) insertFloatingImage(f);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  title="Insert Floating Image (draggable)"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    floatImgRef.current?.click();
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300"
                >
                  <Move size={15} />
                </button>
                {/* Add page */}
                <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1" />
                <TBtnCustom
                  title="Add New Page"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addPage();
                  }}
                >
                  +Page
                </TBtnCustom>
                {/* Font size */}
                <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1" />
                <select
                  defaultValue=""
                  onChange={(e) => {
                    document.execCommand('fontSize', false, e.target.value);
                    e.target.value = '';
                  }}
                  className="text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-2 py-1 focus:outline-none"
                >
                  <option value="" disabled>
                    Size
                  </option>
                  {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                    <option key={s} value={s}>
                      {['8', '10', '12', '14', '18', '24', '36'][s - 1]}px
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-page A4 area */}
              <div
                className="overflow-y-auto bg-gray-100 dark:bg-slate-900 p-6"
                style={{ minHeight: 520 }}
              >
                {Array.from({ length: pageCount }, (_, i) => (
                  <div key={i} className="mb-6 last:mb-2">
                    {/* Page label */}
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                        Page {i + 1} of {pageCount}
                      </span>
                      {pageCount > 1 && (
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setPageCount((p) => Math.max(1, p - 1));
                            setNotes(serializePages());
                          }}
                          className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                        >
                          Remove page
                        </button>
                      )}
                    </div>

                    {/* A4 page */}
                    <div
                      className="mx-auto bg-white dark:bg-slate-800 shadow-md text-gray-900 dark:text-slate-100 relative"
                      style={{
                        width: 794,
                        height: 1123,
                        overflow: 'visible',
                        padding: '60px 70px',
                        boxSizing: 'border-box',
                        fontSize: 14,
                        lineHeight: 1.7,
                        border: activePage === i ? '2px solid #3b82f6' : '2px solid transparent',
                        borderRadius: 2,
                      }}
                    >
                      <div
                        ref={(el) => {
                          pageRefs.current[i] = el;
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={() => handlePageInput(i)}
                        onBlur={syncPagesToState}
                        onKeyDown={handleKeyDown}
                        onClick={handleEditorClick}
                        onFocus={() => setActivePage(i)}
                        data-placeholder={
                          i === 0
                            ? 'Start writing your certificate content here...\n\nUse {{key}} placeholders for dynamic data.'
                            : 'Continue on page ' + (i + 1) + '...'
                        }
                        className="outline-none w-full min-h-[900px] focus:outline-none
                            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-center [&_h1]:my-3
                            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-2
                            [&_p]:my-1.5
                            [&_ul]:list-disc [&_ul]:pl-5
                            [&_ol]:list-decimal [&_ol]:pl-5
                            [&_hr]:my-4 [&_hr]:border-gray-300
                            [&_table]:w-full [&_table]:border-collapse [&_table]:my-3
                            [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:align-top
                            [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-50 [&_th]:font-semibold [&_th]:text-left
                            empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:whitespace-pre-line"
                      />
                      {/* Content-safe-zone guide — shown only when images exist on this page.
                            The A4 div has padding:60px top, so the content area starts at y=60.
                            Images that extend BELOW this line will overlap text in the PDF. */}
                      {images.some((img) => img.pageIndex === i) &&
                        (() => {
                          const PAGE_W = 794;
                          const BANNER_W = Math.round(PAGE_W * 0.7); // must match buildFullHtml
                          const CONTENT_Y = 60; // must match A4 div padding-top
                          const pageImgs = images.filter((img) => img.pageIndex === i);
                          const maxImgBot = Math.max(...pageImgs.map((img) => img.y + img.height));
                          const hasBanner = pageImgs.some(
                            (img) => img.y < 200 && img.width >= BANNER_W
                          );
                          const overlaps = !hasBanner && maxImgBot > CONTENT_Y;

                          // For banners: the guide line appears at the banner's own bottom edge
                          // so the user knows exactly where content will start in the PDF.
                          const guideY = hasBanner
                            ? Math.max(
                                ...pageImgs
                                  .filter((img) => img.width >= BANNER_W)
                                  .map((img) => img.y + img.height)
                              )
                            : CONTENT_Y;

                          const color = hasBanner ? '#22c55e' : overlaps ? '#f59e0b' : '#93c5fd';
                          const label = hasBanner
                            ? '✓ banner — content starts below this edge'
                            : overlaps
                              ? '⚠ logo extends into content area'
                              : 'content starts here';
                          const tooltip = hasBanner
                            ? 'Banner image: will be rendered full-width flush to the top edge in PDF. Content flows below it.'
                            : overlaps
                              ? `⚠ Logo extends past y=${CONTENT_Y}px. It will overlap text in the PDF unless moved higher.`
                              : `Content area starts at y=${CONTENT_Y}px. Images above this line are safe.`;

                          return (
                            <div
                              title={tooltip}
                              style={{
                                position: 'absolute',
                                top: guideY,
                                left: 0,
                                right: 0,
                                height: 0,
                                borderTop: `1.5px dashed ${color}`,
                                zIndex: 30,
                                pointerEvents: 'none',
                              }}
                            >
                              <span
                                style={{
                                  position: 'absolute',
                                  right: 6,
                                  top: 3,
                                  fontSize: 9,
                                  fontFamily: 'monospace',
                                  color,
                                  background: 'white',
                                  padding: '0 3px',
                                  borderRadius: 2,
                                  pointerEvents: 'none',
                                  userSelect: 'none',
                                }}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })()}

                      {/* Floating draggable images for this page */}
                      {images
                        .filter((img) => img.pageIndex === i)
                        .map((img) => (
                          <Rnd
                            key={img.id}
                            size={{ width: img.width, height: img.height }}
                            position={{ x: img.x, y: img.y }}
                            bounds="parent"
                            disableDragging={img.locked}
                            enableResizing={!img.locked}
                            onDragStop={(_e, d) => {
                              updateImage(img.id, { x: d.x, y: d.y });
                              triggerAutoSave();
                            }}
                            onResizeStop={(_e, _dir, ref, _delta, pos) => {
                              updateImage(img.id, {
                                width: ref.offsetWidth,
                                height: ref.offsetHeight,
                                x: pos.x,
                                y: pos.y,
                              });
                              triggerAutoSave();
                            }}
                            style={{ zIndex: selectedImg === img.id ? 20 : 10 }}
                            onMouseDown={() => setSelectedImg(img.id)}
                          >
                            <div className="relative w-full h-full group">
                              <img
                                src={img.src}
                                alt=""
                                className="w-full h-full object-contain select-none pointer-events-none"
                                draggable={false}
                              />
                              {/* Controls — shown on hover/select */}
                              <div
                                className={`absolute -top-7 left-0 flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-md px-1.5 py-1 transition-opacity
                                ${selectedImg === img.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                              >
                                <button
                                  type="button"
                                  title="Center horizontally"
                                  onClick={() => {
                                    centerImage(img.id);
                                    triggerAutoSave();
                                  }}
                                  className="p-0.5 rounded text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                  <CenterIcon size={12} />
                                </button>
                                <button
                                  type="button"
                                  title={img.locked ? 'Unlock' : 'Lock position'}
                                  onClick={() => updateImage(img.id, { locked: !img.locked })}
                                  className="p-0.5 rounded text-gray-500 hover:text-amber-500 transition-colors"
                                >
                                  {img.locked ? <Unlock size={12} /> : <Lock size={12} />}
                                </button>
                                <button
                                  type="button"
                                  title="Remove image"
                                  onClick={() => {
                                    removeImage(img.id);
                                    triggerAutoSave();
                                  }}
                                  className="p-0.5 rounded text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              {/* Resize / drag indicator */}
                              {!img.locked && (
                                <div
                                  className={`absolute inset-0 border-2 border-dashed border-blue-400 rounded pointer-events-none transition-opacity
                                  ${selectedImg === img.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                                />
                              )}
                            </div>
                          </Rnd>
                        ))}

                      {/* Page-end boundary — red dashed line at the bottom of the 1123px A4 boundary.
                            Content that visually flows below this line will print on the next PDF page. */}
                      <div
                        title="Page end — content below this line will print on the next PDF page"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 0,
                          borderTop: '2px dashed #ef4444',
                          zIndex: 50,
                          pointerEvents: 'none',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bottom: 4,
                            fontSize: 9,
                            fontFamily: 'monospace',
                            color: '#ef4444',
                            background: 'white',
                            padding: '1px 6px',
                            borderRadius: 2,
                            pointerEvents: 'none',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ── Page {i + 1} ends here — content below prints on next page ──
                        </span>
                      </div>

                      {/* Page number footer */}
                      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-gray-300 dark:text-slate-600 pointer-events-none select-none">
                        — {i + 1} —
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keys sidebar — always visible */}
            <div
              className="w-60 shrink-0 border-l border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/20 overflow-y-auto"
              style={{ maxHeight: 640 }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gray-50 dark:bg-slate-900/80 backdrop-blur-sm px-4 pt-3 pb-2 border-b border-gray-100 dark:border-slate-700 z-10">
                <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                  Available Variables
                </p>
                <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-0.5">
                  Click to insert into template
                </p>
              </div>

              {/* Grouped student schema keys */}
              {SCHEMA_KEY_GROUPS.map((group) => {
                const colorMap = {
                  blue: {
                    dot: 'bg-blue-500',
                    mono: 'text-blue-600 dark:text-blue-400',
                    hover: 'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                  },
                  pink: {
                    dot: 'bg-pink-500',
                    mono: 'text-pink-600 dark:text-pink-400',
                    hover: 'hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20',
                  },
                  green: {
                    dot: 'bg-green-500',
                    mono: 'text-green-600 dark:text-green-400',
                    hover: 'hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
                  },
                  purple: {
                    dot: 'bg-purple-500',
                    mono: 'text-purple-600 dark:text-purple-400',
                    hover: 'hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
                  },
                  amber: {
                    dot: 'bg-amber-500',
                    mono: 'text-amber-600 dark:text-amber-400',
                    hover: 'hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
                  },
                  slate: {
                    dot: 'bg-slate-400',
                    mono: 'text-slate-600 dark:text-slate-400',
                    hover: 'hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30',
                  },
                };
                const c = colorMap[group.color] || colorMap.blue;
                return (
                  <div
                    key={group.group}
                    className="border-b border-gray-100 dark:border-slate-700/60 last:border-b-0"
                  >
                    <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                      <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                        {group.group}
                      </p>
                    </div>
                    <div className="px-3 pb-2 space-y-1">
                      {group.keys.map((k) => (
                        <button
                          key={k.key}
                          onClick={() => insertKey(k.key)}
                          className={`w-full text-left bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 transition-colors ${c.hover}`}
                        >
                          <p className={`text-xs font-mono ${c.mono}`}>{`{{${k.key}}}`}</p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                            {k.label}
                          </p>
                          {k.hint && (
                            <p className="text-[9px] text-gray-300 dark:text-slate-600 mt-0.5 italic truncate">
                              {k.hint}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Custom fields (from Layout tab) */}
              {fields.filter((f) => f.key && !SCHEMA_KEYS.find((s) => s.key === f.key)).length >
                0 && (
                <div className="border-t border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-violet-500" />
                    <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                      Custom Fields
                    </p>
                  </div>
                  <div className="px-3 pb-4 space-y-1">
                    {fields
                      .filter((f) => f.key && !SCHEMA_KEYS.find((s) => s.key === f.key))
                      .map((f) => (
                        <button
                          key={f.key}
                          onClick={() => insertKey(f.key)}
                          className="w-full text-left bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                        >
                          <p className="text-xs font-mono text-violet-600 dark:text-violet-400">{`{{${f.key}}}`}</p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                            {f.name}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Table toolbar (fixed, above table) */}
            {tableToolbar.show && (
              <div
                style={{
                  position: 'fixed',
                  left: tableToolbar.x,
                  top: tableToolbar.y,
                  zIndex: 9999,
                }}
                className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl px-2 py-1.5"
              >
                {[
                  { op: 'rowAbove', label: '↑ Row' },
                  { op: 'rowBelow', label: '↓ Row' },
                  { op: 'colLeft', label: '← Col' },
                  { op: 'colRight', label: '→ Col' },
                ].map(({ op, label }) => (
                  <button
                    key={op}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      tableOp(op);
                    }}
                    className="px-2 py-1 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    {label}
                  </button>
                ))}
                <div className="w-px h-4 bg-gray-200 dark:bg-slate-600 mx-0.5" />
                {[
                  {
                    op: 'delRow',
                    label: '✕ Row',
                    cls: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40',
                  },
                  {
                    op: 'delCol',
                    label: '✕ Col',
                    cls: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40',
                  },
                  {
                    op: 'delTable',
                    label: '✕ Table',
                    cls: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40',
                  },
                ].map(({ op, label, cls }) => (
                  <button
                    key={op}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      tableOp(op);
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${cls}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Autocomplete dropdown (fixed, near cursor) */}
            {autoComplete.show && (
              <div
                style={{
                  position: 'fixed',
                  left: autoComplete.x,
                  top: autoComplete.y,
                  zIndex: 9999,
                }}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl py-1 min-w-[200px] max-h-48 overflow-y-auto"
              >
                {autoComplete.keys.map((k) => (
                  <button
                    key={k.key}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyAutoComplete(k);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{`{{${k.key}}}`}</span>
                    <span className="text-gray-400 dark:text-slate-500 text-xs">{k.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── LAYOUT TAB ────────────────────────────────────────────── */}
          <div style={{ display: activeTab === 'Layout' ? 'block' : 'none' }} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Dynamic Fields
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  Define data fields. Keys map to{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{{key}}'}</code> in
                  the Notes editor.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSuggest}
                    onChange={(e) => setAutoSuggest(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Auto-suggest type
                  </span>
                </label>
                <button
                  onClick={addField}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors"
                >
                  <Plus size={15} /> Add Field
                </button>
              </div>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                <p className="text-sm text-gray-400">
                  No fields yet — click &quot;+ Add Field&quot;
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-900/50">
                      {['Name', 'Key', 'Type', 'Regex / Options', 'Required', 'Editable', ''].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {fields.map((f, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/20">
                        <td className="px-3 py-2.5">
                          <input
                            value={f.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setFields((p) =>
                                p.map((fld, fi) => {
                                  if (fi !== idx) return fld;
                                  const u = { ...fld, name: newName };
                                  if (toKey(fld.key) === toKey(fld.name)) u.key = toKey(newName);
                                  if (autoSuggest && newName.length > 2)
                                    u.type = suggestType(newName);
                                  return u;
                                })
                              );
                            }}
                            placeholder="Student Name"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            value={f.key}
                            onChange={(e) => updateField(idx, 'key', toKey(e.target.value))}
                            placeholder="student_name"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={f.type}
                            onChange={(e) => updateField(idx, 'type', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="boolean">Boolean</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="textarea">Textarea</option>
                          </select>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 px-0.5 leading-tight">
                            {TYPE_HINTS[f.type]}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          {f.type === 'dropdown' ? (
                            <input
                              value={(f.options || []).join(', ')}
                              onChange={(e) =>
                                updateField(
                                  idx,
                                  'options',
                                  e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                              placeholder="SC, ST, OBC, GM"
                              title="Comma-separated options"
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : f.type === 'boolean' || f.type === 'textarea' ? (
                            <span className="text-gray-300 dark:text-slate-600 text-sm px-2">
                              —
                            </span>
                          ) : (
                            <input
                              value={f.regex || ''}
                              onChange={(e) => updateField(idx, 'regex', e.target.value)}
                              placeholder="Regex"
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={f.required ? 'yes' : 'no'}
                            onChange={(e) => updateField(idx, 'required', e.target.value === 'yes')}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={f.editable ? 'yes' : 'no'}
                            onChange={(e) => updateField(idx, 'editable', e.target.value === 'yes')}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => removeField(idx)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── PREVIEW TAB ───────────────────────────────────────────── */}
          <div
            style={{ display: activeTab === 'Preview' ? 'block' : 'none', minHeight: 560 }}
            className="bg-gray-100 dark:bg-slate-900 p-6 overflow-y-auto"
          >
            <div
              className="mx-auto bg-white dark:bg-slate-800 shadow-md"
              style={{
                width: 794,
                minHeight: 1123,
                padding: '40px',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: 14, lineHeight: 1.6, color: '#1e293b' }}>
                {notes ? (
                  <div dangerouslySetInnerHTML={{ __html: buildPreview() }} />
                ) : (
                  <p
                    style={{
                      color: '#94a3b8',
                      textAlign: 'center',
                      marginTop: 60,
                      fontStyle: 'italic',
                    }}
                  >
                    Write certificate content in the Notes tab to see a preview here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom action bar ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => navigate('/admin/certificates')}
            className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave('LIVE')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            <CheckCircle size={15} />
            {saving ? 'Publishing...' : 'Publish (LIVE)'}
          </button>
        </div>
      </div>
    </>
  );
}
