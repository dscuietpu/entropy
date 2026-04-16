"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, PlusSquare } from "lucide-react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { IssueAttachmentPreviews } from "@/components/issues/issue-attachment-previews";
import { useAsyncTask, useAuth, useToast } from "@/hooks";
import { getErrorMessage } from "@/lib/utils";
import { hospitalService, issueService } from "@/services";
import type { Hospital, Issue } from "@/types";

interface AttachmentPreview {
  file: File;
  previewUrl: string;
}

export function IssueForm() {
  const { token, user } = useAuth();
  const toast = useToast();
  const {
    run: runCreateIssue,
    isLoading: isSubmitting,
    error: submitError,
    data: createdIssue,
  } = useAsyncTask<Issue>();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attachmentPreviews, setAttachmentPreviews] = useState<AttachmentPreview[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    issueType: "general" as "public-help" | "equipment-shortage" | "ambulance-request" | "general",
    roleType: (user?.role === "patient" ? "patient" : "hospital") as "patient" | "hospital",
    hospitalId: "",
    attachments: [] as File[],
  });

  useEffect(() => {
    if (user?.role) {
      setForm((current) => ({
        ...current,
        roleType: user.role === "patient" ? "patient" : "hospital",
      }));
    }
  }, [user?.role]);

  useEffect(() => {
    let isMounted = true;

    const loadHospitals = async () => {
      setHospitalsLoading(true);
      setLoadError(null);

      try {
        const response = await hospitalService.list({ limit: 100 });
        if (isMounted) {
          setHospitals(response.data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Failed to load hospitals");
          toast.error("Unable to load hospitals", error instanceof Error ? error.message : "Failed to load hospitals");
        }
      } finally {
        if (isMounted) {
          setHospitalsLoading(false);
        }
      }
    };

    void loadHospitals();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const previews = form.attachments.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setAttachmentPreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    };
  }, [form.attachments]);

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => hospital._id === form.hospitalId),
    [form.hospitalId, hospitals],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    try {
      const issue = await runCreateIssue(() =>
        issueService.create(
          {
            title: form.title.trim(),
            description: form.description.trim(),
            issueType: form.issueType,
            roleType: form.roleType,
            hospitalId: form.hospitalId || undefined,
            attachments: form.attachments,
          },
          token,
        ),
      );

      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        attachments: [],
      }));

      toast.success("Issue submitted", `Issue created with status ${issue.status}.`);
    } catch (submitError) {
      toast.error("Issue submission failed", getErrorMessage(submitError, "Please try again."));
    }
  };

  return (
    <AuthGuard allowedRoles={["patient", "hospital_admin", "doctor"]}>
      <div className="mx-auto flex w-full max-w-4xl flex-col px-6 pb-20 pt-10 sm:px-8 lg:px-12">
        <div className="space-y-8 py-12">
          <section className="rounded-[34px] border border-[var(--border)] bg-white/92 shadow-[var(--shadow)]">
            <div className="border-b border-[var(--border)] bg-[linear-gradient(140deg,rgba(10,32,28,0.98),rgba(15,118,110,0.94))] px-8 py-10 text-white">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-white/10 p-3 text-teal-200">
                  <PlusSquare className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-teal-200">
                    Issue reporting
                  </p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight">Create a new issue</h1>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-white/78">
                Post a public help request, equipment shortage, ambulance request, or general issue with
                optional media attachments.
              </p>
            </div>

            <div className="p-8">
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="title">
                    Title
                  </label>
                  <input
                    id="title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Short summary of the issue"
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={5}
                    placeholder="Describe what is happening and what help is needed"
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="issueType">
                      Issue type
                    </label>
                    <select
                      id="issueType"
                      value={form.issueType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          issueType: event.target.value as typeof current.issueType,
                        }))
                      }
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    >
                      <option value="general">General</option>
                      <option value="public-help">Public help</option>
                      <option value="equipment-shortage">Equipment shortage</option>
                      <option value="ambulance-request">Ambulance request</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="roleType">
                      Role type
                    </label>
                    <select
                      id="roleType"
                      value={form.roleType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          roleType: event.target.value as typeof current.roleType,
                        }))
                      }
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    >
                      <option value="patient">Patient</option>
                      <option value="hospital">Hospital</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="hospitalId">
                    Hospital (optional)
                  </label>
                  <select
                    id="hospitalId"
                    value={form.hospitalId}
                    onChange={(event) => setForm((current) => ({ ...current, hospitalId: event.target.value }))}
                    disabled={hospitalsLoading}
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  >
                    <option value="">{hospitalsLoading ? "Loading hospitals..." : "No hospital selected"}</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital._id} value={hospital._id}>
                        {hospital.name} • {hospital.city}, {hospital.state}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedHospital ? (
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-sm text-[var(--muted)]">
                    Issue will be linked to{" "}
                    <span className="font-semibold text-[var(--foreground)]">{selectedHospital.name}</span>.
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]" htmlFor="attachments">
                    Attachments
                  </label>
                  <input
                    id="attachments"
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        attachments: Array.from(event.target.files ?? []),
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[var(--accent-soft)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--accent)] focus:border-[var(--primary)]"
                  />
                </div>

                <IssueAttachmentPreviews attachments={attachmentPreviews} />

                {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
                {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
                {createdIssue ? (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                    Issue created successfully with status <span className="font-semibold">{createdIssue.status}</span>.
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || hospitalsLoading || !form.title.trim() || !form.description.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Creating issue...
                    </>
                  ) : (
                    "Create Issue"
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
