"use client";
import { useState, type FormEvent } from "react";
import type { GuideInfoItem, GuidePageContent } from "@/types/guide";
import {
  Field,
  FormSection,
  inputClass,
  textareaClass,
} from "@/components/catalog/forms/FormUi";
import {
  emptyGuidePage,
  guideAdminRequest,
  pageFieldLabels,
} from "./guide-admin";

export default function GuideSettingsEditor({
  initial,
  onSaved,
}: {
  initial: GuidePageContent | null;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(initial ?? emptyGuidePage());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await guideAdminRequest("guide-page/main", {
        method: "PATCH",
        body: JSON.stringify(value),
      });
      await onSaved();
      setMessage("পেজের লেখা সংরক্ষিত হয়েছে।");
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "সংরক্ষণ করা যায়নি।",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(event) => void save(event)} className="space-y-4">
      <p className="text-sm text-slate-600">
        ব্যানারের ছবি, শিরোনাম ও button পরিবর্তন করতে ব্যানার মেনুতে গিয়ে “গাইড
        পেজের উপরে” নির্বাচন করুন।
      </p>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <FormSection title="All page copy">
          <div className="grid gap-4 md:grid-cols-2">
            {(
              Object.keys(pageFieldLabels) as Array<
                keyof typeof pageFieldLabels
              >
            ).map((key) => (
              <Field key={key} label={pageFieldLabels[key]} required>
                <textarea
                  required
                  value={value[key]}
                  onChange={(event) =>
                    setValue({ ...value, [key]: event.target.value })
                  }
                  className={textareaClass}
                />
              </Field>
            ))}
          </div>
        </FormSection>
        {(["trustItems", "processItems"] as const).map((key) => (
          <FormSection
            key={key}
            title={
              key === "trustItems"
                ? "তথ্যের মান — তিনটি আইটেম"
                : "তৈরির প্রক্রিয়া — তিনটি ধাপ"
            }
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {value[key].map((item, index) => (
                <div key={index} className="space-y-3">
                  <Field label={`আইটেম ${index + 1} আইকন`}>
                    <select
                      value={item.icon}
                      onChange={(event) =>
                        setValue({
                          ...value,
                          [key]: value[key].map((old, i) =>
                            i === index
                              ? {
                                  ...old,
                                  icon: event.target
                                    .value as GuideInfoItem["icon"],
                                }
                              : old,
                          ),
                        })
                      }
                      className={inputClass}
                    >
                      {[
                        "message",
                        "file",
                        "refresh",
                        "research",
                        "edit",
                        "check",
                      ].map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Text" required>
                    <textarea
                      required
                      maxLength={200}
                      value={item.text}
                      onChange={(event) =>
                        setValue({
                          ...value,
                          [key]: value[key].map((old, i) =>
                            i === index
                              ? { ...old, text: event.target.value }
                              : old,
                          ),
                        })
                      }
                      className={textareaClass}
                    />
                  </Field>
                </div>
              ))}
            </div>
          </FormSection>
        ))}
      </fieldset>
      <p role="status" className="text-sm text-[#062a54]">
        {message}
      </p>
      <button
        disabled={busy}
        type="submit"
        className="rounded-xl bg-[#ef4277] px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {busy ? "সংরক্ষণ হচ্ছে…" : "পেজের লেখা সংরক্ষণ"}
      </button>
    </form>
  );
}
