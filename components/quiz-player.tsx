"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublishedQuiz } from "@/lib/data/quizzes";
import type { QuizGradeResult } from "@/lib/data/grading";

type Answer = string | string[];
type ProgressStatus = "in_progress" | "submitted";
type QuizProgress = {
  schemaVersion: 1;
  quizId: string;
  quizVersion: number;
  status: ProgressStatus;
  currentQuestionIndex: number;
  answers: Record<string, Answer>;
  flaggedQuestionIds: string[];
  startedAt: string;
  updatedAt: string;
  submittedAt?: string;
  result?: QuizGradeResult;
};
type RestorePrompt = "resume" | "version";

const progressKey = (quizId: string) => `jayquiz:progress:v1:${quizId}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuizGradeResult(value: unknown): value is QuizGradeResult {
  if (!isRecord(value) || !Array.isArray(value.questions)) return false;
  return (
    typeof value.score === "number" &&
    typeof value.totalPoints === "number" &&
    typeof value.correctCount === "number" &&
    typeof value.questionCount === "number" &&
    value.questions.every(
      (item) =>
        isRecord(item) &&
        typeof item.questionId === "string" &&
        typeof item.isCorrect === "boolean" &&
        Array.isArray(item.correctOptionIds) &&
        item.correctOptionIds.every((id) => typeof id === "string") &&
        (typeof item.explanation === "string" || item.explanation === null),
    )
  );
}

function isQuizProgress(value: unknown): value is QuizProgress {
  if (!isRecord(value) || !isRecord(value.answers)) return false;
  const validAnswers = Object.values(value.answers).every(
    (answer) =>
      typeof answer === "string" ||
      (Array.isArray(answer) && answer.every((id) => typeof id === "string")),
  );
  const validResult =
    value.result === undefined || isQuizGradeResult(value.result);

  return (
    value.schemaVersion === 1 &&
    typeof value.quizId === "string" &&
    typeof value.quizVersion === "number" &&
    (value.status === "in_progress" || value.status === "submitted") &&
    typeof value.currentQuestionIndex === "number" &&
    Number.isInteger(value.currentQuestionIndex) &&
    Array.isArray(value.flaggedQuestionIds) &&
    value.flaggedQuestionIds.every((id) => typeof id === "string") &&
    typeof value.startedAt === "string" &&
    typeof value.updatedAt === "string" &&
    validAnswers &&
    validResult
  );
}

function createProgress(quiz: PublishedQuiz): QuizProgress {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    quizId: quiz.id,
    quizVersion: quiz.version,
    status: "in_progress",
    currentQuestionIndex: 0,
    answers: {},
    flaggedQuestionIds: [],
    startedAt: now,
    updatedAt: now,
  };
}

function answerCount(answers: Record<string, Answer>) {
  return Object.values(answers).filter((answer) =>
    Array.isArray(answer) ? answer.length > 0 : Boolean(answer),
  ).length;
}

function displayScore(result: QuizGradeResult) {
  if (!result.totalPoints) return "0";
  return Number(((result.score / result.totalPoints) * 10).toFixed(1)).toString();
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function QuizPlayer({ quiz }: { quiz: PublishedQuiz }) {
  const [progress, setProgress] = useState<QuizProgress>(() => createProgress(quiz));
  const [hydrated, setHydrated] = useState(false);
  const [restorePrompt, setRestorePrompt] = useState<RestorePrompt | null>(null);
  const [notice, setNotice] = useState("");
  const [saveState, setSaveState] = useState("Đang tải tiến độ");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [clockNow, setClockNow] = useState(0);
  const submissionLock = useRef(false);
  const autoSubmissionStarted = useRef(false);

  const questions = quiz.questions;
  const currentQuestion = questions[progress.currentQuestionIndex];
  const answeredCount = answerCount(progress.answers);
  const resultByQuestion = useMemo(
    () => new Map(progress.result?.questions.map((item) => [item.questionId, item])),
    [progress.result],
  );
  const currentResult = currentQuestion
    ? resultByQuestion.get(currentQuestion.id)
    : undefined;
  const isSubmitted = progress.status === "submitted";
  const secondsRemaining = quiz.time_limit_seconds && clockNow > 0
    ? Math.max(
        0,
        quiz.time_limit_seconds -
          Math.floor((clockNow - Date.parse(progress.startedAt)) / 1000),
      )
    : null;

  useEffect(() => {
    let raw: string | null = null;
    let restoredProgress: QuizProgress | undefined;
    let nextPrompt: RestorePrompt | undefined;
    let nextNotice = "";
    let readFailed = false;
    try {
      raw = window.localStorage.getItem(progressKey(quiz.id));
    } catch (error) {
      console.error("Could not read quiz progress from localStorage.", error);
      readFailed = true;
    }

    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!isQuizProgress(parsed) || parsed.quizId !== quiz.id) {
          throw new Error("Saved quiz progress has an invalid format.");
        }
        if (parsed.quizVersion !== quiz.version) {
          nextPrompt = "version";
        } else if (
          parsed.currentQuestionIndex >= questions.length ||
          (parsed.status === "submitted" &&
            (!parsed.result || parsed.result.questionCount !== questions.length))
        ) {
          throw new Error("Saved quiz progress does not match this quiz.");
        } else {
          restoredProgress = parsed;
          if (parsed.status === "in_progress") nextPrompt = "resume";
        }
      } catch (error) {
        console.error("Saved quiz progress could not be restored.", error);
        nextNotice = "Tiến độ lưu trên thiết bị không hợp lệ. Bạn có thể bắt đầu lại.";
      }
    }

    const hydrationTimer = window.setTimeout(() => {
      if (restoredProgress) setProgress(restoredProgress);
      if (nextPrompt) setRestorePrompt(nextPrompt);
      if (nextNotice) setNotice(nextNotice);
      if (readFailed) setSaveState("Không thể đọc tiến độ");
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [quiz.id, quiz.version, questions.length]);

  useEffect(() => {
    if (!hydrated || restorePrompt) return;
    let statusTimer: number;
    try {
      window.localStorage.setItem(
        progressKey(quiz.id),
        JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }),
      );
      statusTimer = window.setTimeout(() => setSaveState("Đã lưu trên thiết bị"), 0);
    } catch (error) {
      console.error("Could not save quiz progress to localStorage.", error);
      statusTimer = window.setTimeout(() => setSaveState("Không thể lưu tiến độ"), 0);
    }
    return () => window.clearTimeout(statusTimer);
  }, [hydrated, progress, quiz.id, restorePrompt]);

  const updateProgress = useCallback(
    (update: (current: QuizProgress) => QuizProgress) => {
      setProgress((current) => ({
        ...update(current),
        updatedAt: new Date().toISOString(),
      }));
      setSaveState("Đang lưu");
    },
    [],
  );

  const submitQuiz = useCallback(async () => {
    if (submissionLock.current || submitting || isSubmitted) return;
    submissionLock.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(`/api/quizzes/${encodeURIComponent(quiz.slug)}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: progress.answers }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : "Không thể chấm điểm bộ đề.";
        throw new Error(message);
      }
      if (!isQuizGradeResult(payload) || payload.questionCount !== questions.length) {
        throw new Error("Kết quả trả về không khớp với nội dung bộ đề.");
      }
      updateProgress((current) => ({
        ...current,
        status: "submitted",
        submittedAt: new Date().toISOString(),
        result: payload,
      }));
    } catch (error) {
      console.error("Could not submit quiz answers.", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Không thể nộp bài. Vui lòng thử lại.",
      );
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }, [
    isSubmitted,
    progress.answers,
    quiz.slug,
    questions.length,
    submitting,
    updateProgress,
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (
      !hydrated ||
      restorePrompt ||
      isSubmitted ||
      !quiz.time_limit_seconds ||
      secondsRemaining !== 0 ||
      autoSubmissionStarted.current
    ) {
      return;
    }
    autoSubmissionStarted.current = true;
    const submitTimer = window.setTimeout(() => {
      void submitQuiz();
    }, 0);
    return () => window.clearTimeout(submitTimer);
  }, [
    hydrated,
    isSubmitted,
    quiz.time_limit_seconds,
    restorePrompt,
    secondsRemaining,
    submitQuiz,
  ]);

  useEffect(() => {
    function handleArrowKeys(event: KeyboardEvent) {
      if (restorePrompt || submitting || isSubmitted) return;
      if (event.key === "ArrowRight") {
        updateProgress((current) => ({
          ...current,
          currentQuestionIndex: Math.min(current.currentQuestionIndex + 1, questions.length - 1),
        }));
      }
      if (event.key === "ArrowLeft") {
        updateProgress((current) => ({
          ...current,
          currentQuestionIndex: Math.max(current.currentQuestionIndex - 1, 0),
        }));
      }
    }

    window.addEventListener("keydown", handleArrowKeys);
    return () => window.removeEventListener("keydown", handleArrowKeys);
  }, [isSubmitted, questions.length, restorePrompt, submitting, updateProgress]);

  function selectOption(optionId: string) {
    if (!currentQuestion || isSubmitted) return;
    updateProgress((current) => {
      const existing = current.answers[currentQuestion.id];
      let answer: Answer;
      if (currentQuestion.type === "multiple_choice") {
        const selected = Array.isArray(existing) ? existing : [];
        answer = selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId];
      } else {
        answer = optionId;
      }

      const answers = { ...current.answers };
      if (Array.isArray(answer) && answer.length === 0) delete answers[currentQuestion.id];
      else answers[currentQuestion.id] = answer;
      return { ...current, answers };
    });
  }

  function resetQuiz() {
    if (
      !window.confirm(
        "Xóa tiến độ của bộ đề này và bắt đầu lại? Các bộ đề khác sẽ không bị ảnh hưởng.",
      )
    ) {
      return;
    }
    setProgress(createProgress(quiz));
    autoSubmissionStarted.current = false;
    setNotice("");
    setRestorePrompt(null);
    setSubmitError("");
  }

  function chooseAnswerForCurrent() {
    if (!currentQuestion) return [];
    const answer = progress.answers[currentQuestion.id];
    return Array.isArray(answer) ? answer : answer ? [answer] : [];
  }

  if (questions.length === 0) {
    return (
      <div className="empty-card">
        <span className="empty-icon">✳</span>
        <h2>Bộ đề chưa có câu hỏi</h2>
        <p>Quay lại sau khi nội dung được cập nhật nhé.</p>
      </div>
    );
  }

  const selectedIds = chooseAnswerForCurrent();

  return (
    <>
      {restorePrompt && (
        <div className="restore-overlay" role="presentation">
          <section
            aria-labelledby="restore-title"
            aria-modal="true"
            className="restore-dialog"
            role="dialog"
          >
            <span className="eyebrow">{restorePrompt === "version" ? "ĐỀ ĐÃ CẬP NHẬT" : "CHÀO MỪNG TRỞ LẠI"}</span>
            <h2 id="restore-title">
              {restorePrompt === "version" ? "Bắt đầu với phiên bản mới?" : "Bạn muốn tiếp tục bài làm?"}
            </h2>
            <p>
              {restorePrompt === "version"
                ? "Phiên bản câu hỏi đã thay đổi nên tiến độ cũ không còn tương thích. Hãy bắt đầu một lượt mới."
                : `Bạn đã trả lời ${answeredCount}/${questions.length} câu. Tiến độ được lưu trên thiết bị này.`}
            </p>
            <div className="dialog-actions">
              {restorePrompt === "resume" && (
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setProgress(createProgress(quiz));
                    setRestorePrompt(null);
                    setNotice("");
                  }}
                  type="button"
                >
                  Làm lại từ đầu
                </button>
              )}
              {restorePrompt === "version" && (
                <Link className="button button-secondary" href={`/subjects/${quiz.subject_slug}`}>
                  Quay lại môn học
                </Link>
              )}
              <button
                className="button button-primary"
                onClick={() => setRestorePrompt(null)}
                type="button"
              >
                {restorePrompt === "version" ? "Bắt đầu đề mới" : "Tiếp tục làm bài"}
              </button>
            </div>
          </section>
        </div>
      )}

      {notice && !restorePrompt && <p className="notice" role="status">{notice}</p>}

      {progress.result && (
        <section className="result-banner" aria-live="polite">
          <span className="result-score">{displayScore(progress.result)}</span>
          <div>
            <h2>{progress.result.correctCount === progress.result.questionCount ? "Xuất sắc, bạn làm đúng tất cả!" : "Hoàn thành bài luyện tập"}</h2>
            <p>
              Đúng {progress.result.correctCount}/{progress.result.questionCount} câu
              {" · "}Điểm {progress.result.score}/{progress.result.totalPoints}
            </p>
          </div>
        </section>
      )}

      <section className="quiz-surface" aria-label="Khu vực làm bài">
        <div className="quiz-toolbar">
          <span className="question-counter">
            Câu <strong>{progress.currentQuestionIndex + 1}</strong> / {questions.length}
          </span>
          <div className="quiz-toolbar-status">
            {secondsRemaining !== null && !isSubmitted && (
              <span className={`quiz-timer ${secondsRemaining <= 60 ? "is-urgent" : ""}`} aria-live="off">
                ◷ {formatTime(secondsRemaining)}
              </span>
            )}
            <span className={`save-state ${saveState.startsWith("Không thể") ? "is-error" : ""}`} role="status">
              {saveState}
            </span>
          </div>
        </div>

        {currentQuestion && (
          <>
            <div className="question-content">
              <span className="question-type-label">
                {currentQuestion.type === "multiple_choice"
                  ? "Chọn tất cả đáp án đúng"
                  : currentQuestion.type === "true_false"
                    ? "Đúng hay sai?"
                    : "Chọn một đáp án"}
                {currentQuestion.difficulty ? ` · ${currentQuestion.difficulty}` : ""}
              </span>
              <h2>{currentQuestion.content}</h2>
            </div>

            <div className="option-list">
              {currentQuestion.options.map((option, index) => {
                const selected = selectedIds.includes(option.id);
                const correct = currentResult?.correctOptionIds.includes(option.id) ?? false;
                const wrongSelection = isSubmitted && selected && !correct;
                const classNames = [
                  "option-button",
                  selected ? "is-selected" : "",
                  currentQuestion.type === "multiple_choice" ? "is-multiple" : "",
                  isSubmitted && correct ? "is-correct" : "",
                  wrongSelection ? "is-wrong" : "",
                ].filter(Boolean).join(" ");
                return (
                  <button
                    aria-pressed={selected}
                    className={classNames}
                    disabled={isSubmitted || submitting || Boolean(restorePrompt)}
                    key={option.id}
                    onClick={() => selectOption(option.id)}
                    type="button"
                  >
                    <span className="option-marker" aria-hidden="true">
                      {selected ? "✓" : String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-copy">{option.content}</span>
                  </button>
                );
              })}
              {isSubmitted && currentResult && (
                <div className={`option-feedback ${currentResult.isCorrect ? "" : "is-wrong"}`} role="status">
                  {currentResult.isCorrect
                    ? "Chính xác! Bạn đã chọn đúng đáp án."
                    : "Chưa chính xác. Đáp án đúng được đánh dấu màu xanh."}
                </div>
              )}
              {isSubmitted && currentResult?.explanation && (
                <div className="explanation-box">
                  <strong>Lời giải</strong>
                  {currentResult.explanation}
                </div>
              )}
            </div>
          </>
        )}

        <div className="question-navigation">
          <button
            className="button button-secondary"
            disabled={progress.currentQuestionIndex === 0 || submitting}
            onClick={() => updateProgress((current) => ({ ...current, currentQuestionIndex: current.currentQuestionIndex - 1 }))}
            type="button"
          >
            ← Trước
          </button>
          {!isSubmitted && (
            <button
              aria-pressed={currentQuestion ? progress.flaggedQuestionIds.includes(currentQuestion.id) : false}
              className={`button-quiet ${currentQuestion && progress.flaggedQuestionIds.includes(currentQuestion.id) ? "is-flagged" : ""}`}
              disabled={submitting || Boolean(restorePrompt)}
              onClick={() => {
                if (!currentQuestion) return;
                updateProgress((current) => {
                  const flagged = current.flaggedQuestionIds.includes(currentQuestion.id);
                  return {
                    ...current,
                    flaggedQuestionIds: flagged
                      ? current.flaggedQuestionIds.filter((id) => id !== currentQuestion.id)
                      : [...current.flaggedQuestionIds, currentQuestion.id],
                  };
                });
              }}
              type="button"
            >
              <span aria-hidden="true">⚑</span>
              {currentQuestion && progress.flaggedQuestionIds.includes(currentQuestion.id) ? "Đã đánh dấu" : "Đánh dấu"}
            </button>
          )}
          {progress.currentQuestionIndex < questions.length - 1 ? (
            <button
              className="button button-primary"
              disabled={submitting || Boolean(restorePrompt)}
              onClick={() => updateProgress((current) => ({ ...current, currentQuestionIndex: current.currentQuestionIndex + 1 }))}
              type="button"
            >
              Tiếp theo →
            </button>
          ) : isSubmitted ? (
            <button className="button button-secondary" onClick={resetQuiz} type="button">Làm lại</button>
          ) : (
            <button
              className="button button-submit"
              disabled={submitting || Boolean(restorePrompt)}
              onClick={() => {
                if (
                  answeredCount < questions.length &&
                  !window.confirm(
                    `Bạn còn ${questions.length - answeredCount} câu chưa trả lời. Vẫn nộp bài?`,
                  )
                ) {
                  return;
                }
                void submitQuiz();
              }}
              type="button"
            >
              {submitting ? "Đang chấm..." : "Nộp bài"}
            </button>
          )}
        </div>
        {submitError && <p className="submit-error" role="alert">{submitError}</p>}

        <div className="question-map" aria-label="Chọn câu hỏi">
          {questions.map((question, index) => (
            <button
              aria-current={index === progress.currentQuestionIndex ? "step" : undefined}
              aria-label={`Câu ${index + 1}${progress.answers[question.id] ? ", đã trả lời" : ", chưa trả lời"}${progress.flaggedQuestionIds.includes(question.id) ? ", đã đánh dấu" : ""}`}
              className={[
                index === progress.currentQuestionIndex ? "is-current" : "",
                progress.answers[question.id] ? "is-answered" : "",
                progress.flaggedQuestionIds.includes(question.id) ? "is-flagged" : "",
              ].filter(Boolean).join(" ")}
              disabled={submitting || Boolean(restorePrompt)}
              key={question.id}
              onClick={() => updateProgress((current) => ({ ...current, currentQuestionIndex: index }))}
              type="button"
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div className="progress-legend" aria-hidden="true">
          <span><i className="legend-dot answered" /> Đã trả lời</span>
          <span><i className="legend-dot" /> Chưa trả lời</span>
          {!isSubmitted && <span><i className="legend-dot flagged" /> Đánh dấu xem lại</span>}
        </div>
      </section>
      {isSubmitted && (
        <div className="quiz-bottom-actions">
          <button className="button-quiet" onClick={resetQuiz} type="button">↻ Xóa tiến độ và làm lại</button>
        </div>
      )}
    </>
  );
}
