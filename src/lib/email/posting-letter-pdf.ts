import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type PostingLetterDocument = {
  institutionName: string;
  departmentName: string;
  programmeName: string;
  reference: string;
  issueDate: Date;
  hostOrganisation: {
    name: string;
    address: string | null;
    city: string | null;
    country: string | null;
  };
  student: {
    name: string;
    matricNumber: string;
  };
  cycle: {
    academicYear: string;
    requiredHours: number;
    startDate: Date;
    endDate: Date;
  };
  fieldSupervisorName: string | null;
  academicSupervisorName: string | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 58;

function date(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function createPostingLetterPdf(letter: PostingLetterDocument): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Posting Letter ${letter.reference}`);
  pdf.setAuthor(letter.institutionName);
  pdf.setSubject("Official practicum placement posting letter");
  pdf.setCreator("PracticumOS");

  const regular = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };
  const write = (text: string, font = regular, size = 10.5, leading = 15, indent = 0) => {
    const lines = wrap(text, font, size, PAGE_WIDTH - MARGIN * 2 - indent);
    if (y - lines.length * leading < MARGIN) addPage();
    for (const line of lines) {
      page.drawText(line, { x: MARGIN + indent, y, font, size, color: rgb(0.08, 0.11, 0.16) });
      y -= leading;
    }
  };
  const gap = (amount = 10) => { y -= amount; };

  page.drawText(letter.institutionName.toUpperCase(), {
    x: MARGIN,
    y,
    size: 15,
    font: bold,
    color: rgb(0.02, 0.25, 0.16),
  });
  y -= 21;
  write(letter.departmentName, bold, 10, 13);
  write("Directorate of Field Education, Practicum & Community Welfare", regular, 9, 12);
  y -= 3;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1.5, color: rgb(0.02, 0.25, 0.16) });
  gap(24);

  page.drawText(`Ref No: ${letter.reference}`, { x: MARGIN, y, size: 10, font: bold });
  const dateText = `Date: ${date(letter.issueDate)}`;
  page.drawText(dateText, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(dateText, 10), y, size: 10, font: regular });
  gap(34);

  write("The Field Practice Coordinator / Executive Director,", bold, 10.5);
  write(letter.hostOrganisation.name, bold, 10.5);
  if (letter.hostOrganisation.address) write(letter.hostOrganisation.address, regular, 10.5);
  write([letter.hostOrganisation.city, letter.hostOrganisation.country].filter(Boolean).join(", ") || "Nigeria", regular, 10.5);
  gap(24);

  const subject = "OFFICIAL POSTING & INTRODUCTION FOR SUPERVISED FIELD PRACTICUM";
  const subjectWidth = bold.widthOfTextAtSize(subject, 10.5);
  page.drawText(subject, { x: Math.max(MARGIN, (PAGE_WIDTH - subjectWidth) / 2), y, size: 10.5, font: bold });
  gap(24);

  write("Dear Sir/Madam,", regular, 10.5);
  gap(11);
  write(
    `The Directorate of Field Education in the Department of Social Work presents its highest compliments. We are pleased to introduce ${letter.student.name} (Matriculation Number: ${letter.student.matricNumber}), who has been formally approved and posted to your organisation for mandatory supervised field practicum.`,
  );
  gap(10);
  write(
    `The ${letter.programmeName} practicum for the ${letter.cycle.academicYear} academic session requires ${letter.cycle.requiredHours} verified hours of supervised practice from ${date(letter.cycle.startDate)} to ${date(letter.cycle.endDate)}.`,
  );
  gap(10);
  write(
    `The designated field supervisor is ${letter.fieldSupervisorName ?? "to be designated by the host organisation"}; the academic supervisor liaison is ${letter.academicSupervisorName ?? "the faculty field education team"}. We kindly request that practice hours are verified and formative assessment is provided through the approved practicum process.`,
  );
  gap(10);
  write("Thank you for your partnership in nurturing ethical and competent practitioners.");
  gap(29);
  write("Yours faithfully,", regular, 10.5);
  gap(36);
  write("Director of Field Education & Practicum", bold, 10.5);
  write(letter.institutionName, regular, 10);

  const pages = pdf.getPages();
  pages.forEach((currentPage, index) => {
    const number = `PracticumOS official document | ${index + 1} of ${pages.length}`;
    currentPage.drawText(number, {
      x: MARGIN,
      y: 28,
      size: 8,
      font: regular,
      color: rgb(0.35, 0.39, 0.45),
    });
  });

  return Buffer.from(await pdf.save());
}
