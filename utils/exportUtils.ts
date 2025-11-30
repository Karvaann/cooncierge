import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

// CSV
export const exportCSV = (data: any[], fileName: string) => {
  const header = Object.keys(data[0]).join(",");
  const rows = data
    .map((row) => Object.values(row).join(","))
    .join("\n");

  const csv = `${header}\n${rows}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${fileName}.csv`);
};

// PDF
export const exportPDF = (data: any[], fileName: string) => {
  const doc = new jsPDF();

  doc.text(fileName, 14, 10);
  autoTable(doc, {
    head: [Object.keys(data[0])],
    body: data.map((row) => Object.values(row)),
    startY: 20,
  });

  doc.save(`${fileName}.pdf`);
};

// DOCX
export const exportDOCX = async (data: any[], fileName: string) => {
  const headers = Object.keys(data[0]);

  const tableRows = [
    new TableRow({
      children: headers.map(
        (h) => new TableCell({ children: [new Paragraph(h)] })
      ),
    }),
    ...data.map(
      (row) =>
        new TableRow({
          children: Object.values(row).map(
            (cell) =>
              new TableCell({
                children: [new Paragraph(String(cell))],
              })
          ),
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [new Table({ rows: tableRows })],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

// EXCEL (.xlsx)
export const exportXLSX = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName}.xlsx`);
};
