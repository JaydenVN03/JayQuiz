"use client";

import ExcelJS from "exceljs";
import JSZip from "jszip";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { importQuizQuestionsFromExcel, type AdminFormState } from "@/app/admin/actions";
import {
  QUIZ_EXCEL_HEADERS,
  QUIZ_EXCEL_TEMPLATE_INSTRUCTIONS,
} from "@/lib/data/quiz-excel";

const initialState: AdminFormState = { success: false, message: "" };
const QUIZ_EXCEL_MAX_ROWS = 500;
const lastQuestionRow = QUIZ_EXCEL_MAX_ROWS + 1;
const QUIZ_EXCEL_VALIDATIONS = [
  `<dataValidation type="list" allowBlank="0" showDropDown="0" showInputMessage="1" showErrorMessage="1" errorStyle="stop" promptTitle="Loại câu hỏi" prompt="Chọn một loại trong danh sách." errorTitle="Loại câu hỏi không hợp lệ" error="Hãy chọn một giá trị trong danh sách." sqref="B2:B${lastQuestionRow}"><formula1>"single_choice,multiple_choice,true_false"</formula1></dataValidation>`,
  `<dataValidation type="list" allowBlank="1" showDropDown="0" showInputMessage="1" showErrorMessage="1" errorStyle="stop" promptTitle="Độ khó" prompt="Chọn easy, medium, hard hoặc để trống." errorTitle="Độ khó không hợp lệ" error="Hãy chọn một giá trị trong danh sách hoặc để trống." sqref="C2:C${lastQuestionRow}"><formula1>"easy,medium,hard"</formula1></dataValidation>`,
].join("");

async function downloadTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JayQuiz";
  const questionsSheet = workbook.addWorksheet("Cau hoi");
  questionsSheet.addRow(QUIZ_EXCEL_HEADERS);
  questionsSheet.getRow(1).font = { bold: true };
  questionsSheet.views = [{ state: "frozen", ySplit: 1 }];
  questionsSheet.columns = QUIZ_EXCEL_HEADERS.map((header, index) => ({
    header,
    width: index === 0 ? 48 : index < 4 ? 22 : 18,
  }));

  const instructionsSheet = workbook.addWorksheet("Huong dan");
  instructionsSheet.addRows(QUIZ_EXCEL_TEMPLATE_INSTRUCTIONS);
  instructionsSheet.getRow(1).font = { bold: true };
  instructionsSheet.columns = [{ width: 28 }, { width: 88 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const worksheetFile = zip.file("xl/worksheets/sheet1.xml");
  if (!worksheetFile) throw new Error("Không thể tạo sheet câu hỏi trong file Excel.");
  const worksheetXml = await worksheetFile.async("string");
  if (!worksheetXml.includes("</sheetData>")) {
    throw new Error("Không thể thêm danh sách chọn vào file Excel.");
  }
  const validationXml = `<dataValidations count="2">${QUIZ_EXCEL_VALIDATIONS}</dataValidations>`;
  zip.file(
    "xl/worksheets/sheet1.xml",
    worksheetXml.replace("</sheetData>", `</sheetData>${validationXml}`),
  );
  const file = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mau-import-cau-hoi.xlsx";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function QuizExcelImport({ quizId }: { quizId: string }) {
  const [state, action, pending] = useActionState(importQuizQuestionsFromExcel, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <section aria-label="Nhập câu hỏi từ Excel" className="admin-excel-import">
      <div className="admin-excel-import-heading">
        <div>
          <h3>Thêm câu hỏi từ Excel</h3>
          <p>Chọn ô ở cột loại hoặc độ khó để hiện mũi tên xổ xuống. Tối đa 500 câu hỏi mỗi file.</p>
        </div>
      </div>
      <form action={action} className="admin-excel-import-form" ref={formRef}>
        <input name="quiz_id" type="hidden" value={quizId} />
        <label className="admin-field">
          File Excel (.xlsx, tối đa 5 MB)
          <input accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" name="excel_file" required type="file" />
        </label>
        <div className="admin-excel-actions">
          <button className="button button-primary" disabled={pending || !quizId} type="submit">
            {pending ? "Đang nhập..." : "Nhập câu hỏi"}
          </button>
          <button className="button button-secondary" onClick={() => void downloadTemplate()} type="button">
            Tải biểu mẫu Excel
          </button>
        </div>
      </form>
      {state.message && (
        <div aria-live="polite" className={`admin-form-message ${state.success ? "is-success" : "is-error"}`}>
          <p>{state.message}</p>
          {state.success && (
            <Link className="text-link" href="/admin/questions">
              Quản lý câu hỏi và xuất bản hàng loạt ↗
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
