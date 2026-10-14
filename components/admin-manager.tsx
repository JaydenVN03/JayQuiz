"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useState } from "react";
import {
  bulkDeleteAdminContent,
  bulkPublishAdminContent,
  deleteAdminContent,
  saveAdminContent,
  type AdminFormState,
} from "@/app/admin/actions";
import { QuizExcelImport } from "@/components/quiz-excel-import";
import type { Database } from "@/lib/supabase/database.types";

type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Chapter = Database["public"]["Tables"]["chapters"]["Row"];
type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];
type Option = Database["public"]["Tables"]["options"]["Row"];
type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
type ContentStatus = Database["public"]["Enums"]["content_status"];
type Section = "subjects" | "chapters" | "quizzes" | "questions";

type AdminManagerProps = {
  section: Section;
  subjects: Subject[];
  chapters: Chapter[];
  quizzes: Quiz[];
  questions: Question[];
  options: Option[];
  quizQuestions: QuizQuestion[];
};

const initialState: AdminFormState = { success: false, message: "" };
const statusLabels: Record<ContentStatus, string> = {
  draft: "Bản nháp",
  published: "Đã xuất bản",
  archived: "Đã lưu trữ",
};
const questionTypeLabels: Record<Database["public"]["Enums"]["question_type"], string> = {
  single_choice: "Một đáp án",
  multiple_choice: "Nhiều đáp án",
  true_false: "Đúng / Sai",
};
const difficultyLabels: Record<NonNullable<Question["difficulty"]>, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};
const titles: Record<Section, { title: string; description: string }> = {
  subjects: { title: "Môn học", description: "Tạo và sắp xếp các môn học trong thư viện." },
  chapters: { title: "Chương", description: "Tổ chức nội dung theo chương và môn học." },
  quizzes: { title: "Bộ đề", description: "Tạo bộ đề trước, sau đó thêm câu hỏi bằng file Excel." },
  questions: { title: "Câu hỏi", description: "Quản lý câu hỏi, lựa chọn đáp án và lời giải." },
};
const singularLabels: Record<Section, string> = {
  subjects: "môn học",
  chapters: "chương",
  quizzes: "bộ đề",
  questions: "câu hỏi",
};

function StatusField({ value = "draft" }: { value?: string }) {
  return (
    <label className="admin-field">
      Trạng thái
      <select defaultValue={value} name="status">
        <option value="draft">Bản nháp</option>
        <option value="published">Đã xuất bản</option>
        <option value="archived">Đã lưu trữ</option>
      </select>
    </label>
  );
}

function TextField({
  label,
  name,
  value = "",
  required = false,
  type = "text",
  min,
  max,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  value?: string | number;
  required?: boolean;
  type?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  step?: number;
}) {
  return (
    <label className="admin-field">
      {label}
      <input
        defaultValue={value}
        max={max}
        min={min}
        name={name}
        placeholder={placeholder}
        required={required}
        step={step}
        type={type}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  value = "",
  required = false,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="admin-field admin-field-wide">
      {label}
      <textarea defaultValue={value} name={name} placeholder={placeholder} required={required} rows={rows} />
    </label>
  );
}

function SaveButton({ editing }: { editing: boolean }) {
  const [state, action, pending] = useActionState(saveAdminContent, initialState);
  return (
    <>
      <button className="button button-primary admin-save-button" disabled={pending} formAction={action} type="submit">
        {pending ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo nội dung"}
      </button>
      {state.message && (
        <p aria-live="polite" className={`admin-form-message ${state.success ? "is-success" : "is-error"}`}>
          {state.message}
        </p>
      )}
    </>
  );
}

function DeleteForm({ entity, id, name }: { entity: Section; id: string; name: string }) {
  const [state, action, pending] = useActionState(deleteAdminContent, initialState);
  return (
    <form action={action} className="admin-delete-form" onSubmit={(event) => {
      if (!window.confirm(`Bạn có chắc muốn xóa “${name}”? Nếu nội dung đang được sử dụng, hệ thống sẽ từ chối thao tác.`)) {
        event.preventDefault();
      }
    }}>
      <input name="entity" type="hidden" value={entity} />
      <input name="id" type="hidden" value={id} />
      <button className="admin-delete-button" disabled={pending} type="submit">
        {pending ? "Đang xóa..." : "Xóa"}
      </button>
      {state.message && (
        <p aria-live="polite" className={`admin-form-message ${state.success ? "is-success" : "is-error"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

function BulkDeleteForm({
  entity,
  ids,
  onDeleted,
}: {
  entity: Section;
  ids: string[];
  onDeleted: () => void;
}) {
  const [state, action, pending] = useActionState(bulkDeleteAdminContent, initialState);
  useEffect(() => {
    if (state.success) onDeleted();
  }, [onDeleted, state]);

  return (
    <form
      action={action}
      className="admin-bulk-delete-form"
      onSubmit={(event) => {
        if (!window.confirm(`Bạn có chắc muốn xóa ${ids.length} ${singularLabels[entity]} đã chọn? Nếu có mục đang được nội dung khác sử dụng, toàn bộ thao tác sẽ bị từ chối.`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="entity" type="hidden" value={entity} />
      {ids.map((id) => <input key={id} name="id" type="hidden" value={id} />)}
      <button className="admin-delete-button" disabled={pending || ids.length === 0} type="submit">
        {pending ? "Đang xóa..." : `Xóa mục đã chọn (${ids.length})`}
      </button>
      {state.message && (
        <p aria-live="polite" className={`admin-form-message ${state.success ? "is-success" : "is-error"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

function BulkPublishForm({
  entity,
  ids,
  onPublished,
}: {
  entity: Section;
  ids: string[];
  onPublished: () => void;
}) {
  const [state, action, pending] = useActionState(bulkPublishAdminContent, initialState);
  useEffect(() => {
    if (state.success) onPublished();
  }, [onPublished, state]);

  return (
    <form
      action={action}
      className="admin-bulk-delete-form"
      onSubmit={(event) => {
        if (!window.confirm(`Bạn có chắc muốn xuất bản ${ids.length} ${singularLabels[entity]} đã chọn? Bộ đề chưa đủ câu hỏi hợp lệ sẽ không thể xuất bản.`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="entity" type="hidden" value={entity} />
      {ids.map((id) => <input key={id} name="id" type="hidden" value={id} />)}
      <button className="button button-primary" disabled={pending || ids.length === 0} type="submit">
        {pending ? "Đang xuất bản..." : `Xuất bản mục đã chọn (${ids.length})`}
      </button>
      {state.message && (
        <p aria-live="polite" className={`admin-form-message ${state.success ? "is-success" : "is-error"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

function SubjectForm({ value }: { value?: Subject }) {
  return (
    <form className="admin-record-form" action={undefined}>
      <input name="entity" type="hidden" value="subjects" />
      {value && <input name="id" type="hidden" value={value.id} />}
      <div className="admin-form-grid">
        <TextField label="Tên môn học" name="name" required value={value?.name} />
        <TextField label="Slug" name="slug" placeholder="vi-du-mon-hoc" required value={value?.slug} />
        <TextField label="Thứ tự hiển thị" min={0} name="sort_order" type="number" value={value?.sort_order ?? 0} />
        <StatusField value={value?.status} />
        <TextArea label="Mô tả" name="description" value={value?.description ?? ""} />
      </div>
      <SaveButton editing={Boolean(value)} />
    </form>
  );
}

function ChapterForm({ value, subjects }: { value?: Chapter; subjects: Subject[] }) {
  return (
    <form className="admin-record-form">
      <input name="entity" type="hidden" value="chapters" />
      {value && <input name="id" type="hidden" value={value.id} />}
      <div className="admin-form-grid">
        <label className="admin-field">
          Môn học
          <select defaultValue={value?.subject_id ?? ""} name="subject_id" required>
            <option disabled value="">Chọn môn học</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <TextField label="Tên chương" name="title" required value={value?.title} />
        <TextField label="Slug" name="slug" placeholder="vi-du-chuong" required value={value?.slug} />
        <TextField label="Thứ tự hiển thị" min={0} name="sort_order" type="number" value={value?.sort_order ?? 0} />
        <StatusField value={value?.status} />
        <TextArea label="Mô tả" name="description" value={value?.description ?? ""} />
      </div>
      <SaveButton editing={Boolean(value)} />
    </form>
  );
}

function QuizForm({
  value,
  subjects,
  chapters,
}: {
  value?: Quiz;
  subjects: Subject[];
  chapters: Chapter[];
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(value?.subject_id ?? "");
  const [selectedChapterId, setSelectedChapterId] = useState(value?.chapter_id ?? "");
  const availableChapters = chapters.filter((chapter) => chapter.subject_id === selectedSubjectId);
  return (
    <form className="admin-record-form">
      <input name="entity" type="hidden" value="quizzes" />
      {value && <input name="id" type="hidden" value={value.id} />}
      <div className="admin-form-grid">
        <label className="admin-field">
          Môn học
          <select
            name="subject_id"
            onChange={(event) => {
              setSelectedSubjectId(event.target.value);
              setSelectedChapterId("");
            }}
            required
            value={selectedSubjectId}
          >
            <option disabled value="">Chọn môn học</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="admin-field">
          Chương (không bắt buộc)
          <select
            name="chapter_id"
            onChange={(event) => setSelectedChapterId(event.target.value)}
            value={selectedChapterId}
          >
            <option value="">Không thuộc chương</option>
            {availableChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
          </select>
        </label>
        <TextField label="Tên bộ đề" name="title" required value={value?.title} />
        <TextField label="Slug" name="slug" placeholder="vi-du-bo-de" required value={value?.slug} />
        <TextField label="Thời lượng (giây, để trống nếu không giới hạn)" min={1} name="time_limit_seconds" type="number" value={value?.time_limit_seconds ?? ""} />
        <TextField label="Điểm đạt (không bắt buộc)" min={0} name="pass_score" step={0.01} type="number" value={value?.pass_score ?? ""} />
        <StatusField value={value?.status} />
        <TextArea label="Mô tả" name="description" value={value?.description ?? ""} />
        <div className="admin-field admin-field-wide">
          <span>Câu hỏi bộ đề</span>
          <p className="admin-muted">
            Lưu bộ đề trước, sau đó nhập câu hỏi bằng một file Excel cho bộ đề này. Có thể mở mục “Nhập Excel” trong menu quản trị.
          </p>
        </div>
      </div>
      <SaveButton editing={Boolean(value)} />
    </form>
  );
}

function QuestionForm({
  value,
  options,
  quizzes,
}: {
  value?: Question;
  options: Option[];
  quizzes: Quiz[];
}) {
  const answerLines = options
    .filter((option) => option.question_id === value?.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((option) => `${option.is_correct ? "* " : ""}${option.content}`)
    .join("\n");
  return (
    <form className="admin-record-form">
      <input name="entity" type="hidden" value="questions" />
      {value && <input name="id" type="hidden" value={value.id} />}
      <div className="admin-form-grid">
        {!value && (
          <label className="admin-field">
            Bộ đề
            <select defaultValue="" name="quiz_id" required>
              <option disabled value="">Chọn bộ đề</option>
              {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
            </select>
          </label>
        )}
        <TextArea label="Nội dung câu hỏi" name="content" required rows={3} value={value?.content ?? ""} />
        <label className="admin-field">
          Loại câu hỏi
          <select defaultValue={value?.type ?? "single_choice"} name="type">
            <option value="single_choice">Chọn một đáp án</option>
            <option value="multiple_choice">Chọn nhiều đáp án</option>
            <option value="true_false">Đúng / Sai</option>
          </select>
        </label>
        <label className="admin-field">
          Độ khó
          <select defaultValue={value?.difficulty ?? ""} name="difficulty">
            <option value="">Chưa đặt</option>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
        </label>
        <StatusField value={value?.status} />
        <TextArea label="Lời giải" name="explanation" value={value?.explanation ?? ""} />
        <TextArea
          label="Các lựa chọn (mỗi lựa chọn một dòng; thêm * ở đầu dòng để đánh dấu đáp án đúng)"
          name="options"
          placeholder={"54\n* 56\n64\n48"}
          required
          rows={5}
          value={answerLines}
        />
      </div>
      <SaveButton editing={Boolean(value)} />
    </form>
  );
}

function RecordCard({
  title,
  subtitle,
  children,
  entity,
  id,
  selected,
  onSelectionChange,
  afterDetails,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  entity: Section;
  id: string;
  selected: boolean;
  onSelectionChange: (id: string, selected: boolean) => void;
  afterDetails?: React.ReactNode;
}) {
  return (
    <article className="admin-record-card">
      <details>
        <summary>
          <span className="admin-record-summary">
            <label className="admin-record-select" onClick={(event) => event.stopPropagation()}>
              <input
                aria-label={`Chọn ${title} để xóa`}
                checked={selected}
                onChange={(event) => onSelectionChange(id, event.target.checked)}
                type="checkbox"
              />
            </label>
            <span className="admin-record-title"><strong>{title}</strong><small>{subtitle}</small></span>
          </span>
          <span className="admin-edit-indicator">Chỉnh sửa⌄</span>
        </summary>
        {children}
        <DeleteForm entity={entity} id={id} name={title} />
      </details>
      {afterDetails}
    </article>
  );
}

export function AdminManager(props: AdminManagerProps) {
  const { section } = props;
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContentStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const title = titles[section];
  const records = {
    subjects: props.subjects,
    chapters: props.chapters,
    quizzes: props.quizzes,
    questions: props.questions,
  }[section];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("vi");
  const visibleIds = new Set(records.filter((record) => {
    const label = "name" in record ? record.name : "title" in record ? record.title : record.content;
    return (statusFilter === "all" || record.status === statusFilter)
      && (!normalizedQuery || label.toLocaleLowerCase("vi").includes(normalizedQuery));
  }).map((record) => record.id));
  const hasFilters = normalizedQuery.length > 0 || statusFilter !== "all";
  const allVisibleSelected = visibleIds.size > 0 && Array.from(visibleIds).every((id) => selectedIds.has(id));
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const changeSelection = useCallback((id: string, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const toggleVisibleSelection = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of visibleIds) {
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  return (
    <>
      <header className="admin-page-heading">
        <div><span className="eyebrow">QUẢN LÝ NỘI DUNG</span><h1>{title.title}</h1><p>{title.description}</p></div>
        <button className="button button-primary" onClick={() => setShowCreate((value) => !value)} type="button">
          {showCreate ? "Đóng biểu mẫu" : `+ Thêm ${section === "subjects" ? "môn học" : section === "chapters" ? "chương" : section === "quizzes" ? "bộ đề" : "câu hỏi"}`}
        </button>
      </header>
      {showCreate && (
        <section className="admin-panel admin-create-panel">
          <h2>Tạo nội dung mới</h2>
          {section === "subjects" && <SubjectForm />}
          {section === "chapters" && <ChapterForm subjects={props.subjects} />}
          {section === "quizzes" && <QuizForm chapters={props.chapters} subjects={props.subjects} />}
          {section === "questions" && <QuestionForm options={[]} quizzes={props.quizzes} />}
        </section>
      )}
      {records.length > 0 && (
        <section aria-label={`Tìm kiếm ${title.title.toLocaleLowerCase("vi")}`} className="admin-list-tools">
          <label className="admin-search-field">
            <span>Tìm kiếm</span>
            <input
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Tìm ${title.title.toLocaleLowerCase("vi")}...`}
              type="search"
              value={searchQuery}
            />
          </label>
          <label className="admin-status-filter">
            <span>Trạng thái</span>
            <select onChange={(event) => {
              const value = event.target.value;
              if (value === "all" || value === "draft" || value === "published" || value === "archived") {
                setStatusFilter(value);
              }
            }} value={statusFilter}>
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </label>
          <span aria-live="polite" className="admin-result-count">{visibleIds.size}/{records.length} mục</span>
          <label className="admin-select-visible">
            <input checked={allVisibleSelected} onChange={toggleVisibleSelection} type="checkbox" />
            Chọn tất cả đang hiển thị
          </label>
          <div className="admin-bulk-actions">
            <BulkPublishForm entity={section} ids={Array.from(selectedIds)} onPublished={clearSelection} />
            <BulkDeleteForm entity={section} ids={Array.from(selectedIds)} onDeleted={clearSelection} />
          </div>
        </section>
      )}
      {records.length === 0 ? (
        <section className="admin-empty-state"><span>✳</span><h2>Chưa có {title.title.toLocaleLowerCase("vi")}</h2><p>Bắt đầu thêm nội dung đầu tiên cho JayQuiz.</p></section>
      ) : visibleIds.size === 0 ? (
        <section className="admin-empty-state">
          <span>⌕</span>
          <h2>Không tìm thấy nội dung phù hợp</h2>
          <p>Thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ nội dung.</p>
          {hasFilters && (
            <button className="button button-secondary admin-clear-filters" onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }} type="button">
              Xóa bộ lọc
            </button>
          )}
        </section>
      ) : (
        <div className="admin-record-list">
          {section === "subjects" && props.subjects.filter((subject) => visibleIds.has(subject.id)).map((subject) => (
            <RecordCard entity={section} id={subject.id} key={subject.id} onSelectionChange={changeSelection} selected={selectedIds.has(subject.id)} subtitle={`${statusLabels[subject.status]} · thứ tự ${subject.sort_order}`} title={subject.name}>
              <SubjectForm value={subject} />
            </RecordCard>
          ))}
          {section === "chapters" && props.chapters.filter((chapter) => visibleIds.has(chapter.id)).map((chapter) => (
            <RecordCard entity={section} id={chapter.id} key={chapter.id} onSelectionChange={changeSelection} selected={selectedIds.has(chapter.id)} subtitle={`${props.subjects.find((subject) => subject.id === chapter.subject_id)?.name ?? "Môn học"} · ${statusLabels[chapter.status]}`} title={chapter.title}>
              <ChapterForm subjects={props.subjects} value={chapter} />
            </RecordCard>
          ))}
          {section === "quizzes" && props.quizzes.filter((quiz) => visibleIds.has(quiz.id)).map((quiz) => {
            const quizRelations = props.quizQuestions.filter((relation) => relation.quiz_id === quiz.id);
            const questionCount = quizRelations.length;
            return (
              <RecordCard afterDetails={<QuizExcelImport quizId={quiz.id} />} entity={section} id={quiz.id} key={quiz.id} onSelectionChange={changeSelection} selected={selectedIds.has(quiz.id)} subtitle={`${props.subjects.find((subject) => subject.id === quiz.subject_id)?.name ?? "Môn học"} · ${statusLabels[quiz.status]} · ${questionCount} câu`} title={quiz.title}>
                <QuizForm chapters={props.chapters} subjects={props.subjects} value={quiz} />
                <details className="admin-preview">
                  <summary>Xem trước nội dung đề ({questionCount} câu)</summary>
                  {quizRelations.sort((a, b) => a.sort_order - b.sort_order).map((relation, index) => {
                    const question = props.questions.find((item) => item.id === relation.question_id);
                    const questionOptions = props.options.filter((option) => option.question_id === relation.question_id).sort((a, b) => a.sort_order - b.sort_order);
                    if (!question) return null;
                    return (
                      <section className="admin-preview-question" key={relation.question_id}>
                        <strong>{index + 1}. {question.content}</strong>
                        <ul>{questionOptions.map((option) => <li className={option.is_correct ? "is-answer" : ""} key={option.id}>{option.content}{option.is_correct ? " ✓" : ""}</li>)}</ul>
                        {question.explanation && <p>{question.explanation}</p>}
                      </section>
                    );
                  })}
                  {quiz.status === "published" && <Link className="text-link" href={`/quiz/${quiz.slug}`} target="_blank">Mở trang công khai ↗</Link>}
                </details>
              </RecordCard>
            );
          })}
          {section === "questions" && props.questions.filter((question) => visibleIds.has(question.id)).map((question) => (
            <RecordCard entity={section} id={question.id} key={question.id} onSelectionChange={changeSelection} selected={selectedIds.has(question.id)} subtitle={`${questionTypeLabels[question.type]} · ${question.difficulty ? difficultyLabels[question.difficulty] : "Chưa đặt độ khó"} · ${statusLabels[question.status]}`} title={question.content}>
              <QuestionForm options={props.options} quizzes={props.quizzes} value={question} />
            </RecordCard>
          ))}
        </div>
      )}
    </>
  );
}
