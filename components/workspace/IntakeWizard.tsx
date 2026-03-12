"use client";

import { useState, useRef, useCallback, type DragEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  ChevronLeft,
  Mic,
  Upload,
  X,
  Check,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import type { IntakeData } from "@/lib/types";
import { processDocument } from "@/services/gemini-client";

export interface IntakeWizardProps {
  onComplete: (data: IntakeData) => void;
  onSkip: () => void;
  defaultPartyAName?: string;
  defaultPartyBName?: string;
}

const CASE_TYPES = [
  "Workplace",
  "Commercial",
  "Family",
  "Neighbor",
  "Landlord-Tenant",
  "Community",
  "Partnership",
  "Customer",
  "Other",
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Mandarin",
  "Japanese",
  "Korean",
  "Hindi",
  "Portuguese",
];

const RELATIONSHIPS = [
  "colleague",
  "manager-report",
  "business-partner",
  "family",
  "neighbor",
  "customer-provider",
  "other",
];

const GROUND_RULES = [
  "One speaker at a time",
  "Mutual respect",
  "Confidentiality",
  "Mediator is neutral",
  "Either party may pause",
  "Goal is understanding, not winning",
];

interface UploadedDoc {
  name: string;
  summary: string;
  expanded: boolean;
}

function buildIntakeContext(
  caseTitle: string,
  caseType: string,
  partyA: { name: string; role?: string; relationship: string },
  partyB: { name: string; role?: string; relationship: string },
  powerBalance: "yes" | "no" | "unsure",
  powerDetail: string,
  description: string,
  partyAGoal: string,
  partyBGoal: string,
  documentSummaries: string[],
  partyAStatement: string,
  partyBStatement: string,
): string {
  return [
    `CASE: ${caseTitle} (${caseType})`,
    `PARTY A: ${partyA.name}${partyA.role ? ` — ${partyA.role}` : ""} [${partyA.relationship}]`,
    `PARTY B: ${partyB.name}${partyB.role ? ` — ${partyB.role}` : ""} [${partyB.relationship}]`,
    powerBalance !== "yes" ? `⚠ POWER IMBALANCE: ${powerDetail}` : null,
    description ? `DISPUTE: ${description}` : null,
    partyAGoal ? `${partyA.name}'S GOAL: ${partyAGoal}` : null,
    partyBGoal ? `${partyB.name}'S GOAL: ${partyBGoal}` : null,
    ...documentSummaries.map((s, i) => `PRE-SESSION DOCUMENT ${i + 1}:\n${s}`),
    partyAStatement ? `${partyA.name}'S OPENING STATEMENT:\n"${partyAStatement}"` : null,
    partyBStatement ? `${partyB.name}'S OPENING STATEMENT:\n"${partyBStatement}"` : null,
    "GROUND RULES: Acknowledged and accepted.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default function IntakeWizard({
  onComplete,
  onSkip,
  defaultPartyAName = "Party A",
  defaultPartyBName = "Party B",
}: IntakeWizardProps) {
  const [step, setStep] = useState(1);

  // Step 1
  const [caseTitle, setCaseTitle] = useState("");
  const [caseType, setCaseType] = useState("");
  const [mediatorStyle, setMediatorStyle] = useState<"professional" | "empathic">("professional");
  const [language, setLanguage] = useState("English");

  // Step 2
  const [partyAName, setPartyAName] = useState(defaultPartyAName !== "Party A" ? defaultPartyAName : "");
  const [partyARole, setPartyARole] = useState("");
  const [partyARelationship, setPartyARelationship] = useState("colleague");
  const [partyBName, setPartyBName] = useState(defaultPartyBName !== "Party B" ? defaultPartyBName : "");
  const [partyBRole, setPartyBRole] = useState("");
  const [partyBRelationship, setPartyBRelationship] = useState("colleague");
  const [powerBalance, setPowerBalance] = useState<"yes" | "no" | "unsure">("yes");
  const [powerDetail, setPowerDetail] = useState("");

  // Step 3
  const [description, setDescription] = useState("");
  const [partyAGoal, setPartyAGoal] = useState("");
  const [partyBGoal, setPartyBGoal] = useState("");
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [partyAStatement, setPartyAStatement] = useState("");
  const [partyBStatement, setPartyBStatement] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Step 4
  const [consentGoodFaith, setConsentGoodFaith] = useState(false);
  const [consentAI, setConsentAI] = useState(false);

  const TOTAL_STEPS = 5;

  const step1Valid = caseTitle.trim().length > 0 && caseType !== "";
  const step2Valid =
    partyAName.trim().length > 0 &&
    partyBName.trim().length > 0 &&
    (powerBalance !== "no" || powerDetail.trim().length > 0);
  const step4Valid = consentGoodFaith && consentAI;

  const canNext = () => {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    if (step === 3) return true;
    if (step === 4) return step4Valid;
    return true;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (docs.length >= 3) {
        setUploadError("Maximum 3 files allowed.");
        return;
      }
      const toProcess = Array.from(files).slice(0, 3 - docs.length);
      for (const file of toProcess) {
        const allowed = [
          "application/pdf",
          "text/plain",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/markdown",
        ];
        if (!allowed.includes(file.type) && !file.name.endsWith(".md") && !file.name.endsWith(".txt")) {
          setUploadError("Only .pdf, .txt, .docx, and .md files are accepted.");
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`${file.name} exceeds 5MB limit.`);
          continue;
        }
        setUploadError("");
        setUploading(true);
        try {
          const summary = await processDocument(file);
          setDocs((prev) => [
            ...prev,
            { name: file.name, summary, expanded: false },
          ]);
        } catch (err: any) {
          setUploadError(err.message || "Failed to process document.");
        } finally {
          setUploading(false);
        }
      }
    },
    [docs.length],
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleComplete = () => {
    const context = buildIntakeContext(
      caseTitle,
      caseType,
      { name: partyAName, role: partyARole || undefined, relationship: partyARelationship },
      { name: partyBName, role: partyBRole || undefined, relationship: partyBRelationship },
      powerBalance,
      powerDetail,
      description,
      partyAGoal,
      partyBGoal,
      docs.map((d) => d.summary),
      partyAStatement,
      partyBStatement,
    );

    const data: IntakeData = {
      caseTitle,
      caseType,
      mediatorStyle,
      language,
      partyA: { name: partyAName, role: partyARole || undefined, relationship: partyARelationship },
      partyB: { name: partyBName, role: partyBRole || undefined, relationship: partyBRelationship },
      powerBalance,
      powerDetail: powerDetail || undefined,
      description: description || undefined,
      partyAGoal: partyAGoal || undefined,
      partyBGoal: partyBGoal || undefined,
      documentSummaries: docs.map((d) => d.summary),
      partyAStatement: partyAStatement || undefined,
      partyBStatement: partyBStatement || undefined,
      context,
    };

    onComplete(data);
  };

  const inputCls =
    "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/95 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Pre-Session Intake</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {step} of {TOTAL_STEPS}
            </p>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            Quick Start <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 px-6 pt-4 shrink-0">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i + 1 < step
                  ? "bg-blue-500"
                  : i + 1 === step
                  ? "bg-violet-500"
                  : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Step circles */}
        <div className="flex items-center justify-between px-6 pt-2 pb-4 shrink-0">
          {["Case Setup", "Parties", "Materials", "Ground Rules", "Review"].map(
            (label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i + 1 < step
                      ? "bg-blue-500 text-white"
                      : i + 1 === step
                      ? "bg-violet-500 text-white ring-2 ring-violet-500/30"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-[10px] ${i + 1 === step ? "text-slate-300" : "text-slate-600"}`}>
                  {label}
                </span>
              </div>
            ),
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-white mb-3">Case Setup</h3>
                <div>
                  <label className={labelCls}>Case Title *</label>
                  <input
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    placeholder="e.g., Sprint Planning Dispute"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Case Type *</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select a type...</option>
                    {CASE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Mediator Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: "professional", label: "Professional", sub: "Zephyr — Calm, authoritative" },
                        { value: "empathic", label: "Empathic", sub: "Kore — Warm, emotionally present" },
                      ] as const
                    ).map(({ value, label, sub }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMediatorStyle(value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          mediatorStyle === value
                            ? "border-blue-500 bg-blue-500/10 text-white"
                            : "border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Session Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={inputCls}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <h3 className="text-sm font-semibold text-white mb-3">Party Information</h3>
                {(["A", "B"] as const).map((side) => {
                  const isA = side === "A";
                  const nameVal = isA ? partyAName : partyBName;
                  const setName = isA ? setPartyAName : setPartyBName;
                  const roleVal = isA ? partyARole : partyBRole;
                  const setRole = isA ? setPartyARole : setPartyBRole;
                  const relVal = isA ? partyARelationship : partyBRelationship;
                  const setRel = isA ? setPartyARelationship : setPartyBRelationship;
                  const accent = isA ? "border-sky-500/40 bg-sky-500/5" : "border-violet-500/40 bg-violet-500/5";
                  return (
                    <div key={side} className={`p-4 rounded-xl border ${accent} space-y-3`}>
                      <div className={`text-xs font-semibold uppercase tracking-wider ${isA ? "text-sky-400" : "text-violet-400"}`}>
                        Party {side}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Name *</label>
                          <input
                            value={nameVal}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={`Party ${side} name`}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Role / Title</label>
                          <input
                            value={roleVal}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g., Engineering Manager"
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Relationship to other party</label>
                        <select
                          value={relVal}
                          onChange={(e) => setRel(e.target.value)}
                          className={inputCls}
                        >
                          {RELATIONSHIPS.map((r) => (
                            <option key={r} value={r}>
                              {r.replace("-", " / ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                <div className="space-y-2">
                  <label className={labelCls}>
                    Do both parties have roughly equal negotiating power?
                  </label>
                  <div className="flex gap-2">
                    {(["yes", "no", "unsure"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPowerBalance(v)}
                        className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-all ${
                          powerBalance === v
                            ? v === "no"
                              ? "border-amber-500 bg-amber-500/10 text-amber-400"
                              : "border-blue-500 bg-blue-500/10 text-blue-400"
                            : "border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {powerBalance === "no" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2"
                    >
                      <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>CONCORDIA will actively balance participation to ensure equitable voice.</span>
                      </div>
                      <textarea
                        value={powerDetail}
                        onChange={(e) => setPowerDetail(e.target.value)}
                        placeholder="Who holds more power and why?"
                        rows={2}
                        className={inputCls + " resize-none"}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-white mb-1">
                  Pre-Session Materials{" "}
                  <span className="text-slate-500 font-normal text-xs">(all optional)</span>
                </h3>

                <div>
                  <label className={labelCls}>Dispute Description (100–500 chars)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    placeholder="Briefly describe the dispute..."
                    rows={3}
                    className={inputCls + " resize-none"}
                  />
                  <div className="text-right text-[10px] text-slate-600 mt-0.5">
                    {description.length}/500
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>
                      {partyAName || "Party A"}&apos;s Desired Outcome
                    </label>
                    <textarea
                      value={partyAGoal}
                      onChange={(e) => setPartyAGoal(e.target.value)}
                      placeholder="What would success look like?"
                      rows={2}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {partyBName || "Party B"}&apos;s Desired Outcome
                    </label>
                    <textarea
                      value={partyBGoal}
                      onChange={(e) => setPartyBGoal(e.target.value)}
                      placeholder="What would success look like?"
                      rows={2}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                </div>

                {/* Document upload */}
                <div>
                  <label className={labelCls}>
                    Supporting Documents (max 3, 5MB each — .pdf .txt .docx .md)
                  </label>
                  <div
                    ref={dropRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !uploading && docs.length < 3 && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      docs.length >= 3 || uploading
                        ? "border-slate-700 opacity-50 cursor-not-allowed"
                        : "border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5"
                    }`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="text-xs">Processing document...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">
                          {docs.length >= 3
                            ? "Maximum files reached"
                            : "Drag & drop or click to upload"}
                        </span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.txt,.docx,.md,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>
                  {uploadError && (
                    <p className="text-xs text-red-400 mt-1">{uploadError}</p>
                  )}
                  {docs.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {docs.map((doc, i) => (
                        <div
                          key={i}
                          className="border border-slate-700 rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-800">
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span className="truncate max-w-[200px]">{doc.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setDocs((prev) =>
                                    prev.map((d, j) =>
                                      j === i ? { ...d, expanded: !d.expanded } : d,
                                    ),
                                  )
                                }
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                              >
                                {doc.expanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDocs((prev) => prev.filter((_, j) => j !== i))
                                }
                                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {doc.expanded && (
                            <div className="px-3 py-2 text-xs text-slate-400 bg-slate-900/50 whitespace-pre-wrap">
                              {doc.summary}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>
                      {partyAName || "Party A"}&apos;s Opening Statement (500 chars max)
                    </label>
                    <textarea
                      value={partyAStatement}
                      onChange={(e) => setPartyAStatement(e.target.value.slice(0, 500))}
                      placeholder="Optional opening statement..."
                      rows={3}
                      className={inputCls + " resize-none"}
                    />
                    <div className="text-right text-[10px] text-slate-600 mt-0.5">
                      {partyAStatement.length}/500
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>
                      {partyBName || "Party B"}&apos;s Opening Statement (500 chars max)
                    </label>
                    <textarea
                      value={partyBStatement}
                      onChange={(e) => setPartyBStatement(e.target.value.slice(0, 500))}
                      placeholder="Optional opening statement..."
                      rows={3}
                      className={inputCls + " resize-none"}
                    />
                    <div className="text-right text-[10px] text-slate-600 mt-0.5">
                      {partyBStatement.length}/500
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-white mb-3">Ground Rules & Consent</h3>

                <div className="border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Session Ground Rules
                    </p>
                  </div>
                  <div className="p-4 grid gap-2">
                    {GROUND_RULES.map((rule) => (
                      <div key={rule} className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-blue-400" />
                        </div>
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    {
                      id: "goodfaith",
                      checked: consentGoodFaith,
                      onChange: setConsentGoodFaith,
                      label: "I/We agree to participate in good faith",
                    },
                    {
                      id: "aitool",
                      checked: consentAI,
                      onChange: setConsentAI,
                      label:
                        "I/We understand CONCORDIA is an AI-assisted tool, not a legal service",
                    },
                  ].map(({ id, checked, onChange, label }) => (
                    <label
                      key={id}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <div
                        onClick={() => onChange(!checked)}
                        className={`mt-0.5 w-5 h-5 rounded border transition-all shrink-0 flex items-center justify-center ${
                          checked
                            ? "bg-blue-500 border-blue-500"
                            : "border-slate-600 group-hover:border-blue-500/50"
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-white mb-3">Review & Launch</h3>

                <div className="space-y-3">
                  <div className="p-4 border border-slate-700 rounded-xl space-y-2">
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                      Case
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Title: </span>
                        <span className="text-white">{caseTitle}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Type: </span>
                        <span className="text-white">{caseType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Mediator: </span>
                        <span className="text-white capitalize">{mediatorStyle}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Language: </span>
                        <span className="text-white">{language}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Party A", name: partyAName, role: partyARole, rel: partyARelationship, accent: "border-sky-500/30 bg-sky-500/5 text-sky-400" },
                      { label: "Party B", name: partyBName, role: partyBRole, rel: partyBRelationship, accent: "border-violet-500/30 bg-violet-500/5 text-violet-400" },
                    ].map(({ label, name, role, rel, accent }) => (
                      <div key={label} className={`p-3 border rounded-xl space-y-1 ${accent}`}>
                        <div className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</div>
                        <div className="text-sm font-medium text-white">{name}</div>
                        {role && <div className="text-xs opacity-70">{role}</div>}
                        <div className="text-xs opacity-60">{rel.replace("-", " / ")}</div>
                      </div>
                    ))}
                  </div>

                  {powerBalance !== "yes" && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Power imbalance noted. CONCORDIA will actively balance participation.</span>
                    </div>
                  )}

                  {description && (
                    <div className="p-3 border border-slate-700 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Dispute</div>
                      <p className="text-sm text-slate-300">{description}</p>
                    </div>
                  )}

                  {docs.length > 0 && (
                    <div className="p-3 border border-slate-700 rounded-xl">
                      <div className="text-xs text-slate-500 mb-2">
                        {docs.length} Document{docs.length > 1 ? "s" : ""} uploaded
                      </div>
                      <div className="space-y-1">
                        {docs.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <FileText className="w-3 h-3 text-blue-400" />
                            {d.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 border border-green-500/20 bg-green-500/5 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <Check className="w-3.5 h-3.5" />
                      Ground rules acknowledged and consent given
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
            >
              <Mic className="w-4 h-4" />
              Start Live Mediation
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
